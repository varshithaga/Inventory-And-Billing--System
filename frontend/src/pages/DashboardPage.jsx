import { useEffect, useState } from "react";
import api from "../api/client";

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-gray-800 mt-1">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard/summary/")
      .then((res) => setData(res.data))
      .catch(() => setError("Failed to load dashboard."));
  }, []);

  if (error) return <div className="text-red-600">{error}</div>;
  if (!data) return <div className="text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Sales" value={`₹${Number(data.today.total_sales).toFixed(2)}`} sub={`${data.today.sales_count} bill(s)`} />
        <StatCard label="This Month" value={`₹${Number(data.month.total_sales).toFixed(2)}`} sub={`${data.month.sales_count} bill(s)`} />
        <StatCard label="Low Stock Items" value={data.low_stock_products.length} />
        <StatCard label="Top Product" value={data.top_products[0]?.product__name || "-"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Low Stock Products</h2>
          {data.low_stock_products.length === 0 ? (
            <p className="text-sm text-gray-400">Nothing is low on stock.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-1">Product</th>
                  <th className="py-1 text-right">Stock</th>
                  <th className="py-1 text-right">Threshold</th>
                </tr>
              </thead>
              <tbody>
                {data.low_stock_products.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-1">{p.name}</td>
                    <td className="py-1 text-right text-red-600 font-medium">{p.stock_quantity}</td>
                    <td className="py-1 text-right text-gray-400">{p.low_stock_threshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Recent Sales</h2>
          {data.recent_sales.length === 0 ? (
            <p className="text-sm text-gray-400">No sales yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-1">Invoice</th>
                  <th className="py-1">Customer</th>
                  <th className="py-1 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_sales.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-1">{s.invoice_number}</td>
                    <td className="py-1">{s.customer}</td>
                    <td className="py-1 text-right">₹{Number(s.total_amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-800 mb-3">Payment Mode Breakdown (Today)</h2>
        {data.today.payment_breakdown.length === 0 ? (
          <p className="text-sm text-gray-400">No sales today yet.</p>
        ) : (
          <div className="flex gap-4 flex-wrap">
            {data.today.payment_breakdown.map((pm) => (
              <div key={pm.payment_mode} className="px-4 py-2 bg-gray-50 rounded border border-gray-200">
                <div className="text-xs uppercase text-gray-500">{pm.payment_mode}</div>
                <div className="font-semibold text-gray-800">₹{Number(pm.total).toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
