"""
apps/boards/urls.py
─────────────────────
Boards are always nested under a project:

  /api/v1/projects/{project_pk}/boards/
  /api/v1/projects/{project_pk}/boards/{id}/
  /api/v1/projects/{project_pk}/boards/reorder/

Wire into config/urls.py:
  path("api/v1/projects/", include("apps.projects.urls")),

And inside apps/projects/urls.py include boards:
  path("<int:project_pk>/boards/", include("apps.boards.urls")),
"""

from django.urls import include, path

from .views import BoardViewSet

board_aggregate = BoardViewSet.as_view({"get": "board"})

# Manually wire the three URL shapes (no router needed for a ViewSet
# that doesn't use the default router's list/detail pattern with pk in path)

board_list   = BoardViewSet.as_view({"get": "list",   "post": "create"})
board_detail = BoardViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"})
board_reorder = BoardViewSet.as_view({"post": "reorder"})

urlpatterns = [
    path("",          board_list,    name="board-list"),
    path("reorder/",  board_reorder, name="board-reorder"),
    path("<int:pk>/", board_detail,  name="board-detail"),
    path("<int:board_pk>/tasks/", include("apps.tasks.urls")),
    path("board/", board_aggregate, name="board-aggregate"),
]