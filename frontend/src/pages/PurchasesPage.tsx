import { useEffect, useState, type FormEvent } from "react";
import api from "../api/client";
import type { PaginatedResponse, Product, Purchase, Supplier } from "../types";

interface PurchaseItemForm {
  product: string;
  quantity: string;
  purchase_price: string;
  gst_rate: string;
}

const emptyItem: PurchaseItemForm = { product: "", quantity: "1", purchase_price: "", gst_rate: "" };

function unwrap<T>(data: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplier, setSupplier] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<PurchaseItemForm[]>([{ ...emptyItem }]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const loadPurchases = () => {
    api.get<PaginatedResponse<Purchase> | Purchase[]>("/purchases/").then((res) => setPurchases(unwrap(res.data)));
  };

  useEffect(() => {
    loadPurchases();
    api.get<PaginatedResponse<Product> | Product[]>("/products/").then((res) => setProducts(unwrap(res.data)));
    api.get<PaginatedResponse<Supplier> | Supplier[]>("/suppliers/").then((res) => setSuppliers(unwrap(res.data)));
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
      await api.post("/purchases/", {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Purchases</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded">
          {showForm ? "Close" : "+ New Purchase"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}

          <div className="grid grid-cols-2 gap-3 max-w-md">
            <select required value={supplier} onChange={(e) => setSupplier(e.target.value)} className="border rounded px-3 py-2 text-sm">
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="border rounded px-3 py-2 text-sm" />
          </div>

          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <select
                  value={item.product}
                  onChange={(e) => updateItem(index, "product", e.target.value)}
                  className="col-span-4 border rounded px-2 py-2 text-sm"
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
                <input
                  type="number" step="0.01" placeholder="Qty" value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", e.target.value)}
                  className="col-span-2 border rounded px-2 py-2 text-sm"
                />
                <input
                  type="number" step="0.01" placeholder="Purchase Price" value={item.purchase_price}
                  onChange={(e) => updateItem(index, "purchase_price", e.target.value)}
                  className="col-span-3 border rounded px-2 py-2 text-sm"
                />
                <input
                  type="number" step="0.01" placeholder="GST %" value={item.gst_rate}
                  onChange={(e) => updateItem(index, "gst_rate", e.target.value)}
                  className="col-span-2 border rounded px-2 py-2 text-sm"
                />
                <button type="button" onClick={() => removeRow(index)} className="col-span-1 text-red-500 text-xs">Remove</button>
              </div>
            ))}
          </div>

          <button type="button" onClick={addRow} className="text-sm text-blue-600 font-medium">+ Add item</button>

          <div className="flex items-center justify-between border-t pt-3">
            <div className="text-sm text-gray-600">Estimated Total: <span className="font-semibold text-gray-800">₹{total.toFixed(2)}</span></div>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded">Save Purchase</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b bg-gray-50">
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Supplier</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Total</th>
              <th className="px-4 py-2 text-right">Balance Due</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="px-4 py-2">{p.purchase_date}</td>
                <td className="px-4 py-2">{p.supplier_name}</td>
                <td className="px-4 py-2 capitalize">{p.status.replace("_", " ")}</td>
                <td className="px-4 py-2 text-right">₹{Number(p.total_amount).toFixed(2)}</td>
                <td className="px-4 py-2 text-right text-red-600">₹{Number(p.balance_due).toFixed(2)}</td>
              </tr>
            ))}
            {purchases.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No purchases yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
