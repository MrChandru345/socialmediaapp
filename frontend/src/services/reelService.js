import api from "./api";

export const reelService = {
  async getAll(params = {}) {
    const response = await api.get("/reels", { params });
    return response.data.data;
  },
  async create(payload) {
    const formData = new FormData();
    formData.append("caption", payload.caption || "");
    formData.append("video", payload.video);

    const response = await api.post("/reels", formData);
    return response.data.data;
  },
  async toggleLike(reelId) {
    const response = await api.post(`/reels/${reelId}/like`);
    return response.data.data;
  },
  async remove(reelId) {
    const response = await api.delete(`/reels/${reelId}`);
    return response.data.data;
  }
};

