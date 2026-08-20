import api from "../../api/client";
import type { Customer, PaginatedResponse, PaymentMode, Product, Sale, SaleStatus } from "../../types";

// Backend-connected, paginated lookups for the POS product search and
// customer picker — load more results as the user scrolls instead of
// fetching everything up front.
export async function fetchBillingProductsPage(search = "", page = 1): Promise<PaginatedResponse<Product>> {
  const res = await api.get<PaginatedResponse<Product>>("/products/", {
    params: { ...(search ? { search } : {}), page },
  });
  return res.data;
}

export async function fetchBillingCustomersPage(search = "", page = 1): Promise<PaginatedResponse<Customer>> {
  const res = await api.get<PaginatedResponse<Customer>>("/customers/", {
    params: { ...(search ? { search } : {}), page },
  });
  return res.data;
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
