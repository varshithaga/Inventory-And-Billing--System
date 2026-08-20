import { useEffect, useState, useMemo, type FormEvent } from "react";
import Pagination from "../../components/Pagination";
import type { Branch, User, UserRole } from "../../types";
import {
  createUser,
  deleteUser,
  fetchAllUsers,
  fetchBranches,
  fetchUsers,
  updateUser,
  type UserPayload,
} from "./api";

interface ToastNotification {
  id: string;
  type: "success" | "error";
  message: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [branchFilter, setBranchFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Quick view drawer state
  const [selectedUserDetail, setSelectedUserDetail] = useState<User | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState<UserPayload>({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "staff",
    branch: null,
    is_active: true,
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Quick Password Reset state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Toast notification state
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = (message: string, type: "success" | "error" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadData = async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        search,
        role: roleFilter,
        branch: branchFilter,
        is_active: statusFilter,
      };
      const [usersPage, allUsersData, branchesData] = await Promise.all([
        fetchUsers({ ...filters, page: p }),
        fetchAllUsers(filters),
        fetchBranches(),
      ]);
      setUsers(usersPage.results);
      setPage(usersPage.current_page);
      setCount(usersPage.count);
      setTotalPages(usersPage.total_pages);
      setHasNext(usersPage.next !== null);
      setHasPrevious(usersPage.previous !== null);
      setAllUsers(allUsersData);
      setBranches(branchesData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load user data.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, [search, roleFilter, branchFilter, statusFilter]);

  // Statistics calculation — derived from the full filtered set (allUsers),
  // not just the current page, so the KPI cards reflect the whole result set.
  const stats = useMemo(() => {
    const total = count;
    const active = allUsers.filter((u) => u.is_active !== false).length;
    const admins = allUsers.filter((u) => u.role === "admin").length;
    const managers = allUsers.filter((u) => u.role === "manager").length;
    const staff = allUsers.filter((u) => u.role === "staff").length;
    return { total, active, admins, managers, staff };
  }, [allUsers, count]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      username: "",
      password: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      role: "staff",
      branch: branches.length > 0 ? branches[0].id : null,
      is_active: true,
    });
    setFormError("");
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role,
      branch: user.branch || null,
      is_active: user.is_active ?? true,
    });
    setFormError("");
    setShowModal(true);
  };

  // Submit User Form (Create or Update)
  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.username.trim()) {
      setFormError("Username is required.");
      return;
    }

    if (!editingUser && !formData.password) {
      setFormError("Password is required for new users.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: UserPayload = {
        username: formData.username.trim(),
        first_name: formData.first_name?.trim(),
        last_name: formData.last_name?.trim(),
        email: formData.email?.trim(),
        phone: formData.phone?.trim(),
        role: formData.role,
        branch: formData.branch || null,
        is_active: formData.is_active,
      };

      if (formData.password?.trim()) {
        payload.password = formData.password.trim();
      }

      if (editingUser) {
        await updateUser(editingUser.id, payload);
        addToast(`User '${editingUser.username}' updated successfully.`);
      } else {
        await createUser(payload);
        addToast(`New user '${payload.username}' created successfully.`);
      }

      setShowModal(false);
      loadData(page);
    } catch (err: any) {
      const respData = err?.response?.data;
      if (respData && typeof respData === "object") {
        const messages = Object.entries(respData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ");
        setFormError(messages || "Failed to save user.");
      } else {
        setFormError("Failed to save user. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Quick Password Reset
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!newPassword || newPassword.length < 4) {
      setPasswordError("Password must be at least 4 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    if (!showPasswordModal) return;

    setSubmitting(true);
    try {
      await updateUser(showPasswordModal.id, { password: newPassword });
      addToast(`Password for '${showPasswordModal.username}' reset successfully.`);
      setShowPasswordModal(null);
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordError("Failed to update password.");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active / Inactive Status
  const handleToggleStatus = async (user: User) => {
    const newStatus = !user.is_active;
    try {
      await updateUser(user.id, { is_active: newStatus });
      addToast(`User '${user.username}' is now ${newStatus ? "Active" : "Inactive"}.`);
      loadData(page);
    } catch {
      addToast(`Failed to update status for '${user.username}'.`, "error");
    }
  };

  // Confirm & Delete User
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setSubmitting(true);
    try {
      await deleteUser(deletingUser.id);
      addToast(`User '${deletingUser.username}' deleted.`);
      setDeletingUser(null);
      loadData(page);
    } catch {
      addToast(`Failed to delete user '${deletingUser.username}'.`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch("");
    setRoleFilter("");
    setBranchFilter("");
    setStatusFilter("");
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-600/15 via-violet-600/15 to-purple-600/15 text-purple-900 border border-purple-300 shadow-xs">
            <svg className="w-3.5 h-3.5 text-purple-700" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Admin
          </span>
        );
      case "manager":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-600/15 via-violet-600/15 to-indigo-600/15 text-indigo-900 border border-indigo-300 shadow-xs">
            <svg className="w-3.5 h-3.5 text-indigo-700" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            Manager
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-600/15 via-teal-600/15 to-emerald-600/15 text-emerald-900 border border-emerald-300 shadow-xs">
            <svg className="w-3.5 h-3.5 text-emerald-700" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            Staff
          </span>
        );
    }
  };

  const getInitials = (user: User) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase();
    }
    return user.username.slice(0, 2).toUpperCase();
  };

  const getAvatarGradient = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-gradient-to-tr from-purple-700 via-violet-600 to-indigo-500 text-white shadow-md shadow-purple-600/30 ring-2 ring-white";
      case "manager":
        return "bg-gradient-to-tr from-indigo-700 via-violet-600 to-purple-500 text-white shadow-md shadow-indigo-600/30 ring-2 ring-white";
      default:
        return "bg-gradient-to-tr from-emerald-600 via-teal-600 to-violet-500 text-white shadow-md shadow-emerald-600/30 ring-2 ring-white";
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Toast Notifications Banner */}
      <div className="fixed top-5 right-5 z-50 space-y-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3.5 rounded-xl shadow-xl text-sm font-semibold transition-all transform animate-bounce-in ${
              toast.type === "success"
                ? "bg-gradient-to-r from-purple-950 to-indigo-950 text-emerald-400 border border-emerald-500/30 backdrop-blur-md"
                : "bg-gradient-to-r from-purple-950 to-indigo-950 text-rose-400 border border-rose-500/30 backdrop-blur-md"
            }`}
          >
            {toast.type === "success" ? (
              <span className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            ) : (
              <span className="p-1.5 bg-rose-500/20 rounded-lg text-rose-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Hero Banner Header - Dark Violet to Medium Violet Spectrum */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-950 via-violet-900 to-indigo-950 p-8 rounded-3xl shadow-2xl text-white border border-violet-800/60">
        {/* Ambient lighting elements */}
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-purple-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-72 h-72 bg-violet-500/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-3 bg-gradient-to-tr from-purple-600 via-violet-600 to-indigo-400 text-white rounded-2xl shadow-lg shadow-purple-600/40">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-violet-300">Access Management & Control</span>
                <h1 className="text-3xl font-black tracking-tight text-white">User Management</h1>
              </div>
            </div>
            <p className="text-sm text-violet-100/90 mt-2 max-w-2xl leading-relaxed">
              Manage system authorization, staff access credentials, multi-branch roles, and user accounts across your organization.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => loadData(page)}
              title="Refresh User List"
              className="p-3 text-violet-200 hover:text-white bg-violet-900/60 hover:bg-violet-800/80 border border-violet-700/60 rounded-2xl transition backdrop-blur-sm"
            >
              <svg className={`w-5 h-5 ${loading ? "animate-spin text-violet-300" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={handleOpenCreate}
              className="group relative flex items-center gap-2.5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-5 py-3.5 rounded-2xl shadow-xl shadow-violet-600/40 hover:shadow-violet-600/60 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span>Add New User</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards Grid - Violet Spectrum (Dark to Light) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Users */}
        <div className="group bg-gradient-to-br from-violet-50 via-purple-50/60 to-indigo-50/50 p-6 rounded-2xl border border-violet-200/90 shadow-md shadow-violet-100/50 hover:shadow-xl hover:border-violet-400 transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-violet-900/60 uppercase tracking-wider">Total Accounts</p>
              <h3 className="text-3xl font-black text-violet-950 mt-1">{stats.total}</h3>
            </div>
            <div className="p-3.5 bg-violet-600 text-white rounded-2xl shadow-md shadow-violet-600/30 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-violet-800 font-semibold">
            <span className="inline-block w-2 h-2 rounded-full bg-violet-600" />
            <span>Registered system users</span>
          </div>
        </div>

        {/* Active Accounts */}
        <div className="group bg-gradient-to-br from-emerald-50 via-teal-50/60 to-emerald-100/40 p-6 rounded-2xl border border-emerald-200/90 shadow-md shadow-emerald-100/50 hover:shadow-xl hover:border-emerald-400 transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-900/60 uppercase tracking-wider">Active Status</p>
              <h3 className="text-3xl font-black text-emerald-900 mt-1">{stats.active}</h3>
            </div>
            <div className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-md shadow-emerald-600/30 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-emerald-800 font-bold">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Operational & Enabled</span>
          </div>
        </div>

        {/* Admins & Managers */}
        <div className="group bg-gradient-to-br from-purple-50 via-violet-50/60 to-purple-100/40 p-6 rounded-2xl border border-purple-200/90 shadow-md shadow-purple-100/50 hover:shadow-xl hover:border-purple-400 transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-purple-900/60 uppercase tracking-wider">Management</p>
              <h3 className="text-3xl font-black text-purple-950 mt-1">{stats.admins + stats.managers}</h3>
            </div>
            <div className="p-3.5 bg-purple-600 text-white rounded-2xl shadow-md shadow-purple-600/30 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-purple-900">
            <span>{stats.admins} Admins</span>
            <span>•</span>
            <span>{stats.managers} Managers</span>
          </div>
        </div>

        {/* Staff & Cashiers */}
        <div className="group bg-gradient-to-br from-indigo-50 via-violet-50/60 to-indigo-100/40 p-6 rounded-2xl border border-indigo-200/90 shadow-md shadow-indigo-100/50 hover:shadow-xl hover:border-indigo-400 transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-indigo-900/60 uppercase tracking-wider">Staff / POS</p>
              <h3 className="text-3xl font-black text-indigo-950 mt-1">{stats.staff}</h3>
            </div>
            <div className="p-3.5 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-600/30 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-indigo-800 font-semibold">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-500" />
            <span>Cashiers & Floor Staff</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Card - Light Violet Theme */}
      <div className="bg-gradient-to-r from-white via-violet-50/40 to-white p-5 rounded-2xl border border-violet-200/80 shadow-md shadow-violet-100/40 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-violet-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search users by name, username, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-10 py-3 text-sm bg-violet-50/50 border border-violet-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all font-semibold text-violet-950 placeholder-violet-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-violet-400 hover:text-violet-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Role Select */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-sm font-bold border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/60 text-violet-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="admin">Admins Only</option>
            <option value="manager">Managers Only</option>
            <option value="staff">Staff Only</option>
          </select>

          {/* Branch Select */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="text-sm font-bold border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/60 text-violet-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition cursor-pointer"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.is_main ? "(Main)" : ""}
              </option>
            ))}
          </select>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm font-bold border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/60 text-violet-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>

          {/* Reset Filters */}
          {(search || roleFilter || branchFilter || statusFilter) && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3.5 py-2.5 rounded-xl border border-rose-200 transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-5 py-4 rounded-2xl shadow-sm flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button onClick={() => loadData(page)} className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg text-xs hover:bg-rose-700 transition">
            Retry Loading
          </button>
        </div>
      )}

      {/* Main Table - Dark Violet Header & Crisp Rows */}
      <div className="bg-white rounded-3xl border border-violet-200/80 shadow-2xl shadow-violet-100/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-purple-950 via-violet-900 to-indigo-950 text-violet-100 uppercase text-[11px] font-extrabold tracking-wider border-b border-violet-800/80">
                <th className="px-6 py-4.5">User Account</th>
                <th className="px-6 py-4.5">Role</th>
                <th className="px-6 py-4.5">Contact Details</th>
                <th className="px-6 py-4.5">Branch Location</th>
                <th className="px-6 py-4.5">Status</th>
                <th className="px-6 py-4.5">Joined Date</th>
                <th className="px-6 py-4.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-100/60 text-sm">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-violet-600">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
                      <p className="font-bold text-violet-950">Loading user accounts...</p>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
                      <div className="p-4 bg-violet-100/60 text-violet-500 rounded-3xl">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-extrabold text-violet-950">No matching user accounts</h3>
                      <p className="text-xs text-violet-600/80 leading-relaxed">
                        We couldn't find any users matching your query. Try clearing filters or create a new user account.
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="px-4 py-2 bg-violet-100 hover:bg-violet-200 text-violet-800 font-bold rounded-xl text-xs transition"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-violet-50/60 transition-colors duration-150 group"
                  >
                    {/* User Profile Info Cell */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="flex items-center gap-3.5">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm ${getAvatarGradient(u.role)}`}>
                            {getInitials(u)}
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                              u.is_active !== false ? "bg-emerald-500" : "bg-violet-300"
                            }`}
                          />
                        </div>

                        {/* Text Details */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-violet-950 group-hover:text-purple-700 transition-colors">
                              {u.first_name || u.last_name ? `${u.first_name || ""} ${u.last_name || ""}` : u.username}
                            </span>
                            <button
                              onClick={() => setSelectedUserDetail(u)}
                              title="View details"
                              className="text-violet-400 hover:text-purple-700 transition p-0.5 opacity-0 group-hover:opacity-100"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </div>
                          <div className="text-xs text-violet-800/70 font-medium flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-purple-900 font-semibold">@{u.username}</span>
                            <span className="text-violet-300">•</span>
                            <span className="text-violet-500 font-bold">ID #{u.id}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge Cell */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      {getRoleBadge(u.role)}
                    </td>

                    {/* Contact Info Cell */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="space-y-1 text-xs">
                        {u.email ? (
                          <a
                            href={`mailto:${u.email}`}
                            className="inline-flex items-center gap-1.5 text-violet-950 hover:text-purple-700 font-semibold transition"
                          >
                            <span className="p-1 bg-violet-100/70 text-violet-600 rounded-md">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </span>
                            <span>{u.email}</span>
                          </a>
                        ) : (
                          <span className="text-violet-400 italic text-[11px]">No email provided</span>
                        )}
                        {u.phone && (
                          <div className="flex items-center gap-1.5 text-violet-800/80 font-medium">
                            <span className="p-1 bg-violet-100/70 text-violet-500 rounded-md">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                            </span>
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Assigned Branch Cell */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      {u.branch_name ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-violet-100/80 text-violet-900 border border-violet-200">
                          <svg className="w-3.5 h-3.5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0h4" />
                          </svg>
                          {u.branch_name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-100/70 text-indigo-900 border border-indigo-200">
                          All Branches (HQ)
                        </span>
                      )}
                    </td>

                    {/* Status Pill Toggle Cell */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        title={`Click to set ${u.is_active !== false ? "Inactive" : "Active"}`}
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition transform active:scale-95 cursor-pointer ${
                          u.is_active !== false
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300/80 shadow-2xs"
                            : "bg-violet-100/70 text-violet-700 hover:bg-violet-200/80 border border-violet-200 shadow-2xs"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${u.is_active !== false ? "bg-emerald-500 animate-pulse" : "bg-violet-400"}`} />
                        <span>{u.is_active !== false ? "Active" : "Inactive"}</span>
                      </button>
                    </td>

                    {/* Joined Date Cell */}
                    <td className="px-6 py-4.5 whitespace-nowrap text-xs text-violet-900/70 font-medium">
                      {u.date_joined ? (
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>
                            {new Date(u.date_joined).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-violet-400 italic">-</span>
                      )}
                    </td>

                    {/* Action Icon Buttons Cell */}
                    <td className="px-6 py-4.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit User Button */}
                        <button
                          onClick={() => handleOpenEdit(u)}
                          title="Edit User Details"
                          className="p-2 text-violet-600 hover:text-purple-800 hover:bg-violet-100/70 border border-transparent hover:border-violet-200 rounded-xl transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Password Reset Button */}
                        <button
                          onClick={() => {
                            setShowPasswordModal(u);
                            setNewPassword("");
                            setConfirmPassword("");
                            setPasswordError("");
                          }}
                          title="Reset Password"
                          className="p-2 text-violet-600 hover:text-amber-700 hover:bg-amber-50 border border-transparent hover:border-amber-200 rounded-xl transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </button>

                        {/* Delete User Button */}
                        <button
                          onClick={() => setDeletingUser(u)}
                          title="Delete User"
                          className="p-2 text-violet-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          count={count}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
          onPageChange={loadData}
        />
      </div>

      {/* Role Permission Legend Card - Dark Violet Gradient */}
      <div className="bg-gradient-to-br from-purple-950 via-violet-900 to-indigo-950 rounded-3xl p-7 text-white shadow-2xl border border-violet-800/60">
        <h3 className="text-sm font-extrabold text-violet-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Role & Access Guidelines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          <div className="bg-violet-900/50 p-4 rounded-2xl border border-violet-700/60 backdrop-blur-md space-y-1.5">
            <div className="font-bold text-purple-300 flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400" />
              Administrator
            </div>
            <p className="text-violet-100/90 leading-relaxed">
              Full system control: create/manage users, configure store profiles, view financial analytics, and override pricing/stock.
            </p>
          </div>
          <div className="bg-violet-900/50 p-4 rounded-2xl border border-violet-700/60 backdrop-blur-md space-y-1.5">
            <div className="font-bold text-indigo-300 flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400" />
              Store Manager
            </div>
            <p className="text-violet-100/90 leading-relaxed">
              Branch-level operations: add products, record purchases, handle customer debts, supplier orders, and sales reports.
            </p>
          </div>
          <div className="bg-violet-900/50 p-4 rounded-2xl border border-violet-700/60 backdrop-blur-md space-y-1.5">
            <div className="font-bold text-emerald-300 flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
              Staff / Cashier
            </div>
            <p className="text-violet-100/90 leading-relaxed">
              Point-of-Sale billing access: issue invoices, search items, accept payment modes, and register customer info.
            </p>
          </div>
        </div>
      </div>

      {/* QUICK VIEW USER DRAWER / MODAL */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-violet-200 overflow-hidden transform transition-all">
            <div className="relative bg-gradient-to-r from-purple-950 via-violet-900 to-indigo-950 p-6 text-white">
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="absolute top-5 right-5 text-violet-300 hover:text-white transition p-1.5 rounded-xl hover:bg-violet-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl ${getAvatarGradient(selectedUserDetail.role)}`}>
                  {getInitials(selectedUserDetail)}
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {selectedUserDetail.first_name || selectedUserDetail.last_name
                      ? `${selectedUserDetail.first_name || ""} ${selectedUserDetail.last_name || ""}`
                      : selectedUserDetail.username}
                  </h3>
                  <p className="text-xs text-violet-300 font-mono mt-0.5">@{selectedUserDetail.username}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-violet-50/60 p-3 rounded-2xl border border-violet-100">
                  <span className="text-xs font-bold text-violet-800/70 uppercase">Assigned Role</span>
                  <div className="mt-1">{getRoleBadge(selectedUserDetail.role)}</div>
                </div>

                <div className="bg-violet-50/60 p-3 rounded-2xl border border-violet-100">
                  <span className="text-xs font-bold text-violet-800/70 uppercase">Account Status</span>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      selectedUserDetail.is_active !== false ? "bg-emerald-100 text-emerald-800" : "bg-violet-200 text-violet-800"
                    }`}>
                      {selectedUserDetail.is_active !== false ? "Active" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between py-2 border-b border-violet-100">
                  <span className="text-violet-700/80 font-semibold">User ID:</span>
                  <span className="font-bold text-violet-950">#{selectedUserDetail.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-violet-100">
                  <span className="text-violet-700/80 font-semibold">Email:</span>
                  <span className="font-bold text-violet-950">{selectedUserDetail.email || "N/A"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-violet-100">
                  <span className="text-violet-700/80 font-semibold">Phone:</span>
                  <span className="font-bold text-violet-950">{selectedUserDetail.phone || "N/A"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-violet-100">
                  <span className="text-violet-700/80 font-semibold">Branch:</span>
                  <span className="font-bold text-violet-950">{selectedUserDetail.branch_name || "All Branches"}</span>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  onClick={() => {
                    handleOpenEdit(selectedUserDetail);
                    setSelectedUserDetail(null);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT USER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-violet-200 overflow-hidden transform transition-all my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-950 via-violet-900 to-indigo-950 text-white px-7 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-violet-600/30 text-violet-300 rounded-2xl border border-violet-500/30">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <div>
                  <h2 className="text-lg font-extrabold text-white">
                    {editingUser ? `Edit User: @${editingUser.username}` : "Create New User Account"}
                  </h2>
                  <p className="text-xs text-violet-200">Set user credentials, permissions, and location access.</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-violet-300 hover:text-white transition p-1.5 rounded-xl hover:bg-violet-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-7 space-y-4">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-2 font-medium">
                  <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{formError}</span>
                </div>
              )}

              {/* Username & Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingUser)}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. john_doe"
                    className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 disabled:bg-violet-50 disabled:text-violet-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">
                    {editingUser ? "Password (optional update)" : "Password *"}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password || ""}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold"
                  />
                </div>
              </div>

              {/* First Name & Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.first_name || ""}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="John"
                    className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.last_name || ""}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Doe"
                    className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold"
                  />
                </div>
              </div>

              {/* Role & Branch Assignment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-violet-100">
                <div>
                  <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">
                    User Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full text-sm font-extrabold border border-violet-200 rounded-xl px-3.5 py-2.5 bg-white text-violet-950 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                  >
                    <option value="staff">Staff / Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">
                    Branch Access
                  </label>
                  <select
                    value={formData.branch ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        branch: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full text-sm font-extrabold border border-violet-200 rounded-xl px-3.5 py-2.5 bg-white text-violet-950 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                  >
                    <option value="">All Branches (HQ)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} {b.is_main ? "(Main)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Account Status Switch */}
              <div className="pt-2 flex items-center justify-between bg-violet-50/50 p-4 rounded-2xl border border-violet-100">
                <div>
                  <span className="text-sm font-extrabold text-violet-950">Account Access Enabled</span>
                  <p className="text-xs text-violet-700/70 mt-0.5">
                    {formData.is_active ? "User is allowed to login and perform operations" : "Login access will be blocked"}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active ?? true}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6.5 bg-violet-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-violet-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-violet-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-sm font-bold text-violet-800 hover:bg-violet-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-violet-600/30 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {editingUser ? "Save User Changes" : "Create User Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK RESET PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-violet-200 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-4.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-500/30 rounded-xl">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </span>
                <h3 className="font-extrabold text-base">Reset User Password</h3>
              </div>
              <button
                onClick={() => setShowPasswordModal(null)}
                className="text-amber-200 hover:text-white transition p-1 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-xs text-violet-900 leading-relaxed">
                Set a new password for user account <strong className="text-purple-950 font-bold">@{showPasswordModal.username}</strong>.
              </p>

              {passwordError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3.5 py-2.5 rounded-xl font-medium">
                  {passwordError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-violet-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(null)}
                  className="px-4 py-2 text-sm font-bold text-violet-800 hover:bg-violet-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submitting ? "Resetting..." : "Confirm New Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-violet-200 overflow-hidden p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-violet-950">Delete User Account?</h3>
              <p className="text-xs text-violet-700 mt-1.5 leading-relaxed">
                Are you sure you want to permanently delete account <strong className="text-purple-950 font-bold">@{deletingUser.username}</strong>?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingUser(null)}
                className="w-full px-4 py-2.5 text-sm font-bold text-violet-800 bg-violet-100 hover:bg-violet-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={submitting}
                className="w-full px-4 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
              >
                {submitting ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
