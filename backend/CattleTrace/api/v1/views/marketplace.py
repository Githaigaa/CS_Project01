"""Marketplace API viewsets."""

from django.db.models import Q

from rest_framework import mixins, viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated

from CattleTrace.api.permissions import (
    IsInquiryParticipant,
    IsSellerOrReadOnly,
    IsTransactionParticipant,
)
from CattleTrace.api.v1.mixins import RoleScopedQuerysetMixin, SellerQuerysetMixin
from CattleTrace.api.v1.serializers import (
    MarketplaceInquirySerializer,
    MarketplaceListingSerializer,
    TransactionSerializer,
)
from CattleTrace.models import MarketplaceInquiry, MarketplaceListing, Transaction, User


class MarketplaceListingViewSet(SellerQuerysetMixin, viewsets.ModelViewSet):
    queryset = MarketplaceListing.objects.select_related(
        'animal',
        'animal__breed',
        'seller',
    ).all()
    serializer_class = MarketplaceListingSerializer
    permission_classes = (IsAuthenticated, IsSellerOrReadOnly)
    filter_backends = (SearchFilter, OrderingFilter)
    search_fields = ('animal__tag_number', 'location_county', 'description')
    ordering_fields = ('listed_on', 'asking_price')
    ordering = ('-listed_on',)
    owner_field = 'seller'

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role == User.Role.BUYER:
            return queryset.filter(status=MarketplaceListing.ListingStatus.ACTIVE)
        return queryset


class MarketplaceInquiryViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = MarketplaceInquiry.objects.select_related('listing', 'buyer').all()
    serializer_class = MarketplaceInquirySerializer
    permission_classes = (IsAuthenticated, IsInquiryParticipant)
    filter_backends = (OrderingFilter,)
    ordering = ('-sent_at',)

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.ADMIN:
            return self.queryset
        return self.queryset.filter(Q(buyer=user) | Q(listing__seller=user))


class TransactionViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Transaction.objects.select_related('listing', 'buyer', 'seller').all()
    serializer_class = TransactionSerializer
    permission_classes = (IsAuthenticated, IsTransactionParticipant)
    filter_backends = (OrderingFilter,)
    ordering = ('-transaction_date',)

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.ADMIN:
            return self.queryset
        return self.queryset.filter(Q(buyer=user) | Q(seller=user))
