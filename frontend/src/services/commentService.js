import api from "./api";

export const commentService = {
  async list(postId, params = {}) {
    const response = await api.get(`/comments/post/${postId}`, { params });
    return response.data.data;
  },
  async create(postId, payload) {
    const response = await api.post(`/comments/post/${postId}`, payload);
    return response.data.data;
  },
  async remove(commentId) {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data.data;
  },
  async toggleLike(commentId) {
    const response = await api.post(`/comments/${commentId}/like`);
    return response.data.data;
  }
};
