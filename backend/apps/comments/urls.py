"""
apps/comments/urls.py
───────────────────────
Comments are nested under tasks:

  /api/v1/projects/{p}/boards/{b}/tasks/{t}/comments/
  /api/v1/projects/{p}/boards/{b}/tasks/{t}/comments/{id}/

Wire into apps/tasks/urls.py:

    from django.urls import path, include
    from .views import TaskViewSet

    task_list    = TaskViewSet.as_view({"get": "list",     "post": "create"})
    task_detail  = TaskViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"})
    task_move    = TaskViewSet.as_view({"post": "move"})
    task_reorder = TaskViewSet.as_view({"post": "reorder"})

    urlpatterns = [
        path("",               task_list,    name="task-list"),
        path("reorder/",       task_reorder, name="task-reorder"),
        path("<int:pk>/",      task_detail,  name="task-detail"),
        path("<int:pk>/move/", task_move,    name="task-move"),
        path("<int:task_pk>/comments/", include("apps.comments.urls")),  ← add
    ]
"""

from django.urls import path
from .views import CommentViewSet

comment_list   = CommentViewSet.as_view({"get": "list",     "post": "create"})
comment_detail = CommentViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"})

urlpatterns = [
    path("",          comment_list,   name="comment-list"),
    path("<int:pk>/", comment_detail, name="comment-detail"),
]
