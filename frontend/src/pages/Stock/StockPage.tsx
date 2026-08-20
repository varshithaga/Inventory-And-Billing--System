import { useEffect, useState } from "react";
import type { BranchStock, StockMovement } from "../../types";
import { fetchBranchStock, fetchStockMovements } from "./api";

export default function StockPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [branchStocks, setBranchStocks] = useState<BranchStock[]>([]);
  const [activeTab, setActiveTab] = useState<"movements" | "branchStock">("movements");
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStockMovements(), fetchBranchStock()])
      .then(([movData, stockData]) => {
        setMovements(movData);
        setBranchStocks(stockData);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredMovements = movements.filter((m) => {
    const matchesType = !filterType || m.movement_type === filterType;
    const matchesSearch = !search || m.product_name.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const filteredBranchStock = branchStocks.filter((b) => {
    return !search || b.product_name.toLowerCase().includes(search.toLowerCase()) || b.branch_name.toLowerCase().includes(search.toLowerCase());
  });

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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-violet-300">Inventory Ledger</span>
                <h1 className="text-3xl font-black tracking-tight text-white">Stock Audit & Movements</h1>
              </div>
            </div>
            <p className="text-sm text-violet-100/90 mt-2 max-w-2xl leading-relaxed">
              Track stock movements (Stock In, Sales Deductions, Adjustments), view per-branch inventory levels, and audit logs.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-violet-950/60 p-1.5 rounded-2xl border border-violet-700/60 shrink-0 backdrop-blur-md">
            <button
              onClick={() => setActiveTab("movements")}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
                activeTab === "movements"
                  ? "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-md"
                  : "text-violet-300 hover:text-white"
              }`}
            >
              Stock Audit Log
            </button>
            <button
              onClick={() => setActiveTab("branchStock")}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
                activeTab === "branchStock"
                  ? "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-md"
                  : "text-violet-300 hover:text-white"
              }`}
            >
              Per-Branch Stock
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-gradient-to-r from-white via-violet-50/40 to-white p-5 rounded-2xl border border-violet-200/80 shadow-md shadow-violet-100/40 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-violet-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            placeholder="Search by product or branch name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 text-sm bg-violet-50/50 border border-violet-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition font-semibold text-violet-950 placeholder-violet-400"
          />
        </div>

        {activeTab === "movements" && (
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-sm font-extrabold border border-violet-200 rounded-xl px-4 py-3 bg-violet-50/60 text-violet-950 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 cursor-pointer"
          >
            <option value="">All Movement Types</option>
            <option value="in">Stock In (+)</option>
            <option value="out">Stock Out (-)</option>
            <option value="adjustment">Stock Adjustment</option>
          </select>
        )}
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-bold text-violet-950 text-sm">Loading stock ledger...</p>
        </div>
      ) : activeTab === "movements" ? (
        <div className="bg-white rounded-3xl border border-violet-200/80 shadow-2xl shadow-violet-100/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-purple-950 via-violet-900 to-indigo-950 text-violet-100 uppercase text-[11px] font-extrabold tracking-wider border-b border-violet-800/80">
                  <th className="px-6 py-4.5">Date & Time</th>
                  <th className="px-6 py-4.5">Product</th>
                  <th className="px-6 py-4.5">Movement Type</th>
                  <th className="px-6 py-4.5 text-right">Quantity</th>
                  <th className="px-6 py-4.5">Reference / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-100/60 text-sm">
                {filteredMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-violet-50/60 transition-colors duration-150">
                    <td className="px-6 py-4.5 text-xs font-semibold text-violet-800/80">{new Date(m.created_at).toLocaleString("en-IN")}</td>
                    <td className="px-6 py-4.5 font-extrabold text-violet-950">{m.product_name}</td>
                    <td className="px-6 py-4.5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold capitalize ${
                        m.movement_type === "in"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : m.movement_type === "out"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}>
                        {m.movement_type === "in" ? "Stock In (+)" : m.movement_type === "out" ? "Stock Out (-)" : "Adjustment"}
                      </span>
                    </td>
                    <td className={`px-6 py-4.5 text-right font-black ${m.movement_type === "in" ? "text-emerald-700" : m.movement_type === "out" ? "text-rose-600" : "text-violet-950"}`}>
                      {m.movement_type === "in" ? `+${m.quantity}` : m.movement_type === "out" ? `-${m.quantity}` : m.quantity}
                    </td>
                    <td className="px-6 py-4.5 text-xs font-semibold text-violet-700">{m.reference_note || m.reference_type || "N/A"}</td>
                  </tr>
                ))}
                {filteredMovements.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-violet-400 font-semibold italic">No stock movements recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-violet-200/80 shadow-2xl shadow-violet-100/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-purple-950 via-violet-900 to-indigo-950 text-violet-100 uppercase text-[11px] font-extrabold tracking-wider border-b border-violet-800/80">
                  <th className="px-6 py-4.5">Branch</th>
                  <th className="px-6 py-4.5">Product</th>
                  <th className="px-6 py-4.5 text-right">Available Stock</th>
                  <th className="px-6 py-4.5 text-right">Reserved Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-100/60 text-sm">
                {filteredBranchStock.map((b) => (
                  <tr key={b.id} className="hover:bg-violet-50/60 transition-colors duration-150">
                    <td className="px-6 py-4.5 font-bold text-violet-900">{b.branch_name}</td>
                    <td className="px-6 py-4.5 font-extrabold text-violet-950">{b.product_name}</td>
                    <td className="px-6 py-4.5 text-right font-black text-violet-950">{b.quantity}</td>
                    <td className="px-6 py-4.5 text-right font-bold text-violet-400">{b.reserved_quantity || "0"}</td>
                  </tr>
                ))}
                {filteredBranchStock.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-violet-400 font-semibold italic">No branch stock entries found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
