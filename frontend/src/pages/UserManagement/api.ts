import api from "../../api/client";
import type { Branch, PaginatedResponse, User, UserRole } from "../../types";

// Dropdown/lookup fetches need every row in one shot, not just page 1 — pull
// up to the backend's max_page_size instead of paginating them.
const LOOKUP_LIMIT = 500;

function unwrap<T>(data: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

export interface UserQueryParams {
  search?: string;
  role?: string;
  branch?: string | number;
  is_active?: string | boolean;
  page?: number;
}

export async function fetchUsers(params?: UserQueryParams): Promise<PaginatedResponse<User>> {
  const query: Record<string, string> = {};
  if (params?.search) query.search = params.search;
  if (params?.role) query.role = params.role;
  if (params?.branch !== undefined && params?.branch !== "") query.branch = String(params.branch);
  if (params?.is_active !== undefined && params?.is_active !== "") query.is_active = String(params.is_active);
  query.page = String(params?.page || 1);

  const res = await api.get<PaginatedResponse<User>>("/users/", { params: query });
  return res.data;
}

// Full filtered set (not just one page) — used to compute the KPI stat
// cards, which should reflect the whole result set, not just the visible page.
export async function fetchAllUsers(params?: UserQueryParams): Promise<User[]> {
  const query: Record<string, string> = { limit: String(LOOKUP_LIMIT) };
  if (params?.search) query.search = params.search;
  if (params?.role) query.role = params.role;
  if (params?.branch !== undefined && params?.branch !== "") query.branch = String(params.branch);
  if (params?.is_active !== undefined && params?.is_active !== "") query.is_active = String(params.is_active);

  const res = await api.get<PaginatedResponse<User> | User[]>("/users/", { params: query });
  return unwrap(res.data);
}

export async function fetchBranches(): Promise<Branch[]> {
  const res = await api.get<PaginatedResponse<Branch> | Branch[]>("/branches/", {
    params: { limit: LOOKUP_LIMIT },
  });
  return unwrap(res.data);
}

export interface UserPayload {
  username: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role: UserRole;
  branch?: number | null;
  is_active?: boolean;
}

export async function createUser(payload: UserPayload): Promise<User> {
  const res = await api.post<User>("/users/", payload);
  return res.data;
}

export async function updateUser(id: number, payload: Partial<UserPayload>): Promise<User> {
  const res = await api.patch<User>(`/users/${id}/`, payload);
  return res.data;
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/users/${id}/`);
}
