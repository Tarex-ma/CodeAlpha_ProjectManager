"""
apps/tasks/views.py
─────────────────────
TaskViewSet — nested under boards:

  GET    /api/v1/projects/{project_pk}/boards/{board_pk}/tasks/
  POST   /api/v1/projects/{project_pk}/boards/{board_pk}/tasks/
  GET    /api/v1/projects/{project_pk}/boards/{board_pk}/tasks/{id}/
  PATCH  /api/v1/projects/{project_pk}/boards/{board_pk}/tasks/{id}/
  DELETE /api/v1/projects/{project_pk}/boards/{board_pk}/tasks/{id}/
  POST   /api/v1/projects/{project_pk}/boards/{board_pk}/tasks/{id}/move/
  POST   /api/v1/projects/{project_pk}/boards/{board_pk}/tasks/reorder/

Extra filtered views (query-param driven, no extra URL needed):
  GET    /api/v1/projects/{project_pk}/boards/{board_pk}/tasks/?assignee=<user_id>
  GET    /api/v1/projects/{project_pk}/boards/{board_pk}/tasks/?priority=high
  GET    /api/v1/projects/{project_pk}/boards/{board_pk}/tasks/?status=in_progress
  GET    /api/v1/projects/{project_pk}/boards/{board_pk}/tasks/?overdue=true
"""

from django.db import models
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

# pyrefly: ignore [missing-import]
from apps.boards.models import Board
# pyrefly: ignore [missing-import]
from apps.projects.models import Project

from rest_framework.decorators import action
from .models import Task
from .permissions import TaskPermission
from .serializers import (
    TaskCreateSerializer,
    TaskMoveSerializer,
    TaskReorderSerializer,
    TaskSerializer,
    TaskUpdateSerializer,
    ActivityLogSerializer,
)


class TaskViewSet(viewsets.ViewSet):
    """
    Tasks are always accessed in the context of a project + board.
    URL prefix: /api/v1/projects/{project_pk}/boards/{board_pk}/tasks/
    """

    permission_classes = [IsAuthenticated, TaskPermission]
    http_method_names  = ["get", "post", "patch", "delete", "head", "options"]

    # ── Resolve parents once per request ──────────────────────────────────

    def initial(self, request: Request, *args, **kwargs):
        # Authenticate the request first
        self.perform_authentication(request)
        if not request.user.is_authenticated:
            from rest_framework.exceptions import NotAuthenticated
            raise NotAuthenticated()
        # Resolve project if provided in URL
        if "project_pk" in self.kwargs:
            request.project = get_object_or_404(
                Project.objects.for_user(request.user),
                pk=self.kwargs["project_pk"],
            )
        else:
            request.project = None
        # Resolve board if provided in URL
        if "board_pk" in self.kwargs:
            request.board = get_object_or_404(
                Board.objects.filter(project=request.project),
                pk=self.kwargs["board_pk"],
            )
        else:
            request.board = None
        # Run DRF permission and throttling checks now that request has required attributes
        self.check_permissions(request)
        self.check_throttles(request)

    # ── Shared queryset ────────────────────────────────────────────────────

    def _get_queryset(self):
        if self.request.board:
            qs = Task.objects.for_board(self.request.board.pk)
        elif self.request.project:
            qs = Task.objects.for_project(self.request.project.pk)
        else:
            qs = Task.objects.filter(project__members=self.request.user).distinct()

        # Optional filters via query params
        assignee = self.request.query_params.get("assignee")
        priority = self.request.query_params.get("priority")
        status_  = self.request.query_params.get("status")
        overdue  = self.request.query_params.get("overdue")

        if assignee:
            qs = qs.filter(assignees__id=assignee)
        if priority and priority in Task.Priority.values:
            qs = qs.filter(priority=priority)
        if status_ and status_ in Task.Status.values:
            qs = qs.filter(status=status_)
        if overdue and overdue.lower() == "true":
            qs = qs.overdue()

        search_query = self.request.query_params.get("search")
        if search_query:
            qs = qs.filter(
                models.Q(title__icontains=search_query) |
                models.Q(description__icontains=search_query)
            )

        return qs

    def _get_task(self, pk: int) -> Task:
        return get_object_or_404(self._get_queryset(), pk=pk)

    # ── LIST ──────────────────────────────────────────────────────────────

    def list(self, request: Request, **kwargs) -> Response:
        """
        GET /api/v1/projects/{project_pk}/boards/{board_pk}/tasks/

        Returns all tasks in the board, sorted by position.
        Supports ?assignee=<id> ?priority=high ?status=in_progress ?overdue=true

        Response 200:
        [
          {
            "id": 1, "title": "Design login page", "priority": "high",
            "status": "in_progress", "position": 0,
            "assignee": {"id": 2, "email": "grace@example.com", ...},
            "due_date": "2024-03-15", "is_overdue": false, ...
          },
          ...
        ]
        """
        tasks = self._get_queryset()
        return Response(TaskSerializer(tasks, many=True).data)

    # ── CREATE ────────────────────────────────────────────────────────────

    def create(self, request: Request, **kwargs) -> Response:
        """
        POST /api/v1/projects/{project_pk}/boards/{board_pk}/tasks/

        Request:
          {
            "title": "Design login page",
            "description": "Include OAuth buttons",
            "assignee_id": 2,
            "priority": "high",
            "status": "todo",
            "due_date": "2024-03-15"
          }

        Response 201: full task object
        """
        serializer = TaskCreateSerializer(
            data=request.data,
            context={
                "request": request,
                "project": request.project,
                "board":   request.board,
            },
        )
        serializer.is_valid(raise_exception=True)
        task = serializer.save()

        return Response(
            TaskSerializer(task).data,
            status=status.HTTP_201_CREATED,
        )

    # ── RETRIEVE ──────────────────────────────────────────────────────────

    def retrieve(self, request: Request, pk: int = None, **kwargs) -> Response:
        """
        GET /api/v1/projects/{project_pk}/boards/{board_pk}/tasks/{id}/

        Response 200: full task object
        """
        task = self._get_task(pk)
        return Response(TaskSerializer(task).data)

    # ── PARTIAL UPDATE ────────────────────────────────────────────────────

    def partial_update(self, request: Request, pk: int = None, **kwargs) -> Response:
        """
        PATCH /api/v1/projects/{project_pk}/boards/{board_pk}/tasks/{id}/

        All fields optional. To move to a different board use /move/ instead.

        Request (examples):
          { "title": "Updated title" }
          { "status": "in_review", "priority": "urgent" }
          { "assignee_id": 3, "due_date": "2024-04-01" }

        Response 200: updated task object
        """
        task = self._get_task(pk)
        serializer = TaskUpdateSerializer(
            task,
            data=request.data,
            partial=True,
            context={"project": request.project},
        )
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        return Response(TaskSerializer(task).data)

    # ── DESTROY ───────────────────────────────────────────────────────────

    def destroy(self, request: Request, pk: int = None, **kwargs) -> Response:
        """
        DELETE /api/v1/projects/{project_pk}/boards/{board_pk}/tasks/{id}/

        Response 204: (no body)
        """
        task = self._get_task(pk)
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── MOVE  (drag to different column) ──────────────────────────────────

    @action(detail=True, methods=["post"], url_path="move")
    def move(self, request: Request, pk: int = None, **kwargs) -> Response:
        """
        POST /api/v1/projects/{project_pk}/boards/{board_pk}/tasks/{id}/move/

        Move task to a different board column within the same project,
        inserting it at the specified position and shifting others.

        Request:
          { "board_id": 3, "position": 1 }

        Response 200: updated task with new board and position
        """
        task = self._get_task(pk)
        serializer = TaskMoveSerializer(
            data=request.data,
            context={"project": request.project},
        )
        serializer.is_valid(raise_exception=True)
        task = serializer.save(task=task)
        return Response(TaskSerializer(task).data)

    # ── REORDER  (drag within same column) ────────────────────────────────

    @action(detail=False, methods=["post"], url_path="reorder")
    def reorder(self, request: Request, **kwargs) -> Response:
        """
        POST /api/v1/projects/{project_pk}/boards/{board_pk}/tasks/reorder/

        Bulk-update positions for ALL tasks in this board.
        All tasks must be included — partial reorder is rejected.

        Request:
          {
            "tasks": [
              {"id": 5, "position": 0},
              {"id": 2, "position": 1},
              {"id": 8, "position": 2}
            ]
          }

        Response 200: full ordered task list
        """
        serializer = TaskReorderSerializer(
            data=request.data,
            context={"board": request.board},
        )
        serializer.is_valid(raise_exception=True)
        tasks = serializer.save()
        return Response(TaskSerializer(tasks, many=True).data)


    @action(detail=False, methods=["get"])
    def recent(self, request):
        limit = int(request.query_params.get("limit", 8))

        tasks = (
            Task.objects
            .filter(board__project__members=request.user)
            .order_by("-created_at")[:limit]
        )

        return Response(TaskSerializer(tasks, many=True).data)

    @action(detail=False, methods=["get"])
    def my(self, request):
        """GET /api/v1/tasks/my/ - tasks assigned to the current user"""
        limit = int(request.query_params.get("limit", 8))
        tasks = (
            Task.objects
            .filter(assignees=request.user, board__project__members=request.user)
            .order_by("-created_at")[:limit]
        )
        return Response(TaskSerializer(tasks, many=True).data)

    @action(detail=True, methods=["get"], url_path="activity")
    def activity_log(self, request, pk=None, **kwargs):
        """GET /api/v1/projects/{p}/boards/{b}/tasks/{id}/activity/"""
        task = self._get_task(pk)
        logs = task.activity_logs.select_related("actor").order_by("-timestamp")
        return Response(ActivityLogSerializer(logs, many=True).data)