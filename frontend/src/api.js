import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3002",
  headers: { "Content-Type": "application/json" },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(e);
  },
);

export const auth = {
  register: (data) => API.post("/auth/register", data),
  login: (data) => API.post("/auth/login", data),
};

export const shipments = {
  list: () => API.get("/shipments"),
  get: (id) => API.get(`/shipments/${id}`),
  create: (data) => API.post("/shipments", data),
};

export const track = {
  get: (carrier, trackingId) => {
    const c = encodeURIComponent(carrier || "");
    const t = encodeURIComponent(trackingId);
    return API.get(`/track/${c}/${t}`);
  },
};
