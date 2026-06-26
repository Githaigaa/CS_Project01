"""Health record API viewset."""

from rest_framework import viewsets
from django.db.models import Q
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated

from CattleTrace.api.permissions import IsHealthRecordAuthorized
from CattleTrace.api.v1.mixins import AnimalRelatedQuerysetMixin
from CattleTrace.api.v1.serializers import HealthRecordSerializer
from CattleTrace.models import HealthRecord, User


class HealthRecordViewSet(AnimalRelatedQuerysetMixin, viewsets.ModelViewSet):
    queryset = HealthRecord.objects.select_related(
        'animal',
        'vet',
        'diagnosis',
        'vaccine_used',
    ).all()
    serializer_class = HealthRecordSerializer
    permission_classes = (IsAuthenticated, IsHealthRecordAuthorized)
    filter_backends = (SearchFilter, OrderingFilter)
    search_fields = (
        'animal__tag_number',
        'animal__rfid_tag',
        'diagnosis__name',
        'vaccine_used__name',
        'medication',
        'notes',
        'certificate_no',
    )
    ordering_fields = ('date', 'created_at')
    ordering = ('-date',)

    def get_queryset(self):
        queryset = super().get_queryset()
        animal_tag = self.request.query_params.get('animal')
        if animal_tag:
            queryset = queryset.filter(animal__tag_number=animal_tag)
        disease = self.request.query_params.get('disease')
        if disease:
            queryset = queryset.filter(
                Q(diagnosis__name__icontains=disease)
                | Q(medication__icontains=disease)
                | Q(notes__icontains=disease)
            )
        user = self.request.user
        if user.role == User.Role.VET:
            return queryset
        return queryset
