from datetime import timedelta

from django.conf import settings
from django.http import FileResponse
from django.utils import timezone
from django.db.models import Sum, Count, F, Q
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Branch,
    BranchStock,
    Category,
    Customer,
    Product,
    Purchase,
    Sale,
    SaleItem,
    SaleReturn,
    ShopProfile,
    StockMovement,
    Supplier,
    User,
)
from .permissions import IsAdminOrManager
from .pdf import build_invoice_pdf
from .serializers import (
    BranchSerializer,
    BranchStockSerializer,
    CategorySerializer,
    CustomerSerializer,
    ProductSerializer,
    PurchaseSerializer,
    SaleReturnSerializer,
    SaleSerializer,
    ShopProfileSerializer,
    StockMovementSerializer,
    SupplierSerializer,
    UserSerializer,
)


# ============================================================================
# AUTH & USERS
# ============================================================================

class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class GoogleLoginView(APIView):
    """Exchange a Google Identity Services ID token for this app's own JWT
    pair. The frontend never talks to Google's token endpoint directly — it
    just gets an ID token from the "Sign in with Google" widget and posts it
    here. We verify the token's signature/audience with Google, find-or-create
    the matching User, and hand back the same {access, refresh} shape as
    /auth/login/, so the rest of the app (refresh, auth headers) is unchanged.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        credential = request.data.get("credential")
        if not credential:
            return Response({"detail": "Missing Google credential."}, status=status.HTTP_400_BAD_REQUEST)
        if not settings.GOOGLE_OAUTH_CLIENT_ID:
            return Response(
                {"detail": "Google sign-in is not configured on the server."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            payload = google_id_token.verify_oauth2_token(
                credential, google_requests.Request(), settings.GOOGLE_OAUTH_CLIENT_ID
            )
        except ValueError:
            return Response({"detail": "Invalid Google credential."}, status=status.HTTP_401_UNAUTHORIZED)

        email = payload.get("email")
        if not email or not payload.get("email_verified"):
            return Response(
                {"detail": "Google account has no verified email address."}, status=status.HTTP_401_UNAUTHORIZED
            )

        user, created = User.objects.get_or_create(
            username=email,
            defaults={
                "email": email,
                "first_name": payload.get("given_name", ""),
                "last_name": payload.get("family_name", ""),
            },
        )
        if created:
            user.set_unusable_password()
            user.save(update_fields=["password"])

        refresh = RefreshToken.for_user(user)
        return Response({"access": str(refresh.access_token), "refresh": str(refresh)})


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related("branch").all().order_by("-date_joined")
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrManager]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get("search")
        role = self.request.query_params.get("role")
        branch = self.request.query_params.get("branch")
        is_active = self.request.query_params.get("is_active")

        if search:
            qs = qs.filter(
                Q(username__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(email__icontains=search)
                | Q(phone__icontains=search)
            )
        if role:
            qs = qs.filter(role=role)
        if branch:
            qs = qs.filter(branch_id=branch)
        if is_active is not None and is_active != "":
            qs = qs.filter(is_active=is_active.lower() == "true")

        return qs


# ============================================================================
# PRODUCTS & INVENTORY
# ============================================================================

class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsAdminOrManager]


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrManager]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related("category").all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrManager]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(name__icontains=search) | qs.filter(sku__icontains=search) | qs.filter(barcode__icontains=search)
        if self.request.query_params.get("low_stock") == "true":
            qs = qs.filter(stock_quantity__lte=F("low_stock_threshold"))
        return qs.order_by("name")


class BranchStockViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BranchStock.objects.select_related("product", "branch").all()
    serializer_class = BranchStockSerializer
    permission_classes = [permissions.IsAuthenticated]


class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockMovement.objects.select_related("product").order_by("-created_at").all()
    serializer_class = StockMovementSerializer
    permission_classes = [permissions.IsAuthenticated]


# ============================================================================
# PURCHASES / SUPPLIERS
# ============================================================================

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by("name")
    serializer_class = SupplierSerializer
    permission_classes = [IsAdminOrManager]


class PurchaseViewSet(viewsets.ModelViewSet):
    queryset = Purchase.objects.select_related("supplier").prefetch_related("items").order_by("-purchase_date")
    serializer_class = PurchaseSerializer
    permission_classes = [IsAdminOrManager]


# ============================================================================
# CUSTOMERS
# ============================================================================

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by("name")
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(name__icontains=search) | qs.filter(phone__icontains=search)
        return qs


# ============================================================================
# SALES & BILLING
# ============================================================================

class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.select_related("customer", "branch").prefetch_related("items", "payments").order_by("-sale_date")
    serializer_class = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    @action(detail=True, methods=["get"], url_path="invoice")
    def invoice(self, request, pk=None):
        sale = self.get_object()
        buffer = build_invoice_pdf(sale)
        filename = f"{sale.invoice_number or sale.pk}.pdf"
        return FileResponse(buffer, as_attachment=True, filename=filename, content_type="application/pdf")


class SaleReturnViewSet(viewsets.ModelViewSet):
    queryset = SaleReturn.objects.select_related("sale").prefetch_related("items").order_by("-created_at")
    serializer_class = SaleReturnSerializer
    permission_classes = [permissions.IsAuthenticated]


# ============================================================================
# SETTINGS
# ============================================================================

class ShopProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ShopProfileSerializer
    permission_classes = [IsAdminOrManager]

    def get_object(self):
        profile, _ = ShopProfile.objects.get_or_create(pk=1, defaults={"name": "My Shop"})
        return profile


# ============================================================================
# DASHBOARD
# ============================================================================

class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        now = timezone.localtime()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        month_start = today_start.replace(day=1)

        completed_sales = Sale.objects.filter(status=Sale.Status.COMPLETED)

        today_qs = completed_sales.filter(sale_date__gte=today_start)
        month_qs = completed_sales.filter(sale_date__gte=month_start)

        today_totals = today_qs.aggregate(total=Sum("total_amount"), count=Count("id"))
        month_totals = month_qs.aggregate(total=Sum("total_amount"), count=Count("id"))

        payment_breakdown = list(
            today_qs.values("payment_mode").annotate(total=Sum("total_amount")).order_by("-total")
        )

        low_stock_products = Product.objects.filter(
            is_active=True, stock_quantity__lte=F("low_stock_threshold")
        ).order_by("stock_quantity")[:10]

        top_products = (
            SaleItem.objects.filter(sale__status=Sale.Status.COMPLETED, sale__sale_date__gte=month_start)
            .values("product__id", "product__name")
            .annotate(quantity_sold=Sum("quantity"), revenue=Sum("total_amount"))
            .order_by("-quantity_sold")[:5]
        )

        recent_sales = completed_sales.order_by("-sale_date")[:5]

        return Response({
            "today": {
                "total_sales": today_totals["total"] or 0,
                "sales_count": today_totals["count"] or 0,
                "payment_breakdown": payment_breakdown,
            },
            "month": {
                "total_sales": month_totals["total"] or 0,
                "sales_count": month_totals["count"] or 0,
            },
            "low_stock_products": [
                {
                    "id": p.id, "name": p.name, "sku": p.sku,
                    "stock_quantity": p.stock_quantity, "low_stock_threshold": p.low_stock_threshold,
                }
                for p in low_stock_products
            ],
            "top_products": list(top_products),
            "recent_sales": [
                {
                    "id": s.id, "invoice_number": s.invoice_number,
                    "customer": s.customer.name if s.customer else "Walk-in",
                    "total_amount": s.total_amount, "sale_date": s.sale_date,
                }
                for s in recent_sales
            ],
        })
