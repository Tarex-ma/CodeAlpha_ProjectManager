
# Create your tests here.
"""
apps/boards/tests.py
──────────────────────
Test layers
───────────
ModelTest        — ORM, next_position, manager methods
SerializerTest   — validation rules (blank title, duplicate title, reorder rules)
ViewTest         — full HTTP integration: list, create, retrieve, patch, delete, reorder
PermissionTest   — member vs admin/owner access control
"""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from django.test import TestCase

from apps.accounts.models import User, Profile
from apps.projects.models import Project, ProjectMember
from apps.boards.models import Board


# ═══════════════════════════════════════════════════════════════════════════
# Shared helpers
# ═══════════════════════════════════════════════════════════════════════════

def make_user(email="user@example.com", **kw) -> User:
    user = User.objects.create_user(
        email=email, first_name="Test", last_name="User",
        password="Str0ngP@ss!", **kw
    )
    Profile.objects.get_or_create(user=user)
    return user


def auth_client(user: User) -> APIClient:
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


def make_project(owner: User, title="Test Project") -> Project:
    project = Project.objects.create(owner=owner, title=title)
    ProjectMember.objects.create(project=project, user=owner, role=ProjectMember.Role.OWNER)
    return project


def add_member(project, user, role=ProjectMember.Role.MEMBER):
    return ProjectMember.objects.create(project=project, user=user, role=role)


def make_board(project, title="Todo", position=None) -> Board:
    if position is None:
        position = Board.next_position(project.pk)
    return Board.objects.create(project=project, title=title, position=position)


# ── URL helpers ───────────────────────────────────────────────────────────

def boards_list_url(project_pk):
    return reverse("board-list", kwargs={"project_pk": project_pk})

def board_detail_url(project_pk, board_pk):
    return reverse("board-detail", kwargs={"project_pk": project_pk, "pk": board_pk})

def board_reorder_url(project_pk):
    return reverse("board-reorder", kwargs={"project_pk": project_pk})


# ═══════════════════════════════════════════════════════════════════════════
# MODEL TESTS
# ═══════════════════════════════════════════════════════════════════════════

class BoardModelTest(TestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)

    def test_str_includes_project_and_title(self):
        board = make_board(self.project, "Todo", position=0)
        self.assertIn("Todo", str(board))
        self.assertIn(self.project.title, str(board))

    def test_next_position_zero_when_no_boards(self):
        self.assertEqual(Board.next_position(self.project.pk), 0)

    def test_next_position_increments(self):
        make_board(self.project, "A", position=0)
        make_board(self.project, "B", position=1)
        self.assertEqual(Board.next_position(self.project.pk), 2)

    def test_next_position_uses_max_not_count(self):
        """Handles gaps in positions correctly."""
        make_board(self.project, "A", position=0)
        make_board(self.project, "B", position=5)
        self.assertEqual(Board.next_position(self.project.pk), 6)

    def test_for_project_manager_returns_ordered_boards(self):
        make_board(self.project, "C", position=2)
        make_board(self.project, "A", position=0)
        make_board(self.project, "B", position=1)
        titles = list(
            Board.objects.for_project(self.project.pk).values_list("title", flat=True)
        )
        self.assertEqual(titles, ["A", "B", "C"])

    def test_for_user_excludes_non_member_projects(self):
        other_owner   = make_user(email="other@example.com")
        other_project = make_project(other_owner)
        make_board(other_project, "Hidden")
        make_board(self.project, "Visible")

        boards = Board.objects.for_user(self.owner)
        titles = list(boards.values_list("title", flat=True))
        self.assertIn("Visible", titles)
        self.assertNotIn("Hidden", titles)

    def test_default_ordering_is_by_position(self):
        make_board(self.project, "Z", position=3)
        make_board(self.project, "A", position=0)
        boards = list(Board.objects.filter(project=self.project))
        self.assertEqual(boards[0].title, "A")

    def test_cascade_delete_with_project(self):
        make_board(self.project, "Todo")
        self.project.delete()
        self.assertEqual(Board.objects.count(), 0)


# ═══════════════════════════════════════════════════════════════════════════
# SERIALIZER TESTS
# ═══════════════════════════════════════════════════════════════════════════

from apps.boards.serializers import (
    BoardCreateSerializer,
    BoardReorderSerializer,
    BoardUpdateSerializer,
)


class BoardCreateSerializerTest(TestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)

    def _ctx(self):
        return {"project": self.project}

    def test_valid_title_creates_board(self):
        s = BoardCreateSerializer(data={"title": "Todo"}, context=self._ctx())
        self.assertTrue(s.is_valid(), s.errors)
        board = s.save()
        self.assertEqual(board.title, "Todo")
        self.assertEqual(board.position, 0)

    def test_blank_title_invalid(self):
        s = BoardCreateSerializer(data={"title": "   "}, context=self._ctx())
        self.assertFalse(s.is_valid())
        self.assertIn("title", s.errors)

    def test_duplicate_title_case_insensitive_invalid(self):
        make_board(self.project, "Todo")
        s = BoardCreateSerializer(data={"title": "TODO"}, context=self._ctx())
        self.assertFalse(s.is_valid())
        self.assertIn("title", s.errors)

    def test_position_auto_assigned(self):
        make_board(self.project, "A", position=0)
        make_board(self.project, "B", position=1)
        s = BoardCreateSerializer(data={"title": "C"}, context=self._ctx())
        s.is_valid(raise_exception=True)
        board = s.save()
        self.assertEqual(board.position, 2)

    def test_same_title_allowed_in_different_projects(self):
        other_owner   = make_user(email="o@example.com")
        other_project = make_project(other_owner)
        make_board(other_project, "Todo")
        # Should be valid for self.project
        s = BoardCreateSerializer(data={"title": "Todo"}, context=self._ctx())
        self.assertTrue(s.is_valid(), s.errors)


class BoardUpdateSerializerTest(TestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)
        self.board   = make_board(self.project, "Todo")

    def _ctx(self):
        return {"project": self.project}

    def test_update_title(self):
        s = BoardUpdateSerializer(self.board, data={"title": "Backlog"}, partial=True, context=self._ctx())
        self.assertTrue(s.is_valid(), s.errors)
        updated = s.save()
        self.assertEqual(updated.title, "Backlog")

    def test_blank_title_invalid(self):
        s = BoardUpdateSerializer(self.board, data={"title": ""}, partial=True, context=self._ctx())
        self.assertFalse(s.is_valid())

    def test_negative_position_invalid(self):
        s = BoardUpdateSerializer(self.board, data={"position": -1}, partial=True, context=self._ctx())
        self.assertFalse(s.is_valid())

    def test_same_title_on_self_is_valid(self):
        """Updating a board with its own current title should not raise duplicate error."""
        s = BoardUpdateSerializer(self.board, data={"title": "Todo"}, partial=True, context=self._ctx())
        self.assertTrue(s.is_valid(), s.errors)


class BoardReorderSerializerTest(TestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)
        self.b1 = make_board(self.project, "Todo",        position=0)
        self.b2 = make_board(self.project, "In Progress", position=1)
        self.b3 = make_board(self.project, "Done",        position=2)

    def _ctx(self):
        return {"project": self.project}

    def _payload(self, order):
        return {"boards": [{"id": b.pk, "position": i} for i, b in enumerate(order)]}

    def test_valid_reorder(self):
        s = BoardReorderSerializer(
            data=self._payload([self.b3, self.b1, self.b2]),
            context=self._ctx(),
        )
        self.assertTrue(s.is_valid(), s.errors)

    def test_reorder_saves_correct_positions(self):
        s = BoardReorderSerializer(
            data=self._payload([self.b3, self.b1, self.b2]),
            context=self._ctx(),
        )
        s.is_valid(raise_exception=True)
        s.save()
        self.b3.refresh_from_db()
        self.b1.refresh_from_db()
        self.b2.refresh_from_db()
        self.assertEqual(self.b3.position, 0)
        self.assertEqual(self.b1.position, 1)
        self.assertEqual(self.b2.position, 2)

    def test_missing_board_invalid(self):
        data = {"boards": [
            {"id": self.b1.pk, "position": 0},
            {"id": self.b2.pk, "position": 1},
            # b3 missing
        ]}
        s = BoardReorderSerializer(data=data, context=self._ctx())
        self.assertFalse(s.is_valid())

    def test_unknown_board_id_invalid(self):
        data = {"boards": [
            {"id": self.b1.pk, "position": 0},
            {"id": self.b2.pk, "position": 1},
            {"id": 9999,        "position": 2},
        ]}
        s = BoardReorderSerializer(data=data, context=self._ctx())
        self.assertFalse(s.is_valid())

    def test_duplicate_ids_invalid(self):
        data = {"boards": [
            {"id": self.b1.pk, "position": 0},
            {"id": self.b1.pk, "position": 1},
            {"id": self.b3.pk, "position": 2},
        ]}
        s = BoardReorderSerializer(data=data, context=self._ctx())
        self.assertFalse(s.is_valid())

    def test_duplicate_positions_invalid(self):
        data = {"boards": [
            {"id": self.b1.pk, "position": 0},
            {"id": self.b2.pk, "position": 0},
            {"id": self.b3.pk, "position": 2},
        ]}
        s = BoardReorderSerializer(data=data, context=self._ctx())
        self.assertFalse(s.is_valid())


# ═══════════════════════════════════════════════════════════════════════════
# VIEW / INTEGRATION TESTS
# ═══════════════════════════════════════════════════════════════════════════

class BoardListCreateTest(APITestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)
        self.client  = auth_client(self.owner)

    def test_list_returns_200(self):
        make_board(self.project, "Todo")
        res = self.client.get(boards_list_url(self.project.pk))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_list_ordered_by_position(self):
        make_board(self.project, "C", position=2)
        make_board(self.project, "A", position=0)
        make_board(self.project, "B", position=1)
        res = self.client.get(boards_list_url(self.project.pk))
        titles = [b["title"] for b in res.data]
        self.assertEqual(titles, ["A", "B", "C"])

    def test_create_board_returns_201(self):
        res = self.client.post(boards_list_url(self.project.pk), {"title": "Todo"})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_create_board_auto_position(self):
        make_board(self.project, "A", position=0)
        res = self.client.post(boards_list_url(self.project.pk), {"title": "B"})
        self.assertEqual(res.data["position"], 1)

    def test_create_board_persists(self):
        self.client.post(boards_list_url(self.project.pk), {"title": "Todo"})
        self.assertTrue(Board.objects.filter(project=self.project, title="Todo").exists())

    def test_non_member_gets_404(self):
        stranger = make_user(email="s@example.com")
        client   = auth_client(stranger)
        res = client.get(boards_list_url(self.project.pk))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_gets_401(self):
        res = self.client_class().get(boards_list_url(self.project.pk))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_duplicate_title_returns_400(self):
        make_board(self.project, "Todo")
        res = self.client.post(boards_list_url(self.project.pk), {"title": "todo"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_plain_member_cannot_create(self):
        member = make_user(email="m@example.com")
        add_member(self.project, member)
        client = auth_client(member)
        res = client.post(boards_list_url(self.project.pk), {"title": "New"})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_viewer_cannot_create(self):
        viewer = make_user(email="v@example.com")
        add_member(self.project, viewer, ProjectMember.Role.VIEWER)
        client = auth_client(viewer)
        res = client.post(boards_list_url(self.project.pk), {"title": "New"})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class BoardRetrieveTest(APITestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)
        self.board   = make_board(self.project, "Todo")
        self.client  = auth_client(self.owner)

    def test_retrieve_returns_200(self):
        res = self.client.get(board_detail_url(self.project.pk, self.board.pk))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_correct_title(self):
        res = self.client.get(board_detail_url(self.project.pk, self.board.pk))
        self.assertEqual(res.data["title"], "Todo")

    def test_retrieve_includes_task_count(self):
        res = self.client.get(board_detail_url(self.project.pk, self.board.pk))
        self.assertIn("task_count", res.data)

    def test_viewer_can_retrieve(self):
        viewer = make_user(email="v@example.com")
        add_member(self.project, viewer, ProjectMember.Role.VIEWER)
        client = auth_client(viewer)
        res = client.get(board_detail_url(self.project.pk, self.board.pk))
        self.assertEqual(res.status_code, status.HTTP_200_OK)


class BoardUpdateTest(APITestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)
        self.board   = make_board(self.project, "Todo")
        self.client  = auth_client(self.owner)

    def test_owner_can_update_title(self):
        res = self.client.patch(
            board_detail_url(self.project.pk, self.board.pk),
            {"title": "Backlog"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.board.refresh_from_db()
        self.assertEqual(self.board.title, "Backlog")

    def test_admin_can_update(self):
        admin = make_user(email="a@example.com")
        add_member(self.project, admin, ProjectMember.Role.ADMIN)
        client = auth_client(admin)
        res = client.patch(board_detail_url(self.project.pk, self.board.pk), {"title": "X"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_member_cannot_update(self):
        member = make_user(email="m@example.com")
        add_member(self.project, member)
        client = auth_client(member)
        res = client.patch(board_detail_url(self.project.pk, self.board.pk), {"title": "X"})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_put_not_allowed(self):
        res = self.client.put(board_detail_url(self.project.pk, self.board.pk), {"title": "X"})
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_update_position(self):
        res = self.client.patch(
            board_detail_url(self.project.pk, self.board.pk),
            {"position": 5},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.board.refresh_from_db()
        self.assertEqual(self.board.position, 5)


class BoardDeleteTest(APITestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)
        self.board   = make_board(self.project, "Todo")
        self.client  = auth_client(self.owner)

    def test_owner_can_delete(self):
        res = self.client.delete(board_detail_url(self.project.pk, self.board.pk))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Board.objects.filter(pk=self.board.pk).exists())

    def test_member_cannot_delete(self):
        member = make_user(email="m@example.com")
        add_member(self.project, member)
        client = auth_client(member)
        res = client.delete(board_detail_url(self.project.pk, self.board.pk))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class BoardReorderViewTest(APITestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)
        self.b1 = make_board(self.project, "Todo",        position=0)
        self.b2 = make_board(self.project, "In Progress", position=1)
        self.b3 = make_board(self.project, "Done",        position=2)
        self.client = auth_client(self.owner)

    def _payload(self, order):
        return {"boards": [{"id": b.pk, "position": i} for i, b in enumerate(order)]}

    def test_reorder_returns_200(self):
        res = self.client.post(
            board_reorder_url(self.project.pk),
            self._payload([self.b3, self.b1, self.b2]),
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_reorder_returns_sorted_list(self):
        res = self.client.post(
            board_reorder_url(self.project.pk),
            self._payload([self.b3, self.b1, self.b2]),
            format="json",
        )
        ids = [b["id"] for b in res.data]
        self.assertEqual(ids, [self.b3.pk, self.b1.pk, self.b2.pk])

    def test_reorder_persists_to_db(self):
        self.client.post(
            board_reorder_url(self.project.pk),
            self._payload([self.b3, self.b1, self.b2]),
            format="json",
        )
        self.b3.refresh_from_db()
        self.assertEqual(self.b3.position, 0)

    def test_partial_reorder_rejected(self):
        data = {"boards": [
            {"id": self.b1.pk, "position": 0},
            {"id": self.b2.pk, "position": 1},
        ]}
        res = self.client.post(board_reorder_url(self.project.pk), data, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_member_cannot_reorder(self):
        member = make_user(email="m@example.com")
        add_member(self.project, member)
        client = auth_client(member)
        res = client.post(
            board_reorder_url(self.project.pk),
            self._payload([self.b1, self.b2, self.b3]),
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


# ═══════════════════════════════════════════════════════════════════════════
# PERMISSION UNIT TESTS
# ═══════════════════════════════════════════════════════════════════════════

from django.test import RequestFactory as DjangoRF
from apps.boards.permissions import BoardPermission


class BoardPermissionTest(TestCase):

    def setUp(self):
        self.factory  = DjangoRF()
        self.owner    = make_user()
        self.project  = make_project(self.owner)
        self.admin    = make_user(email="admin@example.com")
        self.member   = make_user(email="member@example.com")
        self.viewer   = make_user(email="viewer@example.com")
        self.stranger = make_user(email="stranger@example.com")
        add_member(self.project, self.admin,  ProjectMember.Role.ADMIN)
        add_member(self.project, self.member, ProjectMember.Role.MEMBER)
        add_member(self.project, self.viewer, ProjectMember.Role.VIEWER)
        self.perm = BoardPermission()

    def _req(self, user, method="GET"):
        req = getattr(self.factory, method.lower())("/")
        req.user    = user
        req.project = self.project
        return req

    def test_member_can_read(self):
        self.assertTrue(self.perm.has_permission(self._req(self.member, "GET"), None))

    def test_viewer_can_read(self):
        self.assertTrue(self.perm.has_permission(self._req(self.viewer, "GET"), None))

    def test_stranger_cannot_read(self):
        self.assertFalse(self.perm.has_permission(self._req(self.stranger, "GET"), None))

    def test_member_cannot_write(self):
        self.assertFalse(self.perm.has_permission(self._req(self.member, "POST"), None))

    def test_viewer_cannot_write(self):
        self.assertFalse(self.perm.has_permission(self._req(self.viewer, "POST"), None))

    def test_admin_can_write(self):
        self.assertTrue(self.perm.has_permission(self._req(self.admin, "POST"), None))

    def test_owner_can_write(self):
        self.assertTrue(self.perm.has_permission(self._req(self.owner, "DELETE"), None))

    def test_no_project_on_request_blocks_all(self):
        req = self.factory.get("/")
        req.user    = self.owner
        # No request.project set
        self.assertFalse(self.perm.has_permission(req, None))