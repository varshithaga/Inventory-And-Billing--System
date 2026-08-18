import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet

from .models import ShopProfile


def build_invoice_pdf(sale):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=20 * mm, bottomMargin=20 * mm)
    styles = getSampleStyleSheet()
    elements = []

    shop = ShopProfile.objects.first()
    shop_name = shop.name if shop else "My Shop"
    shop_address = shop.address if shop else ""
    shop_gstin = shop.gstin if shop else ""

    elements.append(Paragraph(f"<b>{shop_name}</b>", styles["Title"]))
    if shop_address:
        elements.append(Paragraph(shop_address, styles["Normal"]))
    if shop_gstin:
        elements.append(Paragraph(f"GSTIN: {shop_gstin}", styles["Normal"]))
    elements.append(Spacer(1, 10 * mm))

    elements.append(Paragraph(f"<b>Invoice: {sale.invoice_number or sale.pk}</b>", styles["Heading2"]))
    elements.append(Paragraph(f"Date: {sale.sale_date.strftime('%d-%m-%Y %H:%M')}", styles["Normal"]))
    if sale.customer:
        elements.append(Paragraph(f"Bill To: {sale.customer.name} ({sale.customer.phone})", styles["Normal"]))
    else:
        elements.append(Paragraph("Bill To: Walk-in Customer", styles["Normal"]))
    elements.append(Spacer(1, 6 * mm))

    table_data = [["Product", "Qty", "Unit Price", "CGST", "SGST", "Total"]]
    for item in sale.items.all():
        table_data.append([
            item.product.name,
            f"{item.quantity}",
            f"{item.unit_price:.2f}",
            f"{item.cgst_amount:.2f}",
            f"{item.sgst_amount:.2f}",
            f"{item.total_amount:.2f}",
        ])

    table = Table(table_data, colWidths=[60 * mm, 20 * mm, 25 * mm, 20 * mm, 20 * mm, 25 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 8 * mm))

    summary_data = [
        ["Subtotal", f"{sale.subtotal:.2f}"],
        ["Discount", f"{sale.discount_amount:.2f}"],
        ["Tax (GST)", f"{sale.tax_amount:.2f}"],
        ["Total", f"{sale.total_amount:.2f}"],
        ["Amount Paid", f"{sale.amount_paid:.2f}"],
        ["Balance Due", f"{sale.balance_due:.2f}"],
    ]
    summary_table = Table(summary_data, colWidths=[40 * mm, 30 * mm], hAlign="RIGHT")
    summary_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("LINEABOVE", (0, 3), (-1, 3), 0.5, colors.grey),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 8 * mm))
    elements.append(Paragraph(f"Payment Mode: {sale.get_payment_mode_display()}", styles["Normal"]))
    elements.append(Paragraph("Thank you for your business!", styles["Italic"]))

    doc.build(elements)
    buffer.seek(0)
    return buffer
