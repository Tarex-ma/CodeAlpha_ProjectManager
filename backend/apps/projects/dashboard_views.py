from .models import Project
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum

# pyrefly: ignore [missing-import]
from apps.tasks.models import Task


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        total_projects = Project.objects.filter(members=user).count()
        total_tasks = Task.objects.filter(project__members=user).count()
        completed_tasks = Task.objects.filter(project__members=user, status=Task.Status.DONE).count()
        return Response({
            "total_projects": total_projects,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
        })

class DashboardActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Placeholder activity feed; replace with real implementation as needed
        return Response({"activity": []})
