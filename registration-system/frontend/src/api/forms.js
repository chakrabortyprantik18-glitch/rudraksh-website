
import axios from "axios";
import { getAuthToken } from "./auth";

const API_URL = "https://forms-api.rudrakshsocialculturalorganization.online/api";

// Admin API
const formsApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach admin authentication token
formsApi.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Public participant API — no admin token or JSON default header
const participantApi = axios.create({
  baseURL: API_URL,
});

// CREATE REGISTRATION FORM
export async function saveRegistrationForm(formData) {
  const response = await formsApi.post("/forms", formData);
  return response.data;
}

// GET ALL REGISTRATION FORMS
export async function getRegistrationForms() {
  const response = await formsApi.get("/forms");
  return response.data;
}

// UPDATE REGISTRATION STATUS
export async function updateRegistrationStatus(formId, status) {
  const response = await formsApi.patch(
    `/forms/${formId}/status`,
    { status }
  );

  return response.data;
}

// SUBMIT PARTICIPANT APPLICATION WITH PHOTO
export async function submitParticipantApplication(formData) {
  const response = await participantApi.post(
    "/applications",
    formData
  );

  return response.data;
}

// CREATE RAZORPAY PAYMENT ORDER
export async function createPaymentOrder(applicationId) {
  const response = await participantApi.post(
    "/payments/create-order",
    { applicationId }
  );

  return response.data;
}

// VERIFY RAZORPAY PAYMENT
export async function verifyPayment(paymentDetails) {
  const response = await participantApi.post(
    "/payments/verify",
    paymentDetails
  );

  return response.data;
}

export default formsApi;
