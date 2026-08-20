import api from "../../api/client";
import type { Branch, PaginatedResponse, ShopProfile } from "../../types";

function unwrap<T>(data: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

export async function fetchShopProfile(): Promise<ShopProfile> {
  const res = await api.get<ShopProfile>("/settings/shop-profile/");
  return res.data;
}

export async function updateShopProfile(payload: Partial<ShopProfile>): Promise<ShopProfile> {
  const res = await api.put<ShopProfile>("/settings/shop-profile/", payload);
  return res.data;
}

export async function fetchBranchesList(): Promise<Branch[]> {
  const res = await api.get<PaginatedResponse<Branch> | Branch[]>("/branches/");
  return unwrap(res.data);
}

export async function createBranch(payload: Partial<Branch>): Promise<Branch> {
  const res = await api.post<Branch>("/branches/", payload);
  return res.data;
}
