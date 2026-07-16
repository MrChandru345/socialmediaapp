import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Button from "../../components/common/Button";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services/authService";
import {
  getAuthErrorMessage,
  getPasswordChecks,
  getPasswordScore,
  validateEmail,
  validatePassword,
  validateUsername
} from "../../utils/authValidation";

const initialForm = {
  fullName: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  termsAccepted: false
};

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [availability, setAvailability] = useState({
    username: { status: "idle", message: "" },
    email: { status: "idle", message: "" }
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const usernameError = validateUsername(formData.username);

    if (usernameError || !formData.username) {
      setAvailability((current) => ({ ...current, username: { status: "idle", message: "" } }));
      return undefined;
    }

    setAvailability((current) => ({ ...current, username: { status: "checking", message: "Checking..." } }));

    const timeout = window.setTimeout(async () => {
      try {
        const result = await authService.checkAvailability({ username: formData.username });
        const available = result.username?.available;
        setAvailability((current) => ({
          ...current,
          username: {
            status: available ? "available" : "taken",
            message: available ? "Username is available." : "Username is already taken."
          }
        }));
      } catch (caughtError) {
        setAvailability((current) => ({
          ...current,
          username: { status: "error", message: getAuthErrorMessage(caughtError, "Unable to check username.") }
        }));
      }
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [formData.username]);

  useEffect(() => {
    const emailError = validateEmail(formData.email);

    if (emailError || !formData.email) {
      setAvailability((current) => ({ ...current, email: { status: "idle", message: "" } }));
      return undefined;
    }

    setAvailability((current) => ({ ...current, email: { status: "checking", message: "Checking..." } }));

    const timeout = window.setTimeout(async () => {
      try {
        const result = await authService.checkAvailability({ email: formData.email });
        const available = result.email?.available;
        setAvailability((current) => ({
          ...current,
          email: {
            status: available ? "available" : "taken",
            message: available ? "Email is available." : "Email is already in use."
          }
        }));
      } catch (caughtError) {
        setAvailability((current) => ({
          ...current,
          email: { status: "error", message: getAuthErrorMessage(caughtError, "Unable to check email.") }
        }));
      }
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [formData.email]);

  const passwordChecks = useMemo(
    () => getPasswordChecks(formData.password, { username: formData.username, email: formData.email }),
    [formData.email, formData.password, formData.username]
  );
  const passwordScore = getPasswordScore(formData.password, { username: formData.username, email: formData.email });

  const errors = useMemo(() => {
    const nextErrors = {};
    const usernameError = validateUsername(formData.username);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password, {
      username: formData.username,
      email: formData.email
    });

    if (!formData.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (usernameError) {
      nextErrors.username = usernameError;
    }

    if (emailError) {
      nextErrors.email = emailError;
    }

    if (passwordError) {
      nextErrors.password = passwordError;
    }

    if (formData.confirmPassword !== formData.password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    if (!formData.termsAccepted) {
      nextErrors.termsAccepted = "Accept the terms to continue.";
    }

    return nextErrors;
  }, [formData]);

  const isUsernameTaken = availability.username.status === "taken";
  const isEmailTaken = availability.email.status === "taken";
  const isCheckingAvailability = availability.username.status === "checking" || availability.email.status === "checking";
  const isValid = Object.keys(errors).length === 0 && !isUsernameTaken && !isEmailTaken && !isCheckingAvailability;

  function updateField(name, value) {
    setFormData((current) => ({ ...current, [name]: value }));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched({
      confirmPassword: true,
      email: true,
      fullName: true,
      password: true,
      termsAccepted: true,
      username: true
    });

    if (!isValid || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await signup(formData);
      navigate("/", { replace: true });
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError, "Unable to create account."));
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderFieldError(name) {
    if (touched[name] && errors[name]) {
      return <span className="inline-error">{errors[name]}</span>;
    }

    return null;
  }

  return (
    <main className="auth-page auth-page--clean auth-page--register">
      <section className="auth-panel auth-panel--register">
        <div className="auth-panel__aside" aria-hidden="true">
          <span className="auth-panel__mark">C</span>
          <h2>Join the conversation beautifully.</h2>
          <p>A simple account setup for photos, reels, messages, and the people you follow.</p>
        </div>

        <div className="auth-card auth-card--wide auth-card--signup auth-card--clean">
          <div className="auth-brand auth-brand--left">
            <span className="auth-kicker">Create account</span>
            <h1>Curator</h1>
            <p>Just the essentials. You can personalize everything else later.</p>
          </div>

          <form className="auth-form auth-form--dense" onSubmit={handleSubmit} noValidate>
            <div className="field-grid">
              <label className="field">
                <span className="eyebrow">Full name</span>
                <input
                  className={touched.fullName && errors.fullName ? "field-error" : ""}
                  onBlur={() => setTouched((current) => ({ ...current, fullName: true }))}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  placeholder="Alex Rivera"
                  type="text"
                  value={formData.fullName}
                />
                {renderFieldError("fullName")}
              </label>

              <label className="field">
                <span className="eyebrow">Username</span>
                <input
                  autoComplete="username"
                  className={(touched.username && errors.username) || isUsernameTaken ? "field-error" : ""}
                  onBlur={() => setTouched((current) => ({ ...current, username: true }))}
                  onChange={(event) => updateField("username", event.target.value.toLowerCase())}
                  placeholder="curator_handle"
                  type="text"
                  value={formData.username}
                />
                {renderFieldError("username")}
                {availability.username.message ? (
                  <span className={`availability availability--${availability.username.status}`}>
                    {availability.username.message}
                  </span>
                ) : null}
              </label>
            </div>

            <label className="field">
              <span className="eyebrow">Email</span>
              <input
                autoComplete="email"
                className={(touched.email && errors.email) || isEmailTaken ? "field-error" : ""}
                onBlur={() => setTouched((current) => ({ ...current, email: true }))}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="you@example.com"
                type="email"
                value={formData.email}
              />
              {renderFieldError("email")}
              {availability.email.message ? (
                <span className={`availability availability--${availability.email.status}`}>
                  {availability.email.message}
                </span>
              ) : null}
            </label>

            <div className="field-grid">
              <label className="field">
                <span className="eyebrow">Password</span>
                <div className="password-input">
                  <input
                    autoComplete="new-password"
                    className={touched.password && errors.password ? "field-error" : ""}
                    onBlur={() => setTouched((current) => ({ ...current, password: true }))}
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
                {renderFieldError("password")}
              </label>

              <label className="field">
                <span className="eyebrow">Confirm password</span>
                <div className="password-input">
                  <input
                    autoComplete="new-password"
                    className={touched.confirmPassword && errors.confirmPassword ? "field-error" : ""}
                    onBlur={() => setTouched((current) => ({ ...current, confirmPassword: true }))}
                    onChange={(event) => updateField("confirmPassword", event.target.value)}
                    placeholder="Repeat password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                  />
                  <button
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    type="button"
                  >
                    <span className="material-symbols-outlined">{showConfirmPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
                {renderFieldError("confirmPassword")}
              </label>
            </div>

            <div className="password-strength">
              <div className="password-strength__bar" style={{ "--strength": passwordScore }} />
              <div className="password-strength__checks">
                {passwordChecks.map((check) => (
                  <span className={check.valid ? "is-valid" : ""} key={check.id}>
                    {check.label}
                  </span>
                ))}
              </div>
            </div>

            <label className="check-row auth-check-row">
              <input
                checked={formData.termsAccepted}
                onChange={(event) => updateField("termsAccepted", event.target.checked)}
                type="checkbox"
              />
              <span>I agree to the Terms and Privacy Policy.</span>
            </label>
            {renderFieldError("termsAccepted")}

            {error ? <p className="form-error">{error}</p> : null}

            <Button className="auth-submit" disabled={!isValid || isSubmitting} size="lg" type="submit">
              {isSubmitting ? <span className="auth-spinner" aria-hidden="true" /> : null}
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="auth-footnote">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
