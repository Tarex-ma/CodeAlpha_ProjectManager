from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, UserSettings

@receiver(post_save, sender=User)
def create_user_settings(sender, instance, created, **kwargs):
    """Automatically create a UserSettings instance when a new User is created."""
    if created:
        UserSettings.objects.get_or_create(user=instance)
