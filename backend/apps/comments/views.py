"""
apps/comments/views.py
────────────────────────
CommentViewSet — nested under tasks:

  GET    /api/v1/projects/{p}/boards/{b}/tasks/{t}/comments/
  POST   /api/v1/projects/{p}/boards/{b}/tasks/{t}/comments/
  GET    /api/v1/projects/{p}/boards/{b}/tasks/{t}/comments/{id}/
  PATCH  /api/v1/projects/{p}/boards/{b}/tasks/{t}/comments/{id}/
  DELETE /api/v1/projects/{p}/boards/{b}/tasks/{t}/comments/{id}/

initial() resolves project, board, and task once per request and attaches
them to `request.*` so permission classes and serializers read them cheaply.
"""

from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from apps.boards.models import Board
from apps.projects.models import Project
from apps.tasks.models import Task

from .models import Comment
from .permissions import CommentPermission, IsCommentAuthor
from .serializers import (
    CommentCreateSerializer,
    CommentSerializer,
    CommentUpdateSerializer,
)


class CommentViewSet(viewsets.ViewSet):

    permission_classes = [IsAuthenticated, CommentPermission]
    http_method_names  = ["get", "post", "patch", "delete", "head", "options"]

    # ── Resolve parents once ───────────────────────────────────────────────

    def initial(self, request: Request, *args, **kwargs):
        super().initial(request, *args, **kwargs)

        task_id = self.kwargs.get("task_pk") or request.query_params.get("task") or request.data.get("task")
        if task_id:
            request.task = get_object_or_404(Task.objects.filter(project__members=request.user), pk=task_id)
            request.board = request.task.board
            request.project = request.task.project
        else:
            # If no task is specified, we might be hitting detail endpoint, in which case the object permission handles it
            request.task = None
            request.board = None
            request.project = None

    # ── Shared helpers ─────────────────────────────────────────────────────

    def _get_queryset(self):
        if self.request.task:
            return Comment.objects.for_task(self.request.task.pk)
        return Comment.objects.filter(task__project__members=self.request.user)

    def _get_comment(self, pk: int) -> Comment:
        return get_object_or_404(self._get_queryset(), pk=pk)

    # ── LIST ──────────────────────────────────────────────────────────────

    def list(self, request: Request, **kwargs) -> Response:
        """
        GET .../tasks/{t}/comments/

        Returns all comments on the task in chronological order.

        Response 200:
        [
          {
            "id": 1,
            "task": 5,
            "author": { "id": 1, "email": "ada@example.com", "full_name": "Ada Lovelace" },
            "content": "Looks good to me.",
            "is_edited": false,
            "created_at": "2024-03-01T10:00:00Z",
            "updated_at": "2024-03-01T10:00:00Z"
          }
        ]
        """
        comments = self._get_queryset()
        return Response(CommentSerializer(comments, many=True).data)

    # ── CREATE ────────────────────────────────────────────────────────────

    def create(self, request: Request, **kwargs) -> Response:
        """
        POST .../tasks/{t}/comments/

        Request:  { "content": "Looks good, merging tomorrow." }
        Response 201: full comment object
        """
        serializer = CommentCreateSerializer(
            data=request.data,
            context={"request": request, "task": request.task},
        )
        serializer.is_valid(raise_exception=True)
        comment = serializer.save()

        return Response(
            CommentSerializer(comment).data,
            status=status.HTTP_201_CREATED,
        )

    # ── RETRIEVE ──────────────────────────────────────────────────────────

    def retrieve(self, request: Request, pk: int = None, **kwargs) -> Response:
        """
        GET .../tasks/{t}/comments/{id}/

        Response 200: single comment object
        """
        comment = self._get_comment(pk)
        return Response(CommentSerializer(comment).data)

    # ── PARTIAL UPDATE ────────────────────────────────────────────────────

    def partial_update(self, request: Request, pk: int = None, **kwargs) -> Response:
        """
        PATCH .../tasks/{t}/comments/{id}/

        Only the author (or project admin/owner) can edit.
        Sets is_edited = True automatically.

        Request:  { "content": "Updated thoughts." }
        Response 200: updated comment object
        """
        comment = self._get_comment(pk)

        # Object-level permission: author or admin/owner only
        self.check_object_permissions_with(request, comment)

        serializer = CommentUpdateSerializer(
            comment,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        comment = serializer.save()
        return Response(CommentSerializer(comment).data)

    # ── DESTROY ───────────────────────────────────────────────────────────

    def destroy(self, request: Request, pk: int = None, **kwargs) -> Response:
        """
        DELETE .../tasks/{t}/comments/{id}/

        Only the author (or project admin/owner) can delete.
        Response 204: (no body)
        """
        comment = self._get_comment(pk)
        self.check_object_permissions_with(request, comment)
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── Helper: run object-level permission check ─────────────────────────

    def check_object_permissions_with(self, request: Request, obj: Comment) -> None:
        """
        Manually invoke IsCommentAuthor for write operations on a specific
        comment instance. ViewSet.check_object_permissions() iterates
        self.permission_classes, so we call it directly with the extra class.
        """
        perm = IsCommentAuthor()
        if not perm.has_object_permission(request, self, obj):
            self.permission_denied(request, message=perm.message)
