"""Slaughter record API viewsets."""

from rest_framework import mixins, viewsets
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated

from CattleTrace.api.permissions import IsSlaughterAuthorized
from CattleTrace.api.v1.mixins import AnimalRelatedQuerysetMixin
from CattleTrace.api.v1.serializers import AbattoirSerializer, SlaughterRecordSerializer
from CattleTrace.models import Abattoir, SlaughterRecord


class AbattoirViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = Abattoir.objects.filter(is_active=True)
    serializer_class = AbattoirSerializer
    permission_classes = (IsAuthenticated,)
    filter_backends = (OrderingFilter,)
    ordering = ('name',)


class SlaughterRecordViewSet(AnimalRelatedQuerysetMixin, viewsets.ModelViewSet):
    queryset = SlaughterRecord.objects.select_related(
        'animal',
        'abattoir',
        'inspector',
    ).all()
    serializer_class = SlaughterRecordSerializer
    permission_classes = (IsAuthenticated, IsSlaughterAuthorized)
    filter_backends = (OrderingFilter,)
    ordering_fields = ('slaughter_date', 'created_at')
    ordering = ('-slaughter_date',)
