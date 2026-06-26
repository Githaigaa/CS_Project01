"""Notification serializers."""

from rest_framework import serializers

from CattleTrace.models import Notification

ACTION_REQUIRED_TYPES = (
    Notification.NotificationType.DISEASE_ALERT,
    Notification.NotificationType.LISTING_INQUIRY,
    Notification.NotificationType.MOVEMENT_REJECTED,
)


class NotificationSerializer(serializers.ModelSerializer):
    action_required = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = (
            'id',
            'notification_type',
            'title',
            'message',
            'is_read',
            'action_required',
            'related_animal',
            'related_listing',
            'created_at',
        )
        read_only_fields = (
            'id',
            'notification_type',
            'title',
            'message',
            'action_required',
            'related_animal',
            'related_listing',
            'created_at',
        )

    def get_action_required(self, obj):
        return obj.notification_type in ACTION_REQUIRED_TYPES
