import api from "../../api/client";
import type { Category, PaginatedResponse, Product } from "../../types";

// The "Manage Categories" modal lists every category as pills, so it needs
// every row in one shot — pull up to the backend's max_page_size instead of
// paginating it.
const LOOKUP_LIMIT = 500;

function unwrap<T>(data: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

export async function fetchProducts(search = "", page = 1, category = ""): Promise<PaginatedResponse<Product>> {
  const res = await api.get<PaginatedResponse<Product>>("/products/", {
    params: { ...(search ? { search } : {}), ...(category ? { category } : {}), page },
  });
  return res.data;
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await api.get<PaginatedResponse<Category> | Category[]>("/categories/", {
    params: { limit: LOOKUP_LIMIT },
  });
  return unwrap(res.data);
}

// Backend-connected, paginated category lookup for the searchable dropdown —
// loads more results as the user scrolls instead of fetching everything.
export async function fetchCategoriesPage(search = "", page = 1): Promise<PaginatedResponse<Category>> {
  const res = await api.get<PaginatedResponse<Category>>("/categories/", {
    params: { ...(search ? { search } : {}), page },
  });
  return res.data;
}

export interface ProductPayload {
  name: string;
  sku: string;
  barcode: string;
  category: string | null;
  unit: string;
  hsn_code: string;
  purchase_price: string | number;
  selling_price: string | number;
  gst_rate: string | number;
  low_stock_threshold: string | number;
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  const res = await api.post<Product>("/products/", payload);
  return res.data;
}

export async function updateProduct(id: number, payload: ProductPayload): Promise<Product> {
  const res = await api.patch<Product>(`/products/${id}/`, payload);
  return res.data;
}

export async function createCategory(name: string): Promise<Category> {
  const res = await api.post<Category>("/categories/", { name });
  return res.data;
}
