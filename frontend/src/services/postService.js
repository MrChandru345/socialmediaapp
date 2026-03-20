import api from "./api";

export const postService = {
  async getFeed() {
    const response = await api.get("/posts/feed");
    return response.data.data;
  }
};
