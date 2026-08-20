import { useEffect, useState } from "react";
import api from "../api/client";
import { openInvoicePdf } from "../utils/downloadInvoice";
import type { PaginatedResponse, Sale, SaleStatus } from "../types";

function unwrap<T>(data: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [statusFilter, setStatusFilter] = useState<SaleStatus | "">("");

  const loadSales = (status: SaleStatus | "" = "") => {
    api
      .get<PaginatedResponse<Sale> | Sale[]>("/sales/", { params: status ? { status } : {} })
      .then((res) => setSales(unwrap(res.data)));
  };

  useEffect(() => {
    loadSales(statusFilter);
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Sales</h1>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as SaleStatus | "")} className="border rounded px-3 py-2 text-sm">
          <option value="">All</option>
          <option value="completed">Completed</option>
          <option value="draft">Held / Draft</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b bg-gray-50">
              <th className="px-4 py-2">Invoice</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Payment</th>
              <th className="px-4 py-2 text-right">Total</th>
              <th className="px-4 py-2 text-right">Balance Due</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="px-4 py-2">{s.invoice_number || `Draft #${s.id}`}</td>
                <td className="px-4 py-2 text-gray-500">{new Date(s.sale_date).toLocaleString()}</td>
                <td className="px-4 py-2">{s.customer_name || "Walk-in"}</td>
                <td className="px-4 py-2 capitalize">{s.status}</td>
                <td className="px-4 py-2 capitalize">{s.payment_mode}</td>
                <td className="px-4 py-2 text-right">₹{Number(s.total_amount).toFixed(2)}</td>
                <td className="px-4 py-2 text-right text-red-600">₹{Number(s.balance_due).toFixed(2)}</td>
                <td className="px-4 py-2 text-right">
                  {s.status === "completed" && (
                    <button onClick={() => openInvoicePdf(s.id, s.invoice_number)} className="text-blue-600 text-xs font-medium">
                      Invoice PDF
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400">No sales found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
