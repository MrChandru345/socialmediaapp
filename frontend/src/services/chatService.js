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
      if (payload.replyTo) formData.append("replyTo", payload.replyTo);
      
      const files = payload.attachments || (payload.file ? [payload.file] : []);
      files.forEach((file) => formData.append("attachments", file));

      const response = await api.post(`/chat/${userId}`, formData);
      return response.data.data;
    }

    const response = await api.post(`/chat/${userId}`, {
      body: payload.body || "",
      replyTo: payload.replyTo || null
    });
    return response.data.data;
  },
  
  async markConversationSeen(userId) {
    const response = await api.patch(`/chat/${userId}/seen`);
    return response.data.data;
  },

  async deleteMessage(messageId, action) {
    const response = await api.delete(`/chat/message/${messageId}`, {
      data: { action }
    });
    return response.data.data;
  },

  async getNotes() {
    const response = await api.get("/chat/notes/all");
    return response.data.data;
  },

  async createNote(body) {
    const response = await api.post("/chat/notes", { body });
    return response.data.data;
  },

  async deleteNote(noteId) {
    const response = await api.delete(`/chat/notes/${noteId}`);
    return response.data.data;
  }
};