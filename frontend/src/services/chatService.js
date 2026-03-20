import api from "./api";

export const chatService = {
  async getConversations() {
    const response = await api.get("/chat/conversations");
    return response.data.data;
  }
};
