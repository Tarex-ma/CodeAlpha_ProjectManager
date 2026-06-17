"""
apps/notifications/models.py
──────────────────────────────
Notification is a per-user inbox item.

Design decisions
────────────────
- verb + target pattern: every notification has a typed NotificationType so
  the frontend can render rich UI (icons, colours) without parsing message text.
- message is pre-rendered on creation (cheap to store, zero work to display).
- actor FK → the user who triggered the event (SET_NULL so notifications
  survive account deletion).
- Generic target link via content_type + object_id (optional):
  lets the frontend deep-link to the relevant task / project / comment
  without hard-coding FKs for every notification type.
- bulk_mark_read() class method does a single UPDATE instead of looping.
- NotificationQuerySet.for_recipient() pre-selects actor and content_type
  so list views have zero N+1 queries.
"""

from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import gettext_lazy as _


class NotificationType(models.TextChoices):
    TASK_ASSIGNED      = "task_assigned",      _("Task Assigned")
    COMMENT_ADDED      = "comment_added",      _("Comment Added")
    PROJECT_INVITATION = "project_invitation", _("Project Invitation")
    TASK_STATUS_CHANGED = "task_status_changed", _("Task Status Changed")
    TASK_DUE_SOON      = "task_due_soon",      _("Task Due Soon")      # future-ready
    MENTION            = "mention",            _("Mention")            # future-ready


class NotificationQuerySet(models.QuerySet):

    def for_recipient(self, user):
        return (
            self.filter(recipient=user)
            .select_related("actor", "content_type")
            .order_by("-created_at")
        )

    def unread(self):
        return self.filter(is_read=False)

    def read(self):
        return self.filter(is_read=True)

    def of_type(self, notification_type: str):
        return self.filter(notification_type=notification_type)


class NotificationManager(models.Manager):
    def get_queryset(self):
        return NotificationQuerySet(self.model, using=self._db)

    def for_recipient(self, user):
        return self.get_queryset().for_recipient(user)

    def unread_count(self, user) -> int:
        return self.get_queryset().for_recipient(user).unread().count()


class Notification(models.Model):
    # ── Who receives it ───────────────────────────────────────────────────
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        db_index=True,
    )

    # ── Who triggered it ──────────────────────────────────────────────────
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="triggered_notifications",
    )

    # ── What happened ─────────────────────────────────────────────────────
    notification_type = models.CharField(
        max_length=30,
        choices=NotificationType.choices,
        db_index=True,
    )
    message = models.TextField()

    # ── Deep-link target (optional generic FK) ────────────────────────────
    content_type  = models.ForeignKey(
        ContentType,
        null=True, blank=True,
        on_delete=models.SET_NULL,
    )
    object_id     = models.PositiveIntegerField(null=True, blank=True)
    target        = GenericForeignKey("content_type", "object_id")

    # ── State ─────────────────────────────────────────────────────────────
    is_read    = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    objects = NotificationManager()

    class Meta:
        verbose_name        = _("Notification")
        verbose_name_plural = _("Notifications")
        ordering            = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "is_read", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"→ {self.recipient.email}: {self.message[:60]}"

    def mark_read(self) -> None:
        if not self.is_read:
            self.is_read = True
            self.save(update_fields=["is_read"])

    @classmethod
    def bulk_mark_read(cls, user) -> int:
        """Mark all unread notifications for *user* as read in one query."""
        return cls.objects.for_recipient(user).unread().update(is_read=True)
