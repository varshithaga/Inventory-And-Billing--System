from rest_framework import permissions


class IsAdminOrManager(permissions.BasePermission):
    """Read access for any authenticated user; write access only for Admin/Manager roles."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_superuser or user.role in (user.Role.ADMIN, user.Role.MANAGER))
        )
