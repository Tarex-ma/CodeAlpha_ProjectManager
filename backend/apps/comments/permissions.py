"""
apps/comments/permissions.py
──────────────────────────────
CommentPermission   — controls list / create / retrieve
IsCommentAuthor     — controls edit / delete (author-only)

The view attaches request.project and request.task in initial()
so neither class queries the DB.
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS
from rest_framework.request import Request

from apps.projects.models import ProjectMember


class CommentPermission(BasePermission):
    """
    Any project member can read and create comments.
    Viewers are read-only.
    """

    message = "You must be a project member to access comments."

    def has_permission(self, request: Request, view) -> bool:
        project = getattr(request, "project", None)
        if not project:
            return False

        try:
            membership = ProjectMember.objects.get(
                project=project, user=request.user
            )
        except ProjectMember.DoesNotExist:
            return False

        # Viewers can read but not create/delete/edit
        if request.method not in SAFE_METHODS:
            if membership.role == ProjectMember.Role.VIEWER:
                return False

        return True


class IsCommentAuthor(BasePermission):
    """
    Only the comment author (or a project admin/owner) can edit or delete.
    Applied at the object level for PATCH and DELETE.
    """

    message = "Only the comment author can edit or delete this comment."

    def has_object_permission(self, request: Request, view, obj) -> bool:
        # Safe methods already passed CommentPermission
        if request.method in SAFE_METHODS:
            return True

        # Author always has full access to their own comment
        if obj.author == request.user:
            return True

        # Project admins and owners can moderate any comment
        project = getattr(request, "project", None)
        if project and project.is_admin_or_owner(request.user):
            return True

        return False