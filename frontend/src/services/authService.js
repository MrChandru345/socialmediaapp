import api from "./api";

async function unwrap(promise) {
  const response = await promise;
  return response.data.data;
}

function buildSignupPayload(payload) {
  if (!payload.avatar) {
    return payload;
  }

  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    formData.append(key, value);
  });

  return formData;
}

export const authService = {
  login(payload) {
    return unwrap(api.post("/auth/login", payload));
  },
  signup(payload) {
    return unwrap(api.post("/auth/register", buildSignupPayload(payload)));
  },
  refresh(refreshToken) {
    return unwrap(api.post("/auth/refresh", { refreshToken }));
  },
  logout(refreshToken) {
    return unwrap(api.post("/auth/logout", { refreshToken }));
  },
  logoutAll() {
    return unwrap(api.post("/auth/logout-all"));
  },
  getCurrentUser() {
    return unwrap(api.get("/auth/me"));
  },
  checkAvailability(params) {
    return unwrap(api.get("/auth/availability", { params }));
  },
  forgotPassword(email) {
    return unwrap(api.post("/auth/forgot-password", { email }));
  },
  resetPassword(payload) {
    return unwrap(api.post("/auth/reset-password", payload));
  },
  resendVerification() {
    return unwrap(api.post("/auth/resend-verification"));
  },
  verifyEmail(payload) {
    return unwrap(api.post("/auth/verify-email", payload));
  }
};
