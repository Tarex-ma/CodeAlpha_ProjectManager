"""
apps/comments/models.py
─────────────────────────
Comment belongs to a Task.
author is stored as a direct FK for fast ownership checks.

Design decisions
────────────────
- task FK → CASCADE: deleting a task wipes all its comments.
- author FK → SET_NULL: deleting a user keeps the comment visible
  (content preserved, author shown as "Deleted user" in serializer).
- No reply/thread support here — add a self-referential `parent` FK
  later if needed.
- CommentQuerySet.for_task() pre-fetches the author so list views
  never trigger N+1 queries.
"""

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class CommentQuerySet(models.QuerySet):

    def for_task(self, task_id: int):
        return (
            self.filter(task_id=task_id)
            .select_related("author")
            .order_by("created_at")
        )

    def for_user(self, user):
        """Comments the user can see — must be a project member."""
        return self.filter(task__project__members=user).distinct()


class CommentManager(models.Manager):
    def get_queryset(self):
        return CommentQuerySet(self.model, using=self._db)

    def for_task(self, task_id: int):
        return self.get_queryset().for_task(task_id)

    def for_user(self, user):
        return self.get_queryset().for_user(user)


class Comment(models.Model):
    task    = models.ForeignKey(
        "tasks.Task",
        on_delete=models.CASCADE,
        related_name="comments",
    )
    author  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        on_delete=models.SET_NULL,
        related_name="comments",
    )
    content    = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_edited  = models.BooleanField(default=False)

    objects = CommentManager()

    class Meta:
        verbose_name        = _("Comment")
        verbose_name_plural = _("Comments")
        ordering            = ["created_at"]
        indexes = [
            models.Index(fields=["task", "created_at"]),
        ]

    def __str__(self) -> str:
        author = self.author.email if self.author else "deleted user"
        return f"Comment by {author} on task {self.task_id}"
