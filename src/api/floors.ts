import apiClient from "./client";
import type { Floor, FloorUpdate } from "@/types/api";

export async function listFloorsByBuilding(
  buildingId: string
): Promise<Floor[]> {
  const response = await apiClient.get<Floor[]>(
    `/api/v1/buildings/${buildingId}/floors`
  );
  return response.data;
}

export async function getFloor(id: string): Promise<Floor> {
  const response = await apiClient.get<Floor>(`/api/v1/floors/${id}`);
  return response.data;
}

export async function createFloor(
  buildingId: string,
  data: { floor_number: number }
): Promise<Floor> {
  const response = await apiClient.post<Floor>(
    `/api/v1/buildings/${buildingId}/floors`,
    data
  );
  return response.data;
}

export async function updateFloor(
  id: string,
  data: FloorUpdate
): Promise<Floor> {
  const response = await apiClient.patch<Floor>(
    `/api/v1/floors/${id}`,
    data
  );
  return response.data;
}

export async function deleteFloor(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/floors/${id}`);
}
