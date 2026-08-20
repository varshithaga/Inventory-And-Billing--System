import api from "../../api/client";
import type { Customer, PaginatedResponse, PaymentMode, Product, Sale, SaleStatus } from "../../types";

function unwrap<T>(data: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

export async function fetchBillingProducts(): Promise<Product[]> {
  const res = await api.get<PaginatedResponse<Product> | Product[]>("/products/");
  return unwrap(res.data);
}

export async function fetchBillingCustomers(): Promise<Customer[]> {
  const res = await api.get<PaginatedResponse<Customer> | Customer[]>("/customers/");
  return unwrap(res.data);
}

export interface SaleItemInput {
  product: number;
  quantity: number;
  unit_price: number;
  discount_amount: number;
}

export interface SalePaymentInput {
  mode: PaymentMode;
  amount: string;
}

export interface CreateSalePayload {
  customer: string | null;
  status: SaleStatus;
  payment_mode: PaymentMode;
  items_input: SaleItemInput[];
  payments_input: SalePaymentInput[];
}

export async function createSale(payload: CreateSalePayload): Promise<Sale> {
  const res = await api.post<Sale>("/sales/", payload);
  return res.data;
}
