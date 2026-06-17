"""
core/permissions.py
─────────────────────
Single base permission class for all project-scoped resources.
Replaces BoardPermission, TaskPermission, CommentPermission with
configurable subclasses that share one implementation.

Requires request.project to be set (by ProjectScopedMixin or equivalent).
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.projects.models import ProjectMember


def get_cached_membership(request, project):
    """
    Returns the ProjectMember for (request.user, project).
    Result is cached on the request object so DB is hit only once
    even when multiple permission classes or serializer validators call it.
    """
    cache_key = f"_pm_{project.pk}"
    if not hasattr(request, cache_key):
        try:
            setattr(request, cache_key,
                ProjectMember.objects.get(project=project, user=request.user))
        except ProjectMember.DoesNotExist:
            setattr(request, cache_key, None)
    return getattr(request, cache_key)


class ProjectMemberPermission(BasePermission):
    """
    Base permission for all project-scoped resources.

    Subclass and override `write_roles` to control which roles can write.
    Defaults to MEMBER + ADMIN + OWNER (viewers read-only).

    Example:
        class AdminOnlyWritePermission(ProjectMemberPermission):
            write_roles = [ProjectMember.Role.OWNER, ProjectMember.Role.ADMIN]
    """

    message    = "You do not have permission to perform this action."
    write_roles = [
        ProjectMember.Role.OWNER,
        ProjectMember.Role.ADMIN,
        ProjectMember.Role.MEMBER,
    ]

    def has_permission(self, request, view) -> bool:
        project = getattr(request, "project", None)
        if not project:
            return False

        membership = get_cached_membership(request, project)
        if not membership:
            return False

        if request.method in SAFE_METHODS:
            return True

        return membership.role in self.write_roles

    def has_object_permission(self, request, view, obj) -> bool:
        return self.has_permission(request, view)


# ── Ready-to-use subclasses ───────────────────────────────────────────────

class MemberWritePermission(ProjectMemberPermission):
    """
    Members, admins, and owners can create/edit/delete.
    Viewers are read-only.
    Use for: tasks, comments.
    """
    write_roles = [
        ProjectMember.Role.OWNER,
        ProjectMember.Role.ADMIN,
        ProjectMember.Role.MEMBER,
    ]


class AdminWritePermission(ProjectMemberPermission):
    """
    Only admins and owners can create/edit/delete.
    Members and viewers are read-only.
    Use for: boards, project settings.
    """
    write_roles = [
        ProjectMember.Role.OWNER,
        ProjectMember.Role.ADMIN,
    ]