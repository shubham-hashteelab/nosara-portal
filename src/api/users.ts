import apiClient from "./client";
import type { User, UserCreate, UserUpdate } from "@/types/api";

export async function listUsers(): Promise<User[]> {
  const response = await apiClient.get<User[]>("/api/v1/users");
  return response.data;
}

export async function getUser(id: number): Promise<User> {
  const response = await apiClient.get<User>(`/api/v1/users/${id}`);
  return response.data;
}

export async function createUser(data: UserCreate): Promise<User> {
  const response = await apiClient.post<User>("/api/v1/users", data);
  return response.data;
}

export async function updateUser(
  id: number,
  data: UserUpdate
): Promise<User> {
  const response = await apiClient.put<User>(`/api/v1/users/${id}`, data);
  return response.data;
}

export async function assignProject(
  userId: number,
  projectId: number
): Promise<void> {
  await apiClient.post(`/api/v1/users/${userId}/assign-project`, {
    project_id: projectId,
  });
}

export async function unassignProject(
  userId: number,
  projectId: number
): Promise<void> {
  await apiClient.delete(
    `/api/v1/users/${userId}/unassign-project/${projectId}`
  );
}
