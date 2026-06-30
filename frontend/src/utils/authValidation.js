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
    { id: "length", label: "8 characters", valid: password.length >= 8 },
    { id: "uppercase", label: "Uppercase", valid: /[A-Z]/.test(password) },
    { id: "lowercase", label: "Lowercase", valid: /[a-z]/.test(password) },
    { id: "number", label: "Number", valid: /[0-9]/.test(password) },
    { id: "special", label: "Special", valid: /[^A-Za-z0-9]/.test(password) },
    {
      id: "identity",
      label: "No username/email",
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

  const failedCheck = getPasswordChecks(password, context).find((check) => !check.valid);

  return failedCheck ? "Password does not meet all requirements." : "";
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
