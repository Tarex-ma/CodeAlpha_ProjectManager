from .models import Task, Column

def create_task(*, column_id: int, title: str, assignee_id: int | None, **kwargs) -> Task:
    column = Column.objects.get(pk=column_id)
    last_order = column.tasks.count()
    return Task.objects.create(
        column=column,
        title=title,
        assignee_id=assignee_id,
        order=last_order,
        **kwargs,
    )

def move_task(*, task_id: int, target_column_id: int, new_order: int) -> Task:
    task = Task.objects.select_related("column").get(pk=task_id)
    task.column_id = target_column_id
    task.order = new_order
    task.save(update_fields=["column", "order", "updated_at"])
    return task