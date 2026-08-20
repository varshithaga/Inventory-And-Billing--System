import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PaginatedSearchSelect from "../../components/PaginatedSearchSelect";
import { openInvoicePdf } from "../../utils/downloadInvoice";
import type { Customer, PaymentMode, Product, Sale, SaleStatus } from "../../types";
import { createSale, fetchBillingCustomersPage, fetchBillingProductsPage } from "./api";

interface CartItem {
  product: number;
  name: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  gst_rate: number;
}

interface PaymentRow {
  mode: PaymentMode;
  amount: string;
}

export default function BillingPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMode] = useState<PaymentMode>("cash");
  const [payments, setPayments] = useState<PaymentRow[]>([{ mode: "cash", amount: "" }]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<Sale | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product === product.id);
      if (existing) {
        return prev.map((i) => (i.product === product.id ? { ...i, quantity: Number(i.quantity) + 1 } : i));
      }
      return [
        ...prev,
        { product: product.id, name: product.name, quantity: 1, unit_price: Number(product.selling_price), discount_amount: 0, gst_rate: Number(product.gst_rate) },
      ];
    });
  };

  const updateCartItem = (productId: number, field: keyof CartItem, value: string) => {
    setCart((prev) => prev.map((i) => (i.product === productId ? { ...i, [field]: Number(value) } : i)));
  };

  const removeFromCart = (productId: number) => setCart((prev) => prev.filter((i) => i.product !== productId));

  const totals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    for (const item of cart) {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      const discount = Number(item.discount_amount) || 0;
      const taxable = qty * price - discount;
      subtotal += qty * price;
      tax += (taxable * (Number(item.gst_rate) || 0)) / 100;
    }
    return { subtotal, tax, total: subtotal - cart.reduce((s, i) => s + (Number(i.discount_amount) || 0), 0) + tax };
  }, [cart]);

  const addPaymentRow = () => setPayments([...payments, { mode: "cash", amount: "" }]);
  const removePaymentRow = (index: number) => setPayments(payments.filter((_, i) => i !== index));
  const updatePaymentRow = (index: number, field: keyof PaymentRow, value: string) => {
    const next = [...payments];
    next[index] = { ...next[index], [field]: value } as PaymentRow;
    setPayments(next);
  };

  const paidSoFar = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  const handleHold = () => submitSale("draft");
  const handleCheckout = () => submitSale("completed");

  const submitSale = async (status: SaleStatus) => {
    setError("");
    setSuccess(null);
    if (cart.length === 0) {
      setError("Add at least one product to the cart.");
      return;
    }
    setSubmitting(true);
    try {
      const sale = await createSale({
        customer: selectedCustomer ? String(selectedCustomer.id) : null,
        status,
        payment_mode: payments.length > 1 ? "split" : paymentMode,
        items_input: cart.map((i) => ({
          product: i.product,
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount_amount: i.discount_amount || 0,
        })),
        payments_input:
          status === "completed" ? payments.filter((p) => Number(p.amount) > 0).map((p) => ({ mode: p.mode, amount: p.amount })) : [],
      });
      setSuccess(sale);
      setCart([]);
      setPayments([{ mode: "cash", amount: "" }]);
      setSelectedCustomer(null);
    } catch (err: any) {
      setError(JSON.stringify(err.response?.data || "Failed to complete sale."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Hero Banner Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-950 via-violet-900 to-indigo-950 p-8 rounded-3xl shadow-2xl text-white border border-violet-800/60">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-purple-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-72 h-72 bg-violet-500/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-3 bg-gradient-to-tr from-purple-600 via-violet-600 to-indigo-400 text-white rounded-2xl shadow-lg shadow-purple-600/40">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-violet-300">Point of Sale Terminal</span>
                <h1 className="text-3xl font-black tracking-tight text-white">Billing & Checkout</h1>
              </div>
            </div>
            <p className="text-sm text-violet-100/90 mt-2 max-w-2xl leading-relaxed">
              Instant POS terminal: barcode lookup, live cart calculation, automatic GST computation, split payments, and instant invoice PDF receipts.
            </p>
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center justify-between text-sm shadow-md">
          <span className="text-emerald-950 font-extrabold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Sale {success.invoice_number} completed successfully — Total ₹{Number(success.total_amount).toFixed(2)}
          </span>
          <div className="flex gap-3">
            <button
              onClick={() => openInvoicePdf(success.id, success.invoice_number)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition"
            >
              Download PDF Invoice
            </button>
            <button onClick={() => navigate("/sales")} className="px-4 py-2 bg-violet-100 text-violet-900 font-bold rounded-xl text-xs hover:bg-violet-200 transition">View All Sales</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <PaginatedSearchSelect<Product>
            selected={null}
            onSelect={(product) => product && addToCart(product)}
            fetchPage={fetchBillingProductsPage}
            getId={(p) => p.id}
            getLabel={(p) => p.name}
            allowClear={false}
            clearOnSelect
            placeholder="Search product by name, SKU, or barcode..."
            inputClassName="w-full text-sm font-semibold border border-violet-200 rounded-2xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 shadow-md shadow-violet-100/40 text-violet-950 placeholder-violet-400"
            renderOption={(p) => (
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-extrabold text-violet-950">{p.name}</span>{" "}
                  <span className="text-violet-400 font-mono text-xs">({p.sku})</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-purple-900">₹{Number(p.selling_price).toFixed(2)}</span>
                  <span className="text-xs text-violet-400 block">Stock: {p.stock_quantity}</span>
                </div>
              </div>
            )}
          />

          <div className="bg-white rounded-3xl border border-violet-200/80 shadow-2xl shadow-violet-100/60 overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-purple-950 via-violet-900 to-indigo-950 text-violet-100 uppercase text-[11px] font-extrabold tracking-wider border-b border-violet-800/80">
                  <th className="px-4 py-3.5">Product</th>
                  <th className="px-4 py-3.5 w-24">Qty</th>
                  <th className="px-4 py-3.5 w-28">Price</th>
                  <th className="px-4 py-3.5 w-24">Discount</th>
                  <th className="px-4 py-3.5 text-right">Line Total</th>
                  <th className="px-4 py-3.5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-100/60">
                {cart.map((item) => {
                  const lineTotal = Number(item.quantity) * Number(item.unit_price) - Number(item.discount_amount || 0);
                  return (
                    <tr key={item.product} className="hover:bg-violet-50/50 transition-colors">
                      <td className="px-4 py-3 font-extrabold text-violet-950">{item.name}</td>
                      <td className="px-4 py-3">
                        <input type="number" step="0.01" value={item.quantity} onChange={(e) => updateCartItem(item.product, "quantity", e.target.value)} className="w-20 border border-violet-200 rounded-xl px-2 py-1 text-sm font-semibold bg-violet-50/40 focus:bg-white" />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" step="0.01" value={item.unit_price} onChange={(e) => updateCartItem(item.product, "unit_price", e.target.value)} className="w-24 border border-violet-200 rounded-xl px-2 py-1 text-sm font-semibold bg-violet-50/40 focus:bg-white" />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" step="0.01" value={item.discount_amount} onChange={(e) => updateCartItem(item.product, "discount_amount", e.target.value)} className="w-20 border border-violet-200 rounded-xl px-2 py-1 text-sm font-semibold bg-violet-50/40 focus:bg-white" />
                      </td>
                      <td className="px-4 py-3 text-right font-black text-violet-950">₹{lineTotal.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => removeFromCart(item.product)} className="text-rose-600 hover:text-rose-800 font-bold text-xs">Remove</button>
                      </td>
                    </tr>
                  );
                })}
                {cart.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-violet-400 font-semibold italic">Cart is empty. Search products above to add items.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Checkout Side Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-violet-200/80 shadow-xl shadow-violet-100/60 p-5 space-y-3">
            <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider">Select Customer</label>
            <PaginatedSearchSelect<Customer>
              selected={selectedCustomer}
              onSelect={setSelectedCustomer}
              fetchPage={fetchBillingCustomersPage}
              getId={(c) => c.id}
              getLabel={(c) => (c.phone ? `${c.name} (${c.phone})` : c.name)}
              placeholder="Walk-in Customer"
              inputClassName="w-full text-sm font-extrabold border border-violet-200 rounded-xl px-3.5 py-2.5 bg-white text-violet-950 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
            />
          </div>

          <div className="bg-gradient-to-br from-purple-950 via-violet-900 to-indigo-950 text-white rounded-3xl shadow-2xl p-6 space-y-3 border border-violet-800/60">
            <div className="flex justify-between text-xs text-violet-200 font-semibold"><span>Subtotal</span><span>₹{totals.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-xs text-violet-200 font-semibold"><span>Tax (GST Breakdown)</span><span>₹{totals.tax.toFixed(2)}</span></div>
            <div className="flex justify-between text-xl font-black text-white border-t border-violet-800/80 pt-3"><span>Grand Total</span><span>₹{totals.total.toFixed(2)}</span></div>
          </div>

          <div className="bg-white rounded-3xl border border-violet-200/80 shadow-xl shadow-violet-100/60 p-5 space-y-3">
            <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider">Payment Method</label>
            {payments.map((p, index) => (
              <div key={index} className="flex gap-2">
                <select value={p.mode} onChange={(e) => updatePaymentRow(index, "mode", e.target.value)} className="border border-violet-200 rounded-xl px-3 py-2 text-sm font-extrabold bg-white text-violet-950 flex-1">
                  <option value="cash">Cash</option>
                  <option value="upi">UPI / Online</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="credit">Credit / Customer Due</option>
                </select>
                <input
                  type="number" step="0.01" placeholder="Amount" value={p.amount}
                  onChange={(e) => updatePaymentRow(index, "amount", e.target.value)}
                  className="border border-violet-200 rounded-xl px-3 py-2 text-sm font-semibold bg-violet-50/40 w-28"
                />
                {payments.length > 1 && (
                  <button onClick={() => removePaymentRow(index)} className="text-rose-600 font-extrabold text-xs px-1">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addPaymentRow} className="text-xs text-violet-700 hover:text-purple-800 font-extrabold">+ Add Split Payment</button>
            <div className="text-xs text-violet-900 font-semibold pt-1">
              Paid: ₹{paidSoFar.toFixed(2)} / ₹{totals.total.toFixed(2)}
              {paidSoFar < totals.total && <span className="text-rose-600 font-bold block mt-0.5"> (Balance becomes due on account)</span>}
            </div>
          </div>

          {error && <div className="text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">{error}</div>}

          <div className="flex gap-3">
            <button onClick={handleHold} disabled={submitting} className="flex-1 bg-violet-100 hover:bg-violet-200 text-violet-950 text-sm font-extrabold py-3 rounded-2xl transition border border-violet-200">
              Hold Bill
            </button>
            <button onClick={handleCheckout} disabled={submitting} className="flex-1 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 text-white text-sm font-black py-3 rounded-2xl shadow-lg shadow-violet-600/40 transition">
              {submitting ? "Processing..." : "Complete Checkout"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
