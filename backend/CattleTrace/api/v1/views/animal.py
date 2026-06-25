"""Animal API viewset."""

from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated

from CattleTrace.api.permissions import IsAnimalOwnerOrStaff
from CattleTrace.api.v1.mixins import RoleScopedQuerysetMixin
from CattleTrace.api.v1.serializers import AnimalSerializer
from CattleTrace.models import Animal, User


class AnimalViewSet(RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Animal.objects.select_related(
        'breed',
        'current_owner',
        'current_farm',
        'registered_by',
    ).all()
    serializer_class = AnimalSerializer
    permission_classes = (IsAuthenticated, IsAnimalOwnerOrStaff)
    lookup_field = 'tag_number'
    filter_backends = (SearchFilter, OrderingFilter)
    search_fields = ('tag_number', 'rfid_tag', 'name')
    ordering_fields = ('registration_date', 'date_of_birth', 'created_at')
    ordering = ('-registration_date',)
    owner_field = 'current_owner'
    allow_buyer_read = True

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role == User.Role.BUYER:
            return queryset.filter(status=Animal.Status.ALIVE)
        return queryset
