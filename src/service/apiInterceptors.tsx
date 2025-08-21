import axios from "axios";
import { tokenStorage } from "@/store/storage";
import { BASE_URL } from "./config";
import { resetAndNavigate } from "@/utils/Helpers";

// Function to refresh tokens
export const refresh_tokens = async () => {
  try {
    const refreshToken = await tokenStorage.getString("refresh_token");
    const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
      refresh_token: refreshToken,
    });

    await tokenStorage.set("access_token", response.data.access_token);
    await tokenStorage.set("refresh_token", response.data.refresh_token);

    return response.data;
  } catch (error) {
    console.log("Refresh token error", error);
    await tokenStorage.clearAll();
    resetAndNavigate("/role");
  }
};

// Create an axios instance
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(async (config) => {
  const accessToken = await tokenStorage.getString("access_token");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await refresh_tokens();
        const accessToken = await tokenStorage.getString("access_token");
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
