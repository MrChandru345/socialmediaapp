import api from "./api";

async function unwrap(promise) {
  const response = await promise;
  return response.data.data;
}

export const authService = {
  login(payload) {
    return unwrap(api.post("/auth/login", payload));
  },
  signup(payload) {
    return unwrap(api.post("/auth/register", payload));
  },
  getCurrentUser() {
    return unwrap(api.get("/auth/me"));
  }
};
