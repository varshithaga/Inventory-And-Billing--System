from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import Sum
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


# ============================================================================
# 1. AUTHENTICATION & USER MANAGEMENT
# ============================================================================

class Branch(models.Model):
    """Shop/branch location (multi-branch support)."""

    name = models.CharField(max_length=150)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=15, blank=True)
    is_main = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        MANAGER = "manager", "Manager"
        STAFF = "staff", "Staff/Cashier"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STAFF)
    phone = models.CharField(max_length=15, blank=True)
    branch = models.ForeignKey(
        Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name="users"
    )

    def __str__(self):
        return self.username


class ActivityLog(models.Model):
    """Audit trail of who created/edited/deleted what."""

    class Action(models.TextChoices):
        CREATE = "create", "Create"
        UPDATE = "update", "Update"
        DELETE = "delete", "Delete"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="activity_logs"
    )
    action = models.CharField(max_length=10, choices=Action.choices)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.user} {self.action} {self.model_name}#{self.object_id}"


# ============================================================================
# 2. PRODUCT & INVENTORY MANAGEMENT
# ============================================================================

class Category(models.Model):
    """Product category / sub-category (self-referencing)."""

    name = models.CharField(max_length=100)
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="subcategories"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, unique=True)
    barcode = models.CharField(max_length=50, unique=True, blank=True, null=True)
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="products"
    )
    unit = models.CharField(max_length=20, default="pcs")  # pcs, kg, g, litre, ml, packet, box
    hsn_code = models.CharField(max_length=20, blank=True)

    purchase_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    # Cached total across all branches. BranchStock is the source of truth;
    # this column exists so list/search views don't need to join+sum it.
    # Kept in sync automatically via signals below whenever BranchStock changes
    # — never edit this field directly, always go through BranchStock/StockMovement.
    stock_quantity = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    low_stock_threshold = models.DecimalField(max_digits=12, decimal_places=2, default=5)

    image = models.ImageField(upload_to="products/", blank=True, null=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.sku})"

    @property
    def is_low_stock(self):
        return self.stock_quantity <= self.low_stock_threshold

    def recalculate_stock_quantity(self, save=True):
        """Recompute stock_quantity as the sum of all BranchStock rows for this
        product. Called automatically by the BranchStock signal below, but can
        also be called manually (e.g. from a management command / data fix)."""
        total = self.branch_stocks.aggregate(total=Sum("quantity"))["total"] or 0
        self.stock_quantity = total
        if save:
            self.save(update_fields=["stock_quantity"])
        return total


class BranchStock(models.Model):
    """Per-branch stock level for a product. Source of truth for 'how much do we have where'."""

    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name="stock_levels")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="branch_stocks")
    quantity = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    reserved_quantity = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("branch", "product")

    def __str__(self):
        return f"{self.product} @ {self.branch}: {self.quantity}"

    @property
    def available_quantity(self):
        return self.quantity - self.reserved_quantity

    @property
    def is_low_stock(self):
        return self.quantity <= self.product.low_stock_threshold


@receiver(post_save, sender=BranchStock)
@receiver(post_delete, sender=BranchStock)
def sync_product_stock_quantity(sender, instance, **kwargs):
    """Whenever a BranchStock row is created, updated, or deleted, recompute
    the cached total on the related Product so it never drifts out of sync."""
    instance.product.recalculate_stock_quantity()


class StockMovement(models.Model):
    """Full audit trail of stock in/out/adjustment, tied to the branch and the
    transaction (purchase/sale/return/etc.) that caused it.

    NOTE: Creating a StockMovement does NOT automatically update BranchStock.
    Stock changes should go through a service function (e.g. sales/services.py
    or inventory/services.py) that updates BranchStock.quantity and creates the
    matching StockMovement row together, inside one atomic transaction. This
    keeps StockMovement a pure audit log rather than a trigger source, which
    makes bulk/backfill operations safer.
    """

    class MovementType(models.TextChoices):
        IN = "in", "Stock In"
        OUT = "out", "Stock Out"
        ADJUSTMENT = "adjustment", "Adjustment"

    class ReferenceType(models.TextChoices):
        PURCHASE = "purchase", "Purchase"
        SALE = "sale", "Sale"
        SALE_RETURN = "sale_return", "Sale Return"
        ADJUSTMENT = "adjustment", "Manual Adjustment"
        OPENING_STOCK = "opening_stock", "Opening Stock"
        OTHER = "other", "Other"

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="stock_movements")
    branch = models.ForeignKey(
        Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name="stock_movements"
    )
    movement_type = models.CharField(max_length=15, choices=MovementType.choices)
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    reference_type = models.CharField(max_length=20, choices=ReferenceType.choices, blank=True)
    reference_id = models.CharField(max_length=50, blank=True)
    reference_note = models.CharField(max_length=255, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="stock_movements"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.product} {self.movement_type} {self.quantity}"


class StockTransfer(models.Model):
    """Explicit stock transfer between two branches. Modeled as its own record
    (rather than two implicit StockMovement rows) so a transfer is a single,
    traceable action — useful once you have more than one branch."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="transfers")
    from_branch = models.ForeignKey(
        Branch, on_delete=models.SET_NULL, null=True, related_name="transfers_out"
    )
    to_branch = models.ForeignKey(
        Branch, on_delete=models.SET_NULL, null=True, related_name="transfers_in"
    )
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    notes = models.CharField(max_length=255, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="stock_transfers"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.product} {self.quantity} : {self.from_branch} -> {self.to_branch}"


# ============================================================================
# 3. PURCHASE MANAGEMENT (STOCK IN)
# ============================================================================

class Supplier(models.Model):
    name = models.CharField(max_length=150)
    contact_person = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    gstin = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Purchase(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        RECEIVED = "received", "Received"
        PARTIALLY_PAID = "partially_paid", "Partially Paid"
        PAID = "paid", "Paid"
        CANCELLED = "cancelled", "Cancelled"

    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name="purchases")
    branch = models.ForeignKey(
        Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name="purchases"
    )
    invoice_number = models.CharField(max_length=50, blank=True)
    invoice_file = models.FileField(upload_to="purchase_invoices/", blank=True, null=True)
    purchase_date = models.DateField()

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance_due = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="purchases"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-purchase_date"]

    def __str__(self):
        return f"Purchase #{self.pk} - {self.supplier}"


class PurchaseItem(models.Model):
    purchase = models.ForeignKey(Purchase, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="purchase_items")
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    purchase_price = models.DecimalField(max_digits=12, decimal_places=2)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.product} x {self.quantity}"


# ============================================================================
# 4. SALES & BILLING (CORE MODULE)
# ============================================================================

class Customer(models.Model):
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    gstin = models.CharField(max_length=20, blank=True)
    state = models.CharField(max_length=100, blank=True)

    outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    loyalty_points = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Sale(models.Model):
    """A sale / bill / invoice."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft / Held"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    class PaymentMode(models.TextChoices):
        CASH = "cash", "Cash"
        UPI = "upi", "UPI"
        CARD = "card", "Card"
        CREDIT = "credit", "Credit/Due"
        SPLIT = "split", "Split Payment"

    invoice_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    customer = models.ForeignKey(
        Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name="sales"
    )
    branch = models.ForeignKey(
        Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name="sales"
    )

    status = models.CharField(max_length=15, choices=Status.choices, default=Status.DRAFT)
    payment_mode = models.CharField(max_length=15, choices=PaymentMode.choices, default=PaymentMode.CASH)

    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance_due = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    sale_date = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="sales"
    )

    class Meta:
        ordering = ["-sale_date"]

    def __str__(self):
        return self.invoice_number or f"Draft Sale #{self.pk}"


class SaleItem(models.Model):
    """Line item on a sale. GST rates/amounts are snapshotted here at sale time
    so historical invoices stay correct even if TaxRate/Product rates change later."""

    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="sale_items")
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    taxable_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    cgst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    sgst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    igst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    cgst_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    sgst_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    igst_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.product} x {self.quantity}"


class Payment(models.Model):
    """Supports split payments — a sale can have multiple payment rows."""

    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name="payments")
    mode = models.CharField(max_length=15, choices=Sale.PaymentMode.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reference_number = models.CharField(max_length=100, blank=True)
    paid_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sale} - {self.mode} - {self.amount}"


class SaleReturn(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name="returns")
    reason = models.TextField(blank=True)
    total_refund_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="sale_returns"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Return for {self.sale}"


class SaleReturnItem(models.Model):
    sale_return = models.ForeignKey(SaleReturn, on_delete=models.CASCADE, related_name="items")
    sale_item = models.ForeignKey(SaleItem, on_delete=models.PROTECT, related_name="return_items")
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    refund_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.sale_item} x {self.quantity}"


# ============================================================================
# 5. GST / TAX HANDLING
# ============================================================================

class TaxRate(models.Model):
    """Configurable tax rate presets (e.g. GST 5%, 12%, 18%)."""

    name = models.CharField(max_length=50)
    cgst_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    sgst_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    igst_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return self.name


# ============================================================================
# 6. INVOICE / PDF GENERATION
# ============================================================================

class InvoiceDocument(models.Model):
    """Generated PDF/receipt for a sale, plus delivery status."""

    sale = models.OneToOneField(Sale, on_delete=models.CASCADE, related_name="invoice_document")
    pdf_file = models.FileField(upload_to="invoices/", blank=True, null=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    emailed_at = models.DateTimeField(null=True, blank=True)
    whatsapp_sent_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Invoice for {self.sale}"


# ============================================================================
# 7 & 8. SUPPLIER PAYMENTS (PAYABLES TRACKING)
# Customer model lives in section 4 (Sales & Billing) since Sale depends on it;
# Supplier model lives in section 3 (Purchase Management) for the same reason.
# ============================================================================

class SupplierPayment(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name="payments")
    purchase = models.ForeignKey(
        Purchase, on_delete=models.SET_NULL, null=True, blank=True, related_name="payments"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    mode = models.CharField(max_length=15, choices=Sale.PaymentMode.choices)
    reference_number = models.CharField(max_length=100, blank=True)
    paid_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="supplier_payments"
    )

    def __str__(self):
        return f"{self.supplier} - {self.amount}"


# ============================================================================
# 10. SETTINGS / ADMIN PANEL
# ============================================================================

class ShopProfile(models.Model):
    """Singleton-style shop configuration used on invoices and settings screens."""

    name = models.CharField(max_length=150)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    gstin = models.CharField(max_length=20, blank=True)
    logo = models.ImageField(upload_to="shop/", blank=True, null=True)

    invoice_prefix = models.CharField(max_length=10, default="INV")
    invoice_next_number = models.PositiveIntegerField(default=1)
    tax_inclusive_pricing = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


# ============================================================================
# 11. NOTIFICATIONS
# ============================================================================

class Notification(models.Model):
    class NotificationType(models.TextChoices):
        LOW_STOCK = "low_stock", "Low Stock Alert"
        PAYMENT_DUE = "payment_due", "Payment Due Reminder"
        DAILY_SUMMARY = "daily_summary", "Daily Sales Summary"
        OTHER = "other", "Other"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name="notifications"
    )
    notification_type = models.CharField(max_length=20, choices=NotificationType.choices)
    title = models.CharField(max_length=200)
    message = models.TextField(blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


# ============================================================================
# 12. MULTI-BRANCH SUPPORT
# Branch model lives at the top of section 1 since User references it.
# Per-branch stock levels are handled by BranchStock in section 2, since it
# depends on Product. StockTransfer (also section 2) handles moving stock
# between branches as an explicit, traceable action.
# ============================================================================