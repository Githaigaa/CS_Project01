"""DVS Officer specific API views — disease trace, county census, CAHW management."""

from django.db.models import Count, Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from CattleTrace.models import Animal, Farm, MovementRecord, User


def _is_dvs_or_admin(user):
    return user.role in (User.Role.DVS, User.Role.INSPECTOR, User.Role.ADMIN)


class DiseaseTraceReportView(APIView):
    """
    GET /dvs/disease-trace/?holding_id=<id>&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
    Returns all animals that were present at the specified holding within the date range.
    """
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        if not _is_dvs_or_admin(request.user):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        holding_id = request.query_params.get('holding_id')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        if not holding_id:
            return Response({'detail': 'holding_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            farm = Farm.objects.get(pk=holding_id)
        except Farm.DoesNotExist:
            return Response({'detail': 'Holding not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Animals currently on this farm
        current_animals = Animal.objects.filter(current_farm=farm).values(
            'tag_number', 'rfid_tag', 'status', 'date_of_birth'
        )

        # Animals that arrived at this farm during the date range via movement record
        movements_qs = MovementRecord.objects.filter(destination_farm=farm)
        if date_from:
            movements_qs = movements_qs.filter(move_date__gte=date_from)
        if date_to:
            movements_qs = movements_qs.filter(move_date__lte=date_to)

        movement_animals = movements_qs.select_related('animal').values(
            'animal__tag_number', 'animal__rfid_tag', 'animal__status', 'move_date', 'purpose'
        )

        return Response({
            'holding': {'id': farm.id, 'name': farm.name, 'county': farm.county},
            'date_from': date_from,
            'date_to': date_to,
            'current_animals': list(current_animals),
            'movement_animals': list(movement_animals),
            'total_current': current_animals.count(),
            'total_movements': movement_animals.count(),
        })


class CountyCensusView(APIView):
    """
    GET /dvs/county-census/?county=<name>
    Returns active animal counts by species for the county.
    """
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        if not _is_dvs_or_admin(request.user):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        county = request.query_params.get('county', '')

        farms_qs = Farm.objects.all()
        if county:
            farms_qs = farms_qs.filter(county__iexact=county)

        farm_ids = farms_qs.values_list('id', flat=True)
        animals_qs = Animal.objects.filter(current_farm__in=farm_ids)

        total = animals_qs.count()
        alive = animals_qs.filter(status=Animal.Status.ALIVE).count()
        stolen = animals_qs.filter(status=Animal.Status.STOLEN).count()
        quarantined = animals_qs.filter(status=Animal.Status.QUARANTINED).count()
        restricted_holdings = farms_qs.filter(is_restricted=True).count()

        return Response({
            'county': county or 'All counties',
            'total_animals': total,
            'alive': alive,
            'stolen': stolen,
            'quarantined': quarantined,
            'total_holdings': farms_qs.count(),
            'restricted_holdings': restricted_holdings,
        })


class CAHWManagementView(APIView):
    """
    GET  /dvs/cahws/           — list CAHWs in the DVS officer's county
    POST /dvs/cahws/<id>/verify/ — verify a CAHW account
    """
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        if not _is_dvs_or_admin(request.user):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        county = getattr(request.user, 'county_zone', '')
        cahws = User.objects.filter(role=User.Role.CAHW)
        if county:
            cahws = cahws.filter(Q(county_zone__iexact=county) | Q(location__icontains=county))

        data = [
            {
                'id': u.id,
                'username': u.username,
                'name': u.get_full_name() or u.username,
                'email': u.email,
                'phone': u.phone_number,
                'county_zone': u.county_zone,
                'is_cahw_verified': u.is_cahw_verified,
                'date_joined': u.date_joined,
            }
            for u in cahws
        ]
        return Response({'count': len(data), 'results': data})


class CAHWVerifyView(APIView):
    """POST /dvs/cahws/<pk>/verify/ — verify or unverify a CAHW."""
    permission_classes = (IsAuthenticated,)

    def post(self, request, pk=None):
        if not _is_dvs_or_admin(request.user):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            cahw = User.objects.get(pk=pk, role=User.Role.CAHW)
        except User.DoesNotExist:
            return Response({'detail': 'CAHW not found.'}, status=status.HTTP_404_NOT_FOUND)

        verify = request.data.get('verify', True)
        cahw.is_cahw_verified = bool(verify)
        cahw.save(update_fields=['is_cahw_verified'])

        action_word = 'verified' if cahw.is_cahw_verified else 'unverified'
        return Response({'detail': f"CAHW {cahw.get_full_name() or cahw.username} has been {action_word}."})
