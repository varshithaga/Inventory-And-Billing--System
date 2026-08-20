import { useEffect, useState } from "react";
import { openInvoicePdf } from "../../utils/downloadInvoice";
import type { Sale, SaleStatus } from "../../types";
import { fetchSales } from "./api";

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [statusFilter, setStatusFilter] = useState<SaleStatus | "">("");

  const loadSales = (status: SaleStatus | "" = "") => {
    fetchSales(status).then(setSales);
  };

  useEffect(() => {
    loadSales(statusFilter);
  }, [statusFilter]);

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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-violet-300">Revenue Ledger</span>
                <h1 className="text-3xl font-black tracking-tight text-white">Sales Invoices</h1>
              </div>
            </div>
            <p className="text-sm text-violet-100/90 mt-2 max-w-2xl leading-relaxed">
              Historical sales invoice records, customer billing breakdown, payment modes, and printable GST invoice PDF downloads.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SaleStatus | "")}
              className="text-sm font-extrabold border border-violet-700/60 rounded-2xl px-4 py-3 bg-violet-900/60 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition cursor-pointer backdrop-blur-sm"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed Sales</option>
              <option value="draft">Held / Draft Bills</option>
              <option value="cancelled">Cancelled Sales</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-3xl border border-violet-200/80 shadow-2xl shadow-violet-100/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-purple-950 via-violet-900 to-indigo-950 text-violet-100 uppercase text-[11px] font-extrabold tracking-wider border-b border-violet-800/80">
                <th className="px-6 py-4.5">Invoice #</th>
                <th className="px-6 py-4.5">Date & Time</th>
                <th className="px-6 py-4.5">Customer</th>
                <th className="px-6 py-4.5">Status</th>
                <th className="px-6 py-4.5">Payment Mode</th>
                <th className="px-6 py-4.5 text-right">Total Amount</th>
                <th className="px-6 py-4.5 text-right">Balance Due</th>
                <th className="px-6 py-4.5 text-right">PDF Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-100/60 text-sm">
              {sales.map((s) => (
                <tr key={s.id} className="hover:bg-violet-50/60 transition-colors duration-150">
                  <td className="px-6 py-4.5 font-mono font-bold text-violet-950">{s.invoice_number || `Draft #${s.id}`}</td>
                  <td className="px-6 py-4.5 text-xs font-semibold text-violet-800/80">{new Date(s.sale_date).toLocaleString("en-IN")}</td>
                  <td className="px-6 py-4.5 font-extrabold text-violet-950">{s.customer_name || "Walk-in Customer"}</td>
                  <td className="px-6 py-4.5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold capitalize ${
                      s.status === "completed"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : s.status === "draft"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-rose-100 text-rose-800 border border-rose-200"
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4.5 font-bold text-violet-900 capitalize">{s.payment_mode}</td>
                  <td className="px-6 py-4.5 text-right font-black text-violet-950">₹{Number(s.total_amount).toFixed(2)}</td>
                  <td className="px-6 py-4.5 text-right font-black text-rose-600">₹{Number(s.balance_due).toFixed(2)}</td>
                  <td className="px-6 py-4.5 text-right">
                    {s.status === "completed" && (
                      <button
                        onClick={() => openInvoicePdf(s.id, s.invoice_number)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-violet-100/80 hover:bg-violet-200 text-violet-900 font-extrabold text-xs rounded-xl border border-violet-200 transition"
                      >
                        <svg className="w-3.5 h-3.5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        PDF
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-violet-400 font-semibold italic">No sales invoices found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
