"""
apps/tasks/permissions.py
───────────────────────────
TaskPermission — single class used by TaskViewSet.

Read   (GET/HEAD/OPTIONS) — any project member (including viewers)
Write  (POST/PATCH/DELETE) — members, admins, and owners
                             (viewers are read-only)

The view attaches request.project and request.board in initial()
so this class never hits the DB.
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS
from rest_framework.request import Request

# pyrefly: ignore [missing-import]
from apps.projects.models import ProjectMember


class TaskPermission(BasePermission):

    message = "You do not have permission to perform this action on this task."

    def has_permission(self, request: Request, view) -> bool:
        # Allow global read-only actions (recent, my) without project context
        if hasattr(view, 'action') and view.action in ('recent', 'my'):
            return request.method in SAFE_METHODS
        project = getattr(request, "project", None)
        if project is None:
            # Global endpoint: allow read-only (safe) methods
            return request.method in SAFE_METHODS

        # Owners have full permissions
        if project.owner_id == request.user.id:
            return True

        # Must be a project member
        try:
            membership = ProjectMember.objects.get(project=project, user=request.user)
        except ProjectMember.DoesNotExist:
            return False

        # Viewers can only read
        if request.method not in SAFE_METHODS:
            if membership.role == ProjectMember.Role.VIEWER:
                return False

        return True

    def has_object_permission(self, request: Request, view, obj) -> bool:
        return self.has_permission(request, view)