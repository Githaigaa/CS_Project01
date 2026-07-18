"""Marketplace API viewsets."""

from django.db.models import Q, Sum

from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from CattleTrace.api.permissions import (
    IsInquiryParticipant,
    IsSellerOrReadOnly,
    IsTransactionParticipant,
)
from CattleTrace.api.v1.mixins import RoleScopedQuerysetMixin, SellerQuerysetMixin, SignalValidationMixin
from CattleTrace.api.v1.serializers import (
    MarketplaceInquirySerializer,
    MarketplaceListingSerializer,
    TransactionSerializer,
)
from CattleTrace.models import MarketplaceInquiry, MarketplaceListing, Transaction, User


class MarketplaceListingViewSet(SignalValidationMixin, SellerQuerysetMixin, viewsets.ModelViewSet):
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
            queryset = queryset.filter(status=MarketplaceListing.ListingStatus.ACTIVE)
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        species = self.request.query_params.get('species')
        if species:
            queryset = queryset.filter(animal__breed__name__icontains=species)
        min_price = self.request.query_params.get('min_price')
        if min_price:
            queryset = queryset.filter(asking_price__gte=min_price)
        max_price = self.request.query_params.get('max_price')
        if max_price:
            queryset = queryset.filter(asking_price__lte=max_price)
        location = self.request.query_params.get('location')
        if location:
            queryset = queryset.filter(location_county__icontains=location)
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
    filter_backends = (SearchFilter, OrderingFilter)
    search_fields = ('message', 'listing__animal__tag_number', 'listing__description')
    ordering_fields = ('sent_at', 'offer_price')
    ordering = ('-sent_at',)

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.ADMIN:
            queryset = self.queryset
        else:
            queryset = self.queryset.filter(Q(buyer=user) | Q(listing__seller=user))
        listing = self.request.query_params.get('listing')
        if listing:
            queryset = queryset.filter(listing_id=listing)
        return queryset


class TransactionViewSet(
    SignalValidationMixin,
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Transaction.objects.select_related(
        'listing',
        'listing__animal',
        'buyer',
        'seller',
    ).all()
    serializer_class = TransactionSerializer
    permission_classes = (IsAuthenticated, IsTransactionParticipant)
    filter_backends = (OrderingFilter,)
    ordering = ('-transaction_date',)

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset
        if user.role != User.Role.ADMIN:
            qs = qs.filter(Q(buyer=user) | Q(seller=user))

        payment_status = self.request.query_params.get('payment_status')
        if payment_status and payment_status != 'all':
            qs = qs.filter(payment_status=payment_status)

        return qs

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """Aggregate stats for the current user's transactions."""
        user = request.user
        qs = Transaction.objects.all()
        if user.role != User.Role.ADMIN:
            qs = qs.filter(Q(buyer=user) | Q(seller=user))

        total = qs.count()
        total_revenue = qs.filter(payment_status='paid').aggregate(
            s=Sum('agreed_price')
        )['s'] or 0
        pending = qs.filter(payment_status='pending').count()
        paid = qs.filter(payment_status='paid').count()
        failed = qs.filter(payment_status='failed').count()

        return Response({
            'total': total,
            'total_revenue': str(total_revenue),
            'pending': pending,
            'paid': paid,
            'failed': failed,
        })
