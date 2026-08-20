import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/Logo";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch {
      setError("Invalid username or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 via-violet-900 to-indigo-950 font-sans p-4 relative overflow-hidden">
      {/* Background glowing blurred circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl border border-violet-200/80 p-8 space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <Logo size="xl" showText={false} className="mb-1" />
          <h1 className="text-2xl font-black text-violet-950 tracking-tight">System Sign-In</h1>
          <p className="text-xs text-violet-600 font-bold uppercase tracking-wider">Access Enterprise Suite</p>
        </div>

        {/* Role Support Badges */}
        <div className="flex items-center justify-center gap-2 bg-violet-50/70 p-2.5 rounded-2xl border border-violet-100 text-[11px] font-extrabold text-violet-900">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-600" /> Admin</span>
          <span className="text-violet-300">•</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500" /> Manager</span>
          <span className="text-violet-300">•</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Staff/Cashier</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Username</label>
            <input
              className="w-full text-sm font-semibold border border-violet-200 rounded-xl px-4 py-3 bg-violet-50/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition text-violet-950"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              className="w-full text-sm font-semibold border border-violet-200 rounded-xl px-4 py-3 bg-violet-50/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition text-violet-950"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60 text-white font-extrabold py-3.5 rounded-2xl shadow-xl shadow-violet-600/40 transition-all duration-200 transform active:scale-98 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Sign In to System"
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-violet-100">
          <p className="text-xs text-violet-800 font-medium">
            New Store Admin?{" "}
            <Link to="/signup" className="font-extrabold text-violet-950 hover:underline">
              Create Admin Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
