import api from "../../api/client";
import type { Customer, PaginatedResponse } from "../../types";

function unwrap<T>(data: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

export async function fetchCustomers(): Promise<Customer[]> {
  const res = await api.get<PaginatedResponse<Customer> | Customer[]>("/customers/");
  return unwrap(res.data);
}

export interface CustomerPayload {
  name: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  state: string;
}

export async function createCustomer(payload: CustomerPayload): Promise<Customer> {
  const res = await api.post<Customer>("/customers/", payload);
  return res.data;
}
