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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Products</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded"
        >
          {showForm ? "Close" : "+ Add Product"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required className="border rounded px-3 py-2 text-sm" />
            <input name="sku" placeholder="SKU" value={form.sku} onChange={handleChange} required className="border rounded px-3 py-2 text-sm" />
            <input name="barcode" placeholder="Barcode" value={form.barcode} onChange={handleChange} className="border rounded px-3 py-2 text-sm" />
            <input name="unit" placeholder="Unit (pcs/kg)" value={form.unit} onChange={handleChange} className="border rounded px-3 py-2 text-sm" />
            <input name="hsn_code" placeholder="HSN Code" value={form.hsn_code} onChange={handleChange} className="border rounded px-3 py-2 text-sm" />
            <input name="purchase_price" type="number" step="0.01" placeholder="Purchase Price" value={form.purchase_price} onChange={handleChange} className="border rounded px-3 py-2 text-sm" />
            <input name="selling_price" type="number" step="0.01" placeholder="Selling Price" value={form.selling_price} onChange={handleChange} className="border rounded px-3 py-2 text-sm" />
            <input name="gst_rate" type="number" step="0.01" placeholder="GST %" value={form.gst_rate} onChange={handleChange} className="border rounded px-3 py-2 text-sm" />
            <input name="low_stock_threshold" type="number" step="0.01" placeholder="Low Stock Threshold" value={form.low_stock_threshold} onChange={handleChange} className="border rounded px-3 py-2 text-sm" />
            <select name="category" value={form.category} onChange={handleChange} className="border rounded px-3 py-2 text-sm">
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="flex gap-1 col-span-2">
              <input placeholder="New category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="border rounded px-3 py-2 text-sm flex-1" />
              <button type="button" onClick={handleAddCategory} className="bg-gray-200 hover:bg-gray-300 px-3 rounded text-sm">Add</button>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded">
              {editingId ? "Update Product" : "Save Product"}
            </button>
            <button type="button" onClick={resetForm} className="text-sm text-gray-500 px-4 py-2">Cancel</button>
          </div>
        </form>
      )}

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          placeholder="Search by name, SKU, barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 text-sm flex-1 max-w-sm"
        />
        <button type="submit" className="bg-gray-200 hover:bg-gray-300 text-sm px-4 py-2 rounded">Search</button>
      </form>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b bg-gray-50">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">SKU</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2 text-right">Selling Price</th>
              <th className="px-4 py-2 text-right">GST %</th>
              <th className="px-4 py-2 text-right">Stock</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2 text-gray-500">{p.sku}</td>
                <td className="px-4 py-2 text-gray-500">{p.category_name || "-"}</td>
                <td className="px-4 py-2 text-right">₹{Number(p.selling_price).toFixed(2)}</td>
                <td className="px-4 py-2 text-right">{p.gst_rate}%</td>
                <td className={`px-4 py-2 text-right font-medium ${p.is_low_stock ? "text-red-600" : "text-gray-800"}`}>
                  {p.stock_quantity}
                </td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => handleEdit(p)} className="text-blue-600 hover:text-blue-700 text-xs font-medium">Edit</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
