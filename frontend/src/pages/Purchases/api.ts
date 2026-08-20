import api from "../../api/client";
import type { PaginatedResponse, Product, Purchase, Supplier } from "../../types";

// Dropdown/lookup fetches need every row in one shot, not just page 1 — pull
// up to the backend's max_page_size instead of paginating them.
const LOOKUP_LIMIT = 500;

function unwrap<T>(data: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

export async function fetchPurchases(search = "", page = 1): Promise<PaginatedResponse<Purchase>> {
  const res = await api.get<PaginatedResponse<Purchase>>("/purchases/", {
    params: { ...(search ? { search } : {}), page },
  });
  return res.data;
}

export async function fetchPurchaseProducts(): Promise<Product[]> {
  const res = await api.get<PaginatedResponse<Product> | Product[]>("/products/", {
    params: { limit: LOOKUP_LIMIT },
  });
  return unwrap(res.data);
}

export async function fetchPurchaseSuppliers(): Promise<Supplier[]> {
  const res = await api.get<PaginatedResponse<Supplier> | Supplier[]>("/suppliers/", {
    params: { limit: LOOKUP_LIMIT },
  });
  return unwrap(res.data);
}

export interface PurchaseItemInput {
  product: string;
  quantity: string;
  purchase_price: string;
  gst_rate: string | number;
}

export interface CreatePurchasePayload {
  supplier: string;
  purchase_date: string;
  items: PurchaseItemInput[];
}

export async function createPurchase(payload: CreatePurchasePayload): Promise<Purchase> {
  const res = await api.post<Purchase>("/purchases/", payload);
  return res.data;
}
