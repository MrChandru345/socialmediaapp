const { AppError } = require("../../utils/helpers");

const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value = "") {
  return String(value).trim().toLowerCase();
}

function normalizeUsername(value = "") {
  return String(value).trim().toLowerCase();
}

function normalizeIdentifier(value = "") {
  return String(value).trim().toLowerCase();
}

function getPasswordErrors(password = "", context = {}) {
  const errors = [];
  const normalizedPassword = String(password);
  const normalizedUsername = normalizeUsername(context.username);
  const normalizedEmail = normalizeEmail(context.email);
  const emailLocalPart = normalizedEmail.split("@")[0] || "";

  if (normalizedPassword.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(normalizedPassword)) {
    errors.push("Password must include an uppercase letter");
  }

  if (!/[a-z]/.test(normalizedPassword)) {
    errors.push("Password must include a lowercase letter");
  }

  if (!/[0-9]/.test(normalizedPassword)) {
    errors.push("Password must include a number");
  }

  if (!/[^A-Za-z0-9]/.test(normalizedPassword)) {
    errors.push("Password must include a special character");
  }

  const lowerPassword = normalizedPassword.toLowerCase();

  if (normalizedUsername && lowerPassword.includes(normalizedUsername)) {
    errors.push("Password cannot contain your username");
  }

  if (
    normalizedEmail &&
    (lowerPassword.includes(normalizedEmail) || (emailLocalPart.length >= 3 && lowerPassword.includes(emailLocalPart)))
  ) {
    errors.push("Password cannot contain your email");
  }

  return errors;
}

function assertValidUsername(username, errors) {
  if (!username) {
    errors.push("Username is required");
    return;
  }

  if (!USERNAME_PATTERN.test(username)) {
    errors.push("Username must be 3-30 characters and use only lowercase letters, numbers, and underscores");
  }
}

function assertValidEmail(email, errors) {
  if (!email) {
    errors.push("Email is required");
    return;
  }

  if (!EMAIL_PATTERN.test(email)) {
    errors.push("A valid email address is required");
  }
}

function throwIfErrors(errors) {
  if (errors.length > 0) {
    throw new AppError(400, "Validation failed", errors);
  }
}

function validateRegisterPayload(payload = {}) {
  const errors = [];
  const username = normalizeUsername(payload.username);
  const email = normalizeEmail(payload.email);

  assertValidUsername(username, errors);
  assertValidEmail(email, errors);

  if (!payload.fullName || !String(payload.fullName).trim()) {
    errors.push("Full name is required");
  }

  if (!payload.password) {
    errors.push("Password is required");
  } else {
    errors.push(...getPasswordErrors(payload.password, { username, email }));
  }

  if (payload.confirmPassword !== undefined && payload.password !== payload.confirmPassword) {
    errors.push("Passwords do not match");
  }

  if (!(payload.termsAccepted === true || payload.termsAccepted === "true")) {
    errors.push("You must accept the terms to create an account");
  }

  if (payload.gender && !["female", "male", "nonbinary", "prefer_not_to_say", "custom"].includes(payload.gender)) {
    errors.push("Gender is invalid");
  }

  throwIfErrors(errors);

  return {
    ...payload,
    email,
    username
  };
}

function validateLoginPayload(payload = {}) {
  const errors = [];

  if (!payload.identifier && !payload.email) {
    errors.push("Email or username is required");
  }

  if (!payload.password) {
    errors.push("Password is required");
  }

  throwIfErrors(errors);

  return {
    identifier: normalizeIdentifier(payload.identifier || payload.email),
    password: payload.password,
    remember: Boolean(payload.remember)
  };
}

function validateAvailabilityQuery(query = {}) {
  const errors = [];
  const username = query.username ? normalizeUsername(query.username) : "";
  const email = query.email ? normalizeEmail(query.email) : "";

  if (!username && !email) {
    errors.push("Username or email is required");
  }

  if (username) {
    assertValidUsername(username, errors);
  }

  if (email) {
    assertValidEmail(email, errors);
  }

  throwIfErrors(errors);

  return { email, username };
}

function validateForgotPasswordPayload(payload = {}) {
  const errors = [];
  const email = normalizeEmail(payload.email);
  assertValidEmail(email, errors);
  throwIfErrors(errors);
  return { email };
}

function validateResetPasswordPayload(payload = {}) {
  const errors = [];

  if (!payload.token && !payload.otp) {
    errors.push("Reset token or OTP is required");
  }

  if (!payload.password) {
    errors.push("Password is required");
  } else {
    errors.push(...getPasswordErrors(payload.password, payload));
  }

  if (payload.password !== payload.confirmPassword) {
    errors.push("Passwords do not match");
  }

  throwIfErrors(errors);
}

module.exports = {
  EMAIL_PATTERN,
  USERNAME_PATTERN,
  getPasswordErrors,
  normalizeEmail,
  normalizeIdentifier,
  normalizeUsername,
  validateAvailabilityQuery,
  validateForgotPasswordPayload,
  validateLoginPayload,
  validateRegisterPayload,
  validateResetPasswordPayload
};
