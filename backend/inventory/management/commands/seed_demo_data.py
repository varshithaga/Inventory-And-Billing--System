import random
import uuid
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from inventory.models import (
    ActivityLog,
    Branch,
    BranchStock,
    Category,
    Customer,
    InvoiceDocument,
    Notification,
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
    StockTransfer,
    Supplier,
    SupplierPayment,
    TaxRate,
    User,
)

TWOPLACES = Decimal("0.01")


def d(value):
    return Decimal(str(value)).quantize(TWOPLACES)


CATEGORY_NAMES = [
    "Groceries & Staples",
    "Beverages",
    "Dairy & Bakery",
    "Snacks & Namkeen",
    "Personal Care",
    "Household Essentials",
    "Stationery & Office",
]

# (name, category, unit, hsn, purchase_price, selling_price, gst_rate, low_stock_threshold, sku)
# sku="" demonstrates the auto-generated-SKU path.
PRODUCTS = [
    ("Tata Salt 1kg", "Groceries & Staples", "pcs", "2501", 18, 22, 5, 20, "GRC-001"),
    ("Fortune Sunflower Oil 1L", "Groceries & Staples", "pcs", "1512", 118, 135, 5, 15, "GRC-002"),
    ("India Gate Basmati Rice 5kg", "Groceries & Staples", "pcs", "1006", 480, 560, 5, 10, "GRC-003"),
    ("Toor Dal", "Groceries & Staples", "kg", "0713", 130, 150, 5, 15, "GRC-004"),
    ("Aashirvaad Atta 5kg", "Groceries & Staples", "pcs", "1101", 220, 255, 5, 12, "GRC-005"),
    ("Coca-Cola 750ml", "Beverages", "pcs", "2202", 32, 40, 12, 24, "BEV-001"),
    ("Tata Tea Gold 1kg", "Beverages", "pcs", "0902", 480, 540, 5, 10, "BEV-002"),
    ("Nescafe Classic Coffee 200g", "Beverages", "pcs", "2101", 320, 360, 12, 8, "BEV-003"),
    ("Real Mixed Fruit Juice 1L", "Beverages", "pcs", "2009", 95, 115, 12, 12, "BEV-004"),
    ("Amul Gold Milk 1L", "Dairy & Bakery", "pcs", "0401", 62, 68, 5, 25, "DBK-001"),
    ("Amul Butter 500g", "Dairy & Bakery", "pcs", "0405", 240, 265, 12, 10, "DBK-002"),
    ("Britannia Brown Bread 400g", "Dairy & Bakery", "pcs", "1905", 42, 50, 5, 15, "DBK-003"),
    ("Britannia Cheese Slices 200g", "Dairy & Bakery", "pcs", "0406", 105, 125, 12, 10, "DBK-004"),
    ("Lay's Classic Salted 90g", "Snacks & Namkeen", "pcs", "1905", 18, 20, 12, 30, "SNK-001"),
    ("Haldiram's Aloo Bhujia 400g", "Snacks & Namkeen", "pcs", "2106", 85, 100, 12, 12, "SNK-002"),
    ("Parle-G Biscuits 800g", "Snacks & Namkeen", "pcs", "1905", 65, 75, 18, 20, "SNK-003"),
    ("Colgate Strong Teeth 200g", "Personal Care", "pcs", "3306", 85, 99, 18, 15, "PC-001"),
    ("Dove Soap 100g (Pack of 3)", "Personal Care", "pcs", "3401", 130, 150, 18, 10, "PC-002"),
    ("Head & Shoulders Shampoo 340ml", "Personal Care", "pcs", "3305", 270, 310, 18, 8, "PC-003"),
    ("Vim Dishwash Bar (Pack of 3)", "Household Essentials", "pcs", "3401", 45, 55, 18, 15, "HH-001"),
    ("Surf Excel Detergent 1kg", "Household Essentials", "pcs", "3402", 135, 155, 18, 10, "HH-002"),
    ("Harpic Toilet Cleaner 1L", "Household Essentials", "pcs", "3808", 145, 168, 18, 10, "HH-003"),
    ("Classmate Notebook 200 Pages", "Stationery & Office", "pcs", "4820", 45, 55, 12, 20, ""),
    ("Cello Gel Pen (Pack of 5)", "Stationery & Office", "pcs", "9608", 60, 75, 12, 15, ""),
]

SUPPLIERS = [
    ("FreshFarm Distributors", "Rajesh Kumar", "9845012345", "sales@freshfarm.example.com", "27AAFCF1234K1Z5", "Plot 14, APMC Yard, Bengaluru, Karnataka 560003"),
    ("Metro Wholesale Traders", "Suresh Iyer", "9845023456", "orders@metrowholesale.example.com", "29AABCM5678L1Z2", "Peenya Industrial Area, Bengaluru, Karnataka 560058"),
    ("Sunrise FMCG Suppliers", "Anita Desai", "9845034567", "anita@sunrisefmcg.example.com", "29AAECS9012M1Z8", "Yeshwanthpur Wholesale Market, Bengaluru, Karnataka 560022"),
    ("National Dairy Co.", "Manoj Pillai", "9845045678", "manoj@nationaldairy.example.com", "29AAFCN3456N1Z1", "KR Puram Industrial Layout, Bengaluru, Karnataka 560036"),
    ("Om Stationery House", "Kavita Rao", "9845056789", "kavita@omstationery.example.com", "29AABCO7890P1Z4", "Chickpet Main Road, Bengaluru, Karnataka 560053"),
]

CUSTOMERS = [
    ("Ramesh Gowda", "9900112233", "ramesh.gowda@example.com", "", "Karnataka", 0),
    ("Priya Sharma", "9900112244", "priya.sharma@example.com", "", "Karnataka", 40),
    ("Arjun Reddy", "9900112255", "arjun.reddy@example.com", "", "Telangana", 15),
    ("Sneha Patil", "9900112266", "sneha.patil@example.com", "", "Karnataka", 0),
    ("Vikram Singh", "9900112277", "vikram.singh@example.com", "29VIKRM1234S1Z9", "Karnataka", 60),
    ("Divya Menon", "9900112288", "divya.menon@example.com", "", "Kerala", 10),
    ("Karthik Iyer", "9900112299", "karthik.iyer@example.com", "", "Tamil Nadu", 0),
    ("Lakshmi Nair", "9900112300", "lakshmi.nair@example.com", "", "Karnataka", 25),
    ("Aditya Verma", "9900112311", "aditya.verma@example.com", "27ADVRM5678T1Z3", "Maharashtra", 5),
    ("Meera Krishnan", "9900112322", "meera.krishnan@example.com", "", "Karnataka", 0),
]


class Command(BaseCommand):
    help = (
        "Wipe transactional/business data (products, categories, customers, suppliers, "
        "purchases, sales, stock, notifications, etc.) and reseed it with realistic demo "
        "data. Existing User accounts and the ShopProfile are left untouched."
    )

    def handle(self, *args, **options):
        with transaction.atomic():
            self._wipe()
            main_branch = self._seed_branches()
            User.objects.filter(branch__isnull=True).update(branch=main_branch)
            categories = self._seed_categories()
            products = self._seed_products(categories)
            self._seed_tax_rates()
            suppliers = self._seed_suppliers()
            admin_user = User.objects.filter(is_superuser=True).first() or User.objects.first()
            self._seed_purchases(suppliers, products, main_branch, admin_user)
            customers = self._seed_customers()
            self._seed_sales(customers, products, main_branch, admin_user)
            self._force_low_stock(products, main_branch, admin_user)
            self._seed_notifications(products, customers)

        self.stdout.write(self.style.SUCCESS(
            "Demo data seeded: 3 branches, 7 categories, 24 products, 5 suppliers, "
            "8 purchases, 10 customers, 20 sales."
        ))

    # -- wipe -----------------------------------------------------------

    def _wipe(self):
        SaleReturnItem.objects.all().delete()
        SaleReturn.objects.all().delete()
        Payment.objects.all().delete()
        InvoiceDocument.objects.all().delete()
        SaleItem.objects.all().delete()
        Sale.objects.all().delete()
        SupplierPayment.objects.all().delete()
        PurchaseItem.objects.all().delete()
        Purchase.objects.all().delete()
        StockTransfer.objects.all().delete()
        StockMovement.objects.all().delete()
        BranchStock.objects.all().delete()
        Product.objects.all().delete()
        Category.objects.all().delete()
        Supplier.objects.all().delete()
        Customer.objects.all().delete()
        Notification.objects.all().delete()
        TaxRate.objects.all().delete()
        ActivityLog.objects.all().delete()
        Branch.objects.all().delete()

    # -- seeding: reference data -----------------------------------------

    def _seed_branches(self):
        main = Branch.objects.create(
            name="Main Branch - MG Road", is_main=True,
            address="12 MG Road, Bengaluru, Karnataka 560001", phone="080-41234567",
        )
        Branch.objects.create(
            name="Koramangala Outlet",
            address="5th Block, Koramangala, Bengaluru, Karnataka 560095", phone="080-41234568",
        )
        Branch.objects.create(
            name="Whitefield Outlet",
            address="ITPL Main Road, Whitefield, Bengaluru, Karnataka 560066", phone="080-41234569",
        )
        return main

    def _seed_categories(self):
        return {name: Category.objects.create(name=name) for name in CATEGORY_NAMES}

    def _seed_products(self, categories):
        products = []
        for name, cat, unit, hsn, purchase_price, selling_price, gst_rate, threshold, sku in PRODUCTS:
            # Mirrors ProductSerializer's auto-generate-if-blank behavior, since
            # we're going through the ORM directly here rather than the serializer.
            resolved_sku = sku or f"SKU-{uuid.uuid4().hex[:8].upper()}"
            products.append(Product.objects.create(
                name=name, sku=resolved_sku, category=categories[cat], unit=unit, hsn_code=hsn,
                purchase_price=d(purchase_price), selling_price=d(selling_price),
                gst_rate=d(gst_rate), low_stock_threshold=d(threshold),
            ))
        return products

    def _seed_tax_rates(self):
        for name, rate, is_default in [("GST 5%", 5, False), ("GST 12%", 12, False), ("GST 18%", 18, True), ("GST 28%", 28, False)]:
            TaxRate.objects.create(
                name=name, cgst_percent=d(rate / 2), sgst_percent=d(rate / 2), is_default=is_default,
            )

    def _seed_suppliers(self):
        return [
            Supplier.objects.create(name=n, contact_person=c, phone=p, email=e, gstin=g, address=a)
            for n, c, p, e, g, a in SUPPLIERS
        ]

    def _seed_customers(self):
        customers = []
        for name, phone, email, gstin, state, loyalty in CUSTOMERS:
            customers.append(Customer.objects.create(
                name=name, phone=phone, email=email, gstin=gstin, state=state,
                address=f"{random.randint(1, 200)} {state} Residency, {state}",
                loyalty_points=loyalty,
            ))
        return customers

    # -- seeding: purchases (stocks the shelves) -------------------------

    def _create_purchase(self, supplier, branch, purchase_date, items, user, status, paid_fraction=Decimal("1")):
        subtotal = Decimal("0")
        tax_amount = Decimal("0")
        for item in items:
            line_subtotal = item["quantity"] * item["purchase_price"]
            subtotal += line_subtotal
            tax_amount += line_subtotal * item["gst_rate"] / Decimal("100")
        total_amount = d(subtotal + tax_amount)
        amount_paid = d(total_amount * paid_fraction)

        purchase = Purchase.objects.create(
            supplier=supplier, branch=branch,
            invoice_number=f"PO-{supplier.id:02d}{purchase_date.strftime('%m%d')}{random.randint(10, 99)}",
            purchase_date=purchase_date, status=status,
            subtotal=d(subtotal), tax_amount=d(tax_amount), total_amount=total_amount,
            amount_paid=amount_paid, balance_due=d(total_amount - amount_paid), created_by=user,
        )
        for item in items:
            PurchaseItem.objects.create(
                purchase=purchase, product=item["product"], quantity=item["quantity"],
                purchase_price=item["purchase_price"], gst_rate=item["gst_rate"],
            )
            Product.objects.filter(pk=item["product"].pk).update(stock_quantity=F("stock_quantity") + item["quantity"])
            branch_stock, _ = BranchStock.objects.get_or_create(branch=branch, product=item["product"])
            branch_stock.quantity = F("quantity") + item["quantity"]
            branch_stock.save(update_fields=["quantity"])
            StockMovement.objects.create(
                product=item["product"], branch=branch, movement_type=StockMovement.MovementType.IN,
                quantity=item["quantity"], unit_cost=item["purchase_price"],
                reference_type=StockMovement.ReferenceType.PURCHASE, reference_id=str(purchase.pk), created_by=user,
            )
        if amount_paid > 0:
            SupplierPayment.objects.create(
                supplier=supplier, purchase=purchase, amount=amount_paid, mode=Sale.PaymentMode.CASH, created_by=user,
            )
        return purchase

    def _seed_purchases(self, suppliers, products, branch, user):
        today = timezone.localdate()
        # Spread 24 products across 8 purchase orders, ~3 items each, over the last 6 weeks.
        chunks = [products[i:i + 3] for i in range(0, len(products), 3)]
        statuses = [Purchase.Status.PAID, Purchase.Status.PAID, Purchase.Status.RECEIVED, Purchase.Status.PARTIALLY_PAID]
        for i, chunk in enumerate(chunks):
            supplier = suppliers[i % len(suppliers)]
            purchase_date = today - timezone.timedelta(days=random.randint(5, 42))
            status = statuses[i % len(statuses)]
            paid_fraction = Decimal("1") if status == Purchase.Status.PAID else (
                Decimal("0") if status == Purchase.Status.RECEIVED else Decimal("0.5")
            )
            items = []
            for product in chunk:
                qty = d(random.randint(30, 80) if product.unit == "pcs" else random.randint(15, 35))
                items.append({
                    "product": product, "quantity": qty,
                    "purchase_price": product.purchase_price, "gst_rate": product.gst_rate,
                })
            self._create_purchase(supplier, branch, purchase_date, items, user, status, paid_fraction)

    # -- seeding: sales (draws down the shelves) -------------------------

    def _create_sale(self, customer, branch, sale_date, items, payments, user, status, invoice_number, sale_discount=Decimal("0")):
        subtotal = Decimal("0")
        tax_amount = Decimal("0")
        prepared = []
        for item in items:
            product = item["product"]
            quantity = item["quantity"]
            unit_price = item["unit_price"]
            taxable_amount = quantity * unit_price
            gst_rate = product.gst_rate
            half_rate = gst_rate / Decimal("2")
            cgst_amount = taxable_amount * half_rate / Decimal("100")
            sgst_amount = taxable_amount * half_rate / Decimal("100")
            line_total = d(taxable_amount + cgst_amount + sgst_amount)

            subtotal += taxable_amount
            tax_amount += cgst_amount + sgst_amount
            prepared.append({
                "product": product, "quantity": quantity, "unit_price": unit_price,
                "discount_amount": Decimal("0"), "taxable_amount": d(taxable_amount),
                "cgst_rate": half_rate, "sgst_rate": half_rate,
                "cgst_amount": d(cgst_amount), "sgst_amount": d(sgst_amount), "total_amount": line_total,
            })

        total_amount = d(subtotal - sale_discount + tax_amount)
        amount_paid = d(sum((p["amount"] for p in payments), Decimal("0"))) if status == Sale.Status.COMPLETED else Decimal("0")
        payment_mode = (
            Sale.PaymentMode.SPLIT if len(payments) > 1 else
            (payments[0]["mode"] if payments else Sale.PaymentMode.CASH)
        )

        sale = Sale.objects.create(
            invoice_number=invoice_number, customer=customer, branch=branch, status=status,
            payment_mode=payment_mode, subtotal=d(subtotal), discount_amount=d(sale_discount),
            tax_amount=d(tax_amount), total_amount=total_amount,
            amount_paid=amount_paid, balance_due=d(total_amount - amount_paid), created_by=user,
        )
        Sale.objects.filter(pk=sale.pk).update(sale_date=sale_date)

        for item in prepared:
            SaleItem.objects.create(sale=sale, **item)
            if status == Sale.Status.COMPLETED:
                Product.objects.filter(pk=item["product"].pk).update(stock_quantity=F("stock_quantity") - item["quantity"])
                branch_stock, _ = BranchStock.objects.get_or_create(branch=branch, product=item["product"])
                branch_stock.quantity = F("quantity") - item["quantity"]
                branch_stock.save(update_fields=["quantity"])
                StockMovement.objects.create(
                    product=item["product"], branch=branch, movement_type=StockMovement.MovementType.OUT,
                    quantity=item["quantity"], reference_type=StockMovement.ReferenceType.SALE,
                    reference_id=str(sale.pk), created_by=user,
                )

        for p in payments:
            payment = Payment.objects.create(sale=sale, mode=p["mode"], amount=p["amount"])
            Payment.objects.filter(pk=payment.pk).update(paid_at=sale_date)

        if status == Sale.Status.COMPLETED and amount_paid < total_amount and customer:
            Customer.objects.filter(pk=customer.pk).update(
                outstanding_balance=F("outstanding_balance") + (total_amount - amount_paid)
            )
        return sale

    def _seed_sales(self, customers, products, branch, user):
        shop_profile, _ = ShopProfile.objects.get_or_create(pk=1, defaults={"name": "My Shop"})
        invoice_counter = shop_profile.invoice_next_number
        now = timezone.now()

        # Track running stock so sales never oversell what purchases stocked.
        available = {p.id: p.stock_quantity for p in Product.objects.filter(id__in=[p.id for p in products])}

        plans = [
            # (days_ago, status, payment modes/split, has_discount)
            (0, Sale.Status.COMPLETED, ["upi"], False),
            (0, Sale.Status.COMPLETED, ["cash"], False),
            (0, Sale.Status.COMPLETED, ["card"], True),
            (1, Sale.Status.COMPLETED, ["cash"], False),
            (1, Sale.Status.COMPLETED, ["upi"], False),
            (2, Sale.Status.COMPLETED, ["credit"], False),
            (2, Sale.Status.COMPLETED, ["cash", "upi"], False),
            (3, Sale.Status.COMPLETED, ["card"], False),
            (4, Sale.Status.COMPLETED, ["upi"], False),
            (5, Sale.Status.COMPLETED, ["cash"], True),
            (6, Sale.Status.COMPLETED, ["credit"], False),
            (8, Sale.Status.COMPLETED, ["upi"], False),
            (10, Sale.Status.COMPLETED, ["cash"], False),
            (12, Sale.Status.COMPLETED, ["card"], False),
            (15, Sale.Status.COMPLETED, ["cash", "credit"], False),
            (18, Sale.Status.COMPLETED, ["upi"], True),
            (22, Sale.Status.COMPLETED, ["cash"], False),
            (28, Sale.Status.COMPLETED, ["card"], False),
            (0, Sale.Status.DRAFT, [], False),
            (1, Sale.Status.DRAFT, [], False),
            (3, Sale.Status.DRAFT, [], False),
            (7, Sale.Status.CANCELLED, [], False),
        ]

        for days_ago, status, modes, has_discount in plans:
            sale_date = now - timezone.timedelta(days=days_ago, hours=random.randint(0, 10), minutes=random.randint(0, 59))
            customer = random.choice(customers + [None, None])  # occasional walk-in
            candidates = [p for p in products if available.get(p.id, 0) > 1]
            if not candidates:
                continue
            item_count = random.randint(1, 3)
            chosen = random.sample(candidates, k=min(item_count, len(candidates)))

            items = []
            for product in chosen:
                max_qty = min(int(available[product.id]), 5)
                if max_qty < 1:
                    continue
                qty = d(random.randint(1, max_qty))
                available[product.id] -= qty
                items.append({"product": product, "quantity": qty, "unit_price": product.selling_price})
            if not items:
                continue

            invoice_number = None
            payments = []
            if status == Sale.Status.COMPLETED:
                invoice_number = f"{shop_profile.invoice_prefix}-{invoice_counter:05d}"
                invoice_counter += 1
                line_total_estimate = sum(i["quantity"] * i["unit_price"] for i in items)
                if len(modes) == 1 and modes[0] != "credit":
                    payments = [{"mode": modes[0], "amount": d(line_total_estimate * Decimal("1.1"))}]
                elif len(modes) == 1 and modes[0] == "credit":
                    payments = [{"mode": "cash", "amount": d(line_total_estimate * Decimal("0.4"))}]
                elif len(modes) == 2 and "credit" in modes:
                    other = [m for m in modes if m != "credit"][0]
                    payments = [{"mode": other, "amount": d(line_total_estimate * Decimal("0.5"))}]
                elif len(modes) == 2:
                    half = d(line_total_estimate * Decimal("0.6"))
                    payments = [{"mode": modes[0], "amount": half}, {"mode": modes[1], "amount": d(line_total_estimate + half)}]

            discount = d(sum(i["quantity"] * i["unit_price"] for i in items) * Decimal("0.03")) if has_discount else Decimal("0")
            self._create_sale(customer, branch, sale_date, items, payments, user, status, invoice_number, discount)

        ShopProfile.objects.filter(pk=shop_profile.pk).update(invoice_next_number=invoice_counter)

    # -- final touches ----------------------------------------------------

    def _force_low_stock(self, products, branch, user):
        """Guarantee a couple of products sit below their low-stock threshold,
        so the dashboard's low-stock widget has something to show."""
        for product in random.sample(products, k=2):
            product.refresh_from_db()
            threshold = product.low_stock_threshold
            if product.stock_quantity <= threshold:
                continue
            writeoff = d(product.stock_quantity - threshold + Decimal("2"))
            Product.objects.filter(pk=product.pk).update(stock_quantity=F("stock_quantity") - writeoff)
            branch_stock = BranchStock.objects.filter(branch=branch, product=product).first()
            if branch_stock:
                BranchStock.objects.filter(pk=branch_stock.pk).update(quantity=F("quantity") - writeoff)
            StockMovement.objects.create(
                product=product, branch=branch, movement_type=StockMovement.MovementType.ADJUSTMENT,
                quantity=writeoff, reference_type=StockMovement.ReferenceType.ADJUSTMENT,
                reference_note="Demo data: damaged stock write-off", created_by=user,
            )

    def _seed_notifications(self, products, customers):
        low_stock_products = [p for p in products if Product.objects.get(pk=p.pk).is_low_stock][:3]
        for product in low_stock_products:
            Notification.objects.create(
                notification_type=Notification.NotificationType.LOW_STOCK,
                title=f"Low stock: {product.name}",
                message=f"{product.name} is at {product.stock_quantity} {product.unit}, below the threshold of {product.low_stock_threshold}.",
                is_read=False,
            )
        indebted = [c for c in customers if c.outstanding_balance and Customer.objects.get(pk=c.pk).outstanding_balance > 0][:2]
        for customer in indebted:
            fresh = Customer.objects.get(pk=customer.pk)
            Notification.objects.create(
                notification_type=Notification.NotificationType.PAYMENT_DUE,
                title=f"Payment due: {fresh.name}",
                message=f"{fresh.name} has an outstanding balance of Rs. {fresh.outstanding_balance}.",
                is_read=random.choice([True, False]),
            )
        Notification.objects.create(
            notification_type=Notification.NotificationType.DAILY_SUMMARY,
            title="Daily sales summary",
            message="Yesterday's sales summary is ready to review on the dashboard.",
            is_read=True,
        )
