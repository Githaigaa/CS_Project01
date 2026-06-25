from rest_framework.routers import DefaultRouter

from CattleTrace.api.v1.views.animal import AnimalViewSet
from CattleTrace.api.v1.views.farm import FarmViewSet
from CattleTrace.api.v1.views.health import HealthRecordViewSet
from CattleTrace.api.v1.views.marketplace import (
    MarketplaceInquiryViewSet,
    MarketplaceListingViewSet,
    TransactionViewSet,
)
from CattleTrace.api.v1.views.movement import MovementPermitViewSet, MovementRecordViewSet
from CattleTrace.api.v1.views.slaughter import AbattoirViewSet, SlaughterRecordViewSet

router = DefaultRouter()
router.register('animals', AnimalViewSet, basename='animal')
router.register('holdings', FarmViewSet, basename='holding')
router.register('marketplace/listings', MarketplaceListingViewSet, basename='marketplace-listing')
router.register('marketplace/inquiries', MarketplaceInquiryViewSet, basename='marketplace-inquiry')
router.register('marketplace/transactions', TransactionViewSet, basename='marketplace-transaction')
router.register('health-events', HealthRecordViewSet, basename='health-event')
router.register('movements', MovementRecordViewSet, basename='movement')
router.register('movement-permits', MovementPermitViewSet, basename='movement-permit')
router.register('slaughter-records', SlaughterRecordViewSet, basename='slaughter-record')
router.register('abattoirs', AbattoirViewSet, basename='abattoir')

urlpatterns = router.urls
