import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Button from "../../components/common/Button";
import { useAuth } from "../../hooks/useAuth";

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await signup(formData);
      navigate("/");
    } catch (caughtError) {
      setError(caughtError?.response?.data?.message || caughtError.message || "Unable to create account.");
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

      <div className="auth-card auth-card--wide">
        <div className="auth-card__intro">
          <h2>Create your profile</h2>
          <p>Start curating your social gallery with a premium editorial experience.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field-grid">
            <label className="field">
              <span className="eyebrow">Username</span>
              <input
                onChange={(event) =>
                  setFormData((current) => ({ ...current, username: event.target.value }))
                }
                placeholder="curator_handle"
                type="text"
                value={formData.username}
              />
            </label>
            <label className="field">
              <span className="eyebrow">Full name</span>
              <input
                onChange={(event) =>
                  setFormData((current) => ({ ...current, fullName: event.target.value }))
                }
                placeholder="Alex Rivera"
                type="text"
                value={formData.fullName}
              />
            </label>
          </div>

          <label className="field">
            <span className="eyebrow">Email address</span>
            <input
              onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
              placeholder="you@example.com"
              type="email"
              value={formData.email}
            />
          </label>

          <label className="field">
            <span className="eyebrow">Password</span>
            <input
              onChange={(event) =>
                setFormData((current) => ({ ...current, password: event.target.value }))
              }
              placeholder="At least 6 characters"
              type="password"
              value={formData.password}
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <Button className="auth-submit" size="lg" type="submit">
            {isSubmitting ? "Creating account..." : "Create Curator account"}
          </Button>
        </form>
      </div>

      <p className="auth-footnote">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}
