import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, Lock, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

import { authService } from "../../services/authService";
import { getAuthErrorMessage, getPasswordChecks, validatePassword } from "../../utils/authValidation";
import AmbientBackground from "../../components/auth/AmbientBackground";
import BrandPanel from "../../components/auth/BrandPanel";
import Field from "../../components/auth/Field";
import Orb from "../../components/auth/Orb";
import logo from "../../assets/logo.png";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    token: searchParams.get("token") || "",
    otp: "",
    password: "",
    confirmPassword: ""
  });
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
      setMessage(response.message || "Password reset successful! You can now log in.");
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError, "Unable to reset password."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-y-auto lg:h-full lg:overflow-hidden">
      <AmbientBackground />

      <div className="relative flex min-h-screen w-full flex-col lg:flex-row lg:h-full lg:overflow-hidden">
        {/* LEFT BRAND PANEL (Desktop) */}
        <div className="hidden lg:block w-full lg:h-full lg:w-[55%] xl:w-[56%]">
          <BrandPanel />
        </div>

        {/* RIGHT AUTH CONTAINER */}
        <div className="w-full min-h-screen flex items-center justify-center py-6 px-2 sm:px-4 lg:py-0 lg:px-0 lg:min-h-full lg:h-full lg:w-[45%] xl:w-[44%]">
          <div className="relative flex min-h-full w-full items-center justify-center px-3 py-4 sm:px-8 lg:px-12">
            {/* ambient orb glow */}
            <div className="pointer-events-none absolute -right-10 -top-10 opacity-70 blur-[2px]">
              <Orb size={90} />
            </div>
            <div className="pointer-events-none absolute -left-16 bottom-10 opacity-30 blur-[3px]">
              <Orb size={130} />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong relative w-full max-w-[450px] lg:max-w-[400px] overflow-hidden rounded-[24px] p-5 shadow-card sm:p-6"
            >
              {/* faint top sheen */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-60"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 100%)',
                }}
              />

              {/* Mobile logo header */}
              <div className="relative mb-5 flex items-center justify-center gap-2.5 lg:hidden">
                <img src={logo} alt="Curator" className="h-8 w-8" />
                <span className="font-display text-lg font-semibold tracking-tight text-white/90">
                  Curator
                </span>
              </div>

              {/* Title Header */}
              <div className="relative mb-6 text-center lg:text-left">
                <h2 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Set New Password
                </h2>
                <p className="mt-1 text-[13px] text-white/50">
                  Create a new strong password for your Curator account.
                </p>
              </div>

              {/* Form */}
              <form className="space-y-3.5" onSubmit={handleSubmit} noValidate>
                {!formData.token && (
                  <Field
                    label="Reset Token / OTP"
                    type="text"
                    icon={KeyRound}
                    placeholder="Paste reset token or OTP code"
                    value={formData.token || formData.otp}
                    onChange={(e) => updateField("token", e.target.value)}
                  />
                )}

                <Field
                  label="New Password"
                  type="password"
                  isPassword
                  icon={Lock}
                  placeholder="Create a new password"
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                />

                {/* Password strength checklist */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {passwordChecks.map((check) => (
                    <div
                      key={check.id}
                      className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                        check.valid ? "text-emerald-400" : "text-white/30"
                      }`}
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          check.valid ? "bg-emerald-400" : "bg-white/20"
                        }`}
                      />
                      <span>{check.label}</span>
                    </div>
                  ))}
                </div>

                <Field
                  label="Confirm New Password"
                  type="password"
                  isPassword
                  icon={Lock}
                  placeholder="Repeat new password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                />

                {confirmError && (
                  <p className="text-[12px] font-medium text-rose-400">{confirmError}</p>
                )}

                {/* Error Banner */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-[13px] text-rose-300"
                  >
                    <AlertCircle size={16} className="shrink-0 text-rose-400" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Success Banner */}
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-[13px] text-emerald-300"
                  >
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                    <span>{message}</span>
                  </motion.div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="btn-primary flex items-center justify-center gap-2 mt-2"
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>
              </form>

              {/* Back to Sign In Link */}
              <div className="relative mt-6 pt-4 border-t border-white/10 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 text-[13px] font-medium text-white/60 hover:text-white transition-colors"
                >
                  <ArrowLeft size={15} />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
