from rest_framework import serializers
from .models import Task

class TaskCalendarSerializer(serializers.ModelSerializer):
    """Serializer for calendar endpoint, exposing fields needed for display and filtering."""
    project_name = serializers.CharField(source='project.title', read_only=True)
    project_color = serializers.CharField(source='project.color', read_only=True)
    assignee_names = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'due_date',
            'priority', 'status', 'project',
            'project_name', 'project_color', 'assignee_names',
        ]
        read_only_fields = fields

    def get_assignee_names(self, obj):
        return [user.get_full_name() or user.email for user in obj.assignees.all()]
