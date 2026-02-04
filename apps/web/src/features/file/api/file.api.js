import client from "../../../api/client";

const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || "http://localhost:3000";
  url = url.replace(/\/$/, ""); 
  if (!url.endsWith("/api")) url += "/api";
  return url;
};

export const fileApi = {
  getUrl: (id) => {
    if (!id) return "";
    return `${getBaseUrl()}/files/${id}`;
  },

  getTree: async () => {
    return client.get("/files/manager/tree");
  },

  getList: async (path, params = {}) => {
    return client.get("/files/manager/list", { 
      params: { path, ...params } 
    });
  },

  // [FIX] Generic Update Method (Renaming, Visibility, Access)
  update: async (id, updates) => {
    return client.patch(`/files/${id}`, updates);
  },

  move: async (id, { targetRecordType, targetCategory, targetRecordId }) => {
    return client.patch(`/files/manager/${id}/move`, {
      targetRecordType,
      targetCategory,
      targetRecordId
    });
  },

  // Kept for backward compatibility if needed, but .update() covers this
  rename: async (id, newName) => {
    return client.patch(`/files/${id}`, { name: newName });
  },

  // Bulk Visibility (Admin/Manager route)
  updateVisibility: async (ids, visibility) => {
    return client.patch(`/files/manager/visibility`, { 
      fileIds: Array.isArray(ids) ? ids : Array.from(ids), 
      visibility 
    });
  },

  delete: async (idOrIds) => {
    const ids = Array.isArray(idOrIds) ? idOrIds.join(',') : idOrIds;
    return client.delete(`/files/manager/${ids}`);
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
      link.setAttribute("download", finalFilename || `file-${id}`);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      throw error;
    }
  }
};