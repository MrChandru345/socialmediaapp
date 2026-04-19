import api from "./api";

export const chatService = {
  async getConversations() {
    const response = await api.get("/chat/conversations");
    return response.data.data;
  },
  
  async getUnreadCount() {
    const response = await api.get("/chat/unread-count");
    return response.data.data;
  },
  
  async getMessages(userId, params = {}) {
    const response = await api.get(`/chat/${userId}`, { params });
    return response.data.data;
  },
  
  async sendMessage(userId, payload) {
    // If a physical file is provided (e.g. from file input or recording), use FormData
    if (payload.file) {
      const formData = new FormData();
      formData.append("body", payload.body || "");
      if (payload.replyTo) formData.append("replyTo", payload.replyTo);
      if (payload.sharedPost) formData.append("sharedPost", payload.sharedPost);
      formData.append("attachments", payload.file);

      const response = await api.post(`/chat/${userId}`, formData);
      return response.data.data;
    }

    // Otherwise, send as JSON (supports forwarding already-uploaded attachments)
    const response = await api.post(`/chat/${userId}`, {
      body: payload.body || "",
      replyTo: payload.replyTo || null,
      attachments: payload.attachments || [],
      sharedPost: payload.sharedPost || null
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

  async reactToMessage(messageId, emoji) {
    const response = await api.post(`/chat/message/${messageId}/react`, { emoji });
    return response.data.data;
  },

  async clearConversation(userId) {
    const response = await api.delete(`/chat/conversations/${userId}`);
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