import apiClient from "./client";
import type { Floor, FloorCreate, FloorUpdate } from "@/types/api";

export async function listFloorsByBuilding(
  buildingId: number
): Promise<Floor[]> {
  const response = await apiClient.get<Floor[]>(
    `/api/v1/buildings/${buildingId}/floors`
  );
  return response.data;
}

export async function getFloor(id: number): Promise<Floor> {
  const response = await apiClient.get<Floor>(`/api/v1/floors/${id}`);
  return response.data;
}

export async function createFloor(data: FloorCreate): Promise<Floor> {
  const response = await apiClient.post<Floor>("/api/v1/floors", data);
  return response.data;
}

export async function updateFloor(
  id: number,
  data: FloorUpdate
): Promise<Floor> {
  const response = await apiClient.put<Floor>(`/api/v1/floors/${id}`, data);
  return response.data;
}

export async function deleteFloor(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/floors/${id}`);
}
