"""
apps/tasks/tests.py
─────────────────────
Four test layers:
  ModelTest        — ORM, choices, manager, next_position, save() hook
  SerializerTest   — validation: blank title, past due date, non-member assignee, reorder rules
  ViewTest         — HTTP integration: list, create, retrieve, patch, delete, move, reorder
  PermissionTest   — viewer read-only, member write, stranger blocked
"""

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from rest_framework_simplejwt.tokens import RefreshToken


# pyrefly: ignore [missing-import]
from apps.accounts.models import User, Profile
# pyrefly: ignore [missing-import]
from apps.projects.models import Project, ProjectMember
# pyrefly: ignore [missing-import]
from apps.boards.models import Board
# pyrefly: ignore [missing-import]
from apps.tasks.models import Task

# ═══════════════════════════════════════════════════════════════════════════
# Shared helpers
# ═══════════════════════════════════════════════════════════════════════════

def make_user(email="user@example.com", **kw) -> User:
    user = User.objects.create_user(
        email=email, first_name="Test", last_name="User",
        password="Str0ngP@ss!", **kw,
    )
    Profile.objects.get_or_create(user=user)
    return user


def auth_client(user: User) -> APIClient:
    c = APIClient()
    refresh = RefreshToken.for_user(user)
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return c


def make_project(owner: User, title="Project") -> Project:
    p = Project.objects.create(owner=owner, title=title)
    ProjectMember.objects.create(project=p, user=owner, role=ProjectMember.Role.OWNER)
    return p


def add_member(project, user, role=ProjectMember.Role.MEMBER):
    return ProjectMember.objects.create(project=project, user=user, role=role)


def make_board(project, title="Todo", position=0) -> Board:
    return Board.objects.create(project=project, title=title, position=position)


def make_task(board, created_by, title="Task", position=None, **kw) -> Task:
    if position is None:
        position = Task.objects.next_position(board.pk)
    return Task.objects.create(
        board=board,
        project=board.project,
        created_by=created_by,
        title=title,
        position=position,
        **kw,
    )


def future_date(days=7):
    return (timezone.now() + timezone.timedelta(days=days)).date()


def past_date(days=1):
    return (timezone.now() - timezone.timedelta(days=days)).date()


# ── URL helpers ───────────────────────────────────────────────────────────

def tasks_url(project_pk, board_pk):
    return reverse("task-list", kwargs={"project_pk": project_pk, "board_pk": board_pk})

def task_detail_url(project_pk, board_pk, pk):
    return reverse("task-detail", kwargs={"project_pk": project_pk, "board_pk": board_pk, "pk": pk})

def task_move_url(project_pk, board_pk, pk):
    return reverse("task-move", kwargs={"project_pk": project_pk, "board_pk": board_pk, "pk": pk})

def task_reorder_url(project_pk, board_pk):
    return reverse("task-reorder", kwargs={"project_pk": project_pk, "board_pk": board_pk})


# ═══════════════════════════════════════════════════════════════════════════
# MODEL TESTS
# ═══════════════════════════════════════════════════════════════════════════

class TaskModelTest(TestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)
        self.board   = make_board(self.project)

    def test_str_includes_priority_and_title(self):
        task = make_task(self.board, self.owner, title="Fix bug", priority=Task.Priority.HIGH)
        self.assertIn("Fix bug", str(task))
        self.assertIn("High", str(task))

    def test_project_auto_set_from_board(self):
        task = Task(board=self.board, title="Auto project", created_by=self.owner)
        task.save()
        self.assertEqual(task.project, self.project)

    def test_next_position_zero_when_empty(self):
        self.assertEqual(Task.objects.next_position(self.board.pk), 0)

    def test_next_position_increments(self):
        make_task(self.board, self.owner, position=0)
        make_task(self.board, self.owner, position=1)
        self.assertEqual(Task.objects.next_position(self.board.pk), 2)

    def test_next_position_handles_gaps(self):
        make_task(self.board, self.owner, position=0)
        make_task(self.board, self.owner, position=5)
        self.assertEqual(Task.objects.next_position(self.board.pk), 6)

    def test_for_board_returns_sorted_by_position(self):
        make_task(self.board, self.owner, title="C", position=2)
        make_task(self.board, self.owner, title="A", position=0)
        make_task(self.board, self.owner, title="B", position=1)
        titles = list(Task.objects.for_board(self.board.pk).values_list("title", flat=True))
        self.assertEqual(titles, ["A", "B", "C"])

    def test_for_user_excludes_non_member_tasks(self):
        other_owner   = make_user(email="o@example.com")
        other_project = make_project(other_owner)
        other_board   = make_board(other_project)
        make_task(other_board, other_owner, title="Hidden")
        make_task(self.board,  self.owner,  title="Visible")

        tasks = Task.objects.for_user(self.owner)
        titles = list(tasks.values_list("title", flat=True))
        self.assertIn("Visible", titles)
        self.assertNotIn("Hidden", titles)

    def test_overdue_queryset(self):
        make_task(self.board, self.owner, title="Overdue",  due_date=past_date())
        make_task(self.board, self.owner, title="Future",   due_date=future_date())
        make_task(self.board, self.owner, title="Done",     due_date=past_date(), status=Task.Status.DONE)
        titles = list(Task.objects.for_board(self.board.pk).overdue().values_list("title", flat=True))
        self.assertIn("Overdue", titles)
        self.assertNotIn("Future", titles)
        self.assertNotIn("Done", titles)

    def test_cascade_delete_with_board(self):
        make_task(self.board, self.owner)
        self.board.delete()
        self.assertEqual(Task.objects.count(), 0)

    def test_default_priority_is_medium(self):
        task = make_task(self.board, self.owner)
        self.assertEqual(task.priority, Task.Priority.MEDIUM)

    def test_default_status_is_todo(self):
        task = make_task(self.board, self.owner)
        self.assertEqual(task.status, Task.Status.TODO)


# ═══════════════════════════════════════════════════════════════════════════
# SERIALIZER TESTS
# ═══════════════════════════════════════════════════════════════════════════

from django.test import RequestFactory as DjangoRF
# pyrefly: ignore [missing-import]
from apps.tasks.serializers import (
    TaskCreateSerializer,
    TaskMoveSerializer,
    TaskReorderSerializer,
    TaskUpdateSerializer,
)


class TaskCreateSerializerTest(TestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)
        self.board   = make_board(self.project)
        factory      = DjangoRF()
        req          = factory.post("/")
        req.user     = self.owner
        self.context = {"request": req, "project": self.project, "board": self.board}

    def test_valid_data_creates_task(self):
        s = TaskCreateSerializer(data={"title": "New task"}, context=self.context)
        self.assertTrue(s.is_valid(), s.errors)
        task = s.save()
        self.assertEqual(task.title, "New task")
        self.assertEqual(task.created_by, self.owner)

    def test_blank_title_invalid(self):
        s = TaskCreateSerializer(data={"title": "  "}, context=self.context)
        self.assertFalse(s.is_valid())
        self.assertIn("title", s.errors)

    def test_past_due_date_invalid(self):
        s = TaskCreateSerializer(
            data={"title": "T", "due_date": str(past_date())},
            context=self.context,
        )
        self.assertFalse(s.is_valid())
        self.assertIn("due_date", s.errors)

    def test_future_due_date_valid(self):
        s = TaskCreateSerializer(
            data={"title": "T", "due_date": str(future_date())},
            context=self.context,
        )
        self.assertTrue(s.is_valid(), s.errors)

    def test_non_member_assignee_invalid(self):
        stranger = make_user(email="s@example.com")
        s = TaskCreateSerializer(
            data={"title": "T", "assignee_id": stranger.pk},
            context=self.context,
        )
        self.assertFalse(s.is_valid())
        self.assertIn("assignee_id", s.errors)

    def test_member_assignee_valid(self):
        member = make_user(email="m@example.com")
        add_member(self.project, member)
        s = TaskCreateSerializer(
            data={"title": "T", "assignee_id": member.pk},
            context=self.context,
        )
        self.assertTrue(s.is_valid(), s.errors)

    def test_position_auto_assigned(self):
        make_task(self.board, self.owner, position=0)
        make_task(self.board, self.owner, position=1)
        s = TaskCreateSerializer(data={"title": "Third"}, context=self.context)
        s.is_valid(raise_exception=True)
        task = s.save()
        self.assertEqual(task.position, 2)


class TaskReorderSerializerTest(TestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)
        self.board   = make_board(self.project)
        self.t1 = make_task(self.board, self.owner, title="A", position=0)
        self.t2 = make_task(self.board, self.owner, title="B", position=1)
        self.t3 = make_task(self.board, self.owner, title="C", position=2)

    def _ctx(self):
        return {"board": self.board}

    def _payload(self, order):
        return {"tasks": [{"id": t.pk, "position": i} for i, t in enumerate(order)]}

    def test_valid_reorder_saves(self):
        s = TaskReorderSerializer(data=self._payload([self.t3, self.t1, self.t2]), context=self._ctx())
        self.assertTrue(s.is_valid(), s.errors)
        s.save()
        self.t3.refresh_from_db()
        self.assertEqual(self.t3.position, 0)

    def test_missing_task_invalid(self):
        data = {"tasks": [{"id": self.t1.pk, "position": 0}, {"id": self.t2.pk, "position": 1}]}
        s = TaskReorderSerializer(data=data, context=self._ctx())
        self.assertFalse(s.is_valid())

    def test_duplicate_ids_invalid(self):
        data = {"tasks": [
            {"id": self.t1.pk, "position": 0},
            {"id": self.t1.pk, "position": 1},
            {"id": self.t3.pk, "position": 2},
        ]}
        s = TaskReorderSerializer(data=data, context=self._ctx())
        self.assertFalse(s.is_valid())

    def test_unknown_task_id_invalid(self):
        data = {"tasks": [
            {"id": self.t1.pk, "position": 0},
            {"id": self.t2.pk, "position": 1},
            {"id": 99999, "position": 2},
        ]}
        s = TaskReorderSerializer(data=data, context=self._ctx())
        self.assertFalse(s.is_valid())


# ═══════════════════════════════════════════════════════════════════════════
# VIEW / INTEGRATION TESTS
# ═══════════════════════════════════════════════════════════════════════════

class TaskListCreateTest(APITestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)
        self.board   = make_board(self.project)
        self.client  = auth_client(self.owner)

    def test_list_returns_200(self):
        res = self.client.get(tasks_url(self.project.pk, self.board.pk))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_list_ordered_by_position(self):
        make_task(self.board, self.owner, title="C", position=2)
        make_task(self.board, self.owner, title="A", position=0)
        make_task(self.board, self.owner, title="B", position=1)
        res = self.client.get(tasks_url(self.project.pk, self.board.pk))
        titles = [t["title"] for t in res.data]
        self.assertEqual(titles, ["A", "B", "C"])

    def test_list_filter_by_priority(self):
        make_task(self.board, self.owner, title="High",   priority=Task.Priority.HIGH)
        make_task(self.board, self.owner, title="Low",    priority=Task.Priority.LOW)
        res = self.client.get(tasks_url(self.project.pk, self.board.pk) + "?priority=high")
        titles = [t["title"] for t in res.data]
        self.assertIn("High", titles)
        self.assertNotIn("Low", titles)

    def test_list_filter_by_status(self):
        make_task(self.board, self.owner, title="Done",  status=Task.Status.DONE)
        make_task(self.board, self.owner, title="Todo",  status=Task.Status.TODO)
        res = self.client.get(tasks_url(self.project.pk, self.board.pk) + "?status=done")
        titles = [t["title"] for t in res.data]
        self.assertIn("Done", titles)
        self.assertNotIn("Todo", titles)

    def test_list_filter_overdue(self):
        make_task(self.board, self.owner, title="Late",   due_date=past_date())
        make_task(self.board, self.owner, title="OnTime", due_date=future_date())
        res = self.client.get(tasks_url(self.project.pk, self.board.pk) + "?overdue=true")
        titles = [t["title"] for t in res.data]
        self.assertIn("Late", titles)
        self.assertNotIn("OnTime", titles)

    def test_create_returns_201(self):
        res = self.client.post(tasks_url(self.project.pk, self.board.pk), {"title": "New task"})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_create_sets_created_by(self):
        res = self.client.post(tasks_url(self.project.pk, self.board.pk), {"title": "T"})
        self.assertEqual(res.data["created_by"]["email"], self.owner.email)

    def test_create_auto_position(self):
        make_task(self.board, self.owner, position=0)
        res = self.client.post(tasks_url(self.project.pk, self.board.pk), {"title": "T"})
        self.assertEqual(res.data["position"], 1)

    def test_create_includes_is_overdue(self):
        res = self.client.post(tasks_url(self.project.pk, self.board.pk), {"title": "T"})
        self.assertIn("is_overdue", res.data)

    def test_viewer_can_list(self):
        viewer = make_user(email="v@example.com")
        add_member(self.project, viewer, ProjectMember.Role.VIEWER)
        res = auth_client(viewer).get(tasks_url(self.project.pk, self.board.pk))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_viewer_cannot_create(self):
        viewer = make_user(email="v@example.com")
        add_member(self.project, viewer, ProjectMember.Role.VIEWER)
        res = auth_client(viewer).post(tasks_url(self.project.pk, self.board.pk), {"title": "T"})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_stranger_gets_404(self):
        stranger = make_user(email="s@example.com")
        res = auth_client(stranger).get(tasks_url(self.project.pk, self.board.pk))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_gets_401(self):
        res = self.client_class().get(tasks_url(self.project.pk, self.board.pk))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class TaskUpdateTest(APITestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)
        self.board   = make_board(self.project)
        self.task    = make_task(self.board, self.owner, title="Original")
        self.client  = auth_client(self.owner)

    def test_patch_title(self):
        res = self.client.patch(task_detail_url(self.project.pk, self.board.pk, self.task.pk), {"title": "Updated"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.task.refresh_from_db()
        self.assertEqual(self.task.title, "Updated")

    def test_patch_status(self):
        res = self.client.patch(
            task_detail_url(self.project.pk, self.board.pk, self.task.pk),
            {"status": "in_progress"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, Task.Status.IN_PROGRESS)

    def test_patch_priority(self):
        res = self.client.patch(
            task_detail_url(self.project.pk, self.board.pk, self.task.pk),
            {"priority": "urgent"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_patch_assignee(self):
        member = make_user(email="m@example.com")
        add_member(self.project, member)
        res = self.client.patch(
            task_detail_url(self.project.pk, self.board.pk, self.task.pk),
            {"assignee_id": member.pk},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["assignee"]["email"], member.email)

    def test_patch_non_member_assignee_fails(self):
        stranger = make_user(email="s@example.com")
        res = self.client.patch(
            task_detail_url(self.project.pk, self.board.pk, self.task.pk),
            {"assignee_id": stranger.pk},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_viewer_cannot_patch(self):
        viewer = make_user(email="v@example.com")
        add_member(self.project, viewer, ProjectMember.Role.VIEWER)
        res = auth_client(viewer).patch(
            task_detail_url(self.project.pk, self.board.pk, self.task.pk),
            {"title": "Hack"},
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_put_not_allowed(self):
        res = self.client.put(
            task_detail_url(self.project.pk, self.board.pk, self.task.pk),
            {"title": "T"},
        )
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class TaskDeleteTest(APITestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)
        self.board   = make_board(self.project)
        self.task    = make_task(self.board, self.owner)
        self.client  = auth_client(self.owner)

    def test_owner_can_delete(self):
        res = self.client.delete(task_detail_url(self.project.pk, self.board.pk, self.task.pk))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Task.objects.filter(pk=self.task.pk).exists())

    def test_viewer_cannot_delete(self):
        viewer = make_user(email="v@example.com")
        add_member(self.project, viewer, ProjectMember.Role.VIEWER)
        res = auth_client(viewer).delete(
            task_detail_url(self.project.pk, self.board.pk, self.task.pk)
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class TaskMoveTest(APITestCase):

    def setUp(self):
        self.owner    = make_user()
        self.project  = make_project(self.owner)
        self.board_a  = make_board(self.project, "Todo",        position=0)
        self.board_b  = make_board(self.project, "In Progress", position=1)
        self.task     = make_task(self.board_a, self.owner)
        self.client   = auth_client(self.owner)

    def test_move_to_different_board(self):
        res = self.client.post(
            task_move_url(self.project.pk, self.board_a.pk, self.task.pk),
            {"board_id": self.board_b.pk, "position": 0},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.task.refresh_from_db()
        self.assertEqual(self.task.board, self.board_b)
        self.assertEqual(self.task.position, 0)

    def test_move_shifts_existing_tasks(self):
        existing = make_task(self.board_b, self.owner, title="Existing", position=0)
        self.client.post(
            task_move_url(self.project.pk, self.board_a.pk, self.task.pk),
            {"board_id": self.board_b.pk, "position": 0},
            format="json",
        )
        existing.refresh_from_db()
        self.assertEqual(existing.position, 1)

    def test_move_to_foreign_board_fails(self):
        other_owner   = make_user(email="o@example.com")
        other_project = make_project(other_owner)
        other_board   = make_board(other_project)
        res = self.client.post(
            task_move_url(self.project.pk, self.board_a.pk, self.task.pk),
            {"board_id": other_board.pk, "position": 0},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class TaskReorderViewTest(APITestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)
        self.board   = make_board(self.project)
        self.t1 = make_task(self.board, self.owner, title="A", position=0)
        self.t2 = make_task(self.board, self.owner, title="B", position=1)
        self.t3 = make_task(self.board, self.owner, title="C", position=2)
        self.client = auth_client(self.owner)

    def _payload(self, order):
        return {"tasks": [{"id": t.pk, "position": i} for i, t in enumerate(order)]}

    def test_reorder_returns_200(self):
        res = self.client.post(
            task_reorder_url(self.project.pk, self.board.pk),
            self._payload([self.t3, self.t1, self.t2]),
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_reorder_persists(self):
        self.client.post(
            task_reorder_url(self.project.pk, self.board.pk),
            self._payload([self.t3, self.t1, self.t2]),
            format="json",
        )
        self.t3.refresh_from_db()
        self.assertEqual(self.t3.position, 0)

    def test_partial_reorder_rejected(self):
        data = {"tasks": [{"id": self.t1.pk, "position": 0}]}
        res = self.client.post(
            task_reorder_url(self.project.pk, self.board.pk),
            data, format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_viewer_cannot_reorder(self):
        viewer = make_user(email="v@example.com")
        add_member(self.project, viewer, ProjectMember.Role.VIEWER)
        res = auth_client(viewer).post(
            task_reorder_url(self.project.pk, self.board.pk),
            self._payload([self.t1, self.t2, self.t3]),
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


# ═══════════════════════════════════════════════════════════════════════════
# PERMISSION UNIT TESTS
# ═══════════════════════════════════════════════════════════════════════════

from django.test import RequestFactory as DjangoRF
# pyrefly: ignore [missing-import]
from apps.tasks.permissions import TaskPermission


class TaskPermissionTest(TestCase):

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
        self.perm = TaskPermission()

    def _req(self, user, method="GET"):
        req = getattr(self.factory, method.lower())("/")
        req.user    = user
        req.project = self.project
        return req

    def test_member_can_read(self):
        self.assertTrue(self.perm.has_permission(self._req(self.member, "GET"), None))

    def test_viewer_can_read(self):
        self.assertTrue(self.perm.has_permission(self._req(self.viewer, "GET"), None))

    def test_stranger_blocked(self):
        self.assertFalse(self.perm.has_permission(self._req(self.stranger, "GET"), None))

    def test_viewer_cannot_write(self):
        self.assertFalse(self.perm.has_permission(self._req(self.viewer, "POST"), None))

    def test_member_can_write(self):
        self.assertTrue(self.perm.has_permission(self._req(self.member, "POST"), None))

    def test_admin_can_write(self):
        self.assertTrue(self.perm.has_permission(self._req(self.admin, "DELETE"), None))

    def test_owner_can_write(self):
        self.assertTrue(self.perm.has_permission(self._req(self.owner, "PATCH"), None))

    def test_no_project_blocks_all(self):
        req = self.factory.get("/")
        req.user = self.owner
        self.assertFalse(self.perm.has_permission(req, None))