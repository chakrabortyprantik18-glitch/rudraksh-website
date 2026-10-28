const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000"
    : "https://api.rudrakshsocialculturalorganization.online");

export const API_URL = `${API_BASE_URL}/api/settings`;

export const ADMIN_API_URL = `${API_BASE_URL}/api/admin`;

export const BACKEND_URL = API_BASE_URL;

export default API_BASE_URL;