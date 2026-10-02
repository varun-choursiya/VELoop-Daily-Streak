
import axios from "axios";

const api = axios.create({
  baseURL: (
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api"
  ).replace(/\/+$/, ""),
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Attach JWT to every protected API request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("veloop_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("veloop_token");
    }

    return Promise.reject(error);
  }
);

export default api;