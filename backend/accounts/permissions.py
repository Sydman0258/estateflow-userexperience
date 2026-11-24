from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsTenant(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "TENANT"
        )


class IsLandlord(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "LANDLORD"
        )


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                getattr(request.user, "role", None) == "ADMIN"
                or request.user.is_superuser
            )
        )


class IsPropertyLandlord(BasePermission):
    """
    Only the property owner or an admin can modify a property.
    """

    def has_object_permission(self, request, view, obj):

        user = request.user

        if not user or not user.is_authenticated:
            return False

        # Admins can access everything.
        if user.is_superuser or user.role == "ADMIN":
            return True

        # Allow authenticated users to read properties.
        if request.method in SAFE_METHODS:
            return True

        # Only the owning landlord can modify.
        return (
            user.role == "LANDLORD"
            and obj.landlord_id == user.id
        )