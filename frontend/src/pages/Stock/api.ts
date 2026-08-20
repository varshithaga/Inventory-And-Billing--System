import api from "../../api/client";
import type { BranchStock, PaginatedResponse, StockMovement } from "../../types";

function unwrap<T>(data: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

export async function fetchStockMovements(): Promise<StockMovement[]> {
  const res = await api.get<PaginatedResponse<StockMovement> | StockMovement[]>("/stock-movements/");
  return unwrap(res.data);
}

export async function fetchBranchStock(): Promise<BranchStock[]> {
  const res = await api.get<PaginatedResponse<BranchStock> | BranchStock[]>("/branch-stock/");
  return unwrap(res.data);
}
