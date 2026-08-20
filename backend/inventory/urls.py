from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

router = DefaultRouter()
router.register("branches", views.BranchViewSet)
router.register("categories", views.CategoryViewSet)
router.register("products", views.ProductViewSet)
router.register("branch-stock", views.BranchStockViewSet, basename="branchstock")
router.register("stock-movements", views.StockMovementViewSet, basename="stockmovement")
router.register("suppliers", views.SupplierViewSet)
router.register("purchases", views.PurchaseViewSet)
router.register("customers", views.CustomerViewSet)
router.register("sales", views.SaleViewSet)
router.register("sale-returns", views.SaleReturnViewSet)
router.register("users", views.UserViewSet)

urlpatterns = [
    path("auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/google/", views.GoogleLoginView.as_view(), name="google_login"),
    path("auth/me/", views.MeView.as_view(), name="me"),
    path("settings/shop-profile/", views.ShopProfileView.as_view(), name="shop_profile"),
    path("dashboard/summary/", views.DashboardSummaryView.as_view(), name="dashboard_summary"),
    path("", include(router.urls)),
]
