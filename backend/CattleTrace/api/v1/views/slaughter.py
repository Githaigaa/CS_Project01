"""Slaughter record API viewsets."""

from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from CattleTrace.api.permissions import IsSlaughterAuthorized
from CattleTrace.api.v1.mixins import AnimalRelatedQuerysetMixin
from CattleTrace.api.v1.serializers import AbattoirSerializer, SlaughterRecordSerializer
from CattleTrace.api.v1.serializers.animal import AnimalSerializer
from CattleTrace.models import Abattoir, Animal, SlaughterRecord


class AbattoirViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = Abattoir.objects.filter(is_active=True)
    serializer_class = AbattoirSerializer
    permission_classes = (IsAuthenticated,)
    filter_backends = (OrderingFilter,)
    ordering = ('name',)


class SlaughterRecordViewSet(AnimalRelatedQuerysetMixin, viewsets.ModelViewSet):
    queryset = SlaughterRecord.objects.select_related(
        'animal', 'abattoir', 'inspector',
    ).all()
    serializer_class = SlaughterRecordSerializer
    permission_classes = (IsAuthenticated, IsSlaughterAuthorized)
    filter_backends = (OrderingFilter,)
    ordering_fields = ('slaughter_date', 'created_at')
    ordering = ('-slaughter_date',)

    @action(detail=False, methods=['get'], url_path=r'verify/(?P<tag_number>[^/.]+)')
    def verify_animal(self, request, tag_number=None):
        """Pre-slaughter check — returns eligibility and animal details."""
        try:
            animal = Animal.objects.select_related('current_farm', 'current_owner', 'breed').get(
                tag_number=tag_number
            )
        except Animal.DoesNotExist:
            return Response(
                {'eligible': False, 'reason': 'Animal not found in the system.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        blocked = {Animal.Status.STOLEN, Animal.Status.DECEASED, Animal.Status.SLAUGHTERED}
        if animal.status in blocked:
            return Response({
                'eligible': False,
                'reason': f"Animal status is '{animal.get_status_display()}'. Slaughter is not permitted.",
                'animal_tag': animal.tag_number,
                'status': animal.status,
            })

        has_slaughter_movement = animal.movements.filter(purpose='slaughter').exists()
        serializer = AnimalSerializer(animal, context={'request': request})
        return Response({
            'eligible': True,
            'has_slaughter_movement_record': has_slaughter_movement,
            'animal': serializer.data,
        })
