import axios from "axios";

const BACKEND_URL_KEY = "nosara_backend_url";
const TOKEN_KEY = "nosara_token";

export function getBackendUrl(): string | null {
  return localStorage.getItem(BACKEND_URL_KEY);
}

export function setBackendUrl(url: string): void {
  localStorage.setItem(BACKEND_URL_KEY, url.replace(/\/+$/, ""));
}

export function clearBackendUrl(): void {
  localStorage.removeItem(BACKEND_URL_KEY);
}

export function isBackendConfigured(): boolean {
  return !!getBackendUrl();
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

const apiClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const baseUrl = getBackendUrl();
  if (baseUrl) {
    config.baseURL = baseUrl;
  }

  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && currentPath !== "/setup") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
