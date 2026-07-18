"""Movement record and permit API viewsets."""

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from CattleTrace.api.permissions import IsMovementAuthorized
from CattleTrace.api.v1.mixins import AnimalRelatedQuerysetMixin, RoleScopedQuerysetMixin, SignalValidationMixin
from CattleTrace.api.v1.serializers import MovementPermitSerializer, MovementRecordSerializer
from CattleTrace.models import MovementPermit, MovementRecord, Notification, User


class MovementPermitViewSet(RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = MovementPermit.objects.select_related('issued_by').all()
    serializer_class = MovementPermitSerializer
    permission_classes = (IsAuthenticated,)
    filter_backends = (SearchFilter, OrderingFilter)
    search_fields = ('permit_number', 'notes')
    ordering_fields = ('issued_on', 'valid_until')
    ordering = ('-issued_on',)
    owner_field = 'issued_by'

    def get_queryset(self):
        user = self.request.user
        if user.role in (User.Role.INSPECTOR, User.Role.DVS, User.Role.ADMIN):
            queryset = self.queryset
        else:
            queryset = self.queryset.filter(status=MovementPermit.Status.APPROVED)

        permit_status = self.request.query_params.get('status')
        if permit_status:
            queryset = queryset.filter(status=permit_status)
        return queryset

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        """DVS officer approves a movement permit."""
        permit = self.get_object()
        user = request.user

        if user.role not in (User.Role.DVS, User.Role.INSPECTOR, User.Role.ADMIN):
            return Response(
                {'detail': 'Only DVS officers or inspectors may approve permits.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if permit.status != MovementPermit.Status.PENDING:
            return Response(
                {'detail': f'Permit is already {permit.get_status_display()}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        permit.status = MovementPermit.Status.APPROVED
        permit.issued_by = user
        permit.save(update_fields=['status', 'issued_by'])

        # Notify movements associated with this permit
        for movement in permit.movementrecord_set.select_related('recorded_by').all():
            if movement.recorded_by:
                Notification.objects.create(
                    recipient=movement.recorded_by,
                    notification_type=Notification.NotificationType.MOVEMENT_APPROVED,
                    title=f"Movement permit {permit.permit_number} approved",
                    message=f"Your movement permit {permit.permit_number} has been approved by {user.get_full_name() or user.username}.",
                    related_animal=movement.animal,
                )

        return Response({'detail': 'Permit approved.', 'status': permit.status})

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        """DVS officer rejects a movement permit."""
        permit = self.get_object()
        user = request.user

        if user.role not in (User.Role.DVS, User.Role.INSPECTOR, User.Role.ADMIN):
            return Response(
                {'detail': 'Only DVS officers or inspectors may reject permits.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if permit.status != MovementPermit.Status.PENDING:
            return Response(
                {'detail': f'Permit is already {permit.get_status_display()}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = request.data.get('reason', '')
        permit.status = MovementPermit.Status.REJECTED
        permit.issued_by = user
        if reason:
            permit.notes = f"Rejected: {reason}"
        permit.save(update_fields=['status', 'issued_by', 'notes'])

        for movement in permit.movementrecord_set.select_related('recorded_by').all():
            if movement.recorded_by:
                Notification.objects.create(
                    recipient=movement.recorded_by,
                    notification_type=Notification.NotificationType.MOVEMENT_REJECTED,
                    title=f"Movement permit {permit.permit_number} rejected",
                    message=f"Your movement permit {permit.permit_number} was rejected. {reason}",
                    related_animal=movement.animal,
                )

        return Response({'detail': 'Permit rejected.', 'status': permit.status})


class MovementRecordViewSet(SignalValidationMixin, AnimalRelatedQuerysetMixin, viewsets.ModelViewSet):
    queryset = MovementRecord.objects.select_related(
        'animal',
        'permit',
        'origin_farm',
        'destination_farm',
        'recorded_by',
    ).all()
    serializer_class = MovementRecordSerializer
    permission_classes = (IsAuthenticated, IsMovementAuthorized)
    filter_backends = (SearchFilter, OrderingFilter)
    search_fields = (
        'animal__tag_number',
        'animal__rfid_tag',
        'permit__permit_number',
        'origin_county',
        'destination_county',
        'purpose',
        'transporter',
        'vehicle_reg',
    )
    ordering_fields = ('move_date', 'created_at')
    ordering = ('-move_date',)

    def get_queryset(self):
        queryset = super().get_queryset()
        animal_tag = self.request.query_params.get('animal')
        if animal_tag:
            queryset = queryset.filter(animal__tag_number=animal_tag)
        purpose = self.request.query_params.get('purpose')
        if purpose:
            queryset = queryset.filter(purpose=purpose)
        permit_status = self.request.query_params.get('permit_status')
        if permit_status:
            queryset = queryset.filter(permit__status=permit_status)
        return queryset

