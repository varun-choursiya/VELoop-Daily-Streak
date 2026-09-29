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

export default api;


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("veloop_token");
    }
    return Promise.reject(error);
  }
);
