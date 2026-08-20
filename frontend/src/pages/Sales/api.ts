import api from "../../api/client";
import type { PaginatedResponse, Sale, SaleStatus } from "../../types";

function unwrap<T>(data: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

export async function fetchSales(status: SaleStatus | "" = ""): Promise<Sale[]> {
  const res = await api.get<PaginatedResponse<Sale> | Sale[]>("/sales/", {
    params: status ? { status } : {},
  });
  return unwrap(res.data);
}
