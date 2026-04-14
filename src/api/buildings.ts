import apiClient from "./client";
import type { Building, BuildingCreate, BuildingUpdate } from "@/types/api";

export async function listBuildingsByProject(
  projectId: string
): Promise<Building[]> {
  const response = await apiClient.get<Building[]>(
    `/api/v1/projects/${projectId}/buildings`
  );
  return response.data;
}

export async function getBuilding(id: string): Promise<Building> {
  const response = await apiClient.get<Building>(`/api/v1/buildings/${id}`);
  return response.data;
}

export async function createBuilding(data: BuildingCreate): Promise<Building> {
  const response = await apiClient.post<Building>("/api/v1/buildings", data);
  return response.data;
}

export async function updateBuilding(
  id: string,
  data: BuildingUpdate
): Promise<Building> {
  const response = await apiClient.put<Building>(
    `/api/v1/buildings/${id}`,
    data
  );
  return response.data;
}

export async function deleteBuilding(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/buildings/${id}`);
}
