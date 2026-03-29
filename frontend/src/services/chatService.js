import api from "./api";

export const chatService = {
  async getConversations() {
    const response = await api.get("/chat/conversations");
    return response.data.data;
  },
  
  async getMessages(userId, params = {}) {
    const response = await api.get(`/chat/${userId}`, { params });
    return response.data.data;
  },
  
  async sendMessage(userId, payload) {
    // Handle media attachments via FormData if they exist
    if (payload.file || (payload.attachments && payload.attachments.length > 0)) {
      const formData = new FormData();
      formData.append("body", payload.body || "");
      
      const files = payload.attachments || (payload.file ? [payload.file] : []);
      files.forEach((file) => formData.append("attachments", file));

      const response = await api.post(`/chat/${userId}`, formData);
      return response.data.data;
    }

    const response = await api.post(`/chat/${userId}`, {
      body: payload.body || ""
    });
    return response.data.data;
  },
  
  async markConversationSeen(userId) {
    const response = await api.patch(`/chat/${userId}/seen`);
    return response.data.data;
  }
};