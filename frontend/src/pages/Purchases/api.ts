import api from "../../api/client";
import type { PaginatedResponse, Product, Purchase, Supplier } from "../../types";

function unwrap<T>(data: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

export async function fetchPurchases(): Promise<Purchase[]> {
  const res = await api.get<PaginatedResponse<Purchase> | Purchase[]>("/purchases/");
  return unwrap(res.data);
}

export async function fetchPurchaseProducts(): Promise<Product[]> {
  const res = await api.get<PaginatedResponse<Product> | Product[]>("/products/");
  return unwrap(res.data);
}

export async function fetchPurchaseSuppliers(): Promise<Supplier[]> {
  const res = await api.get<PaginatedResponse<Supplier> | Supplier[]>("/suppliers/");
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
