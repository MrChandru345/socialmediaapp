import api from "./api";

export const followService = {
  async toggle(targetUserId) {
    const response = await api.post(`/follows/${targetUserId}`);
    return response.data.data;
  },
  async acceptRequest(requesterId) {
    const response = await api.post(`/follows/accept/${requesterId}`);
    return response.data.data;
  },
  async rejectRequest(requesterId) {
    const response = await api.post(`/follows/reject/${requesterId}`);
    return response.data.data;
  },
  async removeFollower(followerId) {
    const response = await api.delete(`/follows/remove/${followerId}`);
    return response.data.data;
  }
};

