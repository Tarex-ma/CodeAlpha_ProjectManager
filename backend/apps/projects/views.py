from django.shortcuts import render

# Create your views here.
"""
apps/projects/views.py
────────────────────────
Two ViewSets:

ProjectViewSet
  list        GET  /api/v1/projects/
  create      POST /api/v1/projects/
  retrieve    GET  /api/v1/projects/{id}/
  partial_update PATCH /api/v1/projects/{id}/
  destroy     DELETE /api/v1/projects/{id}/
  invite      POST /api/v1/projects/{id}/invite/
  leave       POST /api/v1/projects/{id}/leave/

ProjectMemberViewSet  (nested under /projects/{project_pk}/members/)
  list        GET  /api/v1/projects/{project_pk}/members/
  retrieve    GET  /api/v1/projects/{project_pk}/members/{id}/
  partial_update PATCH /api/v1/projects/{project_pk}/members/{id}/
  destroy     DELETE /api/v1/projects/{project_pk}/members/{id}/
"""

from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from .models import Project, ProjectMember
from .permissions import IsAdminOrOwner, IsMember, IsProjectOwner
from .serializers import (
    InviteMemberSerializer,
    ProjectMemberSerializer,
    ProjectSerializer,
    ProjectUpdateSerializer,
    UpdateMemberRoleSerializer,
)


class ProjectViewSet(viewsets.ModelViewSet):
    """
    CRUD for projects + invite and leave custom actions.

    Permission matrix
    -----------------
    list / create        IsAuthenticated        (list is filtered to own projects)
    retrieve             IsAuthenticated + IsMember
    partial_update       IsAuthenticated + IsAdminOrOwner
    destroy              IsAuthenticated + IsProjectOwner
    invite               IsAuthenticated + IsAdminOrOwner
    leave                IsAuthenticated + IsMember
    """

    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        qs = (
            Project.objects
            .for_user(self.request.user)
            .select_related("owner")
            .prefetch_related(
                "projectmember_set__user",
            )
            .annotate(member_count=Count("projectmember", distinct=True))
        )
        return qs

    def get_serializer_class(self):
        if self.action in ("partial_update", "update"):
            return ProjectUpdateSerializer
        if self.action == "invite":
            return InviteMemberSerializer
        return ProjectSerializer

    def get_permissions(self):
        if self.action in ("partial_update", "update", "invite"):
            return [IsAuthenticated(), IsAdminOrOwner()]
        if self.action == "destroy":
            return [IsAuthenticated(), IsProjectOwner()]
        if self.action in ("retrieve", "leave"):
            return [IsAuthenticated(), IsMember()]
        # list, create — just authenticated
        return [IsAuthenticated()]

    # ── object-level permission check ─────────────────────────────────────

    def get_object(self) -> Project:
        """
        Overridden to call check_object_permissions explicitly.
        DRF calls this for us in most cases but being explicit here keeps
        things clear when multiple permission classes are involved.
        """
        obj = get_object_or_404(self.get_queryset(), pk=self.kwargs["pk"])
        self.check_object_permissions(self.request, obj)
        return obj

    # ── standard actions ──────────────────────────────────────────────────

    def list(self, request: Request, *args, **kwargs) -> Response:
        """
        GET /api/v1/projects/
        Returns all projects the requesting user belongs to.
        """
        qs = self.get_queryset()
        serializer = ProjectSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    def create(self, request: Request, *args, **kwargs) -> Response:
        """
        POST /api/v1/projects/
        Creates a project; auto-assigns owner as OWNER member.

        Request body:
          { "title": "Sprint Board", "description": "Q3 work items" }

        Response 201:
          { "id": 1, "title": "Sprint Board", "owner": {...}, "members": [...], ... }
        """
        serializer = ProjectSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        project = serializer.save()
        return Response(
            ProjectSerializer(project, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    def retrieve(self, request: Request, *args, **kwargs) -> Response:
        """
        GET /api/v1/projects/{id}/
        Full project detail including nested members.
        """
        project = self.get_object()
        serializer = ProjectSerializer(project, context={"request": request})
        return Response(serializer.data)

    def partial_update(self, request: Request, *args, **kwargs) -> Response:
        """
        PATCH /api/v1/projects/{id}/
        Update title and/or description. Requires ADMIN or OWNER role.

        Request body (all optional):
          { "title": "New title", "description": "Updated desc" }
        """
        project = self.get_object()
        serializer = ProjectUpdateSerializer(project, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        project = serializer.save()
        return Response(
            ProjectSerializer(project, context={"request": request}).data,
        )

    def destroy(self, request: Request, *args, **kwargs) -> Response:
        """
        DELETE /api/v1/projects/{id}/
        Permanently deletes the project. Requires OWNER.

        Response 204: (no body)
        """
        project = self.get_object()
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── custom actions ────────────────────────────────────────────────────

    @action(detail=True, methods=["post"], url_path="invite")
    def invite(self, request: Request, pk: int = None) -> Response:
        """
        POST /api/v1/projects/{id}/invite/
        Add a user to the project by email. Requires ADMIN or OWNER.

        Request body:
          { "email": "grace@example.com", "role": "member" }

        Response 201:
          { "id": 5, "user": {...}, "role": "member", "joined_at": "..." }
        """
        project = self.get_object()
        serializer = InviteMemberSerializer(
            data=request.data,
            context={"request": request, "project": project},
        )
        serializer.is_valid(raise_exception=True)
        membership = serializer.save()
        return Response(
            ProjectMemberSerializer(membership).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="leave")
    def leave(self, request: Request, pk: int = None) -> Response:
        """
        POST /api/v1/projects/{id}/leave/
        Remove yourself from the project. The owner cannot leave.

        Response 204: (no body)
        """
        project = self.get_object()

        if project.owner_id == request.user.pk:
            return Response(
                {"detail": "The project owner cannot leave. Transfer ownership or delete the project."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        deleted, _ = ProjectMember.objects.filter(
            project=project, user=request.user
        ).delete()

        if not deleted:
            return Response(
                {"detail": "You are not a member of this project."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)


# ═══════════════════════════════════════════════════════════════════════════
# ProjectMember ViewSet  (nested: /projects/{project_pk}/members/)
# ═══════════════════════════════════════════════════════════════════════════

class ProjectMemberViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """
    Manage members of a project.

    list        GET  /api/v1/projects/{project_pk}/members/
    retrieve    GET  /api/v1/projects/{project_pk}/members/{id}/
    partial_update PATCH /api/v1/projects/{project_pk}/members/{id}/
    destroy     DELETE /api/v1/projects/{project_pk}/members/{id}/
    """

    serializer_class   = ProjectMemberSerializer
    http_method_names  = ["get", "patch", "delete", "head", "options"]

    def _get_project(self) -> Project:
        project = get_object_or_404(
            Project.objects.for_user(self.request.user),
            pk=self.kwargs["project_pk"],
        )
        return project

    def get_queryset(self):
        project = self._get_project()
        return (
            ProjectMember.objects
            .filter(project=project)
            .select_related("user")
        )

    def get_permissions(self):
        if self.action in ("partial_update", "update", "destroy"):
            return [IsAuthenticated(), IsAdminOrOwner()]
        return [IsAuthenticated(), IsMember()]

    def get_object(self) -> ProjectMember:
        obj = get_object_or_404(self.get_queryset(), pk=self.kwargs["pk"])
        # For write actions, check against the parent project
        if self.request.method not in ("GET", "HEAD", "OPTIONS"):
            self.check_object_permissions(self.request, obj.project)
        return obj

    def partial_update(self, request: Request, *args, **kwargs) -> Response:
        """
        PATCH /api/v1/projects/{project_pk}/members/{id}/
        Change a member's role. Cannot assign 'owner'.

        Request body:
          { "role": "admin" }

        Response 200:
          { "id": 5, "user": {...}, "role": "admin", "joined_at": "..." }
        """
        member = self.get_object()

        # Protect the OWNER row from role changes
        if member.role == ProjectMember.Role.OWNER:
            return Response(
                {"detail": "The owner's role cannot be changed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = UpdateMemberRoleSerializer(member, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        member = serializer.save()
        return Response(ProjectMemberSerializer(member).data)

    def destroy(self, request: Request, *args, **kwargs) -> Response:
        """
        DELETE /api/v1/projects/{project_pk}/members/{id}/
        Remove a member from the project. Cannot remove the owner.

        Response 204: (no body)
        """
        member = self.get_object()

        if member.role == ProjectMember.Role.OWNER:
            return Response(
                {"detail": "The project owner cannot be removed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)