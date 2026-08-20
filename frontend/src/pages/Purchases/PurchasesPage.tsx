import { useEffect, useState, type FormEvent } from "react";
import type { Product, Purchase, Supplier } from "../../types";
import { createPurchase, fetchPurchaseProducts, fetchPurchaseSuppliers, fetchPurchases } from "./api";
import { useAuth } from "../../context/AuthContext";

interface PurchaseItemForm {
  product: string;
  quantity: string;
  purchase_price: string;
  gst_rate: string;
}

const emptyItem: PurchaseItemForm = { product: "", quantity: "1", purchase_price: "", gst_rate: "" };

export default function PurchasesPage() {
  const { user } = useAuth();
  const isStaff = user?.role === "staff";

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplier, setSupplier] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<PurchaseItemForm[]>([{ ...emptyItem }]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const loadPurchases = () => {
    fetchPurchases().then((res: any) => setPurchases(Array.isArray(res) ? res : res.results || []));
  };

  useEffect(() => {
    loadPurchases();
    fetchPurchaseProducts().then((res: any) => setProducts(Array.isArray(res) ? res : res.results || []));
    fetchPurchaseSuppliers().then((res: any) => setSuppliers(Array.isArray(res) ? res : res.results || []));
  }, []);

  const updateItem = (index: number, field: keyof PurchaseItemForm, value: string) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    if (field === "product") {
      const product = products.find((p) => String(p.id) === String(value));
      if (product) {
        next[index].purchase_price = product.purchase_price;
        next[index].gst_rate = product.gst_rate;
      }
    }
    setItems(next);
  };

  const addRow = () => setItems([...items, { ...emptyItem }]);
  const removeRow = (index: number) => setItems(items.filter((_, i) => i !== index));

  const resetForm = () => {
    setSupplier("");
    setItems([{ ...emptyItem }]);
    setShowForm(false);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      await createPurchase({
        supplier,
        purchase_date: purchaseDate,
        items: items
          .filter((i) => i.product)
          .map((i) => ({
            product: i.product,
            quantity: i.quantity,
            purchase_price: i.purchase_price,
            gst_rate: i.gst_rate || 0,
          })),
      });
      resetForm();
      loadPurchases();
    } catch (err: any) {
      setError(JSON.stringify(err.response?.data || "Failed to save purchase."));
    }
  };

  const total = items.reduce((sum, i) => {
    const qty = parseFloat(i.quantity) || 0;
    const price = parseFloat(i.purchase_price) || 0;
    const gst = parseFloat(i.gst_rate) || 0;
    return sum + qty * price * (1 + gst / 100);
  }, 0);

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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-violet-300">Procurement & Orders</span>
                <h1 className="text-3xl font-black tracking-tight text-white">Purchase Orders</h1>
              </div>
            </div>
            <p className="text-sm text-violet-100/90 mt-2 max-w-2xl leading-relaxed">
              Record stock replenishment orders, supplier Invoices, itemized costs, GST tax breakdown, and payables.
            </p>
          </div>

          {!isStaff && (
            <button
              onClick={() => setShowForm(true)}
              className="group flex items-center gap-2.5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-5 py-3.5 rounded-2xl shadow-xl shadow-violet-600/40 transition-all duration-200 transform hover:-translate-y-0.5 shrink-0"
            >
              <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>New Purchase Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-violet-200/80 shadow-2xl shadow-violet-100/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-purple-950 via-violet-900 to-indigo-950 text-violet-100 uppercase text-[11px] font-extrabold tracking-wider border-b border-violet-800/80">
                <th className="px-6 py-4.5">Date</th>
                <th className="px-6 py-4.5">Supplier</th>
                <th className="px-6 py-4.5">Status</th>
                <th className="px-6 py-4.5 text-right">Total Amount</th>
                <th className="px-6 py-4.5 text-right">Balance Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-100/60 text-sm">
              {purchases.map((p) => (
                <tr key={p.id} className="hover:bg-violet-50/60 transition-colors duration-150">
                  <td className="px-6 py-4.5 font-mono text-xs font-bold text-violet-900">{p.purchase_date}</td>
                  <td className="px-6 py-4.5 font-extrabold text-violet-950">{p.supplier_name}</td>
                  <td className="px-6 py-4.5">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-violet-100/80 text-violet-900 border border-violet-200 capitalize">
                      {p.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4.5 text-right font-black text-violet-950">₹{Number(p.total_amount).toFixed(2)}</td>
                  <td className="px-6 py-4.5 text-right font-black text-rose-600">₹{Number(p.balance_due).toFixed(2)}</td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-violet-400 font-semibold italic">No purchase records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PURCHASE MODAL POPUP */}
      {!isStaff && showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-violet-200 overflow-hidden transform transition-all my-8 animate-fade-in">
            <div className="bg-gradient-to-r from-purple-950 via-violet-900 to-indigo-950 text-white px-7 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-violet-600/30 text-violet-300 rounded-2xl border border-violet-500/30">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                </span>
                <div>
                  <h2 className="text-lg font-extrabold text-white">Create Purchase Order</h2>
                  <p className="text-xs text-violet-200">Record inventory purchase order and itemized costs.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="text-violet-300 hover:text-white transition p-1.5 rounded-xl hover:bg-violet-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-7 space-y-5 max-h-[75vh] overflow-y-auto">
              {error && <div className="text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">{error}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Supplier *</label>
                  <select required value={supplier} onChange={(e) => setSupplier(e.target.value)} className="w-full text-sm font-extrabold border border-violet-200 rounded-xl px-3.5 py-2.5 bg-white text-violet-950 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500">
                    <option value="">Select supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Purchase Date</label>
                  <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider">Purchase Line Items</label>
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-violet-50/40 p-3 rounded-2xl border border-violet-100">
                    <div className="md:col-span-4">
                      <select
                        value={item.product}
                        onChange={(e) => updateItem(index, "product", e.target.value)}
                        className="w-full text-sm font-semibold border border-violet-200 rounded-xl px-3 py-2 bg-white text-violet-950"
                      >
                        <option value="">Select product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <input
                        type="number" step="0.01" placeholder="Qty" value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", e.target.value)}
                        className="w-full text-sm font-semibold border border-violet-200 rounded-xl px-3 py-2 bg-white"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <input
                        type="number" step="0.01" placeholder="Purchase Price ₹" value={item.purchase_price}
                        onChange={(e) => updateItem(index, "purchase_price", e.target.value)}
                        className="w-full text-sm font-semibold border border-violet-200 rounded-xl px-3 py-2 bg-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <input
                        type="number" step="0.01" placeholder="GST %" value={item.gst_rate}
                        onChange={(e) => updateItem(index, "gst_rate", e.target.value)}
                        className="w-full text-sm font-semibold border border-violet-200 rounded-xl px-3 py-2 bg-white"
                      />
                    </div>
                    <div className="md:col-span-1 text-right">
                      <button type="button" onClick={() => removeRow(index)} className="p-1 text-rose-600 hover:text-rose-800 font-bold text-xs">Remove</button>
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addRow} className="text-xs font-bold text-violet-700 hover:text-purple-800 bg-violet-100 px-3.5 py-2 rounded-xl border border-violet-200 transition">+ Add Item Row</button>

              <div className="flex items-center justify-between border-t border-violet-100 pt-4">
                <div className="text-sm font-semibold text-violet-900">
                  Estimated Total: <span className="text-lg font-black text-violet-950 ml-1">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-5 py-2.5 text-sm font-bold text-violet-800 hover:bg-violet-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-violet-600/30 transition">
                    Save Purchase Order
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
