"""
apps/tasks/serializers.py
───────────────────────────
TaskSerializer           — read: full task representation
TaskCreateSerializer     — write: create a task inside a board
TaskUpdateSerializer     — write: edit fields (PATCH, all optional)
TaskMoveSerializer       — write: move task to a different board + position
TaskReorderSerializer    — write: bulk reorder tasks within a single board
"""
import django.db.models as models
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

from apps.boards.models import Board
from apps.projects.models import ProjectMember

from .models import Task

User = get_user_model()


# ── Embedded user summary ─────────────────────────────────────────────────

class TaskUserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model  = User
        fields = ["id", "email", "first_name", "last_name", "full_name"]
        read_only_fields = fields


# ── Embedded board summary ────────────────────────────────────────────────

class TaskBoardSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Board
        fields = ["id", "title", "position"]
        read_only_fields = fields


# ══════════════════════════════════════════════════════════════════════════
# READ serializer
# ══════════════════════════════════════════════════════════════════════════

class TaskSerializer(serializers.ModelSerializer):
    assignee   = TaskUserSerializer(read_only=True)
    created_by = TaskUserSerializer(read_only=True)
    board      = TaskBoardSerializer(read_only=True)
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model  = Task
        fields = [
            "id",
            "title",
            "description",
            "board",
            "project",
            "assignee",
            "created_by",
            "priority",
            "status",
            "due_date",
            "position",
            "is_overdue",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_is_overdue(self, obj: Task) -> bool:
        if not obj.due_date or obj.status == Task.Status.DONE:
            return False
        return obj.due_date < timezone.now().date()


# ══════════════════════════════════════════════════════════════════════════
# CREATE serializer
# ══════════════════════════════════════════════════════════════════════════

class TaskCreateSerializer(serializers.ModelSerializer):
    """
    POST /api/v1/projects/{project_pk}/boards/{board_pk}/tasks/

    Required: title
    Optional: description, assignee_id, priority, status, due_date

    position is auto-assigned as MAX(position)+1 within the board.
    project is inferred from the board (never sent by the client).
    """

    assignee_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source="assignee",
        required=False,
        allow_null=True,
    )

    class Meta:
        model  = Task
        fields = [
            "title",
            "description",
            "assignee_id",
            "priority",
            "status",
            "due_date",
        ]

    def validate_title(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Task title cannot be blank.")
        return value

    def validate_due_date(self, value):
        if value and value < timezone.now().date():
            raise serializers.ValidationError("Due date cannot be in the past.")
        return value

    def validate_assignee_id(self, user):
        """Assignee must be a member of the project."""
        project = self.context["project"]
        if user and not ProjectMember.objects.filter(project=project, user=user).exists():
            raise serializers.ValidationError(
                "Assignee must be a member of the project."
            )
        return user

    def create(self, validated_data: dict) -> Task:
        board   = self.context["board"]
        project = self.context["project"]
        user    = self.context["request"].user

        validated_data["board"]      = board
        validated_data["project"]    = project
        validated_data["created_by"] = user
        validated_data["position"]   = Task.objects.next_position(board.pk)

        return Task.objects.create(**validated_data)


# ══════════════════════════════════════════════════════════════════════════
# UPDATE serializer  (PATCH — all fields optional)
# ══════════════════════════════════════════════════════════════════════════

class TaskUpdateSerializer(serializers.ModelSerializer):
    """
    PATCH /api/v1/projects/{project_pk}/boards/{board_pk}/tasks/{id}/

    All fields are optional. Send only what needs to change.
    Use TaskMoveSerializer to change the board.
    """

    assignee_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source="assignee",
        required=False,
        allow_null=True,
    )

    class Meta:
        model  = Task
        fields = [
            "title",
            "description",
            "assignee_id",
            "priority",
            "status",
            "due_date",
            "position",
        ]

    def validate_title(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Task title cannot be blank.")
        return value

    def validate_assignee_id(self, user):
        project = self.context["project"]
        if user and not ProjectMember.objects.filter(project=project, user=user).exists():
            raise serializers.ValidationError(
                "Assignee must be a member of the project."
            )
        return user

    def validate_position(self, value: int) -> int:
        if value < 0:
            raise serializers.ValidationError("Position must be 0 or greater.")
        return value


# ══════════════════════════════════════════════════════════════════════════
# MOVE serializer  (drag task to a different board column)
# ══════════════════════════════════════════════════════════════════════════

class TaskMoveSerializer(serializers.Serializer):
    """
    POST /api/v1/projects/{project_pk}/boards/{board_pk}/tasks/{id}/move/

    Move a task to a different board (column) within the same project,
    and set its new position among the destination board's tasks.

    Request:
        {
            "board_id": 3,
            "position": 1
        }
    """

    board_id = serializers.IntegerField()
    position = serializers.IntegerField(min_value=0)

    def validate_board_id(self, value: int) -> int:
        project = self.context["project"]
        from apps.boards.models import Board as BoardModel
        try:
            self._target_board = BoardModel.objects.get(pk=value, project=project)
        except BoardModel.DoesNotExist:
            raise serializers.ValidationError(
                "Board not found in this project."
            )
        return value

    def save(self, task: Task) -> Task:
        target_board = self._target_board
        new_position = self.validated_data["position"]

        # Shift existing tasks in destination board to make room
        Task.objects.filter(
            board=target_board,
            position__gte=new_position,
        ).exclude(pk=task.pk).update(position=models.F("position") + 1)

        task.board    = target_board
        task.position = new_position
        task.save(update_fields=["board", "position", "updated_at"])
        return task


# ══════════════════════════════════════════════════════════════════════════
# REORDER serializer  (bulk drag-and-drop within one board)
# ══════════════════════════════════════════════════════════════════════════

class TaskPositionItemSerializer(serializers.Serializer):
    id       = serializers.IntegerField()
    position = serializers.IntegerField(min_value=0)


class TaskReorderSerializer(serializers.Serializer):
    """
    POST /api/v1/projects/{project_pk}/boards/{board_pk}/tasks/reorder/

    Bulk-update positions for ALL tasks in a board.
    Must include every task in the board — partial reorder rejected.

    Request:
        {
            "tasks": [
                {"id": 5, "position": 0},
                {"id": 2, "position": 1},
                {"id": 8, "position": 2}
            ]
        }
    """

    tasks = TaskPositionItemSerializer(many=True)

    def validate_tasks(self, value: list) -> list:
        if not value:
            raise serializers.ValidationError("tasks list cannot be empty.")

        ids       = [item["id"] for item in value]
        positions = [item["position"] for item in value]

        if len(ids) != len(set(ids)):
            raise serializers.ValidationError("Duplicate task ids in request.")
        if len(positions) != len(set(positions)):
            raise serializers.ValidationError("Duplicate positions in request.")

        return value

    def validate(self, attrs: dict) -> dict:
        board        = self.context["board"]
        incoming_ids = {item["id"] for item in attrs["tasks"]}
        board_task_ids = set(
            Task.objects.filter(board=board).values_list("id", flat=True)
        )

        unknown = incoming_ids - board_task_ids
        if unknown:
            raise serializers.ValidationError(
                {"tasks": f"Task ids not in this board: {sorted(unknown)}"}
            )

        missing = board_task_ids - incoming_ids
        if missing:
            raise serializers.ValidationError(
                {"tasks": f"All board tasks must be included. Missing: {sorted(missing)}"}
            )

        return attrs

    def save(self, **kwargs) -> list:
        board        = self.context["board"]
        position_map = {item["id"]: item["position"] for item in self.validated_data["tasks"]}

        task_list = list(Task.objects.filter(board=board))
        for task in task_list:
            task.position = position_map[task.pk]

        Task.objects.bulk_update(task_list, ["position"])
        task_list.sort(key=lambda t: t.position)
        return task_list


# Need this for TaskMoveSerializer
