import api from "./api";

export const storyService = {
  async getFeed() {
    const response = await api.get("/stories/feed");
    return response.data.data;
  },
  async create(payload) {
    if (payload.file) {
      const formData = new FormData();
      formData.append("caption", payload.caption || "");
      formData.append("media", payload.file);

      if (payload.mediaUrl) {
        formData.append(
          "media",
          JSON.stringify({
            type: payload.mediaType || "image",
            url: payload.mediaUrl
          })
        );
      }

      const response = await api.post("/stories", formData);
      return response.data.data;
    }

    const response = await api.post("/stories", {
      caption: payload.caption || "",
      media: payload.mediaUrl
        ? {
            type: payload.mediaType || "image",
            url: payload.mediaUrl
          }
        : null
    });

    return response.data.data;
  },
  async remove(storyId) {
    const response = await api.delete(`/stories/${storyId}`);
    return response.data.data;
  }
};
