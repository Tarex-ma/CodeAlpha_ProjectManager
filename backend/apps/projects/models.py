from django.db import models

# Create your models here.
"""
apps/projects/models.py
────────────────────────
Two models:
  Project        — the board/workspace entity
  ProjectMember  — join table that adds role + join timestamp

Design notes
------------
- owner is stored directly on Project for fast ownership checks and
  survives membership deletions.
- ProjectMember uses unique_together so a user cannot be added twice.
- Role choices live on ProjectMember.Role — import anywhere cleanly.
- Custom manager exposes .for_user() and .with_members() so views are clean.
"""

from django.db import models
from django.db.models import Q
from django.conf import settings
from django.utils.translation import gettext_lazy as _



class ProjectQuerySet(models.QuerySet):

    def for_user(self, user):
        """All projects where user is owner OR a member."""
        return self.filter(
            Q(owner=user) | Q(members=user)
        ).distinct()

    def with_members(self):
        """Pre-fetch members + their user rows in one extra query."""
        return self.prefetch_related(
            models.Prefetch(
                "projectmember_set",
                queryset=ProjectMember.objects.select_related("user"),
                to_attr="member_list",
            )
        )

class ProjectManager(models.Manager):
    def get_queryset(self):
        return ProjectQuerySet(self.model, using=self._db)

    def for_user(self, user):
        return self.get_queryset().for_user(user)

    def with_members(self):
        return self.get_queryset().with_members()


class Project(models.Model):

    class Status(models.TextChoices):
        ACTIVE    = "active",    _("Active")
        ON_HOLD   = "on_hold",   _("On Hold")
        COMPLETED = "completed", _("Completed")
        ARCHIVED  = "archived",  _("Archived")

    title       = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    color       = models.CharField(max_length=20, default="#2196f3", blank=True)
    icon        = models.CharField(max_length=10, default="📁", blank=True)
    status      = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True,
    )
    due_date    = models.DateField(null=True, blank=True)
    owner       = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_projects",
    )
    # Access User objects via project.members.all()
    # Access ProjectMember rows via project.projectmember_set.all()
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="ProjectMember",
        through_fields=("project", "user"),
        related_name="projects",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ProjectManager()

    class Meta:
        verbose_name        = _("Project")
        verbose_name_plural = _("Projects")
        ordering            = ["-created_at"]

    def __str__(self) -> str:
        return self.title

    def get_member_role(self, user) -> str | None:
        """Return the role string for *user*, or None if not a member."""
        try:
            return self.projectmember_set.get(user=user).role
        except ProjectMember.DoesNotExist:
            return None

    def is_admin_or_owner(self, user) -> bool:
        if self.owner_id == user.pk:
            return True
        return self.get_member_role(user) == ProjectMember.Role.ADMIN


class ProjectMember(models.Model):
    """
    Through model that links a User to a Project with an explicit role.

    Roles
    -----
    OWNER  — auto-assigned to creator; should never be reassigned via API.
    ADMIN  — can edit settings, invite/remove members, change roles.
    MEMBER — full read/write on tasks and comments.
    VIEWER — read-only across the whole project.
    """

    class Role(models.TextChoices):
        OWNER  = "owner",  _("Owner")
        ADMIN  = "admin",  _("Admin")
        MEMBER = "member", _("Member")
        VIEWER = "viewer", _("Viewer")

    project   = models.ForeignKey(Project,                        on_delete=models.CASCADE)
    user      = models.ForeignKey(settings.AUTH_USER_MODEL,       on_delete=models.CASCADE)
    role      = models.CharField(max_length=10, choices=Role.choices, default=Role.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together     = [("project", "user")]
        verbose_name        = _("Project Member")
        verbose_name_plural = _("Project Members")
        ordering            = ["joined_at"]

    def __str__(self) -> str:
        return f"{self.user.email} → {self.project.title} [{self.role}]"