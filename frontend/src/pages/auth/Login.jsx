import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import Button from "../../components/common/Button";
import { useAuth } from "../../hooks/useAuth";
import { getAuthErrorMessage } from "../../utils/authValidation";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    remember: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errors = useMemo(() => {
    const nextErrors = {};

    if (!formData.identifier.trim()) {
      nextErrors.identifier = "Email or username is required.";
    }

    if (!formData.password) {
      nextErrors.password = "Password is required.";
    }

    return nextErrors;
  }, [formData]);

  const isValid = Object.keys(errors).length === 0;

  function updateField(name, value) {
    setFormData((current) => ({ ...current, [name]: value }));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched({ identifier: true, password: true });

    if (!isValid || isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await login(formData);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError, "Unable to sign in."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page auth-page--clean">
      <section className="auth-panel">
        <div className="auth-panel__aside" aria-hidden="true">
          <span className="auth-panel__mark">C</span>
          <h2>Share the day. Keep the moment.</h2>
          <p>Photos, reels, messages, and friends in one calm place.</p>
        </div>

        <div className="auth-card auth-card--login auth-card--clean">
          <div className="auth-brand auth-brand--left">
            <span className="auth-kicker">Welcome back</span>
            <h1>Curator</h1>
            <p>Log in with your email or username.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label className="field">
              <span className="eyebrow">Email or username</span>
              <input
                autoComplete="username"
                className={touched.identifier && errors.identifier ? "field-error" : ""}
                onBlur={() => setTouched((current) => ({ ...current, identifier: true }))}
                onChange={(event) => updateField("identifier", event.target.value)}
                placeholder="name@example.com or curator_handle"
                type="text"
                value={formData.identifier}
              />
              {touched.identifier && errors.identifier ? <span className="inline-error">{errors.identifier}</span> : null}
            </label>

            <label className="field">
              <div className="field__split">
                <span className="eyebrow">Password</span>
                <Link className="link-button" to="/forgot-password">
                  Forgot password?
                </Link>
              </div>
              <div className="password-input">
                <input
                  autoComplete="current-password"
                  className={touched.password && errors.password ? "field-error" : ""}
                  onBlur={() => setTouched((current) => ({ ...current, password: true }))}
                  onChange={(event) => updateField("password", event.target.value)}
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  type="button"
                >
                  <span className="material-symbols-outlined">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
              {touched.password && errors.password ? <span className="inline-error">{errors.password}</span> : null}
            </label>

            <label className="check-row auth-check-row">
              <input
                checked={formData.remember}
                onChange={(event) => updateField("remember", event.target.checked)}
                type="checkbox"
              />
              <span>Remember me</span>
            </label>

            {error ? <p className="form-error">{error}</p> : null}

            <Button className="auth-submit" disabled={!isValid || isSubmitting} size="lg" type="submit">
              {isSubmitting ? <span className="auth-spinner" aria-hidden="true" /> : null}
              {isSubmitting ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <p className="auth-footnote">
            New here? <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
