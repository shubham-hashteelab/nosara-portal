import axios from "axios";
import apiClient from "./client";
import type { LoginResponse, HealthResponse } from "@/types/api";

export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    "/api/v1/auth/login",
    { username, password }
  );
  return response.data;
}

export async function testConnection(url: string): Promise<HealthResponse> {
  const cleanUrl = url.replace(/\/+$/, "");
  const response = await axios.get<HealthResponse>(
    `${cleanUrl}/api/v1/health`
  );
  return response.data;
}
