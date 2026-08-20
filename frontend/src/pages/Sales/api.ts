import api from "../../api/client";
import type { PaginatedResponse, Sale, SaleStatus } from "../../types";

export async function fetchSales(status: SaleStatus | "" = "", page = 1): Promise<PaginatedResponse<Sale>> {
  const res = await api.get<PaginatedResponse<Sale>>("/sales/", {
    params: { ...(status ? { status } : {}), page },
  });
  return res.data;
}
