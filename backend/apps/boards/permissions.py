"""
apps/boards/permissions.py
────────────────────────────
BoardPermission — single permission class used by BoardViewSet.

Read  (GET/HEAD/OPTIONS) → any project member
Write (POST/PATCH/DELETE) → project admin or owner only

The view resolves the parent Project from the URL kwargs and attaches it
to the request as `request.project` before permission checking runs,
so we never re-query the DB inside the permission class.
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS
from rest_framework.request import Request

from apps.projects.models import ProjectMember


class BoardPermission(BasePermission):

    message = "You do not have permission to perform this action on this board."

    def has_permission(self, request: Request, view) -> bool:
        """
        Called before the object is fetched.
        `request.project` is set by BoardViewSet.initial().
        """
        project = getattr(request, "project", None)
        if project is None:
            return False

        is_member = project.members.filter(pk=request.user.pk).exists()
        if not is_member:
            return False

        if request.method in SAFE_METHODS:
            return True

        return project.is_admin_or_owner(request.user)

    def has_object_permission(self, request: Request, view, obj) -> bool:
        # Object-level check delegates to the same logic
      return self.has_permission(request, view)
    