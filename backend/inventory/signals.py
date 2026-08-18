from django.db.models import F
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import BranchStock, Product, SaleReturnItem, StockMovement


@receiver(post_save, sender=SaleReturnItem)
def restock_on_sale_return(sender, instance, created, **kwargs):
    """A returned item must go back into stock — create the StockMovement and
    bump BranchStock/Product.stock_quantity to match, instead of only
    recording the refund financially."""
    if not created:
        return

    sale_return = instance.sale_return
    sale = sale_return.sale
    product = instance.sale_item.product

    StockMovement.objects.create(
        product=product,
        branch=sale.branch,
        movement_type=StockMovement.MovementType.IN,
        quantity=instance.quantity,
        reference_type=StockMovement.ReferenceType.SALE_RETURN,
        reference_id=str(sale_return.pk),
        created_by=sale_return.created_by,
    )

    if sale.branch_id:
        branch_stock, _ = BranchStock.objects.get_or_create(branch=sale.branch, product=product)
        branch_stock.quantity = F("quantity") + instance.quantity
        branch_stock.save(update_fields=["quantity"])

    Product.objects.filter(pk=product.pk).update(stock_quantity=F("stock_quantity") + instance.quantity)
