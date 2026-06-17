"""
apps/projects/permissions.py
──────────────────────────────
Permission classes used by the projects ViewSet.

IsMember          — user must be a member of the project (any role)
IsAdminOrOwner    — user must have role ADMIN or OWNER in the project
IsProjectOwner    — user must be the project.owner (destructive actions)

All three extend DRF's BasePermission and operate at the object level so
they integrate naturally with ViewSet.get_permissions().
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS
from rest_framework.request import Request
from rest_framework.views import APIView

from .models import Project, ProjectMember


class IsMember(BasePermission):
    """
    Allow any request from a user who has a ProjectMember row for this project.
    Applies to: retrieve, list tasks/comments, etc.
    """

    message = "You must be a member of this project to access it."

    def has_object_permission(self, request: Request, view: APIView, obj: Project) -> bool:
        return obj.members.filter(pk=request.user.pk).exists()


class IsAdminOrOwner(BasePermission):
    """
    Allow write access only if the user is the project owner OR has ADMIN role.
    Safe (GET/HEAD/OPTIONS) requests are let through for any member — pair this
    with IsMember when you want read access restricted too.

    Applies to: update project, invite/remove members, change roles.
    """

    message = "Only project admins or the owner can perform this action."

    def has_object_permission(self, request: Request, view: APIView, obj: Project) -> bool:
        if request.method in SAFE_METHODS:
            return True
        return obj.is_admin_or_owner(request.user)


class IsProjectOwner(BasePermission):
    """
    Strictest level — only the project.owner passes.
    Applies to: delete project, transfer ownership (future).
    """

    message = "Only the project owner can perform this action."

    def has_object_permission(self, request: Request, view: APIView, obj: Project) -> bool:
        return obj.owner_id == request.user.pk


class IsMemberOrAdminOrOwner(BasePermission):
    """
    Convenience composite:
      - SAFE methods  →  any member
      - Unsafe methods → admin or owner only

    Use this as the single permission class on ProjectViewSet so you don't
    have to stack two classes for every action.
    """

    message = "You do not have permission to perform this action on this project."

    def has_object_permission(self, request: Request, view: APIView, obj: Project) -> bool:
        is_member = obj.members.filter(pk=request.user.pk).exists()
        if not is_member:
            return False
        if request.method in SAFE_METHODS:
            return True
        return obj.is_admin_or_owner(request.user)