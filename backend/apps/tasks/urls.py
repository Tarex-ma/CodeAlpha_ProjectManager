"""
apps/tasks/urls.py
────────────────────
Tasks are nested under both a project AND a board:

  /api/v1/projects/{project_pk}/boards/{board_pk}/tasks/
  /api/v1/projects/{project_pk}/boards/{board_pk}/tasks/{id}/
  /api/v1/projects/{project_pk}/boards/{board_pk}/tasks/{id}/move/
  /api/v1/projects/{project_pk}/boards/{board_pk}/tasks/reorder/

Wire into apps/boards/urls.py:
  from django.urls import path, include

  urlpatterns = [
      path("recent/", task_recent, name="task-recent"),
      path("",          board_list,    name="board-list"),
      path("reorder/",  board_reorder, name="board-reorder"),
      path("<int:pk>/", board_detail,  name="board-detail"),
      path("<int:board_pk>/tasks/", include("apps.tasks.urls")),  ← add
  ]
"""

from django.urls import include, path
from .views import TaskViewSet

task_list   = TaskViewSet.as_view({"get": "list",     "post": "create"})
task_detail = TaskViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"})
task_move   = TaskViewSet.as_view({"post": "move"})
task_reorder = TaskViewSet.as_view({"post": "reorder"})
task_recent = TaskViewSet.as_view({"get": "recent"})

task_my = TaskViewSet.as_view({"get": "my"})

urlpatterns = [
    path("recent/", task_recent, name="task-recent"),
    path("my/", task_my, name="task-my"),
    
    path("",              task_list,    name="task-list"),
    path("reorder/",      task_reorder, name="task-reorder"),
    path("<int:pk>/",     task_detail,  name="task-detail"),
    path("<int:pk>/move/", task_move,   name="task-move"),
    path("<int:task_pk>/comments/", include("apps.comments.urls")),
]