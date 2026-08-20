import api from "../../api/client";
import type { PaginatedResponse, Supplier } from "../../types";

function unwrap<T>(data: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

export async function fetchSuppliers(): Promise<Supplier[]> {
  const res = await api.get<PaginatedResponse<Supplier> | Supplier[]>("/suppliers/");
  return unwrap(res.data);
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
