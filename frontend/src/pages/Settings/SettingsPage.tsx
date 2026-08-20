import { useEffect, useState, type FormEvent } from "react";
import type { Branch, ShopProfile } from "../../types";
import { createBranch, fetchBranchesList, fetchShopProfile, updateShopProfile } from "./api";

export default function SettingsPage() {
  const [profile, setProfile] = useState<ShopProfile | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeTab, setActiveTab] = useState<"profile" | "branches">("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // Branch form state
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: "", address: "", phone: "", is_main: false });

  const loadData = () => {
    setLoading(true);
    Promise.all([fetchShopProfile().catch(() => null), fetchBranchesList().catch(() => [])])
      .then(([profData, branchData]) => {
        if (profData) setProfile(profData);
        setBranches(branchData);
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMsg("");
    setError("");
    try {
      const updated = await updateShopProfile(profile);
      setProfile(updated);
      setMsg("Shop profile & settings updated successfully!");
    } catch {
      setError("Failed to update shop profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBranch = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createBranch(branchForm);
      setShowBranchModal(false);
      setBranchForm({ name: "", address: "", phone: "", is_main: false });
      loadData();
    } catch {
      setError("Failed to create branch.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Hero Banner Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-950 via-violet-900 to-indigo-950 p-8 rounded-3xl shadow-2xl text-white border border-violet-800/60">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-purple-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-72 h-72 bg-violet-500/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-3 bg-gradient-to-tr from-purple-600 via-violet-600 to-indigo-400 text-white rounded-2xl shadow-lg shadow-purple-600/40">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-violet-300">System Configuration</span>
                <h1 className="text-3xl font-black tracking-tight text-white">Store Settings & Branches</h1>
              </div>
            </div>
            <p className="text-sm text-violet-100/90 mt-2 max-w-2xl leading-relaxed">
              Configure company profile, GSTIN credentials, invoice serial numbering, tax defaults, and multi-branch store locations.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-violet-950/60 p-1.5 rounded-2xl border border-violet-700/60 shrink-0 backdrop-blur-md">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
                activeTab === "profile"
                  ? "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-md"
                  : "text-violet-300 hover:text-white"
              }`}
            >
              Shop Profile
            </button>
            <button
              onClick={() => setActiveTab("branches")}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
                activeTab === "branches"
                  ? "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-md"
                  : "text-violet-300 hover:text-white"
              }`}
            >
              Branches ({branches.length})
            </button>
          </div>
        </div>
      </div>

      {msg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold px-4 py-3 rounded-2xl">{msg}</div>}
      {error && <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold px-4 py-3 rounded-2xl">{error}</div>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-bold text-violet-950 text-sm">Loading settings...</p>
        </div>
      ) : activeTab === "profile" && profile ? (
        <form onSubmit={handleProfileSubmit} className="bg-white rounded-3xl border border-violet-200/80 shadow-2xl shadow-violet-100/60 p-8 space-y-6">
          <h2 className="text-base font-extrabold text-violet-950 border-b border-violet-100 pb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-600" />
            Company & Invoice Setup
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Shop / Company Name *</label>
              <input
                required
                value={profile.name || ""}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">GSTIN Number</label>
              <input
                value={profile.gstin || ""}
                onChange={(e) => setProfile({ ...profile, gstin: e.target.value })}
                className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Phone Number</label>
              <input
                value={profile.phone || ""}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                value={profile.email || ""}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Invoice Prefix (e.g. INV-)</label>
              <input
                value={profile.invoice_prefix || "INV-"}
                onChange={(e) => setProfile({ ...profile, invoice_prefix: e.target.value })}
                className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Next Invoice Serial Number</label>
              <input
                type="number"
                value={profile.invoice_next_number || 1001}
                onChange={(e) => setProfile({ ...profile, invoice_next_number: Number(e.target.value) })}
                className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Shop Address</label>
              <input
                value={profile.address || ""}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-violet-600/30 transition disabled:opacity-50"
            >
              {saving ? "Saving Changes..." : "Save Shop Settings"}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowBranchModal(true)}
              className="px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl shadow-md transition"
            >
              + Create New Branch
            </button>
          </div>

          {/* Branch Modal */}
          {showBranchModal && (
            <form onSubmit={handleCreateBranch} className="bg-white rounded-3xl border border-violet-200/80 shadow-2xl p-6 space-y-4 max-w-lg mx-auto">
              <h3 className="text-base font-extrabold text-violet-950">Add Store Branch Location</h3>
              <div>
                <label className="block text-xs font-bold text-violet-950 uppercase mb-1">Branch Name *</label>
                <input required value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} placeholder="e.g. Downtown Outlet" className="w-full border rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-violet-950 uppercase mb-1">Address</label>
                <input value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} placeholder="Address" className="w-full border rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-violet-950 uppercase mb-1">Phone</label>
                <input value={branchForm.phone} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })} placeholder="Phone" className="w-full border rounded-xl px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowBranchModal(false)} className="px-4 py-2 text-xs font-bold text-violet-800">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 text-xs font-bold text-white bg-violet-600 rounded-xl">Save Branch</button>
              </div>
            </form>
          )}

          {/* Branches Table */}
          <div className="bg-white rounded-3xl border border-violet-200/80 shadow-2xl shadow-violet-100/60 overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-purple-950 via-violet-900 to-indigo-950 text-violet-100 uppercase text-[11px] font-extrabold tracking-wider border-b border-violet-800/80">
                  <th className="px-6 py-4.5">Branch Name</th>
                  <th className="px-6 py-4.5">Phone Number</th>
                  <th className="px-6 py-4.5">Address</th>
                  <th className="px-6 py-4.5 text-right">Main Branch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-100/60">
                {branches.map((b) => (
                  <tr key={b.id} className="hover:bg-violet-50/60 transition-colors">
                    <td className="px-6 py-4.5 font-extrabold text-violet-950">{b.name}</td>
                    <td className="px-6 py-4.5 font-mono text-violet-900">{b.phone || "-"}</td>
                    <td className="px-6 py-4.5 text-xs text-violet-800/80">{b.address || "-"}</td>
                    <td className="px-6 py-4.5 text-right">
                      {b.is_main ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">Main HQ</span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-violet-100 text-violet-800 border border-violet-200">Branch</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
