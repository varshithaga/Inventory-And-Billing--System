import api from "../../api/client";
import type { PaginatedResponse, Supplier } from "../../types";

export async function fetchSuppliers(page = 1): Promise<PaginatedResponse<Supplier>> {
  const res = await api.get<PaginatedResponse<Supplier>>("/suppliers/", { params: { page } });
  return res.data;
}

export interface SupplierPayload {
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
}

export async function createSupplier(payload: SupplierPayload): Promise<Supplier> {
  const res = await api.post<Supplier>("/suppliers/", payload);
  return res.data;
}
