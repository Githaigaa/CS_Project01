"""
Role-based permission classes for the CattleTrace API.

Use these as `permission_classes` on future ViewSets and APIViews.
Default project-wide permission remains IsAuthenticated (see settings).
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS

from CattleTrace.models import User


class HasRole(BasePermission):
    """Allow access when the authenticated user's role is in allowed_roles."""

    allowed_roles: tuple[str, ...] = ()

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in self.allowed_roles


class IsFarmer(HasRole):
    allowed_roles = (User.Role.FARMER,)


class IsVet(HasRole):
    allowed_roles = (User.Role.VET,)


class IsInspector(HasRole):
    allowed_roles = (User.Role.INSPECTOR,)


class IsBuyer(HasRole):
    allowed_roles = (User.Role.BUYER,)


class IsAbattoir(HasRole):
    allowed_roles = (User.Role.ABATTOIR,)


class IsPlatformAdmin(HasRole):
    allowed_roles = (User.Role.ADMIN,)


class IsStaffRole(HasRole):
    """Inspectors, vets, and platform admins."""

    allowed_roles = (
        User.Role.VET,
        User.Role.INSPECTOR,
        User.Role.ADMIN,
    )


class IsVerifiedUser(BasePermission):
    """Require an authenticated user with is_verified=True."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_verified
        )


class IsOwnerOrReadOnly(BasePermission):
    """Object-level: write access only for obj.owner == request.user."""

    owner_field = 'owner'

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        owner = getattr(obj, self.owner_field, None)
        return owner == request.user


class IsAnimalOwnerOrStaff(BasePermission):
    """Read for owner/staff; write for owner or platform admin."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        staff_roles = (
            User.Role.ADMIN,
            User.Role.INSPECTOR,
            User.Role.VET,
        )
        if request.method in SAFE_METHODS:
            return obj.current_owner_id == user.id or user.role in staff_roles
        return obj.current_owner_id == user.id or user.role == User.Role.ADMIN


class IsSellerOrReadOnly(BasePermission):
    """Marketplace listing write access for seller only."""

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.seller_id == request.user.id or request.user.role == User.Role.ADMIN


class IsInquiryParticipant(BasePermission):
    """Inquiry readable by buyer or listing seller."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        return obj.buyer_id == user.id or obj.listing.seller_id == user.id or user.role == User.Role.ADMIN


class IsTransactionParticipant(BasePermission):
    """Transaction readable by buyer or seller."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        return (
            obj.buyer_id == user.id
            or obj.seller_id == user.id
            or user.role == User.Role.ADMIN
        )


class IsHealthRecordAuthorized(BasePermission):
    """Health records: owner read; vet/staff write; vet/staff/admin read all."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        staff_roles = (User.Role.VET, User.Role.INSPECTOR, User.Role.ADMIN)
        if request.method in SAFE_METHODS:
            return (
                obj.animal.current_owner_id == user.id
                or user.role in staff_roles
            )
        return user.role in staff_roles or obj.animal.current_owner_id == user.id


class IsMovementAuthorized(BasePermission):
    """Movement records: owner or staff."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        staff_roles = (User.Role.INSPECTOR, User.Role.ADMIN)
        if request.method in SAFE_METHODS:
            return obj.animal.current_owner_id == user.id or user.role in staff_roles
        return obj.animal.current_owner_id == user.id or user.role in staff_roles


class IsSlaughterAuthorized(BasePermission):
    """Slaughter records: abattoir role, inspector, admin, or animal owner read."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        staff_roles = (User.Role.ABATTOIR, User.Role.INSPECTOR, User.Role.ADMIN)
        if request.method in SAFE_METHODS:
            return obj.animal.current_owner_id == user.id or user.role in staff_roles
        return user.role in staff_roles

