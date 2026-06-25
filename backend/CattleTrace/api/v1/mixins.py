"""Shared queryset and auth helpers for API v1 viewsets."""

from CattleTrace.models import User


class RoleScopedQuerysetMixin:
    """Filter list querysets by role; staff roles see all records."""

    staff_roles = (
        User.Role.ADMIN,
        User.Role.INSPECTOR,
        User.Role.VET,
    )
    owner_field = 'current_owner'

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            return queryset.none()
        if user.role in self.staff_roles:
            return queryset
        if user.role == User.Role.FARMER:
            return queryset.filter(**{self.owner_field: user})
        if user.role == User.Role.BUYER and self.allow_buyer_read:
            return queryset
        return queryset.none()


class AnimalRelatedQuerysetMixin(RoleScopedQuerysetMixin):
    owner_field = 'animal__current_owner'
    allow_buyer_read = False


class SellerQuerysetMixin(RoleScopedQuerysetMixin):
    owner_field = 'seller'
    allow_buyer_read = True

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.is_authenticated and user.role == User.Role.BUYER:
            return queryset.filter(status='active')
        return queryset
