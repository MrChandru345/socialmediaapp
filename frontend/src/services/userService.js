import api from "./api";

export const userService = {
  async getProfile(identifier) {
    const response = await api.get(`/users/${identifier}`);
    return response.data.data;
  },
  async getPosts(identifier, params = {}) {
    const response = await api.get(`/users/${identifier}/posts`, { params });
    return response.data.data;
  },
  async getSuggestions() {
    const response = await api.get("/users/suggestions");
    return response.data.data;
  },
  async getFollowing() {
    const response = await api.get("/users/me/following");
    return response.data.data;
  },
  async search(query) {
    const response = await api.get("/users/search", {
      params: { q: query }
    });
    return response.data.data;
  },
  async updateMyProfile(payload) {
    if (payload.file) {
      const formData = new FormData();
      formData.append("fullName", payload.fullName || "");
      formData.append("bio", payload.bio || "");
      formData.append("website", payload.website || "");
      formData.append("location", payload.location || "");
      formData.append("avatar", payload.file);

      if (payload.avatarUrl) {
        formData.append("avatarUrl", payload.avatarUrl);
      }

      const response = await api.patch("/users/me", formData);
      return response.data.data;
    }

    const response = await api.patch("/users/me", {
      avatarUrl: payload.avatarUrl || "",
      bio: payload.bio || "",
      fullName: payload.fullName || "",
      location: payload.location || "",
      website: payload.website || ""
    });

    return response.data.data;
  }
};