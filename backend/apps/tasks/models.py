from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class TaskQuerySet(models.QuerySet):

    def for_board(self, board_id: int):
        return (
            self.filter(board_id=board_id)
            .select_related("created_by", "board")
            .prefetch_related("assignees", "labels")
            .order_by("position")
        )

    def for_project(self, project_id: int):
        return (
            self.filter(project_id=project_id)
            .select_related("created_by", "board")
            .prefetch_related("assignees", "labels")
            .order_by("board__position", "position")
        )

    def for_user(self, user):
        return self.filter(project__members=user).distinct()

    def assigned_to(self, user):
        return self.filter(assignees=user)

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
    assignees = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="assigned_tasks",
    )
    labels = models.ManyToManyField(
        "tasks.Label",
        blank=True,
        related_name="task_labels",
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
        ]

    def __str__(self) -> str:
        return f"[{self.get_priority_display()}] {self.title}"

# ---------------------------------------------------------------------------
# Additional models for full task management
# ---------------------------------------------------------------------------

class Label(models.Model):
    name = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=7, default="#cccccc", help_text="Hex color code, e.g., #ff5733")

    class Meta:
        verbose_name = "Label"
        verbose_name_plural = "Labels"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name

 

class ActivityLog(models.Model):
    class Action(models.TextChoices):
        CREATED = "created", "Task created"
        UPDATED = "updated", "Task updated"
        MOVED = "moved", "Task moved"
        ASSIGNEE_ADDED = "assignee_added", "Assignee added"
        ASSIGNEE_REMOVED = "assignee_removed", "Assignee removed"
        PRIORITY_CHANGED = "priority_changed", "Priority changed"
        DUE_DATE_CHANGED = "due_date_changed", "Due date changed"
        COMMENT_ADDED = "comment_added", "Comment added"
        COMMENT_EDITED = "comment_edited", "Comment edited"
        COMMENT_DELETED = "comment_deleted", "Comment deleted"
        LABEL_ADDED = "label_added", "Label added"
        LABEL_REMOVED = "label_removed", "Label removed"

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="activity_logs")
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="activity_logs")
    action = models.CharField(max_length=30, choices=Action.choices)
    timestamp = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(blank=True, null=True, help_text="Additional context, e.g., {\"from\": \"Todo\", \"to\": \"In Progress\"}")

    class Meta:
        ordering = ["-timestamp"]
        verbose_name = "Activity Log"
        verbose_name_plural = "Activity Logs"

    def __str__(self) -> str:
        return f"{self.get_action_display()} on {self.task}"
    def save(self, *args, **kwargs):
        if self.board_id and not self.project_id:
            self.project_id = self.board.project_id
        super().save(*args, **kwargs)