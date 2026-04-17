import api from "./api";

export const followService = {
  async toggle(targetUserId) {
    const response = await api.post(`/follows/${targetUserId}`);
    return response.data.data;
  }
};
