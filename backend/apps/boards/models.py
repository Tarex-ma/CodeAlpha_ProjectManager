from django.db import models

# Create your models here.
"""
apps/boards/models.py
──────────────────────
Board = a column on the Kanban board (Todo, In Progress, Review, Done).
Each Board belongs to one Project and has a `position` integer for ordering.

Design decisions
────────────────
- position is a non-negative integer, unique per project.
  Gaps are fine (0, 2, 5) — we only sort by it, never assume contiguity.
- The Board manager exposes .for_project() so views never write raw filters.
- on_delete=CASCADE means deleting a project wipes all its boards (and later,
  all tasks inside those boards) automatically.
- We deliberately do NOT enforce unique position at the DB level because
  reorder operations need to update multiple rows; a unique constraint would
  cause transient conflicts mid-reorder.
"""

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class BoardQuerySet(models.QuerySet):

    def for_project(self, project_id: int):
        return self.filter(project_id=project_id).order_by("position")

    def for_user(self, user):
        """Boards the user can see — they must be a project member."""
        return self.filter(project__members=user).distinct()


class BoardManager(models.Manager):
    def get_queryset(self):
        return BoardQuerySet(self.model, using=self._db)

    def for_project(self, project_id: int):
        return self.get_queryset().for_project(project_id)

    def for_user(self, user):
        return self.get_queryset().for_user(user)


class Board(models.Model):
    """
    A single column on a project's Kanban board.

    Example layout for project "Sprint Q3":
        position=0  title="Todo"
        position=1  title="In Progress"
        position=2  title="Review"
        position=3  title="Done"
    """

    project  = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="boards",
    )
    title    = models.CharField(max_length=100)
    position = models.PositiveIntegerField(default=0, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = BoardManager()

    class Meta:
        verbose_name        = _("Board")
        verbose_name_plural = _("Boards")
        ordering            = ["position"]
        # Soft uniqueness hint for the DB query planner (not a hard constraint)
        indexes = [
            models.Index(fields=["project", "position"]),
        ]

    def __str__(self) -> str:
        return f"{self.project.title} › {self.title} (pos {self.position})"

    @classmethod
    def next_position(cls, project_id: int) -> int:
        """Return position = max(existing) + 1, or 0 if the project has no boards."""
        last = (
            cls.objects
            .filter(project_id=project_id)
            .aggregate(models.Max("position"))["position__max"]
        )
        return 0 if last is None else last + 1