
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5001/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export async function loginAdmin(email, password) {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  return response.data;
}

export function saveAuthSession(data) {
  if (!data?.token || !data?.admin) {
    throw new Error("Invalid authentication response.");
  }

  sessionStorage.setItem("adminToken", data.token);
  sessionStorage.setItem("adminUser", JSON.stringify(data.admin));
}

export function getAuthToken() {
  return sessionStorage.getItem("adminToken");
}

export function getAdminUser() {
  try {
    return JSON.parse(sessionStorage.getItem("adminUser") || "null");
  } catch {
    return null;
  }
}

export function logoutAdmin() {
  sessionStorage.removeItem("adminToken");
  sessionStorage.removeItem("adminUser");
}
