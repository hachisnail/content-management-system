import client from "./client";

// Helper to ensure robust URL generation
const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || "http://localhost:3000";
  if (url.endsWith("/")) url = url.slice(0, -1);
  if (!url.endsWith("/api")) url += "/api";
  return url;
};

export const fileApi = {
  getUrl: (id, isPrivate = false) => {
    if (!id) return "";
    return `${getBaseUrl()}/files/${id}`;
  },

  fetchImageBlob: async (id) => {
    const response = await client.get(`/files/${id}`, { responseType: "blob" });
    return response.data;
  },

  download: async (id, filename) => {
    try {
      const response = await client.get(`/files/${id}`, { responseType: "blob" });
      
      let finalFilename = filename;
      if (!finalFilename) {
        const disposition = response.headers["content-disposition"];
        if (disposition && disposition.indexOf("filename=") !== -1) {
          const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
          if (matches != null && matches[1]) {
            finalFilename = matches[1].replace(/['"]/g, "");
          }
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", finalFilename || "download");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      throw error;
    }
  },

  // [UPDATED] Use standard PATCH route
  rename: async (id, newName) => {
    return client.patch(`/files/${id}`, { originalName: newName });
  },

  // [NEW] General update (e.g., for visibility)
  update: async (id, data) => {
    return client.patch(`/files/${id}`, data);
  }
};