export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value = "") {
  return String(value).trim().toLowerCase();
}

export function normalizeUsername(value = "") {
  return String(value).trim().toLowerCase();
}

export function validateUsername(username) {
  const value = normalizeUsername(username);

  if (!value) {
    return "Username is required.";
  }

  if (!USERNAME_PATTERN.test(value)) {
    return "Use 3-30 lowercase letters, numbers, or underscores.";
  }

  return "";
}

export function validateEmail(email) {
  const value = normalizeEmail(email);

  if (!value) {
    return "Email is required.";
  }

  if (!EMAIL_PATTERN.test(value)) {
    return "Enter a valid email address.";
  }

  return "";
}

export function getPasswordChecks(password = "", context = {}) {
  const lowerPassword = String(password).toLowerCase();
  const username = normalizeUsername(context.username);
  const email = normalizeEmail(context.email);
  const emailLocalPart = email.split("@")[0] || "";

  return [
    { id: "length", label: "8+ characters", valid: password.length >= 8 },
    { id: "uppercase", label: "1 capital letter (A-Z)", valid: /[A-Z]/.test(password) },
    { id: "lowercase", label: "1 lowercase letter (a-z)", valid: /[a-z]/.test(password) },
    { id: "number", label: "1 number (0-9)", valid: /[0-9]/.test(password) },
    { id: "special", label: "1 special character (!@#$)", valid: /[^A-Za-z0-9]/.test(password) },
    {
      id: "identity",
      label: "No username or email",
      valid:
        (!username || !lowerPassword.includes(username)) &&
        (!email || (!lowerPassword.includes(email) && !(emailLocalPart.length >= 3 && lowerPassword.includes(emailLocalPart))))
    }
  ];
}

export function validatePassword(password, context) {
  if (!password) {
    return "Password is required.";
  }

  const checks = getPasswordChecks(password, context);
  const lengthCheck = checks.find(c => c.id === "length");
  if (!lengthCheck.valid) return "Password must be at least 8 characters long.";

  const upperCheck = checks.find(c => c.id === "uppercase");
  if (!upperCheck.valid) return "Password must include at least 1 capital letter (A-Z).";

  const lowerCheck = checks.find(c => c.id === "lowercase");
  if (!lowerCheck.valid) return "Password must include at least 1 lowercase letter (a-z).";

  const numCheck = checks.find(c => c.id === "number");
  if (!numCheck.valid) return "Password must include at least 1 number (0-9).";

  const specCheck = checks.find(c => c.id === "special");
  if (!specCheck.valid) return "Password must include at least 1 special character (!@#$).";

  const idCheck = checks.find(c => c.id === "identity");
  if (!idCheck.valid) return "Password cannot contain your username or email.";

  return "";
}

export function getPasswordScore(password, context) {
  return getPasswordChecks(password, context).filter((check) => check.valid).length;
}

export function getAuthErrorMessage(error, fallback = "Something went wrong.") {
  const details = error?.response?.data?.details;

  if (Array.isArray(details) && details.length > 0) {
    return details[0];
  }

  return error?.response?.data?.message || error?.message || fallback;
}
