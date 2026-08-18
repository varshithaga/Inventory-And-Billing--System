from decimal import Decimal

from django.db import transaction
from django.db.models import F
from rest_framework import serializers

from .models import (
    Branch,
    BranchStock,
    Category,
    Customer,
    Payment,
    Product,
    Purchase,
    PurchaseItem,
    Sale,
    SaleItem,
    SaleReturn,
    SaleReturnItem,
    ShopProfile,
    StockMovement,
    Supplier,
    User,
)


# ============================================================================
# AUTH / USERS
# ============================================================================

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "phone", "role", "branch"]
        read_only_fields = ["id", "role"]


# ============================================================================
# PRODUCTS & INVENTORY
# ============================================================================

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ["id", "name", "address", "phone", "is_main"]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "parent"]


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "name", "sku", "barcode", "category", "category_name", "unit", "hsn_code",
            "purchase_price", "selling_price", "gst_rate",
            "stock_quantity", "low_stock_threshold", "is_low_stock",
            "image", "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "stock_quantity", "created_at", "updated_at"]


class BranchStockSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = BranchStock
        fields = ["id", "branch", "branch_name", "product", "product_name", "quantity", "reserved_quantity"]


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            "id", "product", "product_name", "branch", "movement_type", "quantity", "unit_cost",
            "reference_type", "reference_id", "reference_note", "created_by", "created_at",
        ]
        read_only_fields = ["id", "created_by", "created_at"]


# ============================================================================
# PURCHASES / SUPPLIERS
# ============================================================================

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ["id", "name", "contact_person", "phone", "email", "address", "gstin", "created_at"]


class PurchaseItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = PurchaseItem
        fields = ["id", "product", "product_name", "quantity", "purchase_price", "gst_rate"]


class PurchaseSerializer(serializers.ModelSerializer):
    items = PurchaseItemSerializer(many=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)

    class Meta:
        model = Purchase
        fields = [
            "id", "supplier", "supplier_name", "branch", "invoice_number", "invoice_file", "purchase_date",
            "status", "subtotal", "discount_amount", "tax_amount", "total_amount",
            "amount_paid", "balance_due", "created_by", "created_at", "items",
        ]
        read_only_fields = [
            "id", "subtotal", "tax_amount", "total_amount", "balance_due", "created_by", "created_at",
        ]

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("A purchase needs at least one item.")
        return items

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        request = self.context["request"]
        branch = validated_data.get("branch") or Branch.objects.filter(is_main=True).first()
        validated_data["branch"] = branch
        validated_data["created_by"] = request.user

        subtotal = Decimal("0")
        tax_amount = Decimal("0")
        for item in items_data:
            line_subtotal = item["quantity"] * item["purchase_price"]
            subtotal += line_subtotal
            tax_amount += line_subtotal * item.get("gst_rate", Decimal("0")) / Decimal("100")

        discount_amount = validated_data.get("discount_amount", Decimal("0"))
        total_amount = subtotal + tax_amount - discount_amount
        amount_paid = validated_data.get("amount_paid", Decimal("0"))

        validated_data["subtotal"] = subtotal
        validated_data["tax_amount"] = tax_amount
        validated_data["total_amount"] = total_amount
        validated_data["balance_due"] = total_amount - amount_paid
        if validated_data.get("status") in (None, Purchase.Status.DRAFT):
            validated_data["status"] = (
                Purchase.Status.PAID if amount_paid >= total_amount and total_amount > 0
                else Purchase.Status.RECEIVED
            )

        purchase = Purchase.objects.create(**validated_data)

        for item in items_data:
            purchase_item = PurchaseItem.objects.create(purchase=purchase, **item)
            product = purchase_item.product

            Product.objects.filter(pk=product.pk).update(
                stock_quantity=F("stock_quantity") + purchase_item.quantity
            )
            if branch:
                branch_stock, _ = BranchStock.objects.get_or_create(branch=branch, product=product)
                branch_stock.quantity = F("quantity") + purchase_item.quantity
                branch_stock.save(update_fields=["quantity"])

            StockMovement.objects.create(
                product=product,
                branch=branch,
                movement_type=StockMovement.MovementType.IN,
                quantity=purchase_item.quantity,
                unit_cost=purchase_item.purchase_price,
                reference_type=StockMovement.ReferenceType.PURCHASE,
                reference_id=str(purchase.pk),
                created_by=request.user,
            )

        return purchase


# ============================================================================
# CUSTOMERS
# ============================================================================

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            "id", "name", "phone", "email", "address", "gstin", "state",
            "outstanding_balance", "loyalty_points", "created_at",
        ]
        read_only_fields = ["id", "outstanding_balance", "created_at"]


# ============================================================================
# SALES & BILLING
# ============================================================================

class SaleItemInputSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    quantity = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0.01"))
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    discount_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, default=Decimal("0"))


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = SaleItem
        fields = [
            "id", "product", "product_name", "quantity", "unit_price", "discount_amount", "taxable_amount",
            "cgst_rate", "sgst_rate", "igst_rate", "cgst_amount", "sgst_amount", "igst_amount", "total_amount",
        ]


class PaymentInputSerializer(serializers.Serializer):
    mode = serializers.ChoiceField(choices=Sale.PaymentMode.choices)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0.01"))
    reference_number = serializers.CharField(required=False, allow_blank=True, default="")


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "mode", "amount", "reference_number", "paid_at"]


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    items_input = SaleItemInputSerializer(many=True, write_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    payments_input = PaymentInputSerializer(many=True, write_only=True, required=False)
    customer_name = serializers.CharField(source="customer.name", read_only=True, default=None)

    class Meta:
        model = Sale
        fields = [
            "id", "invoice_number", "customer", "customer_name", "branch", "status", "payment_mode",
            "subtotal", "discount_percent", "discount_amount", "tax_amount", "total_amount",
            "amount_paid", "balance_due", "sale_date", "created_by",
            "items", "items_input", "payments", "payments_input",
        ]
        read_only_fields = [
            "id", "invoice_number", "subtotal", "tax_amount", "total_amount",
            "amount_paid", "balance_due", "sale_date", "created_by",
        ]

    def validate_items_input(self, items):
        if not items:
            raise serializers.ValidationError("A sale needs at least one item.")
        return items

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items_input")
        payments_data = validated_data.pop("payments_input", [])
        request = self.context["request"]

        branch = validated_data.get("branch") or Branch.objects.filter(is_main=True).first()
        validated_data["branch"] = branch
        validated_data["created_by"] = request.user
        status = validated_data.get("status", Sale.Status.COMPLETED)
        validated_data["status"] = status

        subtotal = Decimal("0")
        tax_amount = Decimal("0")
        prepared_items = []
        for item in items_data:
            product = item["product"]
            quantity = item["quantity"]
            unit_price = item.get("unit_price") or product.selling_price
            discount_amount = item.get("discount_amount") or Decimal("0")

            if status == Sale.Status.COMPLETED:
                available = product.stock_quantity
                if branch:
                    branch_stock = BranchStock.objects.filter(branch=branch, product=product).first()
                    available = branch_stock.available_quantity if branch_stock else Decimal("0")
                if quantity > available:
                    raise serializers.ValidationError(
                        {"items_input": f"Insufficient stock for {product.name}: available {available}, requested {quantity}"}
                    )

            taxable_amount = (quantity * unit_price) - discount_amount
            gst_rate = product.gst_rate
            cgst_rate = sgst_rate = gst_rate / Decimal("2")
            cgst_amount = taxable_amount * cgst_rate / Decimal("100")
            sgst_amount = taxable_amount * sgst_rate / Decimal("100")
            line_total = taxable_amount + cgst_amount + sgst_amount

            subtotal += quantity * unit_price
            tax_amount += cgst_amount + sgst_amount

            prepared_items.append({
                "product": product,
                "quantity": quantity,
                "unit_price": unit_price,
                "discount_amount": discount_amount,
                "taxable_amount": taxable_amount,
                "cgst_rate": cgst_rate,
                "sgst_rate": sgst_rate,
                "igst_rate": Decimal("0"),
                "cgst_amount": cgst_amount,
                "sgst_amount": sgst_amount,
                "igst_amount": Decimal("0"),
                "total_amount": line_total,
            })

        discount_amount = validated_data.get("discount_amount", Decimal("0"))
        total_amount = subtotal - discount_amount + tax_amount
        amount_paid = sum((p["amount"] for p in payments_data), Decimal("0"))
        validated_data.update({
            "subtotal": subtotal,
            "tax_amount": tax_amount,
            "total_amount": total_amount,
            "amount_paid": amount_paid,
            "balance_due": total_amount - amount_paid,
        })
        if status == Sale.Status.COMPLETED and not validated_data.get("invoice_number"):
            validated_data["invoice_number"] = self._next_invoice_number()

        sale = Sale.objects.create(**validated_data)

        for item in prepared_items:
            SaleItem.objects.create(sale=sale, **item)
            if status == Sale.Status.COMPLETED:
                product = item["product"]
                Product.objects.filter(pk=product.pk).update(
                    stock_quantity=F("stock_quantity") - item["quantity"]
                )
                if branch:
                    branch_stock, _ = BranchStock.objects.get_or_create(branch=branch, product=product)
                    branch_stock.quantity = F("quantity") - item["quantity"]
                    branch_stock.save(update_fields=["quantity"])
                StockMovement.objects.create(
                    product=product,
                    branch=branch,
                    movement_type=StockMovement.MovementType.OUT,
                    quantity=item["quantity"],
                    reference_type=StockMovement.ReferenceType.SALE,
                    reference_id=str(sale.pk),
                    created_by=request.user,
                )

        for payment in payments_data:
            Payment.objects.create(sale=sale, **payment)

        return sale

    @staticmethod
    def _next_invoice_number():
        profile, _ = ShopProfile.objects.get_or_create(pk=1, defaults={"name": "My Shop"})
        number = profile.invoice_next_number
        profile.invoice_next_number = F("invoice_next_number") + 1
        profile.save(update_fields=["invoice_next_number"])
        return f"{profile.invoice_prefix}-{number:05d}"


class SaleReturnItemInputSerializer(serializers.Serializer):
    sale_item = serializers.PrimaryKeyRelatedField(queryset=SaleItem.objects.all())
    quantity = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0.01"))


class SaleReturnItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleReturnItem
        fields = ["id", "sale_item", "quantity", "refund_amount"]


class SaleReturnSerializer(serializers.ModelSerializer):
    items = SaleReturnItemSerializer(many=True, read_only=True)
    items_input = SaleReturnItemInputSerializer(many=True, write_only=True)

    class Meta:
        model = SaleReturn
        fields = ["id", "sale", "reason", "total_refund_amount", "created_by", "created_at", "items", "items_input"]
        read_only_fields = ["id", "total_refund_amount", "created_by", "created_at"]

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items_input")
        request = self.context["request"]
        validated_data["created_by"] = request.user

        total_refund = Decimal("0")
        for item in items_data:
            sale_item = item["sale_item"]
            unit_price = sale_item.unit_price
            total_refund += unit_price * item["quantity"]
        validated_data["total_refund_amount"] = total_refund

        sale_return = SaleReturn.objects.create(**validated_data)
        for item in items_data:
            sale_item = item["sale_item"]
            refund_amount = sale_item.unit_price * item["quantity"]
            SaleReturnItem.objects.create(
                sale_return=sale_return, sale_item=sale_item,
                quantity=item["quantity"], refund_amount=refund_amount,
            )
        return sale_return


# ============================================================================
# SETTINGS
# ============================================================================

class ShopProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopProfile
        fields = [
            "id", "name", "address", "phone", "email", "gstin", "logo",
            "invoice_prefix", "invoice_next_number", "tax_inclusive_pricing",
        ]
