from django.shortcuts import render

# Create your views here.
"""
apps/boards/views.py
──────────────────────
BoardViewSet — nested under projects:

  GET    /api/v1/projects/{project_pk}/boards/              list
  POST   /api/v1/projects/{project_pk}/boards/              create
  GET    /api/v1/projects/{project_pk}/boards/{id}/         retrieve
  PATCH  /api/v1/projects/{project_pk}/boards/{id}/         partial_update
  DELETE /api/v1/projects/{project_pk}/boards/{id}/         destroy
  POST   /api/v1/projects/{project_pk}/boards/reorder/      reorder (bulk)

Design decisions
────────────────
- `_resolve_project()` is called in `initial()` so the project is resolved
  once per request and attached as `request.project`. This avoids repeating
  the lookup in every action and lets the permission class read it cheaply.
- Queryset annotates `task_count` so the serializer can show it without an
  extra query per board (will be 0 until the tasks app is connected).
- PUT is disabled (http_method_names excludes "put") — boards use PATCH only.
"""

from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from apps.projects.models import Project

from .models import Board
from .permissions import BoardPermission
from .serializers import (
    BoardCreateSerializer,
    BoardReorderSerializer,
    BoardSerializer,
    BoardUpdateSerializer,
)


class BoardViewSet(viewsets.ViewSet):
    """
    Boards are always accessed in the context of a project.
    URL: /api/v1/projects/{project_pk}/boards/
    """

    permission_classes = [IsAuthenticated, BoardPermission]
    http_method_names  = ["get", "post", "patch", "delete", "head", "options"]

    # ── resolve parent project once per request ───────────────────────────

    def initial(self, request: Request, *args, **kwargs):
        """
        Resolve the parent project from the URL and attach it to the request.
        Returns 404 if the project doesn't exist OR the user isn't a member
        (filtered queryset means non-members see no projects).
        """
        super().initial(request, *args, **kwargs)
        request.project = get_object_or_404(
            Project.objects.for_user(request.user),
            pk=self.kwargs["project_pk"],
        )

    # ── shared queryset ───────────────────────────────────────────────────

    def _get_queryset(self):
        return (
            Board.objects
            .for_project(self.request.project.pk)
            .annotate(task_count=Count("tasks", distinct=True))
        )

    def _get_board(self, pk: int) -> Board:
        return get_object_or_404(self._get_queryset(), pk=pk)

    # ── list ──────────────────────────────────────────────────────────────

    def list(self, request: Request, **kwargs) -> Response:
        """
        GET /api/v1/projects/{project_pk}/boards/

        Returns all boards for the project, sorted by position.

        Response 200:
        [
          { "id": 1, "title": "Todo",        "position": 0, "task_count": 3, ... },
          { "id": 2, "title": "In Progress", "position": 1, "task_count": 1, ... },
          { "id": 3, "title": "Review",      "position": 2, "task_count": 0, ... },
          { "id": 4, "title": "Done",        "position": 3, "task_count": 7, ... }
        ]
        """
        boards = self._get_queryset()
        return Response(BoardSerializer(boards, many=True).data)

    # ── create ────────────────────────────────────────────────────────────

    def create(self, request: Request, **kwargs) -> Response:
        """
        POST /api/v1/projects/{project_pk}/boards/

        Creates a board appended at the end (position = max + 1).
        Requires ADMIN or OWNER role in the project.

        Request:  { "title": "Blocked" }
        Response 201:
          { "id": 5, "title": "Blocked", "position": 4, "task_count": 0, ... }
        """
        serializer = BoardCreateSerializer(
            data=request.data,
            context={"project": request.project},
        )
        serializer.is_valid(raise_exception=True)
        board = serializer.save()

        return Response(
            BoardSerializer(board).data,
            status=status.HTTP_201_CREATED,
        )

    # ── retrieve ──────────────────────────────────────────────────────────

    def retrieve(self, request: Request, pk: int = None, **kwargs) -> Response:
        """
        GET /api/v1/projects/{project_pk}/boards/{id}/

        Response 200:
          { "id": 1, "title": "Todo", "position": 0, "task_count": 3, ... }
        """
        board = self._get_board(pk)
        return Response(BoardSerializer(board).data)

    # ── partial update ────────────────────────────────────────────────────

    def partial_update(self, request: Request, pk: int = None, **kwargs) -> Response:
        """
        PATCH /api/v1/projects/{project_pk}/boards/{id}/

        Update title and/or position of a single board.
        Requires ADMIN or OWNER role.

        Request:  { "title": "QA Review" }
                  { "position": 1 }
                  { "title": "QA Review", "position": 1 }

        Response 200: updated board object
        """
        board = self._get_board(pk)
        serializer = BoardUpdateSerializer(
            board,
            data=request.data,
            partial=True,
            context={"project": request.project},
        )
        serializer.is_valid(raise_exception=True)
        board = serializer.save()
        return Response(BoardSerializer(board).data)

    # ── destroy ───────────────────────────────────────────────────────────

    def destroy(self, request: Request, pk: int = None, **kwargs) -> Response:
        """
        DELETE /api/v1/projects/{project_pk}/boards/{id}/

        Permanently deletes the board and all tasks inside it (CASCADE).
        Requires ADMIN or OWNER role.

        Response 204: (no body)
        """
        board = self._get_board(pk)
        board.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"], url_path="board")
    def board(self, request, **kwargs) -> Response:
        """
        GET /api/v1/projects/{project_pk}/boards/board/
        Returns all boards for the project with their tasks embedded.
        """
        boards = self._get_queryset().prefetch_related("tasks")
        # Use existing BoardSerializer for board fields
        board_serializer = BoardSerializer(boards, many=True)
        # Serialize tasks for each board
        from apps.tasks.serializers import TaskSerializer
        board_data = []
        for board, board_repr in zip(boards, board_serializer.data):
            tasks = board.tasks.all()
            board_repr["tasks"] = TaskSerializer(tasks, many=True).data
            board_data.append(board_repr)
        return Response(board_data)

    # ── reorder (bulk) ────────────────────────────────────────────────────

    @action(detail=False, methods=["post"], url_path="reorder")
    def reorder(self, request: Request, **kwargs) -> Response:
        """
        POST /api/v1/projects/{project_pk}/boards/reorder/

        Bulk-update positions for ALL boards in the project in one request.
        You must include every board — partial reorder is rejected.
        Requires ADMIN or OWNER role.

        Request:
          {
            "boards": [
              {"id": 3, "position": 0},
              {"id": 1, "position": 1},
              {"id": 4, "position": 2},
              {"id": 2, "position": 3}
            ]
          }

        Response 200: full ordered board list (same as list endpoint)
          [
            { "id": 3, "title": "Todo",        "position": 0, ... },
            { "id": 1, "title": "In Progress",  "position": 1, ... },
            ...
          ]
        """
        serializer = BoardReorderSerializer(
            data=request.data,
            context={"project": request.project},
        )
        serializer.is_valid(raise_exception=True)
        boards = serializer.save()
        return Response(BoardSerializer(boards, many=True).data)