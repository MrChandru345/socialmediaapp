import api from "./api";

export const adminService = {
  async getStats() {
    const response = await api.get("/admin/stats");
    return response.data.data;
  },
  async getUsers(params = {}) {
    const response = await api.get("/admin/users", { params });
    return response.data.data;
  },
  async deletePost(postId) {
    const response = await api.delete(`/admin/posts/${postId}`);
    return response.data.data;
  }
};
