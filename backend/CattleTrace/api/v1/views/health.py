"""Health record API viewset."""

from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from CattleTrace.api.permissions import IsHealthRecordAuthorized
from CattleTrace.api.v1.mixins import SignalValidationMixin
from CattleTrace.api.v1.serializers import HealthRecordSerializer
from CattleTrace.models import HealthRecord, Notification, User


class HealthRecordViewSet(SignalValidationMixin, viewsets.ModelViewSet):
    queryset = HealthRecord.objects.select_related(
        'animal', 'vet', 'diagnosis', 'vaccine_used',
    ).all()
    serializer_class = HealthRecordSerializer
    permission_classes = (IsAuthenticated, IsHealthRecordAuthorized)
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    filter_backends = (SearchFilter, OrderingFilter)
    search_fields = (
        'animal__tag_number', 'animal__rfid_tag', 'diagnosis__name',
        'vaccine_used__name', 'medication', 'notes', 'certificate_no',
    )
    ordering_fields = ('date', 'created_at')
    ordering = ('-date',)

    def get_queryset(self):
        # All authenticated users may read; write is gated by IsHealthRecordAuthorized.
        # Farmers see only their own animals' records; everyone else sees all.
        queryset = HealthRecord.objects.select_related(
            'animal', 'vet', 'diagnosis', 'vaccine_used',
        ).all()
        user = self.request.user
        if user.role == User.Role.FARMER:
            queryset = queryset.filter(animal__current_owner=user)

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
        return queryset

    @action(detail=True, methods=['post'], url_path='escalate')
    def escalate(self, request, pk=None):
        """Escalate a suspected disease record to the county DVS officer."""
        record = self.get_object()
        user = request.user

        if user.role not in (User.Role.VET, User.Role.CAHW, User.Role.ADMIN):
            return Response(
                {'detail': 'Only vets or CAHWs may escalate health records.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if record.is_escalated:
            return Response({'detail': 'This record has already been escalated.'}, status=status.HTTP_400_BAD_REQUEST)

        # Find a DVS officer in the same county zone as the recording vet
        county = getattr(user, 'county_zone', '') or ''
        dvs_officer = User.objects.filter(role=User.Role.DVS, county_zone__iexact=county).first()

        record.is_escalated = True
        record.escalated_to = dvs_officer
        record.save(update_fields=['is_escalated', 'escalated_to'])

        # Notify the DVS officer if found
        if dvs_officer:
            Notification.objects.create(
                recipient=dvs_officer,
                notification_type=Notification.NotificationType.DISEASE_ALERT,
                title=f"Disease escalation: {record.animal.tag_number}",
                message=(
                    f"Health worker {user.get_full_name() or user.username} escalated "
                    f"a {record.get_record_type_display()} record for animal "
                    f"{record.animal.tag_number} on {record.date}. Please review."
                ),
                related_animal=record.animal,
            )

        return Response({
            'detail': 'Record escalated successfully.',
            'escalated_to': dvs_officer.get_full_name() if dvs_officer else None,
        })
