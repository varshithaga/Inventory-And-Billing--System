import api from "../../api/client";
import type { Category, PaginatedResponse, Product } from "../../types";

function unwrap<T>(data: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

export async function fetchProducts(search = ""): Promise<Product[]> {
  const res = await api.get<PaginatedResponse<Product> | Product[]>("/products/", {
    params: search ? { search } : {},
  });
  return unwrap(res.data);
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await api.get<PaginatedResponse<Category> | Category[]>("/categories/");
  return unwrap(res.data);
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
