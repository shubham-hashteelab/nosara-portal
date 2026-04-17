import apiClient from "./client";
import type {
  ProjectStats,
  BuildingStats,
  InspectorActivity,
} from "@/types/api";

export async function getProjectStats(
  projectId: string
): Promise<ProjectStats> {
  const response = await apiClient.get<ProjectStats>(
    `/api/v1/dashboard/projects/${projectId}/stats`
  );
  return response.data;
}

export async function getBuildingStats(
  projectId: string
): Promise<BuildingStats[]> {
  const response = await apiClient.get<BuildingStats[]>(
    `/api/v1/dashboard/projects/${projectId}/building-stats`
  );
  return response.data;
}

export async function getInspectorActivity(
  projectId: string,
  days: number = 7
): Promise<InspectorActivity[]> {
  const response = await apiClient.get<InspectorActivity[]>(
    `/api/v1/dashboard/projects/${projectId}/inspector-activity`,
    { params: { days } }
  );
  return response.data;
}
