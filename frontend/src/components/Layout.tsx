import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  icon: (active: boolean) => React.ReactNode;
}

const navItems: NavItem[] = [
  {
    to: "/",
    label: "Dashboard",
    end: true,
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? "text-violet-200" : "text-violet-300/80"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    to: "/billing",
    label: "Billing / POS",
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? "text-violet-200" : "text-violet-300/80"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    to: "/sales",
    label: "Sales History",
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? "text-violet-200" : "text-violet-300/80"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    to: "/products",
    label: "Products",
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? "text-violet-200" : "text-violet-300/80"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    to: "/stock",
    label: "Stock & Movements",
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? "text-violet-200" : "text-violet-300/80"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    to: "/purchases",
    label: "Purchases",
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? "text-violet-200" : "text-violet-300/80"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
    ),
  },
  {
    to: "/suppliers",
    label: "Suppliers",
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? "text-violet-200" : "text-violet-300/80"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0h4" />
      </svg>
    ),
  },
  {
    to: "/customers",
    label: "Customers",
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? "text-violet-200" : "text-violet-300/80"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    to: "/user-management",
    label: "User Management",
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? "text-violet-200" : "text-violet-300/80"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    to: "/settings",
    label: "Store Settings",
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? "text-violet-200" : "text-violet-300/80"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-violet-50/50 via-purple-50/30 to-indigo-50/40 font-sans">
      {/* Dark Violet to Medium Violet Gradient Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-purple-950 via-violet-900 to-indigo-950 text-white flex flex-col border-r border-violet-800/50 shadow-2xl relative overflow-hidden shrink-0">
        {/* Background ambient light effects */}
        <div className="absolute top-0 right-0 w-56 h-56 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="px-6 py-6 border-b border-violet-800/50 flex items-center gap-3 relative z-10">
          <div className="p-2.5 bg-gradient-to-tr from-purple-600 via-violet-600 to-indigo-400 rounded-2xl shadow-lg shadow-purple-600/40 text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-violet-100 to-purple-200 bg-clip-text text-transparent">
              Inventory & POS
            </h1>
            <p className="text-[10px] font-bold tracking-widest uppercase text-violet-300 mt-0.5">
              Enterprise Suite
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto relative z-10">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-500 text-white shadow-lg shadow-violet-600/40 border-l-4 border-violet-300 transform translate-x-1"
                    : "text-violet-200/80 hover:bg-violet-800/50 hover:text-white hover:translate-x-1"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="p-1 rounded-lg shrink-0">{item.icon(isActive)}</span>
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Footer Card */}
        <div className="p-4 border-t border-violet-800/50 relative z-10 bg-purple-950/40">
          <div className="flex items-center gap-3 p-3 bg-violet-900/40 border border-violet-700/50 rounded-2xl">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 via-violet-500 to-indigo-400 text-white flex items-center justify-center font-black text-xs shadow-md">
              {user?.username?.slice(0, 2).toUpperCase() || "US"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.username || "Admin User"}</p>
              <span className="inline-block text-[10px] font-semibold text-violet-300 capitalize">
                {user?.role || "Administrator"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area with Light Violet Tint */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-gradient-to-r from-white/90 via-violet-50/50 to-white/90 backdrop-blur-md border-b border-violet-200/80 px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-violet-600 animate-pulse" />
            <span className="text-xs font-bold text-violet-900/70 uppercase tracking-wider">System Operational</span>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-violet-100/80 to-purple-100/80 border border-violet-200 rounded-xl shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-extrabold text-violet-950">{user?.username}</span>
              <span className="text-[11px] font-extrabold text-violet-700 bg-white/80 px-2 py-0.5 rounded-md uppercase border border-violet-200">
                {user?.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-xl border border-rose-200 transition active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
