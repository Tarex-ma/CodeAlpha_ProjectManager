"""
apps/comments/tests.py
────────────────────────
ModelTest        — ORM, manager, cascade, str
SerializerTest   — blank content, over-limit content, is_edited on update
ViewTest         — list, create, retrieve, patch, delete + all permission cases
PermissionTest   — author-only edit/delete, admin override, viewer read-only
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User, Profile
from apps.projects.models import Project, ProjectMember
from apps.boards.models import Board
from apps.tasks.models import Task
from apps.comments.models import Comment


# ═══════════════════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════════════════

def make_user(email="u@example.com", **kw) -> User:
    u = User.objects.create_user(
        email=email, first_name="Test", last_name="User", password="Str0ng!", **kw
    )
    Profile.objects.get_or_create(user=u)
    return u


def auth_client(user: User) -> APIClient:
    c = APIClient()
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}")
    return c


def make_project(owner: User) -> Project:
    p = Project.objects.create(owner=owner, title="P")
    ProjectMember.objects.create(project=p, user=owner, role=ProjectMember.Role.OWNER)
    return p


def add_member(project, user, role=ProjectMember.Role.MEMBER):
    return ProjectMember.objects.create(project=project, user=user, role=role)


def make_board(project) -> Board:
    return Board.objects.create(project=project, title="Board", position=0)


def make_task(board, user) -> Task:
    return Task.objects.create(
        board=board, project=board.project,
        created_by=user, title="Task", position=0,
    )


def make_comment(task, author, content="Good work.") -> Comment:
    return Comment.objects.create(task=task, author=author, content=content)


# ── URL helpers ───────────────────────────────────────────────────────────

def comments_url(project_pk, board_pk, task_pk):
    return reverse("comment-list", kwargs={
        "project_pk": project_pk, "board_pk": board_pk, "task_pk": task_pk,
    })


def comment_detail_url(project_pk, board_pk, task_pk, pk):
    return reverse("comment-detail", kwargs={
        "project_pk": project_pk, "board_pk": board_pk, "task_pk": task_pk, "pk": pk,
    })


# ═══════════════════════════════════════════════════════════════════════════
# MODEL TESTS
# ═══════════════════════════════════════════════════════════════════════════

class CommentModelTest(TestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)
        self.board   = make_board(self.project)
        self.task    = make_task(self.board, self.owner)

    def test_str_includes_author_and_task(self):
        c = make_comment(self.task, self.owner)
        self.assertIn(self.owner.email, str(c))

    def test_str_handles_deleted_author(self):
        c = make_comment(self.task, self.owner)
        c.author = None
        c.save()
        self.assertIn("deleted user", str(c))

    def test_default_is_edited_false(self):
        c = make_comment(self.task, self.owner)
        self.assertFalse(c.is_edited)

    def test_for_task_ordered_by_created_at(self):
        make_comment(self.task, self.owner, "First")
        make_comment(self.task, self.owner, "Second")
        contents = list(
            Comment.objects.for_task(self.task.pk).values_list("content", flat=True)
        )
        self.assertEqual(contents, ["First", "Second"])

    def test_cascade_delete_with_task(self):
        make_comment(self.task, self.owner)
        self.task.delete()
        self.assertEqual(Comment.objects.count(), 0)

    def test_author_null_on_user_delete(self):
        user2 = make_user(email="u2@example.com")
        add_member(self.project, user2)
        c = make_comment(self.task, user2)
        user2.delete()
        c.refresh_from_db()
        self.assertIsNone(c.author)
        self.assertTrue(Comment.objects.filter(pk=c.pk).exists())

    def test_for_user_excludes_non_member_comments(self):
        other_owner = make_user(email="o@example.com")
        other_proj  = make_project(other_owner)
        other_board = make_board(other_proj)
        other_task  = make_task(other_board, other_owner)
        make_comment(other_task, other_owner, "Hidden")
        make_comment(self.task, self.owner, "Visible")

        qs = Comment.objects.for_user(self.owner)
        contents = list(qs.values_list("content", flat=True))
        self.assertIn("Visible", contents)
        self.assertNotIn("Hidden", contents)


# ═══════════════════════════════════════════════════════════════════════════
# SERIALIZER TESTS
# ═══════════════════════════════════════════════════════════════════════════

from django.test import RequestFactory as DjangoRF
from apps.comments.serializers import CommentCreateSerializer, CommentUpdateSerializer


class CommentCreateSerializerTest(TestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)
        self.board   = make_board(self.project)
        self.task    = make_task(self.board, self.owner)
        req          = DjangoRF().post("/")
        req.user     = self.owner
        self.context = {"request": req, "task": self.task}

    def test_valid_content_creates_comment(self):
        s = CommentCreateSerializer(data={"content": "LGTM"}, context=self.context)
        self.assertTrue(s.is_valid(), s.errors)
        c = s.save()
        self.assertEqual(c.author, self.owner)
        self.assertEqual(c.task, self.task)

    def test_blank_content_invalid(self):
        s = CommentCreateSerializer(data={"content": "   "}, context=self.context)
        self.assertFalse(s.is_valid())
        self.assertIn("content", s.errors)

    def test_content_over_5000_chars_invalid(self):
        s = CommentCreateSerializer(data={"content": "x" * 5001}, context=self.context)
        self.assertFalse(s.is_valid())
        self.assertIn("content", s.errors)

    def test_content_stripped_of_whitespace(self):
        s = CommentCreateSerializer(data={"content": "  Nice work.  "}, context=self.context)
        s.is_valid(raise_exception=True)
        c = s.save()
        self.assertEqual(c.content, "Nice work.")


class CommentUpdateSerializerTest(TestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)
        self.board   = make_board(self.project)
        self.task    = make_task(self.board, self.owner)
        self.comment = make_comment(self.task, self.owner)

    def test_update_sets_is_edited(self):
        s = CommentUpdateSerializer(
            self.comment, data={"content": "Updated"}, partial=True
        )
        self.assertTrue(s.is_valid(), s.errors)
        c = s.save()
        self.assertTrue(c.is_edited)

    def test_blank_update_invalid(self):
        s = CommentUpdateSerializer(
            self.comment, data={"content": ""}, partial=True
        )
        self.assertFalse(s.is_valid())

    def test_content_updated(self):
        s = CommentUpdateSerializer(
            self.comment, data={"content": "Changed"}, partial=True
        )
        s.is_valid(raise_exception=True)
        c = s.save()
        self.assertEqual(c.content, "Changed")


# ═══════════════════════════════════════════════════════════════════════════
# VIEW INTEGRATION TESTS
# ═══════════════════════════════════════════════════════════════════════════

class CommentListCreateTest(APITestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)
        self.board   = make_board(self.project)
        self.task    = make_task(self.board, self.owner)
        self.client  = auth_client(self.owner)

    def _url(self):
        return comments_url(self.project.pk, self.board.pk, self.task.pk)

    def test_list_returns_200(self):
        make_comment(self.task, self.owner)
        res = self.client.get(self._url())
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_list_in_chronological_order(self):
        make_comment(self.task, self.owner, "First")
        make_comment(self.task, self.owner, "Second")
        res = self.client.get(self._url())
        contents = [c["content"] for c in res.data]
        self.assertEqual(contents, ["First", "Second"])

    def test_list_includes_author(self):
        make_comment(self.task, self.owner)
        res = self.client.get(self._url())
        self.assertIn("author", res.data[0])
        self.assertEqual(res.data[0]["author"]["email"], self.owner.email)

    def test_list_includes_is_edited(self):
        make_comment(self.task, self.owner)
        res = self.client.get(self._url())
        self.assertIn("is_edited", res.data[0])

    def test_create_returns_201(self):
        res = self.client.post(self._url(), {"content": "Looks good!"})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_create_sets_author(self):
        res = self.client.post(self._url(), {"content": "Test"})
        self.assertEqual(res.data["author"]["email"], self.owner.email)

    def test_create_persists(self):
        self.client.post(self._url(), {"content": "Hello"})
        self.assertTrue(Comment.objects.filter(task=self.task, content="Hello").exists())

    def test_blank_content_returns_400(self):
        res = self.client.post(self._url(), {"content": "   "})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_stranger_gets_404(self):
        stranger = make_user(email="s@example.com")
        res = auth_client(stranger).get(self._url())
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_viewer_can_list(self):
        viewer = make_user(email="v@example.com")
        add_member(self.project, viewer, ProjectMember.Role.VIEWER)
        res = auth_client(viewer).get(self._url())
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_viewer_cannot_create(self):
        viewer = make_user(email="v@example.com")
        add_member(self.project, viewer, ProjectMember.Role.VIEWER)
        res = auth_client(viewer).post(self._url(), {"content": "Hi"})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_returns_401(self):
        res = self.client_class().get(self._url())
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class CommentUpdateDeleteTest(APITestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)
        self.board   = make_board(self.project)
        self.task    = make_task(self.board, self.owner)

        # A second member who creates their own comment
        self.member  = make_user(email="m@example.com")
        add_member(self.project, self.member)
        self.comment = make_comment(self.task, self.member, "Original")

    def _url(self, pk=None):
        return comment_detail_url(
            self.project.pk, self.board.pk, self.task.pk, pk or self.comment.pk
        )

    # ── retrieve ──────────────────────────────────────────────────────────

    def test_retrieve_returns_200(self):
        res = auth_client(self.member).get(self._url())
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["content"], "Original")

    # ── edit ──────────────────────────────────────────────────────────────

    def test_author_can_edit(self):
        res = auth_client(self.member).patch(self._url(), {"content": "Edited"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["content"], "Edited")
        self.assertTrue(res.data["is_edited"])

    def test_edit_sets_is_edited_true(self):
        auth_client(self.member).patch(self._url(), {"content": "Changed"})
        self.comment.refresh_from_db()
        self.assertTrue(self.comment.is_edited)

    def test_non_author_member_cannot_edit(self):
        other = make_user(email="o@example.com")
        add_member(self.project, other)
        res = auth_client(other).patch(self._url(), {"content": "Hijack"})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_project_admin_can_edit(self):
        admin = make_user(email="a@example.com")
        add_member(self.project, admin, ProjectMember.Role.ADMIN)
        res = auth_client(admin).patch(self._url(), {"content": "Moderated"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_project_owner_can_edit(self):
        res = auth_client(self.owner).patch(self._url(), {"content": "Owner edit"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_put_not_allowed(self):
        res = auth_client(self.member).put(self._url(), {"content": "X"})
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    # ── delete ────────────────────────────────────────────────────────────

    def test_author_can_delete(self):
        res = auth_client(self.member).delete(self._url())
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Comment.objects.filter(pk=self.comment.pk).exists())

    def test_non_author_member_cannot_delete(self):
        other = make_user(email="o@example.com")
        add_member(self.project, other)
        res = auth_client(other).delete(self._url())
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_project_owner_can_delete_any_comment(self):
        res = auth_client(self.owner).delete(self._url())
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_project_admin_can_delete_any_comment(self):
        admin = make_user(email="a@example.com")
        add_member(self.project, admin, ProjectMember.Role.ADMIN)
        res = auth_client(admin).delete(self._url())
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_viewer_cannot_delete(self):
        viewer = make_user(email="v@example.com")
        add_member(self.project, viewer, ProjectMember.Role.VIEWER)
        res = auth_client(viewer).delete(self._url())
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


# ═══════════════════════════════════════════════════════════════════════════
# PERMISSION UNIT TESTS
# ═══════════════════════════════════════════════════════════════════════════

from django.test import RequestFactory as DjangoRF
from apps.comments.permissions import CommentPermission, IsCommentAuthor


class CommentPermissionTest(TestCase):

    def setUp(self):
        self.factory  = DjangoRF()
        self.owner    = make_user()
        self.project  = make_project(self.owner)
        self.board    = make_board(self.project)
        self.task     = make_task(self.board, self.owner)
        self.member   = make_user(email="m@example.com")
        self.viewer   = make_user(email="v@example.com")
        self.stranger = make_user(email="s@example.com")
        add_member(self.project, self.member)
        add_member(self.project, self.viewer, ProjectMember.Role.VIEWER)
        self.comment  = make_comment(self.task, self.member)

    def _req(self, user, method="GET"):
        req = getattr(self.factory, method.lower())("/")
        req.user    = user
        req.project = self.project
        return req

    # CommentPermission
    def test_member_can_read(self):
        self.assertTrue(CommentPermission().has_permission(self._req(self.member), None))

    def test_viewer_can_read(self):
        self.assertTrue(CommentPermission().has_permission(self._req(self.viewer), None))

    def test_stranger_blocked(self):
        self.assertFalse(CommentPermission().has_permission(self._req(self.stranger), None))

    def test_viewer_cannot_post(self):
        self.assertFalse(CommentPermission().has_permission(self._req(self.viewer, "POST"), None))

    def test_member_can_post(self):
        self.assertTrue(CommentPermission().has_permission(self._req(self.member, "POST"), None))

    # IsCommentAuthor
    def test_author_can_edit(self):
        self.assertTrue(
            IsCommentAuthor().has_object_permission(self._req(self.member, "PATCH"), None, self.comment)
        )

    def test_non_author_blocked(self):
        other = make_user(email="o@example.com")
        add_member(self.project, other)
        self.assertFalse(
            IsCommentAuthor().has_object_permission(self._req(other, "PATCH"), None, self.comment)
        )

    def test_admin_can_edit_any(self):
        admin = make_user(email="a@example.com")
        add_member(self.project, admin, ProjectMember.Role.ADMIN)
        req = self._req(admin, "PATCH")
        self.assertTrue(
            IsCommentAuthor().has_object_permission(req, None, self.comment)
        )

    def test_owner_can_edit_any(self):
        self.assertTrue(
            IsCommentAuthor().has_object_permission(self._req(self.owner, "DELETE"), None, self.comment)
        )