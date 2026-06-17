"""
apps/projects/urls.py
──────────────────────
Nested routing structure:

  /api/v1/projects/                              ProjectViewSet (list, create)
  /api/v1/projects/{id}/                         ProjectViewSet (retrieve, partial_update, destroy)
  /api/v1/projects/{id}/invite/                  ProjectViewSet.invite  (POST)
  /api/v1/projects/{id}/leave/                   ProjectViewSet.leave   (POST)
  /api/v1/projects/{project_pk}/members/         ProjectMemberViewSet   (list)
  /api/v1/projects/{project_pk}/members/{id}/    ProjectMemberViewSet   (retrieve, partial_update, destroy)

Uses drf-nested-routers if available, falls back to manual nesting.
Install:  pip install drf-nested-routers
"""
from django.urls import path, include

try:
    from rest_framework_nested import routers as nested_routers # type: ignore

    router = nested_routers.DefaultRouter()
    router.register(r"", __import__("apps.projects.views", fromlist=["ProjectViewSet"]).ProjectViewSet, basename="project")

    members_router = nested_routers.NestedDefaultRouter(router, r"", lookup="project")
    members_router.register(
        r"members",
        __import__("apps.projects.views", fromlist=["ProjectMemberViewSet"]).ProjectMemberViewSet,
        basename="project-members",
    )

    urlpatterns = router.urls + members_router.urls + [
        path("<int:project_pk>/boards/", include("apps.boards.urls")),
    ]

except ImportError:
    # ── Fallback: manual routing (no drf-nested-routers) ─────────────────
    from django.urls import path, include
    from rest_framework.routers import DefaultRouter
    from .views import ProjectViewSet, ProjectMemberViewSet


    router = DefaultRouter()
    router.register(r"", ProjectViewSet, basename="project")
    
    # Manually wire the nested member routes under projects/{project_pk}/members/
    member_router = DefaultRouter()
    member_router.register(r"", ProjectMemberViewSet, basename="project-members")

    urlpatterns = router.urls + [
        path("<int:project_pk>/members/", include(member_router.urls)),
        path("<int:project_pk>/boards/", include("apps.boards.urls")),
    ]