import { useEffect, useState, type FormEvent } from "react";
import type { Supplier } from "../../types";
import { createSupplier, fetchSuppliers } from "./api";

interface SupplierForm {
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
}

const emptyForm: SupplierForm = { name: "", contact_person: "", phone: "", email: "", address: "", gstin: "" };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const loadSuppliers = () => {
    fetchSuppliers().then(setSuppliers);
  };

  useEffect(loadSuppliers, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      await createSupplier(form);
      setForm(emptyForm);
      setShowForm(false);
      loadSuppliers();
    } catch {
      setError("Failed to save supplier.");
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0h4" />
                </svg>
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-violet-300">Vendor Management</span>
                <h1 className="text-3xl font-black tracking-tight text-white">Suppliers & Vendors</h1>
              </div>
            </div>
            <p className="text-sm text-violet-100/90 mt-2 max-w-2xl leading-relaxed">
              Manage inventory suppliers, contact persons, corporate GSTIN identifiers, and procurement accounts.
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="group flex items-center gap-2.5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-5 py-3.5 rounded-2xl shadow-xl shadow-violet-600/40 transition-all duration-200 transform hover:-translate-y-0.5 shrink-0"
          >
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>{showForm ? "Close Form" : "Add New Supplier"}</span>
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-violet-200/80 shadow-2xl shadow-violet-100/60 p-7 space-y-4">
          <h2 className="text-base font-extrabold text-violet-950 border-b border-violet-100 pb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-600" />
            Create Vendor Entry
          </h2>

          {error && <div className="text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Supplier Name *</label>
              <input placeholder="Company / Vendor Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold" />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Contact Person</label>
              <input placeholder="Manager / Rep" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold" />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Phone</label>
              <input placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold" />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Email</label>
              <input placeholder="vendor@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold" />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">GSTIN</label>
              <input placeholder="GSTIN Number" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold" />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Address</label>
              <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-semibold" />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl shadow-md transition">
              Save Supplier
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-white rounded-3xl border border-violet-200/80 shadow-2xl shadow-violet-100/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-purple-950 via-violet-900 to-indigo-950 text-violet-100 uppercase text-[11px] font-extrabold tracking-wider border-b border-violet-800/80">
                <th className="px-6 py-4.5">Supplier Name</th>
                <th className="px-6 py-4.5">Contact Person</th>
                <th className="px-6 py-4.5">Phone Number</th>
                <th className="px-6 py-4.5">GSTIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-100/60 text-sm">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-violet-50/60 transition-colors duration-150">
                  <td className="px-6 py-4.5 font-extrabold text-violet-950">{s.name}</td>
                  <td className="px-6 py-4.5 font-semibold text-violet-900">{s.contact_person || "-"}</td>
                  <td className="px-6 py-4.5 font-mono text-violet-800">{s.phone || "-"}</td>
                  <td className="px-6 py-4.5 font-mono text-xs font-bold text-purple-900">{s.gstin || "-"}</td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-violet-400 font-semibold italic">No suppliers listed yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
