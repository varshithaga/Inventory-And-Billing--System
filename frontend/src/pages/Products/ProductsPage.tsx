import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type { Category, Product } from "../../types";
import { createCategory, createProduct, fetchCategories, fetchProducts, updateProduct } from "./api";
import { useAuth } from "../../context/AuthContext";

interface ProductForm {
  name: string;
  sku: string;
  category: string;
  new_category_name: string;
  purchase_price: string;
  selling_price: string;
  gst_rate: string;
  stock_quantity: string;
  low_stock_threshold: string;
}

const emptyForm: ProductForm = {
  name: "",
  sku: "",
  category: "",
  new_category_name: "",
  purchase_price: "",
  selling_price: "",
  gst_rate: "18.00",
  stock_quantity: "0",
  low_stock_threshold: "5",
};

export default function ProductsPage() {
  const { user } = useAuth();
  const isStaff = user?.role === "staff";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [catError, setCatError] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const loadProducts = () => {
    fetchProducts().then((res: any) => setProducts(Array.isArray(res) ? res : res.results || []));
  };

  const loadCategories = () => {
    fetchCategories().then((res: any) => setCategories(Array.isArray(res) ? res : res.results || []));
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEditModal = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      sku: p.sku,
      category: p.category ? String(p.category) : "",
      new_category_name: "",
      purchase_price: p.purchase_price,
      selling_price: p.selling_price,
      gst_rate: p.gst_rate,
      stock_quantity: p.stock_quantity.toString(),
      low_stock_threshold: p.low_stock_threshold.toString(),
    });
    setError("");
    setShowForm(true);
  };

  const handleCreateCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCatError("");
    try {
      const created = await createCategory(newCatName.trim());
      await loadCategories();
      setNewCatName("");
      setShowCategoryModal(false);
      setForm((prev) => ({ ...prev, category: String(created.id) }));
    } catch {
      setCatError("Failed to add category.");
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      let catId = form.category ? Number(form.category) : undefined;
      if (!catId && form.new_category_name.trim()) {
        const newCat = await createCategory(form.new_category_name.trim());
        catId = newCat.id;
        loadCategories();
      }

      const payload = {
        name: form.name,
        sku: form.sku,
        category: catId,
        purchase_price: form.purchase_price,
        selling_price: form.selling_price,
        gst_rate: form.gst_rate,
        stock_quantity: Number(form.stock_quantity),
        low_stock_threshold: Number(form.low_stock_threshold),
      };

      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }

      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      loadProducts();
    } catch {
      setError("Failed to save product. Verify SKU uniqueness.");
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.barcode || "").toLowerCase().includes(q);
    const matchesCategory = !categoryFilter || String(p.category) === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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
                <span className="text-xs font-bold uppercase tracking-wider text-violet-300">Catalog Management</span>
                <h1 className="text-3xl font-black tracking-tight text-white">Product Inventory</h1>
              </div>
            </div>
            <p className="text-sm text-violet-100/90 mt-2 max-w-2xl leading-relaxed">
              Maintain central product catalog, cost & selling pricing tiers, GST tax slabs, stock levels, and category classifications.
            </p>
          </div>

          {!isStaff && (
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setShowCategoryModal(true)}
                className="flex items-center gap-2 bg-violet-900/60 hover:bg-violet-800 text-white font-extrabold px-4 py-3.5 rounded-2xl border border-violet-700/60 shadow-lg transition backdrop-blur-sm"
              >
                <svg className="w-5 h-5 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 11h.01M7 15h.01M13 7h7M13 11h7M13 15h7" />
                </svg>
                <span>Manage Categories</span>
              </button>

              <button
                onClick={openCreateModal}
                className="group flex items-center gap-2.5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-5 py-3.5 rounded-2xl shadow-xl shadow-violet-600/40 transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add New Product</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-violet-200/80 shadow-xl shadow-violet-100/60 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <input
            placeholder="Search products by name, SKU, or barcode..."
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-full text-sm font-semibold border border-violet-200 rounded-2xl px-4 py-3 bg-violet-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 text-violet-950 placeholder-violet-400"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full md:w-64 text-sm font-extrabold border border-violet-200 rounded-2xl px-4 py-3 bg-white text-violet-950 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-violet-200/80 shadow-2xl shadow-violet-100/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-purple-950 via-violet-900 to-indigo-950 text-violet-100 uppercase text-[11px] font-extrabold tracking-wider border-b border-violet-800/80">
                <th className="px-6 py-4.5">Product Info</th>
                <th className="px-6 py-4.5">Category</th>
                <th className="px-6 py-4.5 text-right">Purchase Price</th>
                <th className="px-6 py-4.5 text-right">Selling Price</th>
                <th className="px-6 py-4.5 text-right">GST %</th>
                <th className="px-6 py-4.5 text-right">Current Stock</th>
                {!isStaff && <th className="px-6 py-4.5 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-100/60 text-sm">
              {filteredProducts.map((p) => {
                const low = p.stock_quantity <= p.low_stock_threshold;
                return (
                  <tr key={p.id} className="hover:bg-violet-50/60 transition-colors duration-150">
                    <td className="px-6 py-4.5">
                      <div className="font-extrabold text-violet-950">{p.name}</div>
                      <div className="text-xs font-mono text-violet-800/80">SKU: {p.sku}</div>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-violet-100/80 text-violet-900 border border-violet-200">
                        {p.category_name || "Uncategorized"}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-right font-mono font-bold text-violet-800">₹{Number(p.purchase_price).toFixed(2)}</td>
                    <td className="px-6 py-4.5 text-right font-black text-violet-950">₹{Number(p.selling_price).toFixed(2)}</td>
                    <td className="px-6 py-4.5 text-right font-semibold text-violet-800">{p.gst_rate}%</td>
                    <td className="px-6 py-4.5 text-right">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black ${
                        low ? "bg-rose-100 text-rose-800 border border-rose-300" : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      }`}>
                        {p.stock_quantity} units
                      </span>
                    </td>
                    {!isStaff && (
                      <td className="px-6 py-4.5 text-right">
                        <button
                          onClick={() => openEditModal(p)}
                          className="px-3.5 py-1.5 bg-violet-100/80 hover:bg-violet-200 text-violet-900 font-extrabold text-xs rounded-xl border border-violet-200 transition"
                        >
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={isStaff ? 6 : 7} className="px-6 py-12 text-center text-violet-400 font-semibold italic">
                    No products found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT PRODUCT MODAL POPUP */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-violet-200 overflow-hidden transform transition-all my-8 animate-fade-in">
            <div className="bg-gradient-to-r from-purple-950 via-violet-900 to-indigo-950 text-white px-7 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-violet-600/30 text-violet-300 rounded-2xl border border-violet-500/30">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </span>
                <div>
                  <h2 className="text-lg font-extrabold text-white">{editingId ? "Edit Product Details" : "Create New Product"}</h2>
                  <p className="text-xs text-violet-200">Fill in pricing, tax rates, inventory units, and category.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-violet-300 hover:text-white transition p-1.5 rounded-xl hover:bg-violet-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-7 space-y-4 max-h-[75vh] overflow-y-auto">
              {error && <div className="text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">{error}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Product Name *</label>
                  <input placeholder="e.g. Wireless Mouse" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">SKU / Code *</label>
                  <input placeholder="e.g. WM-100" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full text-sm font-semibold border border-violet-200 rounded-xl px-3.5 py-2.5 bg-white text-violet-950 focus:ring-2 focus:ring-violet-500/30">
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Purchase Price ₹ *</label>
                  <input type="number" step="0.01" required value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 font-semibold" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Selling Price ₹ *</label>
                  <input type="number" step="0.01" required value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 font-semibold" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">GST Tax Rate %</label>
                  <input type="number" step="0.01" value={form.gst_rate} onChange={(e) => setForm({ ...form, gst_rate: e.target.value })} className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 font-semibold" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Initial Stock Qty</label>
                  <input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 font-semibold" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Low Stock Alert Level</label>
                  <input type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 font-semibold" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-violet-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 text-sm font-bold text-violet-800 hover:bg-violet-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-violet-600/30 transition">
                  {editingId ? "Update Product" : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEDICATED CATEGORY MODAL POPUP */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-violet-200 overflow-hidden transform transition-all my-8">
            <div className="bg-gradient-to-r from-purple-950 via-violet-900 to-indigo-950 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-base">Category Management</h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-violet-300 hover:text-white text-lg font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
              {catError && <div className="text-xs font-bold text-rose-800 bg-rose-50 p-3 rounded-xl border border-rose-200">{catError}</div>}
              <div>
                <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">New Category Name</label>
                <input placeholder="e.g. Beverages" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white font-semibold" autoFocus />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="px-4 py-2 text-xs font-bold text-violet-800 hover:bg-violet-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-md">Add Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
