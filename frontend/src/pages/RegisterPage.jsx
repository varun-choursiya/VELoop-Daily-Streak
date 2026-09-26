import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { saveAuth } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const response = await api.post("/auth/register", form);
      saveAuth(response.data);
      navigate("/daily-streak");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand-mark">V</div>
        <p className="eyebrow">VELOOP REWARDS</p>
        <h1>Create account</h1>
        <p className="muted">Start your daily reward streak.</p>

        {error && <div className="error-box">{error}</div>}

        <label>Name</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          minLength={2}
        />

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
          minLength={8}
        />

        <button className="primary-button w-100" disabled={busy}>
          {busy ? "Creating..." : "Create Account"}
        </button>

        <p className="auth-link">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </form>
    </main>
  );
}
