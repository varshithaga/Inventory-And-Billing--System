# -*- coding: utf-8 -*-
"""Generate docs/demo.svg : an animated walkthrough of the Inventory & Billing System.
Scenes and figures mirror the real app running on the `seed_demo_data` dataset.
Stdlib only.  Regenerate with:  python docs/gen_demo.py
"""
import html, io, os

W, H = 1000, 712
CX0, CY0, CX1, CY1 = 20, 62, 980, 648          # clipped content area
SIDE_W = 208
MAIN_X = CX0 + SIDE_W

SANS = "'Segoe UI', system-ui, sans-serif"
MONO = "'JetBrains Mono', Consolas, ui-monospace, monospace"

INK, INKL = "#241640", "#6b5b8f"
ACCENT, DEEP = "#7c3aed", "#4c1d95"
BG, CARD, LINE = "#f5f1fe", "#ffffff", "#e7ddf8"
ROWALT = "#faf7ff"
BRIGHT = "#d8b4fe"
GOOD, WARN = "#047857", "#be123c"


def esc(s):
    return html.escape(str(s), quote=True)


def T(x, y, s, txt, fill=INK, weight=None, anchor=None, family=None, ls=None, opacity=None, inner=""):
    a = f' text-anchor="{anchor}"' if anchor else ""
    w = f' font-weight="{weight}"' if weight else ""
    fam = f' font-family="{family}"' if family else ""
    l = f' letter-spacing="{ls}"' if ls else ""
    o = f' opacity="{opacity}"' if opacity is not None else ""
    return f'<text x="{x}" y="{y}" font-size="{s}" fill="{fill}"{w}{a}{fam}{l}{o}>{esc(txt)}{inner}</text>'


def rect(x, y, w, h, fill, rx=0, stroke=None, sw=1, opacity=None):
    st = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    o = f' opacity="{opacity}"' if opacity is not None else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"{st}{o}/>'


def circle(cx, cy, r, fill):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}"/>'


def line(x1, y1, x2, y2, stroke=LINE):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}"/>'


def clip(txt, colw, px_per_char=5.4):
    s = str(txt)
    m = max(3, int(colw / px_per_char))
    return s if len(s) <= m else s[:m - 1] + "…"


PILL = {
    "paid": ("#dcfce7", "#15803d"), "completed": ("#dcfce7", "#15803d"), "yes": ("#dcfce7", "#15803d"),
    "cash": ("#dcfce7", "#15803d"),
    "partially paid": ("#fef9c3", "#a16207"), "pending": ("#fef9c3", "#a16207"), "credit": ("#fef9c3", "#a16207"),
    "cancelled": ("#fee2e2", "#b91c1c"), "failed": ("#fee2e2", "#b91c1c"), "no": ("#fee2e2", "#b91c1c"),
    "received": ("#ede9fe", "#6d28d9"), "draft": ("#ede9fe", "#6d28d9"), "card": ("#ede9fe", "#6d28d9"),
    "upi": ("#dbeafe", "#1d4ed8"),
    "split": ("#fce7f3", "#be185d"),
}


def pill(x, y, label):
    key = str(label).lower().replace("_", " ")
    bg, fg = PILL.get(key, ("#ede9fe", "#6d28d9"))
    txt = key
    wpx = 12 + len(txt) * 6.1
    return rect(x, y - 12, wpx, 17, bg, rx=8) + T(x + 7, y, 10, txt, fill=fg, weight=700)


# ------------------------------------------------------------------ app chrome
NAV = ["Dashboard", "Billing / POS", "Sales History", "Products", "Stock & Movements",
       "Purchases", "Suppliers", "Customers", "User Management", "Store Settings"]


def sidebar(active):
    o = [rect(CX0, CY0, SIDE_W, CY1 - CY0, "url(#gradV)")]
    o.append(rect(CX0 + 18, CY0 + 20, 22, 22, "rgba(255,255,255,0.18)", rx=7))
    o.append(f'<path d="M{CX0+23} {CY0+37} h12 M{CX0+23} {CY0+31} h12 M{CX0+23} {CY0+25} h12" stroke="#fff" stroke-width="2"/>')
    o.append(T(CX0 + 48, CY0 + 37, 13, "Inventory", fill="#fff", weight=700,
               inner='<tspan fill="rgba(255,255,255,0.55)"> POS</tspan>'))
    o.append(line(CX0 + 18, CY0 + 54, CX0 + SIDE_W - 16, CY0 + 54, "rgba(255,255,255,0.16)"))
    yy = CY0 + 80
    for it in NAV:
        if it == active:
            o.append(rect(CX0 + 10, yy - 14, SIDE_W - 20, 22, "rgba(255,255,255,0.20)", rx=7))
            o.append(circle(CX0 + 22, yy - 3, 2.5, BRIGHT))
            o.append(T(CX0 + 32, yy, 11.5, it, fill="#fff", weight=700))
        else:
            o.append(T(CX0 + 32, yy, 11.5, it, fill="rgba(255,255,255,0.78)"))
        yy += 27
    return "".join(o)


def topbar(crumb=""):
    o = [rect(MAIN_X, CY0, CX1 - MAIN_X, 42, "#fff", stroke=LINE)]
    o.append(T(MAIN_X + 24, CY0 + 26, 11, crumb, fill=INKL))
    o.append(circle(CX1 - 150, CY0 + 21, 11, "url(#grad)"))
    o.append(T(CX1 - 150, CY0 + 25, 9, "VG", fill="#fff", weight=700, anchor="middle"))
    o.append(T(CX1 - 132, CY0 + 19, 10.5, "Varshitha GA", fill=INK, weight=600))
    o.append(T(CX1 - 132, CY0 + 32, 8.5, "Admin", fill=INKL))
    return "".join(o)


def page_title(mx, title):
    return T(mx, CY0 + 74, 20, title, fill=DEEP, weight=700) + rect(mx, CY0 + 82, 40, 3, ACCENT)


def data_table(active, crumb, title, add_label, search_ph, headers, rows, status_col, total, pages, aligns=None, col0=1.9, weights=None):
    mx = MAIN_X + 24
    o = [rect(CX0, CY0, 960, CY1 - CY0, BG), sidebar(active), topbar(crumb)]
    o.append(page_title(mx, title))
    o.append(rect(CX1 - 360, CY0 + 58, 210, 30, "#fff", rx=7, stroke=LINE))
    o.append(f'<circle cx="{CX1-345}" cy="{CY0+73}" r="4.5" fill="none" stroke="#a99cc7" stroke-width="1.6"/>')
    o.append(T(CX1 - 333, CY0 + 77, 10.5, search_ph, fill="#a99cc7"))
    o.append(rect(CX1 - 136, CY0 + 58, 116, 30, "url(#grad)", rx=7) +
             T(CX1 - 78, CY0 + 77, 10.5, add_label, fill="#fff", weight=700, anchor="middle"))

    tx, ty, tw = mx, CY0 + 100, CX1 - 20 - mx
    body_h = 34 + len(rows) * 30 + 4
    o.append(rect(tx, ty, tw, body_h, "#fff", rx=10, stroke=LINE))

    weights = weights or ([col0] + [1.0] * (len(headers) - 1) + [1.15])
    tot_w = sum(weights)
    xl, cw = [], []
    acc = tx
    for wt in weights:
        w = tw * wt / tot_w
        xl.append(acc)
        cw.append(w)
        acc += w

    o.append(f'<path d="M{tx} {ty+10} A10 10 0 0 1 {tx+10} {ty} H{tx+tw-10} A10 10 0 0 1 {tx+tw} {ty+10} V{ty+34} H{tx} Z" fill="url(#grad)"/>')
    for i, hd in enumerate(headers + ["ACTIONS"]):
        if (aligns or {}).get(i) == "r":
            o.append(T(xl[i] + cw[i] - 16, ty + 22, 9, hd.upper(), fill="#e9defb", weight=700, ls="0.5", anchor="end"))
        else:
            o.append(T(xl[i] + 14, ty + 22, 9, hd.upper(), fill="#e9defb", weight=700, ls="0.5"))
    ry = ty + 34
    for r, row in enumerate(rows):
        if r % 2:
            o.append(rect(tx, ry, tw, 30, ROWALT))
        for i, cell in enumerate(list(row) + [None]):
            if i == len(row):
                cxx = xl[i] + 8
                o.append(rect(cxx, ry + 7, 36, 16, "#fff", rx=4, stroke=LINE) + T(cxx + 6, ry + 19, 8.5, "Edit", fill=ACCENT, weight=700))
                o.append(rect(cxx + 42, ry + 7, 44, 16, "#fff", rx=4, stroke=LINE) + T(cxx + 48, ry + 19, 8.5, "Delete", fill="#d6455d", weight=700))
            elif status_col is not None and i == status_col:
                o.append(pill(xl[i] + 14, ry + 19, cell))
            elif (aligns or {}).get(i) == "r":
                o.append(T(xl[i] + cw[i] - 16, ry + 19, 10.5, clip(cell, cw[i]), fill=INK, anchor="end", family=MONO))
            else:
                o.append(T(xl[i] + 14, ry + 19, 10.5, clip(cell, cw[i] - 10), fill=INK))
        o.append(line(tx, ry + 30, tx + tw, ry + 30, "#f1ebfd"))
        ry += 30
    o.append(rect(tx, ry + 12, tw, 36, "#fff", rx=10, stroke=LINE))
    o.append(T(tx + 16, ry + 34, 10.5, f"Page 1 of {pages}  ·  {total} total", fill=INKL))
    o.append(rect(tx + tw - 150, ry + 19, 64, 22, "#fff", rx=5, stroke=LINE) + T(tx + tw - 118, ry + 34, 9.5, "Previous", fill="#a99cc7", anchor="middle"))
    o.append(rect(tx + tw - 78, ry + 19, 58, 22, "#fff", rx=5, stroke=LINE) + T(tx + tw - 49, ry + 34, 9.5, "Next", fill=ACCENT, weight=700, anchor="middle"))
    return "".join(o)


def mini_table(x, y, w, h, title, headers, rows, red_col=None):
    pad = 16
    o = [rect(x, y, w, h, "#fff", rx=12, stroke=LINE)]
    o.append(T(x + pad, y + 24, 9.5, title.upper(), fill=INKL, weight=700, ls="0.6"))
    namew = (w - 2 * pad) * 0.5
    restw = (w - 2 * pad - namew) / (len(headers) - 1)
    right_x = [x + pad + namew + i * restw for i in range(1, len(headers))]  # right edges
    for i, hd in enumerate(headers):
        if i == 0:
            o.append(T(x + pad, y + 44, 8.5, hd.upper(), fill="#a99cc7", weight=700))
        else:
            o.append(T(right_x[i - 1], y + 44, 8.5, hd.upper(), fill="#a99cc7", weight=700, anchor="end"))
    ry = y + 64
    for row in rows:
        o.append(T(x + pad, ry, 10.5, clip(row[0], namew + 30), fill=INK, weight=600))
        for i in range(1, len(row)):
            col = WARN if red_col == i else INK
            o.append(T(right_x[i - 1], ry, 10.5, str(row[i]), fill=col, weight=700, anchor="end", family=MONO))
        o.append(line(x + 12, ry + 10, x + w - 12, ry + 10, "#f1ebfd"))
        ry += 26
    return "".join(o)


# --------------------------------------------------------------------- SCENE 1
def scene_login():
    o = [rect(CX0, CY0, 960, CY1 - CY0, "url(#gradHero)")]
    o.append(circle(CX0 + 250, CY0 + 150, 150, "rgba(168,85,247,0.18)"))
    o.append(circle(CX1 - 220, CY1 - 140, 160, "rgba(124,58,237,0.18)"))
    cw, ch = 356, 340
    cx, cy = CX0 + (960 - cw) / 2, CY0 + (CY1 - CY0 - ch) / 2
    o.append(rect(cx, cy, cw, ch, "#fff", rx=20))
    o.append(rect(cx + cw / 2 - 22, cy + 26, 44, 44, "url(#gradV)", rx=13))
    o.append(f'<path d="M{cx+cw/2-10} {cy+52} h20 M{cx+cw/2-10} {cy+45} h20 M{cx+cw/2-10} {cy+38} h20" stroke="#fff" stroke-width="2.4"/>')
    o.append(T(cx + cw / 2, cy + 96, 18, "System Sign-In", fill=DEEP, weight=700, anchor="middle"))
    o.append(T(cx + cw / 2, cy + 118, 10, "ADMIN  •  MANAGER  •  STAFF", fill=ACCENT, weight=700, anchor="middle", ls="1.5"))
    for k, (lab, val) in enumerate([("USERNAME", "admin"), ("PASSWORD", "•••••••••")]):
        yy = cy + 148 + k * 60
        o.append(T(cx + 30, yy, 9.5, lab, fill=INKL, weight=700, ls="0.6"))
        o.append(rect(cx + 30, yy + 10, cw - 60, 36, "#f7f3ff", rx=8, stroke=LINE))
        o.append(T(cx + 44, yy + 33, 12, val, fill=INK, weight=600))
    o.append(rect(cx + 30, cy + 274, cw - 60, 42, "url(#grad)", rx=10) +
             T(cx + cw / 2, cy + 301, 12.5, "Sign In to System", fill="#fff", weight=700, anchor="middle"))
    o.append(T(cx + cw / 2, cy + 330, 10.5, "New Store Admin?  Create Admin Account", fill=INKL, anchor="middle"))
    return "".join(o)


# --------------------------------------------------------------------- SCENE 2
KPIS = [("TODAY'S REVENUE", "₹1,284.60", "3 bills today", GOOD),
        ("THIS MONTH", "₹18,742.15", "18 invoices", INK),
        ("LOW STOCK", "2", "below threshold", WARN),
        ("TOP SELLER", "Coca-Cola 750ml", "this month", DEEP)]


def scene_dashboard():
    mx = MAIN_X + 24
    o = [rect(CX0, CY0, 960, CY1 - CY0, BG), sidebar("Dashboard"), topbar("Dashboard")]
    o.append(rect(mx, CY0 + 58, CX1 - 20 - mx, 60, "url(#grad)", rx=12))
    o.append(T(mx + 20, CY0 + 84, 15, "Executive Dashboard", fill="#fff", weight=700))
    o.append(T(mx + 20, CY0 + 104, 10, "Live store metrics — revenue, low stock and payment distribution.", fill="rgba(255,255,255,0.85)"))
    gx, gy = mx, CY0 + 130
    cw = (CX1 - 20 - mx - 3 * 12) / 4
    for i, (lab, val, sub, col) in enumerate(KPIS):
        cxx = gx + i * (cw + 12)
        o.append(rect(cxx, gy, cw, 74, "#fff", rx=12, stroke=LINE))
        o.append(T(cxx + 14, gy + 22, 8.5, lab, fill="#a99cc7", weight=700, ls="0.5"))
        o.append(T(cxx + 14, gy + 46, 15 if len(val) < 10 else 11.5, val, fill=col, weight=700))
        o.append(T(cxx + 14, gy + 63, 8.5, sub, fill=INKL))
    ty = gy + 88
    half = (CX1 - 20 - mx - 14) / 2
    o.append(mini_table(mx, ty, half, 150, "Low stock warnings",
                        ["Product", "Avail", "Min"],
                        [("Nescafe Classic Coffee 200g", 6, 8), ("Amul Butter 500g", 8, 10)], red_col=1))
    o.append(mini_table(mx + half + 14, ty, half, 150, "Recent sale invoices",
                        ["Invoice", "Customer", "Amount"],
                        [("INV-00018", "Priya Sharma", "₹255.90"),
                         ("INV-00017", "Walk-in", "₹412.30"),
                         ("INV-00016", "Vikram Singh", "₹616.40")]))
    py = ty + 164
    o.append(rect(mx, py, CX1 - 20 - mx, 66, "#fff", rx=12, stroke=LINE))
    o.append(T(mx + 16, py + 24, 9.5, "TODAY'S PAYMENT MODE BREAKDOWN", fill=INKL, weight=700, ls="0.6"))
    for i, (m, v) in enumerate([("UPI", "₹642.30"), ("Cash", "₹448.20"), ("Card", "₹194.10")]):
        bx = mx + 16 + i * 190
        o.append(T(bx, py + 48, 11, m, fill=DEEP, weight=700))
        o.append(T(bx + 52, py + 48, 11, v, fill=INK, family=MONO))
    return "".join(o)


# --------------------------------------------------------------------- SCENE 3
def scene_products():
    return data_table("Products", "Products", "Products · Catalog Directory", "+ Add Product",
                      "amul", ["Product", "SKU", "Category", "Price", "GST", "Stock"],
                      [("Amul Gold Milk 1L", "DBK-001", "Dairy & Bakery", "₹68.00", "5%", "120"),
                       ("Amul Butter 500g", "DBK-002", "Dairy & Bakery", "₹265.00", "12%", "8 · low")],
                      None, 24, 3, aligns={3: "r", 5: "r"})


# --------------------------------------------------------------------- SCENE 4
def scene_purchases():
    rows = [
        ("PO-011042", "FreshFarm Distributors", "2026-07-19", "₹16,170.00", "paid"),
        ("PO-020803", "Metro Wholesale", "2026-07-28", "₹8,940.00", "paid"),
        ("PO-030811", "Sunrise FMCG", "2026-08-05", "₹12,360.00", "received"),
        ("PO-040817", "National Dairy Co.", "2026-08-11", "₹6,420.00", "partially_paid"),
        ("PO-050820", "Om Stationery House", "2026-08-14", "₹2,280.00", "paid"),
    ]
    return data_table("Purchases", "Purchases", "Purchases · Stock In", "+ New Purchase",
                      "supplier / invoice", ["Invoice", "Supplier", "Date", "Total", "Status"],
                      rows, 4, 8, 1, aligns={3: "r"},
                      weights=[1.1, 1.9, 1.1, 1.2, 1.1, 1.0])


# --------------------------------------------------------------------- SCENE 5
def scene_stock():
    rows = [
        ("6 weeks ago", "in", "MG Road", "+72", "purchase #3"),
        ("12 days ago", "out", "MG Road", "−4", "sale #12"),
        ("5 days ago", "out", "MG Road", "−3", "sale #16"),
        ("2 days ago", "adjustment", "MG Road", "−6", "damaged write-off"),
        ("today", "out", "MG Road", "−3", "sale #18"),
    ]
    return data_table("Stock & Movements", "Stock & Movements", "Stock & Movements · Audit Ledger",
                      "Coca-Cola 750ml", "filter product…",
                      ["When", "Type", "Branch", "Qty", "Reference"], rows, 1, 63, 7, aligns={3: "r"})


# --------------------------------------------------------------------- SCENE 6
CART = [("Coca-Cola 750ml", "3", "₹40.00", "—", "₹120.00"),
        ("Lay's Classic Salted 90g", "2", "₹20.00", "—", "₹40.00"),
        ("Parle-G Biscuits 800g", "1", "₹75.00", "₹10", "₹65.00")]


def scene_pos():
    mx = MAIN_X + 24
    o = [rect(CX0, CY0, 960, CY1 - CY0, BG), sidebar("Billing / POS"), topbar("Billing / POS")]
    o.append(rect(mx, CY0 + 58, CX1 - 20 - mx, 54, "url(#grad)", rx=12))
    o.append(T(mx + 20, CY0 + 80, 14, "Billing & Checkout", fill="#fff", weight=700))
    o.append(T(mx + 20, CY0 + 99, 9.5, "POS terminal — live cart, automatic GST, split payments, instant PDF.", fill="rgba(255,255,255,0.85)"))
    ty = CY0 + 126
    lw = 420
    o.append(rect(mx, ty - 8, lw, 34, "#fff", rx=9, stroke=LINE) +
             T(mx + 16, ty + 14, 10.5, "Search product by name, SKU, or barcode…", fill="#a99cc7"))
    o.append(rect(mx, ty + 34, lw, 34 + len(CART) * 30 + 4, "#fff", rx=10, stroke=LINE))
    o.append(f'<path d="M{mx} {ty+44} A10 10 0 0 1 {mx+10} {ty+34} H{mx+lw-10} A10 10 0 0 1 {mx+lw} {ty+44} V{ty+68} H{mx} Z" fill="url(#grad)"/>')
    for i, hd in enumerate(["PRODUCT", "QTY", "PRICE", "DISC", "LINE"]):
        xs = [mx + 14, mx + 210, mx + 260, mx + 320, mx + lw - 16]
        o.append(T(xs[i], ty + 56, 8.5, hd, fill="#e9defb", weight=700, anchor="end" if i == 4 else None))
    ry = ty + 68
    for nm, q, pr, ds, ln in CART:
        o.append(T(mx + 14, ry + 19, 10.5, clip(nm, 190), fill=INK, weight=600))
        o.append(T(mx + 210, ry + 19, 10.5, q, fill=INK, anchor="end", family=MONO))
        o.append(T(mx + 268, ry + 19, 10.5, pr, fill=INK, anchor="end", family=MONO))
        o.append(T(mx + 322, ry + 19, 10.5, ds, fill=INK, anchor="end", family=MONO))
        o.append(T(mx + lw - 16, ry + 19, 10.5, ln, fill=INK, weight=700, anchor="end", family=MONO))
        o.append(line(mx, ry + 30, mx + lw, ry + 30, "#f1ebfd"))
        ry += 30
    # right column
    rx = mx + lw + 16
    rw = CX1 - 20 - rx
    o.append(rect(rx, ty - 8, rw, 62, "#f7f3ff", rx=12, stroke=LINE))
    o.append(T(rx + 14, ty + 12, 9, "CUSTOMER", fill=INKL, weight=700, ls="0.5"))
    o.append(T(rx + 14, ty + 32, 11.5, "Priya Sharma", fill=INK, weight=700))
    o.append(T(rx + 14, ty + 46, 9, "Karnataka  ·  40 loyalty pts", fill=INKL))
    o.append(rect(rx, ty + 66, rw, 84, "#fff", rx=12, stroke=LINE))
    for i, (lab, val, big) in enumerate([("Subtotal", "₹225.00", 0), ("CGST + SGST", "₹30.90", 0), ("Grand Total", "₹255.90", 1)]):
        yy = ty + 88 + i * 22
        o.append(T(rx + 14, yy, 11 if not big else 12.5, lab, fill=INK if not big else DEEP, weight=700 if big else 400))
        o.append(T(rx + rw - 14, yy, 11 if not big else 12.5, val, fill=INK if not big else DEEP, weight=700, anchor="end", family=MONO))
    o.append(rect(rx, ty + 162, rw, 66, "#f7f3ff", rx=12, stroke=LINE))
    o.append(T(rx + 14, ty + 182, 9, "SPLIT PAYMENT", fill=INKL, weight=700, ls="0.5"))
    for i, (m, v) in enumerate([("Cash", "₹150.00"), ("UPI / Online", "₹105.90")]):
        yy = ty + 200 + i * 18
        o.append(T(rx + 14, yy, 10, m, fill=INK))
        o.append(T(rx + rw - 14, yy, 10, v, fill=INK, anchor="end", family=MONO))
    o.append(rect(rx, ty + 238, rw, 40, "url(#grad)", rx=10) +
             T(rx + rw / 2, ty + 263, 11.5, "Complete Checkout", fill="#fff", weight=700, anchor="middle"))
    return "".join(o)


# --------------------------------------------------------------------- SCENE 7
INV = [("Coca-Cola 750ml", "2202", "3", "₹120.00", "₹7.20", "₹7.20", "₹134.40"),
       ("Lay's Classic Salted 90g", "1905", "2", "₹40.00", "₹2.40", "₹2.40", "₹44.80"),
       ("Parle-G Biscuits 800g", "1905", "1", "₹65.00", "₹5.85", "₹5.85", "₹76.70")]


def scene_invoice():
    o = [rect(CX0, CY0, 960, CY1 - CY0, "#efe9fe")]
    pw, ph = 620, 320
    px, py = CX0 + (960 - pw) / 2, CY0 + (CY1 - CY0 - ph) / 2
    o.append(rect(px, py, pw, ph, "#fff", rx=12, stroke=LINE))
    o.append(rect(px, py, pw, 6, "url(#grad)", rx=3))
    o.append(T(px + 26, py + 40, 17, "My Shop", fill=DEEP, weight=700))
    o.append(T(px + 26, py + 58, 9.5, "12 MG Road, Bengaluru 560001  ·  GSTIN 29ABCDE1234F1Z5", fill=INKL))
    o.append(T(px + pw - 26, py + 36, 10, "TAX INVOICE", fill=INKL, weight=700, anchor="end", ls="1"))
    o.append(T(px + pw - 26, py + 56, 13, "INV-00001", fill=ACCENT, weight=700, anchor="end", family=MONO))
    o.append(T(px + pw - 26, py + 72, 9.5, "30 Aug 2026", fill=INKL, anchor="end"))
    o.append(line(px + 26, py + 84, px + pw - 26, py + 84, ACCENT))
    hx = [px + 26, px + 230, px + 288, px + 350, px + 430, px + 500, px + pw - 26]
    for i, hd in enumerate(["ITEM", "HSN", "QTY", "TAXABLE", "CGST", "SGST", "TOTAL"]):
        o.append(T(hx[i], py + 104, 8.5, hd, fill="#a99cc7", weight=700, anchor="end" if i >= 3 else None))
    ry = py + 124
    for nm, hsn, q, tx, cg, sg, tot in INV:
        o.append(T(px + 26, ry, 10, clip(nm, 190), fill=INK, weight=600))
        o.append(T(px + 230, ry, 9.5, hsn, fill=INKL, family=MONO))
        o.append(T(px + 300, ry, 9.5, q, fill=INK, anchor="end", family=MONO))
        o.append(T(px + 350, ry, 9.5, tx, fill=INK, anchor="end", family=MONO))
        o.append(T(px + 430, ry, 9.5, cg, fill=INK, anchor="end", family=MONO))
        o.append(T(px + 500, ry, 9.5, sg, fill=INK, anchor="end", family=MONO))
        o.append(T(px + pw - 26, ry, 9.5, tot, fill=INK, weight=700, anchor="end", family=MONO))
        o.append(line(px + 26, ry + 10, px + pw - 26, ry + 10, "#f1ebfd"))
        ry += 28
    for i, (lab, val) in enumerate([("Taxable value", "₹225.00"), ("CGST + SGST", "₹15.45 + ₹15.45")]):
        o.append(T(px + pw - 200, ry + 12 + i * 20, 10, lab, fill=INKL, anchor="end"))
        o.append(T(px + pw - 26, ry + 12 + i * 20, 10, val, fill=INK, anchor="end", family=MONO))
    o.append(line(px + pw - 320, ry + 44, px + pw - 26, ry + 44, LINE))
    o.append(T(px + pw - 200, ry + 66, 13, "Grand Total", fill=DEEP, weight=700, anchor="end"))
    o.append(T(px + pw - 26, ry + 66, 13, "₹255.90", fill=DEEP, weight=700, anchor="end", family=MONO))
    o.append(T(px + 26, ry + 66, 9.5, "Paid:  ₹150.00 Cash + ₹105.90 UPI   ·   Balance ₹0.00", fill=INKL))
    return "".join(o)


# --------------------------------------------------------------------- SCENE 8
def scene_sales():
    rows = [
        ("INV-00018", "Priya Sharma", "2026-08-30", "split", "₹255.90"),
        ("INV-00017", "Walk-in", "2026-08-30", "upi", "₹412.30"),
        ("INV-00016", "Vikram Singh", "2026-08-29", "credit", "₹616.40"),
        ("INV-00015", "Sneha Patil", "2026-08-28", "card", "₹289.75"),
        ("INV-00014", "Walk-in", "2026-08-28", "cash", "₹154.20"),
    ]
    return data_table("Sales History", "Sales History", "Sales History", "+ New Sale",
                      "invoice / customer", ["Invoice", "Customer", "Date", "Payment", "Total"],
                      rows, 3, 22, 3, aligns={4: "r"},
                      weights=[1.2, 1.7, 1.2, 1.1, 1.1, 1.0])


# --------------------------------------------------------------------- SCENE 9
def scene_customers():
    rows = [
        ("Ramesh Gowda", "9900112233", "Karnataka", "₹0.00", "0"),
        ("Priya Sharma", "9900112244", "Karnataka", "₹255.90", "42"),
        ("Arjun Reddy", "9900112255", "Telangana", "₹180.00", "15"),
        ("Vikram Singh", "9900112277", "Karnataka", "₹420.00", "60"),
        ("Divya Menon", "9900112288", "Kerala", "₹95.00", "10"),
        ("Lakshmi Nair", "9900112300", "Karnataka", "₹0.00", "25"),
    ]
    return data_table("Customers", "Customers", "Customers · Ledger & Loyalty", "+ Add Customer",
                      "name / phone", ["Name", "Phone", "State", "Outstanding", "Points"],
                      rows, None, 10, 1, aligns={3: "r", 4: "r"})


# -------------------------------------------------------------------- SCENE 10
def scene_settings():
    mx = MAIN_X + 24
    o = [rect(CX0, CY0, 960, CY1 - CY0, BG), sidebar("Store Settings"), topbar("Store Settings")]
    o.append(page_title(mx, "Store Settings"))
    half = (CX1 - 20 - mx - 16) / 2
    ty = CY0 + 100
    o.append(rect(mx, ty, half, 250, "#fff", rx=12, stroke=LINE))
    o.append(T(mx + 18, ty + 26, 9.5, "SHOP PROFILE", fill=INKL, weight=700, ls="0.6"))
    for i, (lab, val) in enumerate([("Shop name", "My Shop"),
                                    ("Address", "12 MG Road, Bengaluru 560001"),
                                    ("Phone", "080-41234567"),
                                    ("GSTIN", "29ABCDE1234F1Z5"),
                                    ("Logo", "shop-logo.png")]):
        yy = ty + 54 + i * 38
        o.append(T(mx + 18, yy, 9, lab.upper(), fill="#a99cc7", weight=700))
        o.append(rect(mx + 18, yy + 8, half - 36, 24, "#f7f3ff", rx=6, stroke=LINE))
        o.append(T(mx + 30, yy + 24, 10, val, fill=INK, weight=600))
    x2 = mx + half + 16
    o.append(rect(x2, ty, half, 250, "#fff", rx=12, stroke=LINE))
    o.append(T(x2 + 18, ty + 26, 9.5, "INVOICE & TAX", fill=INKL, weight=700, ls="0.6"))
    for i, (lab, val) in enumerate([("Invoice prefix", "INV"),
                                    ("Next invoice number", "00019"),
                                    ("Tax-inclusive pricing", "Off")]):
        yy = ty + 54 + i * 38
        o.append(T(x2 + 18, yy, 9, lab.upper(), fill="#a99cc7", weight=700))
        o.append(rect(x2 + 18, yy + 8, half - 36, 24, "#f7f3ff", rx=6, stroke=LINE))
        o.append(T(x2 + 30, yy + 24, 10, val, fill=INK, weight=600, family=MONO if i < 2 else None))
    o.append(T(x2 + 18, ty + 186, 9, "GST PRESETS", fill="#a99cc7", weight=700))
    for i, t in enumerate(["5%", "12%", "18% ★", "28%"]):
        o.append(rect(x2 + 18 + i * 58, ty + 196, 50, 22, "#ede9fe", rx=11) +
                 T(x2 + 18 + i * 58 + 25, ty + 211, 9.5, t, fill="#6d28d9", weight=700, anchor="middle"))
    o.append(rect(mx, ty + 268, CX1 - 20 - mx, 40, "#f7f3ff", rx=10, stroke=LINE))
    o.append(T(mx + 16, ty + 293, 10, "These fields print on every GST invoice PDF.  ·  Admin-only screen.", fill=INKL))
    return "".join(o)


# -------------------------------------------------------------------- SCENE 11
def scene_users():
    rows = [
        ("admin", "admin", "Main Branch - MG Road", "Yes"),
        ("priya.k", "manager", "Koramangala Outlet", "Yes"),
        ("ravi.s", "staff", "Main Branch - MG Road", "Yes"),
        ("anita.d", "staff", "Whitefield Outlet", "Yes"),
        ("old.user", "staff", "—", "No"),
    ]
    return data_table("User Management", "User Management", "User Management", "+ Add User",
                      "name / role / branch", ["Username", "Role", "Branch", "Active"],
                      rows, 3, 5, 1)


# --------------------------------------------------------------------- assemble
SCENES = [
    ("localhost:5173/login", "Sign in — JWT auth, three roles (Admin / Manager / Staff)", scene_login),
    ("localhost:5173/", "Dashboard — revenue, payment split, low stock, top sellers", scene_dashboard),
    ("localhost:5173/products", "Products — price, GST, HSN, low-stock threshold; search name / SKU / barcode", scene_products),
    ("localhost:5173/purchases", "Purchases — supplier orders, GST, status & balance due (stock in)", scene_purchases),
    ("localhost:5173/stock", "Stock & Movements — full in / out / adjustment audit ledger", scene_stock),
    ("localhost:5173/billing", "Billing / POS — cart, per-line GST, customer, split payment", scene_pos),
    ("localhost:5173/billing", "GST invoice PDF — CGST / SGST split per line, generated on checkout", scene_invoice),
    ("localhost:5173/sales", "Sales History — every bill, filter by status, re-download the invoice", scene_sales),
    ("localhost:5173/customers", "Customers — outstanding-balance ledger & loyalty points", scene_customers),
    ("localhost:5173/settings", "Store Settings — shop profile & invoice numbering feed the PDF", scene_settings),
    ("localhost:5173/user-management", "User Management — roles & branches; RBAC enforced on API + UI", scene_users),
]

N = len(SCENES)
DUR = round(3.9 * N, 1)
FADE = 0.004


def keytimes(i):
    a, b = i / N, (i + 1) / N
    pts = [0, round(a, 5), round(a + FADE, 5), round(b - FADE, 5), round(b, 5), 1]
    return ";".join(str(p) for p in pts)


def anim(i):
    return (f'<animate attributeName="opacity" dur="{DUR}s" repeatCount="indefinite" '
            f'calcMode="linear" keyTimes="{keytimes(i)}" values="0;0;1;1;0;0"/>')


buf = io.StringIO()
buf.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" font-family="{SANS}">')
buf.write('<defs>')
buf.write(f'<linearGradient id="grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{ACCENT}"/><stop offset="1" stop-color="{DEEP}"/></linearGradient>')
buf.write(f'<linearGradient id="gradV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6d28d9"/><stop offset="1" stop-color="#3b0764"/></linearGradient>')
buf.write(f'<linearGradient id="gradHero" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b0764"/><stop offset="0.55" stop-color="#4c1d95"/><stop offset="1" stop-color="#312e81"/></linearGradient>')
buf.write(f'<clipPath id="screen"><rect x="{CX0}" y="{CY0}" width="960" height="{CY1-CY0}"/></clipPath>')
buf.write('</defs>')

# window frame
buf.write(rect(18, 18, 964, H - 34, "#ffffff", rx=14, stroke="#e2e0ee", sw=2))
buf.write('<path d="M18 32 A14 14 0 0 1 32 18 H968 A14 14 0 0 1 982 32 V62 H18 Z" fill="#f1eefb"/>')
for i, c in enumerate(["#f87171", "#fbbf24", "#34d399"]):
    buf.write(circle(42 + i * 20, 40, 6, c))
buf.write(rect(116, 28, 620, 24, "#ffffff", rx=12, stroke="#e2e0ee"))
for i, (url, _, _) in enumerate(SCENES):
    buf.write(f'<text x="132" y="44" font-size="13" fill="#5b6b76" opacity="0">{esc(url)}{anim(i)}</text>')

# scenes
buf.write('<g clip-path="url(#screen)">')
for i, (_, _, fn) in enumerate(SCENES):
    buf.write(f'<g opacity="0">{anim(i)}{fn()}</g>')
buf.write('</g>')

# caption bar
CAP_Y = CY1
buf.write(rect(18, CAP_Y, 964, 40, "#2e1065"))
for i, (_, cap, _) in enumerate(SCENES):
    buf.write(f'<text x="500" y="{CAP_Y+25}" font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle" opacity="0">{esc(cap)}{anim(i)}</text>')

# progress bar
PB_Y = CAP_Y + 40
buf.write(rect(18, PB_Y, 964, 4, "#1e0a44"))
buf.write(f'<rect x="18" y="{PB_Y}" width="0" height="4" fill="{BRIGHT}"><animate attributeName="width" dur="{DUR}s" repeatCount="indefinite" values="0;964;964" keyTimes="0;0.995;1"/></rect>')
buf.write('</svg>\n')

out = os.path.join(os.path.dirname(__file__), "demo.svg")
with open(out, "w", encoding="utf-8") as f:
    f.write(buf.getvalue())
print("wrote", out, len(buf.getvalue()), "bytes,", N, "scenes,", DUR, "s loop")
