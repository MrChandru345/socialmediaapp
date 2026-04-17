import api from "./api";

export const postService = {
  async getFeed(params = {}) {
    const response = await api.get("/posts/feed", { params });
    return response.data.data;
  },
  async getExplore(params = {}) {
    const response = await api.get("/posts/explore", { params });
    return response.data.data;
  },
  async create(payload) {
    if (payload.file) {
      const formData = new FormData();
      formData.append("caption", payload.caption || "");
      formData.append("visibility", payload.visibility || "public");
      formData.append("media", payload.file);

      if (payload.mediaUrl) {
        formData.append(
          "media",
          JSON.stringify([
            {
              type: payload.mediaType || "image",
              url: payload.mediaUrl
            }
          ])
        );
      }

      const response = await api.post("/posts", formData);
      return response.data.data;
    }

    const response = await api.post("/posts", {
      caption: payload.caption || "",
      media: payload.mediaUrl
        ? [
            {
              type: payload.mediaType || "image",
              url: payload.mediaUrl
            }
          ]
        : [],
      visibility: payload.visibility || "public"
    });

    return response.data.data;
  },
  async toggleLike(postId) {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data.data;
  },
  async toggleSave(postId) {
    const response = await api.post(`/posts/${postId}/save`);
    return response.data.data;
  },
  async remove(postId) {
    const response = await api.delete(`/posts/${postId}`);
    return response.data.data;
  }
};