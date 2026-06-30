from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from .models import Task, ActivityLog
# pyrefly: ignore [missing-import]
from apps.comments.models import Comment

@receiver(post_save, sender=Task)
def log_task_saved(sender, instance, created, **kwargs):
    if created:
        ActivityLog.objects.create(
            task=instance,
            actor=instance.created_by,
            action=ActivityLog.Action.CREATED
        )

@receiver(m2m_changed, sender=Task.assignees.through)
def log_task_assignees_changed(sender, instance, action, reverse, model, pk_set, **kwargs):
    if action == "post_add" and pk_set:
        for pk in pk_set:
            user = model.objects.get(pk=pk)
            ActivityLog.objects.create(
                task=instance,
                actor=user,
                action=ActivityLog.Action.ASSIGNEE_ADDED
            )
    elif action == "post_remove" and pk_set:
        for pk in pk_set:
            user = model.objects.get(pk=pk)
            ActivityLog.objects.create(
                task=instance,
                actor=user,
                action=ActivityLog.Action.ASSIGNEE_REMOVED
            )

@receiver(post_save, sender=Comment)
def log_comment_saved(sender, instance, created, **kwargs):
    if created:
        ActivityLog.objects.create(
            task=instance.task,
            actor=instance.author,
            action=ActivityLog.Action.COMMENT_ADDED
        )
    else:
        ActivityLog.objects.create(
            task=instance.task,
            actor=instance.author,
            action=ActivityLog.Action.COMMENT_EDITED
        )
