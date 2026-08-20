import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Pagination from "../../components/Pagination";
import { openInvoicePdf } from "../../utils/downloadInvoice";
import type { Sale, SaleStatus } from "../../types";
import { fetchSales } from "./api";

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [statusFilter, setStatusFilter] = useState<SaleStatus | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const navigate = useNavigate();

  const loadSales = (status: SaleStatus | "" = "", q = "", p = 1) => {
    fetchSales(status, q, p).then((res) => {
      setSales(res.results);
      setPage(res.current_page);
      setCount(res.count);
      setTotalPages(res.total_pages);
      setHasNext(res.next !== null);
      setHasPrevious(res.previous !== null);
    });
  };

  useEffect(() => {
    loadSales(statusFilter, search, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    loadSales(statusFilter, search, 1);
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

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SaleStatus | "")}
              className="text-sm font-extrabold border border-violet-700/60 rounded-2xl px-4 py-3.5 bg-violet-900/60 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition cursor-pointer backdrop-blur-sm"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed Sales</option>
              <option value="draft">Held / Draft Bills</option>
              <option value="cancelled">Cancelled Sales</option>
            </select>

            <button
              onClick={() => navigate("/billing")}
              className="group flex items-center gap-2.5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-5 py-3.5 rounded-2xl shadow-xl shadow-violet-600/40 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>+ New Sale (POS Checkout)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="bg-gradient-to-r from-white via-violet-50/40 to-white p-5 rounded-2xl border border-violet-200/80 shadow-md shadow-violet-100/40 flex items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-violet-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            placeholder="Search sales by invoice number or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 text-sm bg-violet-50/50 border border-violet-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all font-semibold text-violet-950 placeholder-violet-400"
          />
        </div>
        <button type="submit" className="px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl text-xs shadow-md transition shrink-0">
          Search
        </button>
      </form>

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
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          count={count}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
          onPageChange={(p) => loadSales(statusFilter, search, p)}
        />
      </div>
    </div>
  );
}
