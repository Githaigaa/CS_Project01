"""Movement record and permit API viewsets."""

from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated

from CattleTrace.api.permissions import IsMovementAuthorized
from CattleTrace.api.v1.mixins import AnimalRelatedQuerysetMixin, RoleScopedQuerysetMixin
from CattleTrace.api.v1.serializers import MovementPermitSerializer, MovementRecordSerializer
from CattleTrace.models import MovementPermit, MovementRecord, User


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
        if user.role in (User.Role.INSPECTOR, User.Role.ADMIN):
            queryset = self.queryset
        else:
            queryset = self.queryset.filter(status=MovementPermit.Status.APPROVED)

        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        return queryset


class MovementRecordViewSet(AnimalRelatedQuerysetMixin, viewsets.ModelViewSet):
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
