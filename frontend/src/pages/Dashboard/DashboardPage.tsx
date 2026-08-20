import { useEffect, useState, type ReactNode } from "react";
import type { DashboardSummary } from "../../types";
import { fetchDashboardSummary } from "./api";

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon: ReactNode;
  accent: "violet" | "purple" | "rose" | "indigo";
}) {
  const accentStyles = {
    violet: "from-violet-50 via-purple-50/60 to-indigo-50/50 border-violet-200/90 text-violet-950 icon-bg:bg-violet-600",
    purple: "from-purple-50 via-violet-50/60 to-purple-100/40 border-purple-200/90 text-purple-950 icon-bg:bg-purple-600",
    rose: "from-rose-50 via-pink-50/60 to-rose-100/40 border-rose-200/90 text-rose-950 icon-bg:bg-rose-600",
    indigo: "from-indigo-50 via-violet-50/60 to-indigo-100/40 border-indigo-200/90 text-indigo-950 icon-bg:bg-indigo-600",
  };

  const iconBg = {
    violet: "bg-violet-600 shadow-violet-600/30 text-white",
    purple: "bg-purple-600 shadow-purple-600/30 text-white",
    rose: "bg-rose-600 shadow-rose-600/30 text-white",
    indigo: "bg-indigo-600 shadow-indigo-600/30 text-white",
  };

  return (
    <div className={`group bg-gradient-to-br ${accentStyles[accent]} p-6 rounded-2xl border shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-violet-900/60 uppercase tracking-wider">{label}</p>
          <h3 className="text-3xl font-black mt-1">{value}</h3>
        </div>
        <div className={`p-3.5 rounded-2xl shadow-md ${iconBg[accent]} group-hover:scale-110 transition-transform shrink-0`}>
          {icon}
        </div>
      </div>
      {sub && <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-violet-800">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardSummary()
      .then(setData)
      .catch(() => setError("Failed to load dashboard statistics."));
  }, []);

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 px-5 py-4 rounded-2xl shadow-sm text-sm font-semibold">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <p className="font-bold text-violet-950 text-sm">Loading Executive Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Hero Banner Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-950 via-violet-900 to-indigo-950 p-8 rounded-3xl shadow-2xl text-white border border-violet-800/60">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-purple-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-72 h-72 bg-violet-500/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-3 bg-gradient-to-tr from-purple-600 via-violet-600 to-indigo-400 text-white rounded-2xl shadow-lg shadow-purple-600/40">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-violet-300">Live Business Performance</span>
                <h1 className="text-3xl font-black tracking-tight text-white">Executive Dashboard</h1>
              </div>
            </div>
            <p className="text-sm text-violet-100/90 mt-2 max-w-2xl leading-relaxed">
              Real-time store metrics, sales revenue summaries, low stock warnings, and payment distribution analytics.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Today's Sales Revenue"
          value={`₹${Number(data.today.total_sales).toFixed(2)}`}
          sub={<span>{data.today.sales_count} bill(s) processed today</span>}
          accent="violet"
          icon={
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          label="This Month's Sales"
          value={`₹${Number(data.month.total_sales).toFixed(2)}`}
          sub={<span>{data.month.sales_count} total monthly invoices</span>}
          accent="purple"
          icon={
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />

        <StatCard
          label="Low Stock Alert"
          value={data.low_stock_products.length}
          sub={<span>Products below threshold</span>}
          accent="rose"
          icon={
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />

        <StatCard
          label="Top Selling Item"
          value={data.top_products[0]?.product__name || "None"}
          sub={<span>Highest revenue item</span>}
          accent="indigo"
          icon={
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          }
        />
      </div>

      {/* Main Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Products */}
        <div className="bg-white rounded-3xl border border-violet-200/80 shadow-xl shadow-violet-100/60 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-950 via-violet-900 to-indigo-950 px-6 py-4 flex items-center justify-between border-b border-violet-800">
            <h2 className="font-extrabold text-white text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              Low Stock Warnings
            </h2>
            <span className="text-xs bg-rose-500/20 text-rose-300 font-bold px-2.5 py-1 rounded-lg border border-rose-500/30">
              {data.low_stock_products.length} Items
            </span>
          </div>

          <div className="p-6">
            {data.low_stock_products.length === 0 ? (
              <p className="text-sm text-violet-900/60 font-semibold italic text-center py-6">All stock levels are optimal.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-xs font-bold uppercase text-violet-900/70 border-b border-violet-100">
                      <th className="pb-3">Product Name</th>
                      <th className="pb-3 text-right">Available</th>
                      <th className="pb-3 text-right">Min Threshold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-violet-100">
                    {data.low_stock_products.map((p) => (
                      <tr key={p.id} className="hover:bg-violet-50/50 transition-colors">
                        <td className="py-3 font-extrabold text-violet-950">{p.name}</td>
                        <td className="py-3 text-right text-rose-600 font-black">{p.stock_quantity}</td>
                        <td className="py-3 text-right text-violet-400 font-bold">{p.low_stock_threshold}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-white rounded-3xl border border-violet-200/80 shadow-xl shadow-violet-100/60 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-950 via-violet-900 to-indigo-950 px-6 py-4 flex items-center justify-between border-b border-violet-800">
            <h2 className="font-extrabold text-white text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              Recent Sale Invoices
            </h2>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-1 rounded-lg border border-emerald-500/30">
              Latest Activity
            </span>
          </div>

          <div className="p-6">
            {data.recent_sales.length === 0 ? (
              <p className="text-sm text-violet-900/60 font-semibold italic text-center py-6">No recent sales invoices recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-xs font-bold uppercase text-violet-900/70 border-b border-violet-100">
                      <th className="pb-3">Invoice #</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-violet-100">
                    {data.recent_sales.map((s) => (
                      <tr key={s.id} className="hover:bg-violet-50/50 transition-colors">
                        <td className="py-3 font-mono font-bold text-violet-900">{s.invoice_number}</td>
                        <td className="py-3 font-extrabold text-violet-950">{s.customer}</td>
                        <td className="py-3 text-right text-emerald-700 font-black">₹{Number(s.total_amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Breakdown Card */}
      <div className="bg-white rounded-3xl border border-violet-200/80 shadow-xl shadow-violet-100/60 p-6">
        <h2 className="font-extrabold text-violet-950 text-base mb-4 flex items-center gap-2">
          <span className="p-1.5 bg-violet-100 text-violet-700 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </span>
          Today's Payment Mode Breakdown
        </h2>

        {data.today.payment_breakdown.length === 0 ? (
          <p className="text-sm text-violet-900/60 font-semibold italic">No payments received today yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {data.today.payment_breakdown.map((pm) => (
              <div key={pm.payment_mode} className="p-4 bg-gradient-to-br from-violet-50 to-purple-50/60 rounded-2xl border border-violet-200/80 shadow-2xs">
                <div className="text-xs uppercase font-extrabold text-violet-700 tracking-wider">{pm.payment_mode}</div>
                <div className="text-xl font-black text-violet-950 mt-1">₹{Number(pm.total).toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
