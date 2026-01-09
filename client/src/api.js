// src/api.js
import axios from "axios";
import { API_BASE_URL } from "./config";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  timeout: 10000,
});

axiosInstance.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (!error.response) {
      if (error.code === "ECONNABORTED")
        return Promise.reject(new Error("Request timed out. Server is busy."));
      return Promise.reject(new Error("Network error. Check connection."));
    }
    const { status, config } = error.response;
    if (status === 401 && !config.url.includes("/auth/login")) {
      window.dispatchEvent(new Event("auth:unauthorized"));
    }
    return Promise.reject({
      status,
      message: error.response.data?.message || error.message,
    });
  }
);

const api = {
  get: (url, config) => axiosInstance.get(url, config),
  post: (url, data, config) => axiosInstance.post(url, data, config),
  put: (url, data, config) => axiosInstance.put(url, data, config),
  delete: (url, config) => axiosInstance.delete(url, config),

  login: async (email, password) => {
    try {
      return await axiosInstance.post("/auth/login", { email, password });
    } catch (error) {
      throw new Error(error.message || "Login failed");
    }
  },
  logout: async () => await axiosInstance.post("/auth/logout"),

  updateUser: async (id, data) => await axiosInstance.put(`/users/${id}`, data),
  deleteUser: async (id) => await axiosInstance.delete(`/users/${id}`),

  uploadFile: async (formData) => {
    return await axiosInstance.post("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getFileUrl: (fileId) => `${API_BASE_URL}/files/${fileId}`,
};

export default api;
