import apiClient from "./client";
import type {
  User,
  UserCreate,
  UserScopeDetails,
  UserUpdate,
} from "@/types/api";

export async function listUsers(): Promise<User[]> {
  const response = await apiClient.get<User[]>("/api/v1/users");
  return response.data;
}

export async function getUser(id: string): Promise<User> {
  const response = await apiClient.get<User>(`/api/v1/users/${id}`);
  return response.data;
}

export async function getUserScopeDetails(
  id: string
): Promise<UserScopeDetails> {
  const response = await apiClient.get<UserScopeDetails>(
    `/api/v1/users/${id}/scope-details`
  );
  return response.data;
}

export async function createUser(data: UserCreate): Promise<User> {
  const response = await apiClient.post<User>("/api/v1/users", data);
  return response.data;
}

export async function updateUser(
  id: string,
  data: UserUpdate
): Promise<User> {
  const response = await apiClient.patch<User>(`/api/v1/users/${id}`, data);
  return response.data;
}

export async function assignProject(
  userId: string,
  projectId: string
): Promise<void> {
  await apiClient.post(
    `/api/v1/users/${userId}/assign-project/${projectId}`
  );
}

export async function unassignProject(
  userId: string,
  projectId: string
): Promise<void> {
  await apiClient.delete(
    `/api/v1/users/${userId}/assign-project/${projectId}`
  );
}

export async function assignBuilding(
  userId: string,
  buildingId: string
): Promise<void> {
  await apiClient.post(
    `/api/v1/users/${userId}/assign-building/${buildingId}`
  );
}

export async function unassignBuilding(
  userId: string,
  buildingId: string
): Promise<void> {
  await apiClient.delete(
    `/api/v1/users/${userId}/assign-building/${buildingId}`
  );
}

export async function assignFlat(
  userId: string,
  flatId: string
): Promise<void> {
  await apiClient.post(
    `/api/v1/users/${userId}/assign-flat/${flatId}`
  );
}

export async function unassignFlat(
  userId: string,
  flatId: string
): Promise<void> {
  await apiClient.delete(
    `/api/v1/users/${userId}/assign-flat/${flatId}`
  );
}
