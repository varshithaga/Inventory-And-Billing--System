import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/Logo";
import type { UserRole } from "../../types";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("admin");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setSubmitting(true);
    try {
      await signup({
        username,
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        role,
        password,
        confirm_password: confirmPassword,
      });
      navigate("/", { replace: true });
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.username?.[0] || "Failed to create account. Username may already exist.";
      setError(typeof detail === "string" ? detail : JSON.stringify(detail));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 via-violet-900 to-indigo-950 font-sans p-4 relative overflow-hidden">
      {/* Ambient ambient background lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl border border-violet-200/80 p-8 space-y-6 relative z-10 my-8">
        {/* Header */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <Logo size="xl" showText={false} className="mb-1" />
          <h1 className="text-2xl font-black text-violet-950 tracking-tight">Create Admin Account</h1>
          <p className="text-xs text-violet-600 font-bold uppercase tracking-wider">Register Your Store Organization</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Username *</label>
              <input
                required
                className="w-full text-sm font-semibold border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 text-violet-950"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose username (e.g. admin_store)"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">First Name</label>
              <input
                className="w-full text-sm font-semibold border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 text-violet-950"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Last Name</label>
              <input
                className="w-full text-sm font-semibold border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 text-violet-950"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                className="w-full text-sm font-semibold border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 text-violet-950"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@store.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Phone Number</label>
              <input
                className="w-full text-sm font-semibold border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 text-violet-950"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Account Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full text-sm font-extrabold border border-violet-200 rounded-xl px-3.5 py-2.5 bg-white text-violet-950 focus:ring-2 focus:ring-violet-500/30"
              >
                <option value="admin">Administrator (Full Access & Store Controls)</option>
                <option value="manager">Store Manager (Inventory & Sales Operations)</option>
                <option value="staff">Staff / Cashier (POS Billing & Checkout Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Password *</label>
              <input
                type="password"
                required
                className="w-full text-sm font-semibold border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 text-violet-950"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-950 uppercase tracking-wider mb-1.5">Confirm Password *</label>
              <input
                type="password"
                required
                className="w-full text-sm font-semibold border border-violet-200 rounded-xl px-3.5 py-2.5 bg-violet-50/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 text-violet-950"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60 text-white font-extrabold py-3.5 rounded-2xl shadow-xl shadow-violet-600/40 transition-all duration-200 transform active:scale-98 flex items-center justify-center gap-2 mt-2"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Create Account & Launch Suite"
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-violet-100">
          <p className="text-xs text-violet-800 font-medium">
            Already have an account?{" "}
            <Link to="/login" className="font-extrabold text-violet-950 hover:underline">
              Sign In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
