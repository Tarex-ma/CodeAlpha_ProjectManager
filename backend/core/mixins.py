"""
core/mixins.py
────────────────
Resolves nested URL parents (project → board → task) once per request.
Replaces the copy-pasted initial() in BoardViewSet, TaskViewSet, CommentViewSet.

Usage
─────
    from core.mixins import ProjectScopedMixin, BoardScopedMixin, TaskScopedMixin

    class BoardViewSet(ProjectScopedMixin, viewsets.ViewSet):
        ...  # request.project available in every action

    class TaskViewSet(BoardScopedMixin, viewsets.ViewSet):
        ...  # request.project + request.board available

    class CommentViewSet(TaskScopedMixin, viewsets.ViewSet):
        ...  # request.project + request.board + request.task available
"""

import functools

from django.shortcuts import get_object_or_404


class ProjectScopedMixin:
    """
    Resolves request.project from URL kwargs["project_pk"].
    Returns 404 if project not found OR user is not a member.
    """

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        from apps.projects.models import Project
        request.project = get_object_or_404(
            Project.objects.for_user(request.user),
            pk=self.kwargs["project_pk"],
        )


class BoardScopedMixin(ProjectScopedMixin):
    """
    Extends ProjectScopedMixin.
    Resolves request.project + request.board from URL kwargs.
    """

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        from apps.boards.models import Board
        request.board = get_object_or_404(
            Board.objects.filter(project=request.project),
            pk=self.kwargs["board_pk"],
        )


class TaskScopedMixin(BoardScopedMixin):
    """
    Extends BoardScopedMixin.
    Resolves request.project + request.board + request.task.
    """

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        from apps.tasks.models import Task
        request.task = get_object_or_404(
            Task.objects.filter(board=request.board),
            pk=self.kwargs["task_pk"],
        )