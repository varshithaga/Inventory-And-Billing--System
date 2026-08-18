import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { openInvoicePdf } from "../utils/downloadInvoice";

export default function BillingPage() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]); // {product, name, quantity, unit_price, discount_amount, gst_rate}
  const [customer, setCustomer] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [payments, setPayments] = useState([{ mode: "cash", amount: "" }]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/products/").then((res) => setProducts(res.data.results ?? res.data));
    api.get("/customers/").then((res) => setCustomers(res.data.results ?? res.data));
  }, []);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.barcode || "").toLowerCase().includes(q))
      .slice(0, 8);
  }, [search, products]);

  const addToCart = (product) => {
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
    setSearch("");
  };

  const updateCartItem = (productId, field, value) => {
    setCart((prev) => prev.map((i) => (i.product === productId ? { ...i, [field]: value } : i)));
  };

  const removeFromCart = (productId) => setCart((prev) => prev.filter((i) => i.product !== productId));

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
  const removePaymentRow = (index) => setPayments(payments.filter((_, i) => i !== index));
  const updatePaymentRow = (index, field, value) => {
    const next = [...payments];
    next[index] = { ...next[index], [field]: value };
    setPayments(next);
  };

  const paidSoFar = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  const handleHold = () => submitSale("draft");
  const handleCheckout = () => submitSale("completed");

  const submitSale = async (status) => {
    setError("");
    setSuccess(null);
    if (cart.length === 0) {
      setError("Add at least one product to the cart.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/sales/", {
        customer: customer || null,
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
      setSuccess(res.data);
      setCart([]);
      setPayments([{ mode: "cash", amount: "" }]);
      setCustomer("");
    } catch (err) {
      setError(JSON.stringify(err.response?.data || "Failed to complete sale."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Billing / POS</h1>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-green-800">
            Sale {success.invoice_number} completed — Total ₹{Number(success.total_amount).toFixed(2)}
          </span>
          <div className="flex gap-3">
            <button
              onClick={() => openInvoicePdf(success.id, success.invoice_number)}
              className="text-sm text-blue-600 font-medium"
            >
              Download Invoice PDF
            </button>
            <button onClick={() => navigate("/sales")} className="text-sm text-gray-500">View Sales</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <input
              placeholder="Search product by name, SKU, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            />
            {filteredProducts.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-64 overflow-y-auto">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addToCart(p)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex justify-between"
                  >
                    <span>{p.name} <span className="text-gray-400">({p.sku})</span></span>
                    <span className="text-gray-500">₹{Number(p.selling_price).toFixed(2)} · stock {p.stock_quantity}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b bg-gray-50">
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2 w-24">Qty</th>
                  <th className="px-3 py-2 w-28">Price</th>
                  <th className="px-3 py-2 w-24">Discount</th>
                  <th className="px-3 py-2 text-right">Line Total</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => {
                  const lineTotal = Number(item.quantity) * Number(item.unit_price) - Number(item.discount_amount || 0);
                  return (
                    <tr key={item.product} className="border-b last:border-0">
                      <td className="px-3 py-2">{item.name}</td>
                      <td className="px-3 py-2">
                        <input type="number" step="0.01" value={item.quantity} onChange={(e) => updateCartItem(item.product, "quantity", e.target.value)} className="w-20 border rounded px-2 py-1" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" step="0.01" value={item.unit_price} onChange={(e) => updateCartItem(item.product, "unit_price", e.target.value)} className="w-24 border rounded px-2 py-1" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" step="0.01" value={item.discount_amount} onChange={(e) => updateCartItem(item.product, "discount_amount", e.target.value)} className="w-20 border rounded px-2 py-1" />
                      </td>
                      <td className="px-3 py-2 text-right">₹{lineTotal.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => removeFromCart(item.product)} className="text-red-500 text-xs">Remove</button>
                      </td>
                    </tr>
                  );
                })}
                {cart.length === 0 && (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">Cart is empty. Search and add products above.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
            <label className="block text-sm font-medium text-gray-700">Customer</label>
            <select value={customer} onChange={(e) => setCustomer(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
              <option value="">Walk-in Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>₹{totals.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm text-gray-600"><span>Tax (GST)</span><span>₹{totals.tax.toFixed(2)}</span></div>
            <div className="flex justify-between text-base font-semibold text-gray-800 border-t pt-2"><span>Total</span><span>₹{totals.total.toFixed(2)}</span></div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment</label>
            {payments.map((p, index) => (
              <div key={index} className="flex gap-2">
                <select value={p.mode} onChange={(e) => updatePaymentRow(index, "mode", e.target.value)} className="border rounded px-2 py-1 text-sm flex-1">
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="credit">Credit/Due</option>
                </select>
                <input
                  type="number" step="0.01" placeholder="Amount" value={p.amount}
                  onChange={(e) => updatePaymentRow(index, "amount", e.target.value)}
                  className="border rounded px-2 py-1 text-sm w-24"
                />
                {payments.length > 1 && (
                  <button onClick={() => removePaymentRow(index)} className="text-red-500 text-xs">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addPaymentRow} className="text-xs text-blue-600 font-medium">+ Split payment</button>
            <div className="text-xs text-gray-500 pt-1">
              Paid: ₹{paidSoFar.toFixed(2)} / ₹{totals.total.toFixed(2)}
              {paidSoFar < totals.total && <span className="text-orange-600"> (remainder becomes credit/due)</span>}
            </div>
          </div>

          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}

          <div className="flex gap-2">
            <button onClick={handleHold} disabled={submitting} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium py-2 rounded">
              Hold Bill
            </button>
            <button onClick={handleCheckout} disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded">
              {submitting ? "Processing..." : "Checkout"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
