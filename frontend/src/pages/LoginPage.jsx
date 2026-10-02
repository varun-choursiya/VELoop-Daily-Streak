import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const navigate = useNavigate();
  const { saveAuth } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const response = await api.post("/auth/login", form);
      saveAuth(response.data);
      navigate("/daily-streak");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials. Please verify and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-ambient-glow top" aria-hidden="true" />
      <div className="auth-ambient-glow bottom" aria-hidden="true" />

      <form className="auth-card" onSubmit={submit} noValidate>
        <div className="auth-header">
          <div className="auth-brand-badge">
            <span className="auth-brand-logo">V</span>
            <span className="auth-brand-text">VELOOP REWARDS</span>
          </div>
          <h1>Welcome Back</h1>
          <p className="subtitle">Sign in to claim today's streak and grow your rewards.</p>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <div className="input-wrapper">
            <Mail className="input-icon-left" size={18} />
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="name@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="input-wrapper">
            <Lock className="input-icon-left" size={18} />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="input-field"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="input-toggle-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Log In</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>

        <p className="auth-switch">
          New to VELOOP? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </main>
  );
}
