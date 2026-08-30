# 🎬 Demo Recording Script — Inventory & Billing System

A scene-by-scene script for a **~7-minute screen-recorded product demo**. Follow it top to
bottom in one take, or record per-scene and stitch. Narration lines are written to be read
aloud at a normal pace.

> Can't record video from code — this script + your seeded demo data is what turns into the
> video. Any screen recorder works: OBS Studio (free), the Xbox Game Bar (`Win + G`) on
> Windows, ShareX, or Loom.

---

## 0. Pre-flight checklist (do this before hitting record)

| ✔ | Step |
|---|---|
| ☐ | `cd backend && python manage.py seed_demo_data` — fresh data with today's dates |
| ☐ | Backend running: `python manage.py runserver 8000` |
| ☐ | Frontend running: `cd frontend && npm run dev` (→ http://localhost:5173) |
| ☐ | Know your **admin** password, and have one **staff** user ready (see Appendix A) |
| ☐ | Browser at **1920×1080**, zoom **100–110%**, bookmarks bar hidden, one clean tab |
| ☐ | Downloads bar / folder visible so the invoice PDF is seen landing |
| ☐ | Close Slack/mail/notifications; silence the phone |
| ☐ | Recorder set to 1080p, 30fps, capture the browser window (not full desktop) |

**Total runtime target: 7:00.** Timestamps below are cumulative and approximate.

---

## Scene 1 — Cold open & login · `0:00–0:35`

**Screen:** `http://localhost:5173/login` — the violet gradient sign-in card.

**Do:**
1. Let the login screen sit for 2 seconds.
2. Type the admin username, then the password.
3. Click **Sign In to System**.

**Narration:**
> "This is a full-stack inventory and point-of-sale system for a multi-branch retail shop —
> Django REST Framework on the back end, React and TypeScript on the front. It handles the
> whole loop: buying stock from suppliers, holding it per branch, selling it at a GST-compliant
> POS, and tracking dues, loyalty and revenue. I'm signing in as an admin, who can see
> everything."

---

## Scene 2 — Dashboard tour · `0:35–1:30`

**Screen:** `/` (Dashboard) — loads right after login.

**Do:**
1. Slow mouse sweep across the top **revenue tiles** (today's sales, sale count, this month).
2. Point at the **payment-mode breakdown** for today.
3. Scroll to the **Low-stock** list — hover 1–2 rows.
4. Point at **Top products this month** and **Recent sales**.

**Narration:**
> "Straight after login, the dashboard summarises the business. Revenue today and this month,
> the number of sales, and how today's takings split across cash, UPI, card and credit. Below
> that, the system is already flagging products that have dropped below their low-stock
> threshold, the five best-selling products this month, and the most recent sales. All of this
> comes from one aggregate endpoint — `dashboard/summary`."

---

## Scene 3 — Products & categories · `1:30–2:25`

**Screen:** click **Products** in the left nav → `/products`.

**Do:**
1. In the search box type `amul` — show the list filtering live.
2. Open **Amul Butter 500g** (or any product row).
3. Point out: selling price, purchase price, **GST rate**, unit, HSN code, **low-stock threshold**.
4. Close the product. Open the **Category / manage categories** dialog; show the 7 categories.
5. Clear the search; point at any row showing a **low-stock badge**.

**Narration:**
> "The catalog. Each product carries a selling price, a purchase price, its GST rate, unit and
> HSN code, and a low-stock threshold. Search works on name, SKU or barcode. SKUs are
> auto-generated if you leave them blank. Categories support sub-categories, and any product at
> or below its threshold gets a low-stock badge — that's what fed the dashboard warning."

---

## Scene 4 — Purchases: stock in · `2:25–3:15`

**Screen:** click **Purchases** → `/purchases`.

**Do:**
1. Show the list of 8 purchase orders — point at the **status** column
   (`paid`, `received`, `partially paid`) and **balance due**.
2. Open one purchase order.
3. Walk down its **line items**: quantity, purchase price, GST per line.
4. Point at the totals: subtotal, tax, total, amount paid, balance due.
5. (Optional) click **Suppliers** briefly — show a supplier with GSTIN + contact person.

**Narration:**
> "Stock comes in through purchase orders. Each one is tied to a supplier and a branch, with
> itemised quantities, cost prices and GST. A purchase can be a draft, received, partially paid
> or fully paid, and the system tracks exactly how much we still owe each supplier. Receiving a
> purchase adds that stock to the branch and writes an entry in the stock ledger."

---

## Scene 5 — Stock & movements: the audit trail · `3:15–4:00`

**Screen:** click **Stock & Movements** → `/stock`.

**Do:**
1. Show the full movement ledger — point at the `in` / `out` / `adjustment` types.
2. Filter / search for one product you'll sell in the next scene (e.g. `Coca-Cola`).
3. Trace its history: a big `in` from the purchase, smaller `out` rows from past sales.
4. Point at the **per-branch stock** figures.

**Narration:**
> "Every single stock change is logged here — purchases in, sales out, manual adjustments and
> transfers between branches. Nothing edits stock silently. Per-branch levels are the source of
> truth, and the product's total quantity is kept in sync automatically. Let's go make a new
> sale and watch it land in this ledger."

---

## Scene 6 — POS / Billing: the core demo · `4:00–5:30`

**Screen:** click **Billing / POS** → `/billing`.

**Do:**
1. In **"Search product by name, SKU, or barcode…"** type `coca` → click the result to add it.
2. Add two more from the catalog grid (e.g. **Lay's Classic Salted**, **Parle-G Biscuits**).
3. On one line, bump **Qty** to `3`.
4. On another line, enter a **Discount** (e.g. `10`).
5. In **Select Customer**, pick **Priya Sharma** (she has an outstanding balance — good callback).
6. Watch **Subtotal / tax / Grand Total** update in the right panel.
7. Set **Payment Method** to `Cash`, enter a partial amount, click **+ Add Split Payment**,
   add a `UPI` row for the remainder — demonstrating a **split payment**.
8. Click **Complete Checkout**.
9. On the success panel, click **Download PDF Invoice** — show the PDF opening / downloading.
10. Open the PDF: point at the shop header, invoice number, line items, **CGST/SGST breakdown**, total.

**Narration:**
> "The POS terminal. I search products and add them, or tap tiles from the grid. Each line has
> its own quantity and discount, and the panel on the right keeps a running subtotal, GST and
> grand total. I'll attach this to a customer, then split the payment — part cash, part UPI —
> which the system fully supports. On checkout, stock is drawn down, a stock movement is
> written, an invoice number is assigned from the shop's counter, and the customer's dues and
> loyalty points update. And here's the one-click GST invoice PDF — shop details, HSN codes,
> CGST and SGST split out per line, generated with ReportLab."

> **Tip:** to show the *Hold Bill* feature, before checkout click **Hold Bill** once, then go
> to Sales History and show it sitting there as a **draft**, then come back. Optional — costs ~20s.

---

## Scene 7 — Sales history & the invoice again · `5:30–6:00`

**Screen:** click **Sales History** → `/sales` (or **View All Sales** from the success panel).

**Do:**
1. The sale you just made is at the top — point at invoice number, customer, total, **split** payment mode.
2. Use the **status filter** to show `draft` sales (the held bills from the seed data).
3. Open the sale you just made and **re-download its invoice** to show it's reproducible any time.

**Narration:**
> "Every completed sale lives in the history, searchable by invoice number or customer, and
> filterable by status. Draft bills that were held show up here too. The invoice PDF can be
> regenerated from any sale at any time — the tax figures are snapshotted at sale time, so old
> invoices stay correct even if prices or GST rates change later."

---

## Scene 8 — Customers: dues & loyalty · `6:00–6:20`

**Screen:** click **Customers** → `/customers`.

**Do:**
1. Open **Priya Sharma**.
2. Point at her **outstanding balance** (just increased by the credit portion of our sale) and
   **loyalty points**.

**Narration:**
> "Because part of that last sale was on credit, Priya's outstanding balance just went up
> automatically, and she earned loyalty points on the purchase. The dashboard and the
> notifications panel both pick up customers who owe money."

---

## Scene 9 — Settings + RBAC finale · `6:20–7:00`

**Screen:** click **Store Settings** → `/settings`.

**Do:**
1. Show the shop profile: name, address, GSTIN, **invoice prefix** and **next number**.
2. Say that these fields are exactly what printed on the PDF.
3. Click **User Management** → show users, their **roles** and **branches**.
4. **Log out.** Log back in as the **staff / cashier** user.
5. Show the trimmed-down left nav: **Billing, Sales, Customers** are full; **Products / Stock /
   Purchases / Suppliers** are read-only; **User Management** and **Settings** are gone.

**Narration:**
> "Settings drives the invoice — the shop details and the invoice numbering all come from here,
> and it's admin-only. Access is role-based: three tiers — admin, manager, and staff. When I
> log back in as a cashier, the settings and user-management screens disappear entirely, the
> catalog and stock screens become read-only, and all that's left is what a person on the till
> actually needs: billing, sales history and customers. Same enforcement on the API, not just
> the UI. That's the whole system — procurement, multi-branch stock, GST billing, and
> reporting, with access control end to end."

**End on:** the cashier's dashboard or POS screen. Stop recording.

---

## Appendix A — Getting a staff user for Scene 9

The seeded database has two admin users (`admin`, `admin1`) but no plain staff user. Create one:

```bash
cd backend
python manage.py shell -c "from inventory.models import User, Branch; b=Branch.objects.filter(is_main=True).first(); u=User.objects.create_user('cashier','cashier@shop.test','Passw0rd!'); u.role='staff'; u.branch=b; u.save(); print('created', u.username)"
```

Login for the demo: **`cashier` / `Passw0rd!`**

(Delete afterward with `User.objects.filter(username='cashier').delete()` if you like.)

---

## Appendix B — Shot list (condensed, for a teleprompter)

| # | Screen | Key action | Time |
|---|---|---|---|
| 1 | `/login` | sign in as admin | 0:35 |
| 2 | `/` | revenue tiles, payment split, low stock, top products | 1:30 |
| 3 | `/products` | search `amul`, open product, category dialog | 2:25 |
| 4 | `/purchases` | open a PO, line items, balance due | 3:15 |
| 5 | `/stock` | filter one product, trace in/out history | 4:00 |
| 6 | `/billing` | add 3 items, qty+discount, customer, **split pay**, checkout, **PDF** | 5:30 |
| 7 | `/sales` | find the sale, status filter, re-download invoice | 6:00 |
| 8 | `/customers` | open Priya Sharma — balance + loyalty | 6:20 |
| 9 | `/settings` → `/user-management` → re-login as **cashier** | show RBAC-trimmed nav | 7:00 |

---

## Appendix C — Optional B-roll / extra scenes

- **Django admin** (`http://localhost:8000/admin/`) — show the raw models for a "built on
  Django" beat.
- **API in the browser** — hit `http://localhost:8000/api/products/` with DRF's browsable API
  to show the JSON layer.
- **Signup flow** (`/signup`) — creating a fresh admin account from scratch.
- **Notifications panel** — low-stock and payment-due alerts from the seed data.
- **Stock transfer** between two branches, then show both branch levels change.
