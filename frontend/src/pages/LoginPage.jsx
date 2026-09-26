import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const navigate = useNavigate();
  const { saveAuth } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
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
      setError(err.response?.data?.message || "Unable to log in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand-mark">V</div>
        <p className="eyebrow">VELOOP REWARDS</p>
        <h1>Welcome back</h1>
        <p className="muted">Log in to continue your daily streak.</p>

        {error && <div className="error-box">{error}</div>}

        <label>Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <button className="primary-button w-100" disabled={busy}>
          {busy ? "Logging in..." : "Log In"}
        </button>

        <p className="auth-link">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </main>
  );
}
