from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Access allowed only for superusers or users with role 'admin'."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_superuser or user.role == getattr(user.Role, "ADMIN", "admin"))
        )


class IsAdminOrManager(permissions.BasePermission):
    """Access allowed for Admin or Manager roles."""

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_superuser:
            return True
        return user.role in (getattr(user.Role, "ADMIN", "admin"), getattr(user.Role, "MANAGER", "manager"))


class IsAdminOrManagerOrReadOnly(permissions.BasePermission):
    """Read access for any authenticated user; write access only for Admin/Manager roles."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        if user.is_superuser:
            return True
        return user.role in (getattr(user.Role, "ADMIN", "admin"), getattr(user.Role, "MANAGER", "manager"))
