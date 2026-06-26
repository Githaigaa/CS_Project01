"""Notification API viewset."""

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from CattleTrace.api.v1.serializers.notification import NotificationSerializer
from CattleTrace.models import Notification

ACTION_REQUIRED_TYPES = (
    Notification.NotificationType.DISEASE_ALERT,
    Notification.NotificationType.LISTING_INQUIRY,
    Notification.NotificationType.MOVEMENT_REJECTED,
)

PENDING_APPROVAL_TYPES = (
    Notification.NotificationType.MOVEMENT_REJECTED,
    Notification.NotificationType.LISTING_INQUIRY,
)


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = (IsAuthenticated,)
    filter_backends = (OrderingFilter,)
    ordering_fields = ('created_at',)
    ordering = ('-created_at',)
    http_method_names = ('get', 'patch', 'delete', 'head', 'options')

    def get_queryset(self):
        queryset = Notification.objects.filter(recipient=self.request.user)
        is_read = self.request.query_params.get('is_read')
        if is_read == 'true':
            queryset = queryset.filter(is_read=True)
        elif is_read == 'false':
            queryset = queryset.filter(is_read=False)

        action_required = self.request.query_params.get('action_required')
        if action_required == 'true':
            queryset = queryset.filter(notification_type__in=ACTION_REQUIRED_TYPES)
        elif action_required == 'false':
            queryset = queryset.exclude(notification_type__in=ACTION_REQUIRED_TYPES)

        notification_type = self.request.query_params.get('notification_type')
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)

        return queryset

    def partial_update(self, request, *args, **kwargs):
        notification = self.get_object()
        if 'is_read' in request.data and request.data['is_read'] is True:
            notification.mark_read()
            serializer = self.get_serializer(notification)
            return Response(serializer.data)
        return super().partial_update(request, *args, **kwargs)

    @action(detail=False, methods=('post',), url_path='mark-all-read')
    def mark_all_read(self, request):
        updated = Notification.objects.filter(
            recipient=request.user,
            is_read=False,
        ).update(is_read=True)
        return Response({'updated': updated})

    @action(detail=False, methods=('get',), url_path='unread-count')
    def unread_count(self, request):
        unread = Notification.objects.filter(recipient=request.user, is_read=False)
        return Response({
            'count': unread.count(),
            'action_required_count': unread.filter(
                notification_type__in=ACTION_REQUIRED_TYPES,
            ).count(),
            'disease_alerts_count': unread.filter(
                notification_type=Notification.NotificationType.DISEASE_ALERT,
            ).count(),
            'pending_approvals_count': unread.filter(
                notification_type__in=PENDING_APPROVAL_TYPES,
            ).count(),
        })
