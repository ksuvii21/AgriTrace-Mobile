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

if (__DEV__) {
  console.log(
    "[apiClient] baseURL:",
    APP_CONFIG.apiUrl
  );
}

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

    const requestUrl =
      error.config?.baseURL +
      (error.config?.url || "");

    const wrapped =
      new Error(message);

    wrapped.status = status;

    wrapped.data =
      error.response?.data;

    wrapped.original =
      error;

    wrapped.url = requestUrl;

    // Preserve Axios error code for diagnostics
    // (e.g. ERR_NETWORK, ECONNABORTED, ETIMEDOUT)
    if (error.code) {
      wrapped.code = error.code;
    }

    // Detailed logging for network-level errors
    if (!error.response && __DEV__) {
      console.error(
        "[apiClient] Network request failed:",
        JSON.stringify({
          code: error.code,
          url: requestUrl,
          baseURL: error.config?.baseURL,
          method: error.config?.method,
          timeout: error.config?.timeout,
          message: error.message,
          hasAuthHeader:
            !!error.config?.headers
              ?.Authorization,
        }, null, 2)
      );
    }

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