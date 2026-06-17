"""
apps/notifications/services.py
────────────────────────────────
One function per trigger event.

Why a services module?
──────────────────────
- Keeps model.py clean (no business logic).
- All notification creation goes through one place → easy to extend
  (add email, push, WebSocket) without touching other apps.
- Views and signals call these functions; they never build Notification
  objects directly.

Usage in other apps
───────────────────
    from apps.notifications.services import notify_task_assigned
    notify_task_assigned(task=task, actor=request.user)

Adding new notification types
──────────────────────────────
1. Add a choice to NotificationType in models.py
2. Add a function here following the same pattern
3. Call it from the relevant view or signal
"""

from django.contrib.contenttypes.models import ContentType

from .models import Notification, NotificationType


def _create(recipient, actor, notification_type, message, target=None) -> Notification | None:
    """
    Internal helper. Returns None (silently) if recipient == actor so users
    don't get notified about their own actions.
    """
    if recipient == actor:
        return None

    kwargs = dict(
        recipient=recipient,
        actor=actor,
        notification_type=notification_type,
        message=message,
    )

    if target is not None:
        kwargs["content_type"] = ContentType.objects.get_for_model(target)
        kwargs["object_id"]    = target.pk

    return Notification.objects.create(**kwargs)


# ── Public trigger functions ──────────────────────────────────────────────

def notify_task_assigned(*, task, actor) -> Notification | None:
    """
    Call when a task's assignee changes.
    Notifies the new assignee (not the actor who made the assignment).

    from apps.notifications.services import notify_task_assigned
    notify_task_assigned(task=task, actor=request.user)
    """
    assignee = task.assignee
    if not assignee:
        return None

    message = (
        f"{actor.get_full_name() or actor.email} assigned you to "
        f"\"{task.title}\" in {task.project.title}."
    )
    return _create(
        recipient=assignee,
        actor=actor,
        notification_type=NotificationType.TASK_ASSIGNED,
        message=message,
        target=task,
    )


def notify_comment_added(*, comment, actor) -> list[Notification]:
    """
    Call when a comment is created on a task.
    Notifies:
      - the task assignee (if any and if not the commenter)
      - the task creator (if not the commenter)

    from apps.notifications.services import notify_comment_added
    notify_comment_added(comment=comment, actor=request.user)
    """
    task        = comment.task
    project     = task.project
    recipients  = set()

    if task.assignee:
        recipients.add(task.assignee)
    if task.created_by:
        recipients.add(task.created_by)

    notifications = []
    for recipient in recipients:
        message = (
            f"{actor.get_full_name() or actor.email} commented on "
            f"\"{task.title}\" in {project.title}."
        )
        n = _create(
            recipient=recipient,
            actor=actor,
            notification_type=NotificationType.COMMENT_ADDED,
            message=message,
            target=comment,
        )
        if n:
            notifications.append(n)

    return notifications


def notify_project_invitation(*, project, recipient, actor) -> Notification | None:
    """
    Call when a user is invited to a project.

    from apps.notifications.services import notify_project_invitation
    notify_project_invitation(project=project, recipient=invitee, actor=request.user)
    """
    message = (
        f"{actor.get_full_name() or actor.email} invited you to join "
        f"\"{project.title}\"."
    )
    return _create(
        recipient=recipient,
        actor=actor,
        notification_type=NotificationType.PROJECT_INVITATION,
        message=message,
        target=project,
    )


def notify_task_status_changed(*, task, old_status: str, actor) -> Notification | None:
    """
    Call when a task's status field changes.
    Notifies the task creator (if different from the actor).

    from apps.notifications.services import notify_task_status_changed
    notify_task_status_changed(task=task, old_status="todo", actor=request.user)
    """
    recipient = task.created_by
    if not recipient:
        return None

    message = (
        f"{actor.get_full_name() or actor.email} moved \"{task.title}\" "
        f"from {old_status.replace('_', ' ')} → "
        f"{task.get_status_display()} in {task.project.title}."
    )
    return _create(
        recipient=recipient,
        actor=actor,
        notification_type=NotificationType.TASK_STATUS_CHANGED,
        message=message,
        target=task,
    )