"""Movement record and permit API viewsets."""

from rest_framework import viewsets
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated

from CattleTrace.api.permissions import IsMovementAuthorized
from CattleTrace.api.v1.mixins import AnimalRelatedQuerysetMixin, RoleScopedQuerysetMixin
from CattleTrace.api.v1.serializers import MovementPermitSerializer, MovementRecordSerializer
from CattleTrace.models import MovementPermit, MovementRecord, User


class MovementPermitViewSet(RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = MovementPermit.objects.select_related('issued_by').all()
    serializer_class = MovementPermitSerializer
    permission_classes = (IsAuthenticated,)
    filter_backends = (OrderingFilter,)
    ordering = ('-issued_on',)
    owner_field = 'issued_by'

    def get_queryset(self):
        user = self.request.user
        if user.role in (User.Role.INSPECTOR, User.Role.ADMIN):
            return self.queryset
        return self.queryset.filter(status=MovementPermit.Status.APPROVED)


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
    filter_backends = (OrderingFilter,)
    ordering_fields = ('move_date', 'created_at')
    ordering = ('-move_date',)

    def get_queryset(self):
        queryset = super().get_queryset()
        animal_tag = self.request.query_params.get('animal')
        if animal_tag:
            queryset = queryset.filter(animal__tag_number=animal_tag)
        return queryset
