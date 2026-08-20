import { useEffect, useState, type FormEvent } from "react";
import api from "../api/client";
import type { Customer, PaginatedResponse } from "../types";

interface CustomerForm {
  name: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  state: string;
}

const emptyForm: CustomerForm = { name: "", phone: "", email: "", address: "", gstin: "", state: "" };

function unwrap<T>(data: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const loadCustomers = () => {
    api.get<PaginatedResponse<Customer> | Customer[]>("/customers/").then((res) => setCustomers(unwrap(res.data)));
  };

  useEffect(loadCustomers, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/customers/", form);
      setForm(emptyForm);
      setShowForm(false);
      loadCustomers();
    } catch {
      setError("Failed to save customer.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Customers</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded">
          {showForm ? "Close" : "+ Add Customer"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <input placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded px-3 py-2 text-sm" />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="border rounded px-3 py-2 text-sm" />
            <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border rounded px-3 py-2 text-sm" />
            <input placeholder="GSTIN" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} className="border rounded px-3 py-2 text-sm" />
            <input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="border rounded px-3 py-2 text-sm" />
            <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="border rounded px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded">Save Customer</button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b bg-gray-50">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Outstanding</th>
              <th className="px-4 py-2">Loyalty Points</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="px-4 py-2">{c.name}</td>
                <td className="px-4 py-2 text-gray-500">{c.phone || "-"}</td>
                <td className="px-4 py-2">₹{Number(c.outstanding_balance).toFixed(2)}</td>
                <td className="px-4 py-2 text-gray-500">{c.loyalty_points}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No customers yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
