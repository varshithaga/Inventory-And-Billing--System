import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type { Category, Product } from "../../types";
import { createCategory, createProduct, fetchCategories, fetchProducts, updateProduct } from "./api";

interface ProductForm {
  name: string;
  sku: string;
  barcode: string;
  category: string;
  unit: string;
  hsn_code: string;
  purchase_price: string;
  selling_price: string;
  gst_rate: string;
  low_stock_threshold: string;
}

const emptyForm: ProductForm = {
  name: "",
  sku: "",
  barcode: "",
  category: "",
  unit: "pcs",
  hsn_code: "",
  purchase_price: "",
  selling_price: "",
  gst_rate: "",
  low_stock_threshold: "5",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadProducts = (q = "") => {
    fetchProducts(q).then(setProducts);
  };

  const loadCategories = () => {
    fetchCategories().then(setCategories);
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    loadProducts(search);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const payload = {
      ...form,
      category: form.category || null,
      purchase_price: form.purchase_price || 0,
      selling_price: form.selling_price || 0,
      gst_rate: form.gst_rate || 0,
      low_stock_threshold: form.low_stock_threshold || 0,
    };
    try {
      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }
      resetForm();
      loadProducts(search);
    } catch (err: any) {
      setError(JSON.stringify(err.response?.data || "Failed to save product."));
    }
  };

  const handleEdit = (product: Product) => {
    setForm({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || "",
      category: product.category ? String(product.category) : "",
      unit: product.unit,
      hsn_code: product.hsn_code || "",
      purchase_price: product.purchase_price,
      selling_price: product.selling_price,
      gst_rate: product.gst_rate,
      low_stock_threshold: product.low_stock_threshold,
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    const category = await createCategory(newCategory.trim());
    setCategories([...categories, category]);
    setForm({ ...form, category: String(category.id) });
    setNewCategory("");
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-violet-300">Catalog & Inventory</span>
                <h1 className="text-3xl font-black tracking-tight text-white">Product Catalog</h1>
              </div>
            </div>
            <p className="text-sm text-violet-100/90 mt-2 max-w-2xl leading-relaxed">
              Manage product items, barcodes, pricing, HSN codes, category classification, and minimum stock threshold alerts.
            </p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="group flex items-center gap-2.5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-5 py-3.5 rounded-2xl shadow-xl shadow-violet-600/40 hover:shadow-violet-600/60 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 shrink-0"
          >
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>{showForm ? "Close Form" : "Add New Product"}</span>
          </button>
        </div>
      </div>

      {/* Form Drawer / Container */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-violet-200/80 shadow-2xl shadow-violet-100/60 p-7 space-y-4">
          <h2 className="text-base font-extrabold text-violet-950 border-b border-violet-100 pb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-600" />
            {editingId ? "Edit Product Details" : "Create New Product Entry"}
          </h2>

          {error && <div className="text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Product Name *</label>
              <input name="name" placeholder="Item Name" value={form.name} onChange={handleChange} required className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold" />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">SKU *</label>
              <input name="sku" placeholder="SKU Code" value={form.sku} onChange={handleChange} required className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold" />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Barcode</label>
              <input name="barcode" placeholder="Barcode" value={form.barcode} onChange={handleChange} className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold" />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Unit (pcs/kg)</label>
              <input name="unit" placeholder="pcs" value={form.unit} onChange={handleChange} className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold" />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">HSN Code</label>
              <input name="hsn_code" placeholder="HSN" value={form.hsn_code} onChange={handleChange} className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold" />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Purchase Price (₹)</label>
              <input name="purchase_price" type="number" step="0.01" placeholder="0.00" value={form.purchase_price} onChange={handleChange} className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold" />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Selling Price (₹)</label>
              <input name="selling_price" type="number" step="0.01" placeholder="0.00" value={form.selling_price} onChange={handleChange} className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold" />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">GST Rate (%)</label>
              <input name="gst_rate" type="number" step="0.01" placeholder="18" value={form.gst_rate} onChange={handleChange} className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold" />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Low Stock Limit</label>
              <input name="low_stock_threshold" type="number" step="0.01" placeholder="5" value={form.low_stock_threshold} onChange={handleChange} className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold" />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className="w-full text-sm font-extrabold border border-violet-200 rounded-xl px-3.5 py-2.5 bg-white text-violet-950 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500">
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Add Category</label>
              <div className="flex gap-2">
                <input placeholder="New Category Name" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold" />
                <button type="button" onClick={handleAddCategory} className="px-4 py-2.5 bg-violet-100 hover:bg-violet-200 text-violet-900 font-extrabold rounded-xl text-xs transition">Add</button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-violet-100">
            <button type="button" onClick={resetForm} className="px-5 py-2.5 text-sm font-bold text-violet-800 hover:bg-violet-100 rounded-xl transition">Cancel</button>
            <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl shadow-md transition">
              {editingId ? "Update Product" : "Save Product"}
            </button>
          </div>
        </form>
      )}

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="bg-gradient-to-r from-white via-violet-50/40 to-white p-5 rounded-2xl border border-violet-200/80 shadow-md shadow-violet-100/40 flex items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-violet-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            placeholder="Search products by name, SKU, or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 text-sm bg-violet-50/50 border border-violet-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all font-semibold text-violet-950 placeholder-violet-400"
          />
        </div>
        <button type="submit" className="px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl text-xs shadow-md transition">Search Catalog</button>
      </form>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-violet-200/80 shadow-2xl shadow-violet-100/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-purple-950 via-violet-900 to-indigo-950 text-violet-100 uppercase text-[11px] font-extrabold tracking-wider border-b border-violet-800/80">
                <th className="px-6 py-4.5">Product</th>
                <th className="px-6 py-4.5">SKU Code</th>
                <th className="px-6 py-4.5">Category</th>
                <th className="px-6 py-4.5 text-right">Selling Price</th>
                <th className="px-6 py-4.5 text-right">GST Rate</th>
                <th className="px-6 py-4.5 text-right">Stock Level</th>
                <th className="px-6 py-4.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-100/60 text-sm">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-violet-50/60 transition-colors duration-150">
                  <td className="px-6 py-4.5 font-extrabold text-violet-950">{p.name}</td>
                  <td className="px-6 py-4.5 font-mono text-xs font-bold text-violet-900/80">{p.sku}</td>
                  <td className="px-6 py-4.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-violet-100/80 text-violet-900 border border-violet-200">
                      {p.category_name || "Uncategorized"}
                    </span>
                  </td>
                  <td className="px-6 py-4.5 text-right font-black text-violet-950">₹{Number(p.selling_price).toFixed(2)}</td>
                  <td className="px-6 py-4.5 text-right font-bold text-violet-800">{p.gst_rate}%</td>
                  <td className="px-6 py-4.5 text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${p.is_low_stock ? "bg-rose-100 text-rose-800 border border-rose-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"}`}>
                      {p.stock_quantity} {p.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4.5 text-right">
                    <button onClick={() => handleEdit(p)} className="p-2 text-violet-600 hover:text-purple-800 hover:bg-violet-100/70 rounded-xl transition">Edit</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-violet-400 font-semibold italic">No products found in catalog.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
