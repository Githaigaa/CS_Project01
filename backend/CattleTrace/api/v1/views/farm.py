"""Farm / holding API viewset."""

from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated

from CattleTrace.api.permissions import IsOwnerOrReadOnly
from CattleTrace.api.v1.mixins import RoleScopedQuerysetMixin
from CattleTrace.api.v1.serializers import FarmSerializer
from CattleTrace.models import Farm


class FarmViewSet(RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Farm.objects.select_related('owner').prefetch_related('animals').all()
    serializer_class = FarmSerializer
    permission_classes = (IsAuthenticated, IsOwnerOrReadOnly)
    filter_backends = (SearchFilter, OrderingFilter)
    search_fields = ('name', 'registration_no', 'county')
    ordering_fields = ('created_at', 'name')
    ordering = ('-created_at',)
    owner_field = 'owner'
