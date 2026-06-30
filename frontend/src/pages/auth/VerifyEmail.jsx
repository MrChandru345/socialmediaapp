import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import Button from "../../components/common/Button";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services/authService";
import { getAuthErrorMessage } from "../../utils/authValidation";

const RESEND_SECONDS = 60;

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => setSecondsLeft((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  async function handleVerify(event) {
    event.preventDefault();

    if (!token || isSubmitting) {
      setError("Verification token is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await authService.verifyEmail({ token });
      setMessage(response.message || "Email verification is ready.");
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError, "Unable to verify email."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (!isAuthenticated || secondsLeft > 0) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await authService.resendVerification();
      setMessage(response.message || "Verification email queued.");
      setSecondsLeft(RESEND_SECONDS);
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError, "Unable to resend verification."));
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card auth-card--compact">
        <div className="auth-brand">
          <h1>Curator</h1>
          <p>Verify your email to protect your account.</p>
        </div>

        <form className="auth-form" onSubmit={handleVerify} noValidate>
          <label className="field">
            <span className="eyebrow">Verification token</span>
            <input
              onChange={(event) => {
                setToken(event.target.value);
                setError("");
              }}
              placeholder="Paste verification token"
              type="text"
              value={token}
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}
          {message ? <p className="form-success">{message}</p> : null}

          <Button className="auth-submit" disabled={!token || isSubmitting} size="lg" type="submit">
            {isSubmitting ? <span className="auth-spinner" aria-hidden="true" /> : null}
            {isSubmitting ? "Verifying..." : "Verify email"}
          </Button>
        </form>

        <button
          className="link-button auth-resend"
          disabled={!isAuthenticated || secondsLeft > 0}
          onClick={handleResend}
          type="button"
        >
          {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : "Resend verification email"}
        </button>

        <p className="auth-footnote">
          Go to <Link to="/">home</Link>
        </p>
      </section>
    </main>
  );
}
