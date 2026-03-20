import api from "./api";

export const notificationService = {
  async list() {
    const response = await api.get("/notifications");
    return response.data.data;
  }
};
