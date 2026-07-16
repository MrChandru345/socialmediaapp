import { useState } from "react";
import { Link } from "react-router-dom";

import Button from "../../components/common/Button";
import { authService } from "../../services/authService";
import { getAuthErrorMessage, validateEmail } from "../../utils/authValidation";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailError = validateEmail(email);

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched(true);

    if (emailError || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await authService.forgotPassword(email);
      setMessage(response.message || "If the email exists, a reset link will be sent.");
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError, "Unable to send reset instructions."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card auth-card--compact">
        <div className="auth-brand">
          <h1>Curator</h1>
          <p>Reset access to your account.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span className="eyebrow">Email</span>
            <input
              autoComplete="email"
              className={touched && emailError ? "field-error" : ""}
              onBlur={() => setTouched(true)}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
                setMessage("");
              }}
              placeholder="you@example.com"
              type="email"
              value={email}
            />
            {touched && emailError ? <span className="inline-error">{emailError}</span> : null}
          </label>

          {error ? <p className="form-error">{error}</p> : null}
          {message ? <p className="form-success">{message}</p> : null}

          <Button className="auth-submit" disabled={Boolean(emailError) || isSubmitting} size="lg" type="submit">
            {isSubmitting ? <span className="auth-spinner" aria-hidden="true" /> : null}
            {isSubmitting ? "Sending..." : "Send reset link"}
          </Button>
        </form>

        <p className="auth-footnote">
          Remembered it? <Link to="/login">Back to login</Link>
        </p>
      </section>
    </main>
  );
}
