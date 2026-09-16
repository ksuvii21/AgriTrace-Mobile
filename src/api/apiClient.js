import axios from "axios";

import { auth } from "../config/firebase";

import {
  APP_CONFIG,
} from "../constants/config";

const apiClient =
  axios.create({
    baseURL:
      APP_CONFIG.apiUrl,

    timeout: 15000,

    headers: {
      "Content-Type":
        "application/json",
    },
  });

apiClient.interceptors.request.use(
  async (config) => {
    const user = auth?.currentUser;

    if (!user) {
      delete config.headers.Authorization;
      return config;
    }

    try {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.warn("[apiClient] Failed to get Firebase ID token:", error);
      delete config.headers.Authorization;
    }

    return config;
  }
);

apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const status =
      error.response?.status;

    const message =
      error.response?.data
        ?.message ||
      error.response?.data
        ?.detail ||
      error.message ||
      "Request failed";

    const wrapped =
      new Error(message);

    wrapped.status = status;

    wrapped.data =
      error.response?.data;

    wrapped.original =
      error;

    throw wrapped;
  }
);

export function unwrapEnvelope(
  response
) {
  const body =
    response?.data;

  if (
    body &&
    typeof body === "object" &&
    "success" in body &&
    "data" in body
  ) {
    return body.data;
  }

  return body;
}

export default apiClient;