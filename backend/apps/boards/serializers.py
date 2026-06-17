"""
apps/boards/serializers.py
────────────────────────────
BoardSerializer          — read + create + update (title / position)
BoardCreateSerializer    — write: title only; position auto-assigned
BoardUpdateSerializer    — write: title and/or position (single board PATCH)
BoardReorderSerializer   — write: list of {id, position} pairs for bulk reorder
"""

from rest_framework import serializers

from .models import Board


# ── Read serializer ───────────────────────────────────────────────────────

class BoardSerializer(serializers.ModelSerializer):
    """
    Full representation returned in list / retrieve / create responses.

    task_count is annotated in the view queryset so it is always 0 until
    the tasks app is wired up — no code change needed here.
    """

    task_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model  = Board
        fields = [
            "id",
            "project",
            "title",
            "position",
            "task_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "project", "created_at", "updated_at"]


# ── Create serializer ─────────────────────────────────────────────────────

class BoardCreateSerializer(serializers.ModelSerializer):
    """
    POST /api/v1/projects/{project_pk}/boards/
    Only title is required. position is auto-computed as max+1.

    Request:  { "title": "In Progress" }
    Response: full BoardSerializer representation
    """

    class Meta:
        model  = Board
        fields = ["title"]

    def validate_title(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Board title cannot be blank.")

        project = self.context["project"]
        qs = Board.objects.filter(project=project, title__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "A board with this title already exists in the project."
            )
        return value

    def create(self, validated_data: dict) -> Board:
        project = self.context["project"]
        validated_data["position"] = Board.next_position(project.pk)
        return Board.objects.create(project=project, **validated_data)


# ── Update serializer (single board PATCH) ────────────────────────────────

class BoardUpdateSerializer(serializers.ModelSerializer):
    """
    PATCH /api/v1/projects/{project_pk}/boards/{id}/
    Both fields are optional — send only what changes.

    Request:  { "title": "QA Review" }
            or { "position": 2 }
            or both
    """

    class Meta:
        model  = Board
        fields = ["title", "position"]

    def validate_title(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Board title cannot be blank.")

        project = self.context["project"]
        qs = Board.objects.filter(project=project, title__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "A board with this title already exists in the project."
            )
        return value

    def validate_position(self, value: int) -> int:
        if value < 0:
            raise serializers.ValidationError("Position must be 0 or greater.")
        return value


# ── Bulk reorder serializer ───────────────────────────────────────────────

class BoardPositionItemSerializer(serializers.Serializer):
    """One item inside the reorder list: { "id": 3, "position": 0 }"""
    id       = serializers.IntegerField()
    position = serializers.IntegerField(min_value=0)


class BoardReorderSerializer(serializers.Serializer):
    """
    POST /api/v1/projects/{project_pk}/boards/reorder/

    Send the complete new ordering for ALL boards in a project.

    Request:
        {
            "boards": [
                {"id": 3, "position": 0},
                {"id": 1, "position": 1},
                {"id": 4, "position": 2},
                {"id": 2, "position": 3}
            ]
        }

    Validation rules
    ────────────────
    - Every board id must belong to the project.
    - Every board in the project must appear in the list (no partial reorder).
    - No duplicate ids.
    - No duplicate positions.
    """

    boards = BoardPositionItemSerializer(many=True)

    def validate_boards(self, value: list) -> list:
        if not value:
            raise serializers.ValidationError("boards list cannot be empty.")

        ids      = [item["id"] for item in value]
        positions = [item["position"] for item in value]

        # Duplicate ids
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError("Duplicate board ids in request.")

        # Duplicate positions
        if len(positions) != len(set(positions)):
            raise serializers.ValidationError("Duplicate positions in request.")

        return value

    def validate(self, attrs: dict) -> dict:
        project       = self.context["project"]
        incoming_ids  = {item["id"] for item in attrs["boards"]}
        project_board_ids = set(
            Board.objects.filter(project=project).values_list("id", flat=True)
        )

        # Extra ids not belonging to this project
        unknown = incoming_ids - project_board_ids
        if unknown:
            raise serializers.ValidationError(
                {"boards": f"Board ids not found in this project: {sorted(unknown)}"}
            )

        # Missing boards (partial reorder not allowed)
        missing = project_board_ids - incoming_ids
        if missing:
            raise serializers.ValidationError(
                {"boards": f"All project boards must be included. Missing ids: {sorted(missing)}"}
            )

        return attrs

    def save(self, **kwargs) -> list[Board]:
        """
        Bulk-update positions using a single UPDATE ... CASE WHEN ... statement
        via Django's bulk_update — far more efficient than one UPDATE per board.
        """
        project      = self.context["project"]
        position_map = {item["id"]: item["position"] for item in self.validated_data["boards"]}

        boards = list(Board.objects.filter(project=project))
        for board in boards:
            board.position = position_map[board.pk]

        Board.objects.bulk_update(boards, ["position"])
        boards.sort(key=lambda b: b.position)
        return boards