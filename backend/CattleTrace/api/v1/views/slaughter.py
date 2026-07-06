"""Slaughter record API viewsets."""

from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS
from rest_framework.permissions import BasePermission
from rest_framework.response import Response

from CattleTrace.api.permissions import IsSlaughterAuthorized
from CattleTrace.api.v1.mixins import AnimalRelatedQuerysetMixin
from CattleTrace.api.v1.serializers import AbattoirSerializer, SlaughterRecordSerializer
from CattleTrace.api.v1.serializers.animal import AnimalSerializer
from CattleTrace.models import Abattoir, Animal, SlaughterRecord, User


class IsAbattoirWriteAuthorized(BasePermission):
    """Anyone authenticated may read abattoirs; only admin/abattoir role may write."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role in (User.Role.ADMIN, User.Role.ABATTOIR)


class AbattoirViewSet(viewsets.ModelViewSet):
    serializer_class = AbattoirSerializer
    permission_classes = (IsAuthenticated, IsAbattoirWriteAuthorized)
    filter_backends = (OrderingFilter,)
    ordering = ('name',)

    def get_queryset(self):
        # Admins/abattoir operators can see inactive ones too (for management)
        if self.request.user.role in (User.Role.ADMIN, User.Role.ABATTOIR):
            return Abattoir.objects.all()
        return Abattoir.objects.filter(is_active=True)


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

    @action(detail=True, methods=['post'], url_path='accept')
    def accept(self, request, pk=None):
        """Mark a slaughter record as inspector-verified (sets inspector to current user)."""
        record = self.get_object()
        allowed = (User.Role.INSPECTOR, User.Role.ABATTOIR, User.Role.ADMIN)
        if request.user.role not in allowed:
            return Response(
                {'detail': 'Only inspectors and abattoir staff may verify records.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        record.inspector = request.user
        record.save(update_fields=['inspector'])
        serializer = self.get_serializer(record)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """Aggregate stats — not limited to the current page."""
        from django.utils import timezone
        import datetime

        today = timezone.now().date()
        week_ago = today - datetime.timedelta(days=7)
        month_start = today.replace(day=1)

        qs = SlaughterRecord.objects.all()
        total = qs.count()
        this_week = qs.filter(slaughter_date__gte=week_ago).count()
        today_count = qs.filter(slaughter_date=today).count()
        verified = qs.filter(inspector__isnull=False).count()
        this_month = qs.filter(slaughter_date__gte=month_start).count()

        return Response({
            'total': total,
            'this_week': this_week,
            'today': today_count,
            'this_month': this_month,
            'verified': verified,
            'compliance_rate': round((verified / total * 100), 1) if total else 0,
        })
