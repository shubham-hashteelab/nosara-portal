import apiClient from "./client";
import type { Building, BuildingUpdate } from "@/types/api";

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

export async function createBuilding(
  projectId: string,
  data: { name: string }
): Promise<Building> {
  const response = await apiClient.post<Building>(
    `/api/v1/projects/${projectId}/buildings`,
    data
  );
  return response.data;
}

export async function updateBuilding(
  id: string,
  data: BuildingUpdate
): Promise<Building> {
  const response = await apiClient.patch<Building>(
    `/api/v1/buildings/${id}`,
    data
  );
  return response.data;
}

export async function deleteBuilding(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/buildings/${id}`);
}
