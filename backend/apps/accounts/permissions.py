from rest_framework.permissions import BasePermission, SAFE_METHODS
from rest_framework.request import Request
from rest_framework.views import APIView


class IsOwnerOrReadOnly(BasePermission):
    """
    Object-level permission.
    Full access to the owner; read-only to anyone else.

    Usage:
        permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    Your model or view must expose an `owner` attribute (or override
    `has_object_permission` where needed).
    """

    def has_object_permission(self, request: Request, view: APIView, obj) -> bool:
        if request.method in SAFE_METHODS:
            return True
        owner = getattr(obj, "user", getattr(obj, "owner", None))
        return owner == request.user


class IsSelfOrAdmin(BasePermission):
    """
    Allows access only if the requesting user IS the target user,
    or is a staff/admin user.

    Use on user-detail endpoints to prevent one user modifying another's data.
    """

    def has_object_permission(self, request: Request, view: APIView, obj) -> bool:
        if request.user and request.user.is_staff:
            return True
        # obj is the User instance being accessed
        return obj == request.user


class IsActiveUser(BasePermission):
    """
    Explicitly rejects soft-deleted / deactivated accounts even if
    a valid JWT is still in circulation.
    """

    message = "Your account has been deactivated."

    def has_permission(self, request: Request, view: APIView) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_active
        )