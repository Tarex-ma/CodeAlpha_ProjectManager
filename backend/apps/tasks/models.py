from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class TaskQuerySet(models.QuerySet):

    def for_board(self, board_id: int):
        return (
            self.filter(board_id=board_id)
            .select_related("assignee", "created_by", "board")
            .order_by("position")
        )

    def for_project(self, project_id: int):
        return (
            self.filter(project_id=project_id)
            .select_related("assignee", "created_by", "board")
            .order_by("board__position", "position")
        )

    def for_user(self, user):
        return self.filter(project__members=user).distinct()

    def assigned_to(self, user):
        return self.filter(assignee=user)

    def overdue(self):
        from django.utils import timezone
        return self.filter(
            due_date__lt=timezone.now().date(),
        ).exclude(status=Task.Status.DONE)


class TaskManager(models.Manager):
    def get_queryset(self):
        return TaskQuerySet(self.model, using=self._db)

    def for_board(self, board_id: int):
        return self.get_queryset().for_board(board_id)

    def for_project(self, project_id: int):
        return self.get_queryset().for_project(project_id)

    def for_user(self, user):
        return self.get_queryset().for_user(user)

    @staticmethod
    def next_position(board_id: int) -> int:
        last = Task.objects.filter(board_id=board_id).aggregate(
            models.Max("position")
        )["position__max"]
        return 0 if last is None else last + 1


class Task(models.Model):

    class Priority(models.TextChoices):
        LOW    = "low",    _("Low")
        MEDIUM = "medium", _("Medium")
        HIGH   = "high",   _("High")
        URGENT = "urgent", _("Urgent")

    class Status(models.TextChoices):
        TODO        = "todo",        _("Todo")
        IN_PROGRESS = "in_progress", _("In Progress")
        IN_REVIEW   = "in_review",   _("In Review")
        DONE        = "done",        _("Done")
        CANCELLED   = "cancelled",   _("Cancelled")

    title       = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    board = models.ForeignKey(
        "boards.Board",
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="assigned_tasks",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        on_delete=models.SET_NULL,
        related_name="created_tasks",
    )

    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM, db_index=True)
    status   = models.CharField(max_length=15, choices=Status.choices,   default=Status.TODO,    db_index=True)
    due_date = models.DateField(null=True, blank=True, db_index=True)
    position = models.PositiveIntegerField(default=0, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = TaskManager()

    class Meta:
        verbose_name        = _("Task")
        verbose_name_plural = _("Tasks")
        ordering            = ["position"]
        indexes = [
            models.Index(fields=["board", "position"]),
            models.Index(fields=["project", "status"]),
            models.Index(fields=["assignee", "due_date"]),
        ]

    def __str__(self) -> str:
        return f"[{self.get_priority_display()}] {self.title}"

    def save(self, *args, **kwargs):
        if self.board_id and not self.project_id:
            self.project_id = self.board.project_id
        super().save(*args, **kwargs)