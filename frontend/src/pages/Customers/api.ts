import api from "../../api/client";
import type { Customer, PaginatedResponse } from "../../types";

export async function fetchCustomers(page = 1): Promise<PaginatedResponse<Customer>> {
  const res = await api.get<PaginatedResponse<Customer>>("/customers/", { params: { page } });
  return res.data;
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
