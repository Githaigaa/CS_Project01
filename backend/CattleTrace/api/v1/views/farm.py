"""Farm / holding API viewset."""

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from CattleTrace.api.permissions import IsOwnerOrReadOnly
from CattleTrace.api.v1.mixins import RoleScopedQuerysetMixin
from CattleTrace.api.v1.serializers import FarmSerializer
from CattleTrace.models import Farm, User


class FarmViewSet(RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Farm.objects.select_related('owner').prefetch_related('animals').all()
    serializer_class = FarmSerializer
    permission_classes = (IsAuthenticated, IsOwnerOrReadOnly)
    filter_backends = (SearchFilter, OrderingFilter)
    search_fields = ('name', 'registration_no', 'county')
    ordering_fields = ('created_at', 'name')
    ordering = ('-created_at',)
    owner_field = 'owner'

    @action(detail=True, methods=['post'], url_path='restrict')
    def restrict(self, request, pk=None):
        """DVS officer places a movement restriction on a holding."""
        farm = self.get_object()
        user = request.user

        if user.role not in (User.Role.DVS, User.Role.INSPECTOR, User.Role.ADMIN):
            return Response(
                {'detail': 'Only DVS officers may restrict holdings.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        reason = request.data.get('reason', '')
        farm.is_restricted = True
        farm.restriction_reason = reason
        farm.restricted_by = user
        farm.restricted_on = timezone.now().date()
        farm.save(update_fields=['is_restricted', 'restriction_reason', 'restricted_by', 'restricted_on'])

        return Response({'detail': f"Holding '{farm.name}' is now restricted.", 'reason': reason})

    @action(detail=True, methods=['post'], url_path='unrestrict')
    def unrestrict(self, request, pk=None):
        """DVS officer lifts a movement restriction from a holding."""
        farm = self.get_object()
        user = request.user

        if user.role not in (User.Role.DVS, User.Role.INSPECTOR, User.Role.ADMIN):
            return Response(
                {'detail': 'Only DVS officers may lift holding restrictions.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        farm.is_restricted = False
        farm.restriction_reason = ''
        farm.restricted_by = None
        farm.restricted_on = None
        farm.save(update_fields=['is_restricted', 'restriction_reason', 'restricted_by', 'restricted_on'])

        return Response({'detail': f"Restriction lifted from holding '{farm.name}'."})
