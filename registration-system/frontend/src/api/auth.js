
import axios from "axios";

const api = axios.create({
  baseURL: "https://forms-api.rudrakshsocialculturalorganization.online/api",
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

// Verify the stored token with the backend.
// This requires a protected GET /api/auth/me endpoint.
export async function verifyAdminSession() {
  const token = getAuthToken();

  if (!token) return false;

  try {
    const response = await api.get("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data?.success === true;
  } catch {
    logoutAdmin();
    return false;
  }
}
