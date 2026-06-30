import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import Button from "../../components/common/Button";
import { authService } from "../../services/authService";
import { getAuthErrorMessage, getPasswordChecks, validatePassword } from "../../utils/authValidation";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    token: searchParams.get("token") || "",
    otp: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordChecks = useMemo(() => getPasswordChecks(formData.password), [formData.password]);
  const passwordError = validatePassword(formData.password);
  const confirmError =
    formData.confirmPassword && formData.confirmPassword !== formData.password ? "Passwords do not match." : "";
  const tokenError = !formData.token && !formData.otp ? "Enter the reset token or OTP." : "";
  const isValid = !passwordError && !confirmError && !tokenError && formData.confirmPassword;

  function updateField(name, value) {
    setFormData((current) => ({ ...current, [name]: value }));
    setError("");
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isValid || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.resetPassword(formData);
      setMessage(response.message || "Password reset flow is ready.");
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError, "Unable to reset password."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card auth-card--compact">
        <div className="auth-brand">
          <h1>Curator</h1>
          <p>Choose a new password.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span className="eyebrow">Reset token</span>
            <input
              onChange={(event) => updateField("token", event.target.value)}
              placeholder="Paste reset token"
              type="text"
              value={formData.token}
            />
          </label>

          <label className="field">
            <span className="eyebrow">OTP</span>
            <input
              inputMode="numeric"
              onChange={(event) => updateField("otp", event.target.value)}
              placeholder="Optional one-time code"
              type="text"
              value={formData.otp}
            />
            {tokenError ? <span className="inline-error">{tokenError}</span> : null}
          </label>

          <label className="field">
            <span className="eyebrow">New password</span>
            <div className="password-input">
              <input
                autoComplete="new-password"
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="Create a strong password"
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
            {passwordError ? <span className="inline-error">{passwordError}</span> : null}
          </label>

          <div className="password-strength__checks">
            {passwordChecks.map((check) => (
              <span className={check.valid ? "is-valid" : ""} key={check.id}>
                {check.label}
              </span>
            ))}
          </div>

          <label className="field">
            <span className="eyebrow">Confirm password</span>
            <input
              autoComplete="new-password"
              onChange={(event) => updateField("confirmPassword", event.target.value)}
              placeholder="Repeat password"
              type="password"
              value={formData.confirmPassword}
            />
            {confirmError ? <span className="inline-error">{confirmError}</span> : null}
          </label>

          {error ? <p className="form-error">{error}</p> : null}
          {message ? <p className="form-success">{message}</p> : null}

          <Button className="auth-submit" disabled={!isValid || isSubmitting} size="lg" type="submit">
            {isSubmitting ? <span className="auth-spinner" aria-hidden="true" /> : null}
            {isSubmitting ? "Resetting..." : "Reset password"}
          </Button>
        </form>

        <p className="auth-footnote">
          Back to <Link to="/login">login</Link>
        </p>
      </section>
    </main>
  );
}
