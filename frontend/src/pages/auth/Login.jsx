import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Button from "../../components/common/Button";
import { useAuth } from "../../hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: true
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({ email: formData.email, password: formData.password });
      navigate("/");
    } catch (caughtError) {
      setError(caughtError?.response?.data?.message || caughtError.message || "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <h1>Curator</h1>
        <p>The Digital Gallery</p>
      </div>

      <div className="auth-card">
        <div className="auth-card__intro">
          <h2>Welcome back</h2>
          <p>Please enter your details to sign in</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="eyebrow">Email address</span>
            <input
              onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
              placeholder="name@example.com"
              type="email"
              value={formData.email}
            />
          </label>

          <label className="field">
            <div className="field__split">
              <span className="eyebrow">Password</span>
              <button className="link-button" type="button">
                Forgot password?
              </button>
            </div>
            <input
              onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
              placeholder="••••••••"
              type="password"
              value={formData.password}
            />
          </label>

          <label className="check-row">
            <input
              checked={formData.remember}
              onChange={(event) =>
                setFormData((current) => ({ ...current, remember: event.target.checked }))
              }
              type="checkbox"
            />
            <span>Stay signed in for 30 days</span>
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <Button className="auth-submit" size="lg" type="submit">
            {isSubmitting ? "Signing in..." : "Sign in to Curator"}
          </Button>
        </form>

        <div className="auth-divider" />

        <div className="auth-socials">
          <button className="social-button" type="button">
            <span>G</span>
            <span>Google</span>
          </button>
          <button className="social-button" type="button">
            <span className="material-symbols-outlined">laptop_mac</span>
            <span>Apple</span>
          </button>
        </div>
      </div>

      <p className="auth-footnote">
        Don't have an account? <Link to="/signup">Sign up for free</Link>
      </p>
    </div>
  );
}
