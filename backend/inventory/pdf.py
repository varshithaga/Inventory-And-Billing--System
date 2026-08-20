import io

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from .models import ShopProfile

# Brand palette — matches the frontend's violet/indigo theme. Kept as plain
# "#rrggbb" strings (not just Color objects) because reportlab's inline
# <font color="..."> paragraph markup wants that literal format.
BRAND_DARK_HEX = "#2e1065"
BRAND_HEX = "#7c3aed"
BRAND_LIGHT_HEX = "#f5f3ff"
BRAND_BORDER_HEX = "#ddd6fe"
TEXT_DARK_HEX = "#1e1b2e"
TEXT_MUTED_HEX = "#6b6280"
DUE_RED_HEX = "#dc2626"
PAID_GREEN_HEX = "#059669"
ZEBRA_HEX = "#faf9ff"

BRAND_DARK = colors.HexColor(BRAND_DARK_HEX)
BRAND = colors.HexColor(BRAND_HEX)
BRAND_LIGHT = colors.HexColor(BRAND_LIGHT_HEX)
BRAND_BORDER = colors.HexColor(BRAND_BORDER_HEX)
TEXT_DARK = colors.HexColor(TEXT_DARK_HEX)
TEXT_MUTED = colors.HexColor(TEXT_MUTED_HEX)
DUE_RED = colors.HexColor(DUE_RED_HEX)
PAID_GREEN = colors.HexColor(PAID_GREEN_HEX)
ZEBRA = colors.HexColor(ZEBRA_HEX)


def _styles():
    base = getSampleStyleSheet()
    return {
        "shop_name": ParagraphStyle(
            "ShopName", parent=base["Title"], textColor=colors.white, fontSize=20,
            leading=24, alignment=TA_CENTER, spaceAfter=2,
        ),
        "shop_meta": ParagraphStyle(
            "ShopMeta", parent=base["Normal"], textColor=colors.whitesmoke, fontSize=9,
            leading=12, alignment=TA_CENTER,
        ),
        "invoice_badge": ParagraphStyle(
            "InvoiceBadge", parent=base["Normal"], textColor=colors.white, fontSize=11,
            leading=14, alignment=TA_CENTER, fontName="Helvetica-Bold",
        ),
        "section_label": ParagraphStyle(
            "SectionLabel", parent=base["Normal"], textColor=BRAND, fontSize=8.5,
            leading=11, fontName="Helvetica-Bold", spaceAfter=3,
        ),
        "body": ParagraphStyle(
            "Body", parent=base["Normal"], textColor=TEXT_DARK, fontSize=9.5, leading=13,
        ),
        "body_muted": ParagraphStyle(
            "BodyMuted", parent=base["Normal"], textColor=TEXT_MUTED, fontSize=8.5, leading=12,
        ),
        "meta_label": ParagraphStyle(
            "MetaLabel", parent=base["Normal"], textColor=TEXT_MUTED, fontSize=8, leading=11,
            alignment=TA_RIGHT,
        ),
        "meta_value": ParagraphStyle(
            "MetaValue", parent=base["Normal"], textColor=TEXT_DARK, fontSize=9.5, leading=13,
            alignment=TA_RIGHT, fontName="Helvetica-Bold",
        ),
        "footer": ParagraphStyle(
            "Footer", parent=base["Normal"], textColor=TEXT_MUTED, fontSize=8.5, leading=12,
            alignment=TA_CENTER,
        ),
        "thanks": ParagraphStyle(
            "Thanks", parent=base["Normal"], textColor=BRAND, fontSize=11, leading=14,
            alignment=TA_CENTER, fontName="Helvetica-Bold",
        ),
    }


def _money(value):
    return f"Rs. {value:,.2f}"


def build_invoice_pdf(sale):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        topMargin=0, bottomMargin=18 * mm, leftMargin=16 * mm, rightMargin=16 * mm,
    )
    styles = _styles()
    elements = []

    shop = ShopProfile.objects.first()
    shop_name = shop.name if shop else "My Shop"
    shop_address = shop.address if shop else ""
    shop_phone = shop.phone if shop else ""
    shop_email = shop.email if shop else ""
    shop_gstin = shop.gstin if shop else ""

    # -- Header band -----------------------------------------------------
    contact_bits = [b for b in [shop_phone, shop_email] if b]
    header_cell = [Paragraph(f"<b>{shop_name}</b>", styles["shop_name"])]
    if shop_address:
        header_cell.append(Paragraph(shop_address, styles["shop_meta"]))
    meta_line = " &nbsp;|&nbsp; ".join(contact_bits + ([f"GSTIN: {shop_gstin}"] if shop_gstin else []))
    if meta_line:
        header_cell.append(Paragraph(meta_line, styles["shop_meta"]))
    header_cell.append(Spacer(1, 3 * mm))
    header_cell.append(Paragraph("TAX INVOICE", styles["invoice_badge"]))

    header_table = Table([[header_cell]], colWidths=[doc.width])
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BRAND_DARK),
        ("TOPPADDING", (0, 0), (-1, -1), 12 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10 * mm),
        ("LEFTPADDING", (0, 0), (-1, -1), 16 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 16 * mm),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 8 * mm))

    # -- Invoice meta + Bill To -------------------------------------------
    status_color_hex = PAID_GREEN_HEX if sale.status == sale.Status.COMPLETED else TEXT_MUTED_HEX
    bill_to_lines = [Paragraph("BILL TO", styles["section_label"])]
    if sale.customer:
        bill_to_lines.append(Paragraph(f"<b>{sale.customer.name}</b>", styles["body"]))
        if sale.customer.phone:
            bill_to_lines.append(Paragraph(sale.customer.phone, styles["body_muted"]))
        if sale.customer.address:
            bill_to_lines.append(Paragraph(sale.customer.address, styles["body_muted"]))
        if sale.customer.gstin:
            bill_to_lines.append(Paragraph(f"GSTIN: {sale.customer.gstin}", styles["body_muted"]))
    else:
        bill_to_lines.append(Paragraph("<b>Walk-in Customer</b>", styles["body"]))

    meta_rows = [
        [Paragraph("Invoice #", styles["meta_label"]), Paragraph(sale.invoice_number or str(sale.pk), styles["meta_value"])],
        [Paragraph("Date", styles["meta_label"]), Paragraph(sale.sale_date.strftime("%d %b %Y, %I:%M %p"), styles["meta_value"])],
        [Paragraph("Payment Mode", styles["meta_label"]), Paragraph(sale.get_payment_mode_display(), styles["meta_value"])],
        [Paragraph("Status", styles["meta_label"]), Paragraph(
            f'<font color="{status_color_hex}"><b>{sale.get_status_display()}</b></font>', styles["meta_value"]
        )],
    ]
    meta_table = Table(meta_rows, colWidths=[28 * mm, 40 * mm])
    meta_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
    ]))

    info_row = Table(
        [[bill_to_lines, meta_table]],
        colWidths=[doc.width - 68 * mm, 68 * mm],
    )
    info_row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (0, 0), BRAND_LIGHT),
        ("BOX", (0, 0), (0, 0), 0.75, BRAND_BORDER),
        ("LEFTPADDING", (0, 0), (0, 0), 4 * mm),
        ("RIGHTPADDING", (0, 0), (0, 0), 4 * mm),
        ("TOPPADDING", (0, 0), (0, 0), 3.5 * mm),
        ("BOTTOMPADDING", (0, 0), (0, 0), 3.5 * mm),
        ("LEFTPADDING", (1, 0), (1, 0), 6 * mm),
    ]))
    elements.append(info_row)
    elements.append(Spacer(1, 7 * mm))

    # -- Line items --------------------------------------------------------
    header_style = ParagraphStyle("ItemHeader", fontName="Helvetica-Bold", fontSize=8.5, textColor=colors.white)
    table_data = [[
        Paragraph("Item", header_style), Paragraph("Qty", header_style), Paragraph("Unit Price", header_style),
        Paragraph("CGST", header_style), Paragraph("SGST", header_style), Paragraph("Amount", header_style),
    ]]
    for item in sale.items.all():
        table_data.append([
            Paragraph(item.product.name, styles["body"]),
            Paragraph(f"{item.quantity}", styles["body"]),
            Paragraph(_money(item.unit_price), styles["body"]),
            Paragraph(_money(item.cgst_amount), styles["body"]),
            Paragraph(_money(item.sgst_amount), styles["body"]),
            Paragraph(f"<b>{_money(item.total_amount)}</b>", styles["body"]),
        ])

    table = Table(
        table_data,
        colWidths=[doc.width - 108 * mm, 12 * mm, 23 * mm, 24 * mm, 24 * mm, 25 * mm],
        repeatRows=1,
    )
    row_styles = [
        ("BACKGROUND", (0, 0), (-1, 0), BRAND),
        ("TOPPADDING", (0, 0), (-1, 0), 3 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 3 * mm),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 1), (-1, -1), 2.5 * mm),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 2.5 * mm),
        ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
        ("LINEBELOW", (0, 0), (-1, 0), 0, BRAND),
        ("LINEBELOW", (0, 1), (-1, -2), 0.4, BRAND_BORDER),
        ("LINEBELOW", (0, -1), (-1, -1), 0.75, BRAND),
    ]
    for i in range(1, len(table_data)):
        if i % 2 == 0:
            row_styles.append(("BACKGROUND", (0, i), (-1, i), ZEBRA))
    table.setStyle(TableStyle(row_styles))
    elements.append(table)
    elements.append(Spacer(1, 6 * mm))

    # -- Totals summary ------------------------------------------------------
    def _row(label, value, bold=False, color_hex=TEXT_DARK_HEX):
        style = "Helvetica-Bold" if bold else "Helvetica"
        return [
            Paragraph(f'<font color="{TEXT_MUTED_HEX}">{label}</font>', styles["body"]),
            Paragraph(f'<font name="{style}" color="{color_hex}">{_money(value)}</font>', styles["meta_value"]),
        ]

    summary_data = [
        _row("Subtotal", sale.subtotal),
        _row("Discount", -sale.discount_amount if sale.discount_amount else 0),
        _row("Tax (GST)", sale.tax_amount),
    ]
    summary_table = Table(summary_data, colWidths=[35 * mm, 35 * mm], hAlign="RIGHT")
    summary_table.setStyle(TableStyle([
        ("TOPPADDING", (0, 0), (-1, -1), 1.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 2 * mm))

    total_table = Table(
        [[Paragraph('<font color="white"><b>TOTAL</b></font>', styles["body"]),
          Paragraph(f'<font color="white"><b>{_money(sale.total_amount)}</b></font>', styles["meta_value"])]],
        colWidths=[35 * mm, 35 * mm], hAlign="RIGHT",
    )
    total_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BRAND_DARK),
        ("TOPPADDING", (0, 0), (-1, -1), 2.5 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5 * mm),
        ("LEFTPADDING", (0, 0), (0, 0), 3 * mm),
        ("RIGHTPADDING", (-1, 0), (-1, 0), 3 * mm),
    ]))
    elements.append(total_table)
    elements.append(Spacer(1, 2 * mm))

    paid_due_data = [_row("Amount Paid", sale.amount_paid, color_hex=PAID_GREEN_HEX)]
    if sale.balance_due and sale.balance_due > 0:
        paid_due_data.append(_row("Balance Due", sale.balance_due, bold=True, color_hex=DUE_RED_HEX))
    paid_due_table = Table(paid_due_data, colWidths=[35 * mm, 35 * mm], hAlign="RIGHT")
    paid_due_table.setStyle(TableStyle([
        ("TOPPADDING", (0, 0), (-1, -1), 1.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5),
    ]))
    elements.append(paid_due_table)
    elements.append(Spacer(1, 10 * mm))

    # -- Footer -------------------------------------------------------------
    elements.append(HRFlowable(width="100%", thickness=0.5, color=BRAND_BORDER))
    elements.append(Spacer(1, 4 * mm))
    elements.append(Paragraph("Thank you for your business!", styles["thanks"]))
    elements.append(Paragraph(
        "This is a computer-generated invoice and does not require a signature.", styles["footer"]
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer
