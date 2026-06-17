"""
apps/notifications/tests.py
─────────────────────────────
ModelTest        — ORM, manager, bulk_mark_read, mark_read, __str__
ServiceTest      — each trigger function: correct recipient, message, target, self-notify guard
ViewTest         — list (filters), retrieve, mark-read, mark-all-read, delete, clear
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
from apps.notifications.models import Notification, NotificationType
from apps.notifications.services import (
    notify_comment_added,
    notify_project_invitation,
    notify_task_assigned,
    notify_task_status_changed,
)


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
    p = Project.objects.create(owner=owner, title="Proj")
    ProjectMember.objects.create(project=p, user=owner, role=ProjectMember.Role.OWNER)
    return p


def add_member(project, user, role=ProjectMember.Role.MEMBER):
    return ProjectMember.objects.create(project=project, user=user, role=role)


def make_board(project) -> Board:
    return Board.objects.create(project=project, title="Board", position=0)


def make_task(board, created_by, assignee=None) -> Task:
    return Task.objects.create(
        board=board, project=board.project,
        created_by=created_by, title="Task", position=0,
        assignee=assignee,
    )


def make_comment(task, author) -> Comment:
    return Comment.objects.create(task=task, author=author, content="LGTM")


def make_notification(recipient, actor=None, ntype=NotificationType.TASK_ASSIGNED, msg="msg") -> Notification:
    return Notification.objects.create(
        recipient=recipient,
        actor=actor,
        notification_type=ntype,
        message=msg,
    )


# ── URL helpers ───────────────────────────────────────────────────────────

LIST_URL       = reverse("notification-list")
MARK_ALL_URL   = reverse("notification-mark-all-read")
CLEAR_URL      = reverse("notification-clear")

def detail_url(pk):      return reverse("notification-detail",    args=[pk])
def mark_read_url(pk):   return reverse("notification-mark-read", args=[pk])


# ═══════════════════════════════════════════════════════════════════════════
# MODEL TESTS
# ═══════════════════════════════════════════════════════════════════════════

class NotificationModelTest(TestCase):

    def setUp(self):
        self.user  = make_user()
        self.actor = make_user(email="actor@example.com")

    def test_str_includes_recipient_and_message(self):
        n = make_notification(self.user, msg="You were assigned to Task X")
        self.assertIn(self.user.email, str(n))

    def test_default_is_read_false(self):
        n = make_notification(self.user)
        self.assertFalse(n.is_read)

    def test_mark_read_sets_flag(self):
        n = make_notification(self.user)
        n.mark_read()
        n.refresh_from_db()
        self.assertTrue(n.is_read)

    def test_mark_read_no_op_if_already_read(self):
        n = make_notification(self.user)
        n.is_read = True
        n.save()
        n.mark_read()   # should not raise or hit DB unnecessarily
        self.assertTrue(n.is_read)

    def test_bulk_mark_read_returns_count(self):
        make_notification(self.user)
        make_notification(self.user)
        make_notification(self.user)
        count = Notification.bulk_mark_read(self.user)
        self.assertEqual(count, 3)

    def test_bulk_mark_read_only_affects_recipient(self):
        other = make_user(email="o@example.com")
        make_notification(self.user)
        make_notification(other)
        Notification.bulk_mark_read(self.user)
        self.assertTrue(Notification.objects.filter(recipient=other, is_read=False).exists())

    def test_for_recipient_ordered_newest_first(self):
        n1 = make_notification(self.user, msg="First")
        n2 = make_notification(self.user, msg="Second")
        ids = list(Notification.objects.for_recipient(self.user).values_list("id", flat=True))
        self.assertEqual(ids[0], n2.pk)   # newest first

    def test_unread_manager_filter(self):
        make_notification(self.user)
        n2 = make_notification(self.user)
        n2.is_read = True
        n2.save()
        unread = Notification.objects.for_recipient(self.user).unread()
        self.assertEqual(unread.count(), 1)

    def test_unread_count_helper(self):
        make_notification(self.user)
        make_notification(self.user)
        self.assertEqual(Notification.objects.unread_count(self.user), 2)

    def test_cascade_delete_with_recipient(self):
        make_notification(self.user)
        self.user.delete()
        self.assertEqual(Notification.objects.count(), 0)

    def test_actor_null_on_actor_delete(self):
        n = make_notification(self.user, actor=self.actor)
        self.actor.delete()
        n.refresh_from_db()
        self.assertIsNone(n.actor)


# ═══════════════════════════════════════════════════════════════════════════
# SERVICE TESTS
# ═══════════════════════════════════════════════════════════════════════════

class NotifyTaskAssignedTest(TestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)
        self.board   = make_board(self.project)
        self.assignee = make_user(email="a@example.com")
        add_member(self.project, self.assignee)

    def test_creates_notification_for_assignee(self):
        task = make_task(self.board, self.owner, assignee=self.assignee)
        n = notify_task_assigned(task=task, actor=self.owner)
        self.assertIsNotNone(n)
        self.assertEqual(n.recipient, self.assignee)
        self.assertEqual(n.notification_type, NotificationType.TASK_ASSIGNED)

    def test_message_mentions_task_title(self):
        task = make_task(self.board, self.owner, assignee=self.assignee)
        n = notify_task_assigned(task=task, actor=self.owner)
        self.assertIn(task.title, n.message)

    def test_no_notification_when_no_assignee(self):
        task = make_task(self.board, self.owner)
        n = notify_task_assigned(task=task, actor=self.owner)
        self.assertIsNone(n)

    def test_no_self_notification(self):
        """Actor assigning themselves gets no notification."""
        task = make_task(self.board, self.owner, assignee=self.owner)
        n = notify_task_assigned(task=task, actor=self.owner)
        self.assertIsNone(n)

    def test_target_is_task(self):
        task = make_task(self.board, self.owner, assignee=self.assignee)
        n = notify_task_assigned(task=task, actor=self.owner)
        self.assertEqual(n.target, task)


class NotifyCommentAddedTest(TestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)
        self.board   = make_board(self.project)
        self.commenter = make_user(email="c@example.com")
        add_member(self.project, self.commenter)
        self.assignee = make_user(email="a@example.com")
        add_member(self.project, self.assignee)

    def test_notifies_assignee_and_creator(self):
        task = make_task(self.board, self.owner, assignee=self.assignee)
        comment = make_comment(task, self.commenter)
        notifications = notify_comment_added(comment=comment, actor=self.commenter)
        recipients = {n.recipient for n in notifications}
        self.assertIn(self.assignee, recipients)
        self.assertIn(self.owner, recipients)

    def test_does_not_notify_commenter_themselves(self):
        task = make_task(self.board, self.owner, assignee=self.commenter)
        comment = make_comment(task, self.commenter)
        notifications = notify_comment_added(comment=comment, actor=self.commenter)
        recipients = {n.recipient for n in notifications}
        self.assertNotIn(self.commenter, recipients)

    def test_notification_type_is_comment_added(self):
        task = make_task(self.board, self.owner)
        comment = make_comment(task, self.commenter)
        notifications = notify_comment_added(comment=comment, actor=self.commenter)
        for n in notifications:
            self.assertEqual(n.notification_type, NotificationType.COMMENT_ADDED)


class NotifyProjectInvitationTest(TestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)
        self.invitee = make_user(email="i@example.com")

    def test_creates_notification_for_invitee(self):
        n = notify_project_invitation(
            project=self.project, recipient=self.invitee, actor=self.owner
        )
        self.assertIsNotNone(n)
        self.assertEqual(n.recipient, self.invitee)
        self.assertEqual(n.notification_type, NotificationType.PROJECT_INVITATION)

    def test_message_mentions_project_title(self):
        n = notify_project_invitation(
            project=self.project, recipient=self.invitee, actor=self.owner
        )
        self.assertIn(self.project.title, n.message)

    def test_no_self_invitation(self):
        n = notify_project_invitation(
            project=self.project, recipient=self.owner, actor=self.owner
        )
        self.assertIsNone(n)


class NotifyTaskStatusChangedTest(TestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)
        self.board   = make_board(self.project)
        self.actor   = make_user(email="a@example.com")
        add_member(self.project, self.actor)

    def test_notifies_task_creator(self):
        task = make_task(self.board, self.owner)
        task.status = Task.Status.IN_PROGRESS
        task.save()
        n = notify_task_status_changed(task=task, old_status="todo", actor=self.actor)
        self.assertIsNotNone(n)
        self.assertEqual(n.recipient, self.owner)
        self.assertEqual(n.notification_type, NotificationType.TASK_STATUS_CHANGED)

    def test_message_mentions_old_and_new_status(self):
        task = make_task(self.board, self.owner)
        task.status = Task.Status.DONE
        task.save()
        n = notify_task_status_changed(task=task, old_status="in_progress", actor=self.actor)
        self.assertIn("in progress", n.message)

    def test_no_notification_when_no_created_by(self):
        task = make_task(self.board, self.owner)
        task.created_by = None
        task.save()
        n = notify_task_status_changed(task=task, old_status="todo", actor=self.actor)
        self.assertIsNone(n)

    def test_no_self_notification(self):
        task = make_task(self.board, self.owner)
        n = notify_task_status_changed(task=task, old_status="todo", actor=self.owner)
        self.assertIsNone(n)


# ═══════════════════════════════════════════════════════════════════════════
# VIEW INTEGRATION TESTS
# ═══════════════════════════════════════════════════════════════════════════

class NotificationListTest(APITestCase):

    def setUp(self):
        self.user   = make_user()
        self.actor  = make_user(email="actor@example.com")
        self.client = auth_client(self.user)

    def test_list_returns_200(self):
        res = self.client.get(LIST_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_list_returns_own_notifications_only(self):
        other = make_user(email="o@example.com")
        make_notification(self.user,  msg="Mine")
        make_notification(other,      msg="Not mine")
        res = self.client.get(LIST_URL)
        messages = [n["message"] for n in res.data["results"]]
        self.assertIn("Mine", messages)
        self.assertNotIn("Not mine", messages)

    def test_list_includes_unread_count(self):
        make_notification(self.user)
        make_notification(self.user)
        res = self.client.get(LIST_URL)
        self.assertEqual(res.data["unread_count"], 2)

    def test_filter_unread_only(self):
        n1 = make_notification(self.user, msg="Unread")
        n2 = make_notification(self.user, msg="Read")
        n2.is_read = True
        n2.save()
        res = self.client.get(LIST_URL + "?unread=true")
        messages = [n["message"] for n in res.data["results"]]
        self.assertIn("Unread", messages)
        self.assertNotIn("Read", messages)

    def test_filter_by_type(self):
        make_notification(self.user, ntype=NotificationType.TASK_ASSIGNED, msg="Task")
        make_notification(self.user, ntype=NotificationType.COMMENT_ADDED, msg="Comment")
        res = self.client.get(LIST_URL + "?type=task_assigned")
        messages = [n["message"] for n in res.data["results"]]
        self.assertIn("Task", messages)
        self.assertNotIn("Comment", messages)

    def test_newest_first(self):
        n1 = make_notification(self.user, msg="First")
        n2 = make_notification(self.user, msg="Second")
        res = self.client.get(LIST_URL)
        results = res.data["results"]
        self.assertEqual(results[0]["id"], n2.pk)

    def test_unauthenticated_returns_401(self):
        res = self.client_class().get(LIST_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class NotificationDetailTest(APITestCase):

    def setUp(self):
        self.user         = make_user()
        self.other        = make_user(email="o@example.com")
        self.notification = make_notification(self.user)
        self.client       = auth_client(self.user)

    def test_retrieve_own_returns_200(self):
        res = self.client.get(detail_url(self.notification.pk))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_retrieve_other_user_notification_returns_404(self):
        other_notif = make_notification(self.other)
        res = self.client.get(detail_url(other_notif.pk))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_own_returns_204(self):
        res = self.client.delete(detail_url(self.notification.pk))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Notification.objects.filter(pk=self.notification.pk).exists())

    def test_delete_other_user_notification_returns_404(self):
        other_notif = make_notification(self.other)
        res = self.client.delete(detail_url(other_notif.pk))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class MarkReadTest(APITestCase):

    def setUp(self):
        self.user         = make_user()
        self.notification = make_notification(self.user)
        self.client       = auth_client(self.user)

    def test_mark_read_returns_200(self):
        res = self.client.patch(mark_read_url(self.notification.pk))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_mark_read_sets_is_read(self):
        self.client.patch(mark_read_url(self.notification.pk))
        self.notification.refresh_from_db()
        self.assertTrue(self.notification.is_read)

    def test_mark_read_returns_updated_notification(self):
        res = self.client.patch(mark_read_url(self.notification.pk))
        self.assertTrue(res.data["is_read"])

    def test_cannot_mark_other_users_notification(self):
        other        = make_user(email="o@example.com")
        other_notif  = make_notification(other)
        res = self.client.patch(mark_read_url(other_notif.pk))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class MarkAllReadTest(APITestCase):

    def setUp(self):
        self.user   = make_user()
        self.other  = make_user(email="o@example.com")
        self.client = auth_client(self.user)

    def test_mark_all_read_returns_200(self):
        make_notification(self.user)
        res = self.client.post(MARK_ALL_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_mark_all_read_returns_count(self):
        make_notification(self.user)
        make_notification(self.user)
        make_notification(self.user)
        res = self.client.post(MARK_ALL_URL)
        self.assertEqual(res.data["marked_read"], 3)

    def test_mark_all_read_does_not_affect_other_users(self):
        make_notification(self.other)
        self.client.post(MARK_ALL_URL)
        self.assertTrue(Notification.objects.filter(recipient=self.other, is_read=False).exists())

    def test_mark_all_read_zero_when_already_read(self):
        n = make_notification(self.user)
        n.is_read = True
        n.save()
        res = self.client.post(MARK_ALL_URL)
        self.assertEqual(res.data["marked_read"], 0)


class ClearReadTest(APITestCase):

    def setUp(self):
        self.user   = make_user()
        self.client = auth_client(self.user)

    def test_clear_read_returns_200(self):
        n = make_notification(self.user)
        n.is_read = True
        n.save()
        res = self.client.delete(CLEAR_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_clear_read_deletes_only_read(self):
        unread = make_notification(self.user, msg="Unread")
        read   = make_notification(self.user, msg="Read")
        read.is_read = True
        read.save()
        self.client.delete(CLEAR_URL)
        self.assertTrue(Notification.objects.filter(pk=unread.pk).exists())
        self.assertFalse(Notification.objects.filter(pk=read.pk).exists())

    def test_clear_read_returns_deleted_count(self):
        for _ in range(3):
            n = make_notification(self.user)
            n.is_read = True
            n.save()
        res = self.client.delete(CLEAR_URL)
        self.assertEqual(res.data["deleted"], 3)