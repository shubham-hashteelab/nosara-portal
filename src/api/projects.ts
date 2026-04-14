import apiClient from "./client";
import type { Project, ProjectCreate, ProjectUpdate } from "@/types/api";

export async function listProjects(): Promise<Project[]> {
  const response = await apiClient.get<Project[]>("/api/v1/projects");
  return response.data;
}

export async function getProject(id: string): Promise<Project> {
  const response = await apiClient.get<Project>(`/api/v1/projects/${id}`);
  return response.data;
}

export async function createProject(data: ProjectCreate): Promise<Project> {
  const response = await apiClient.post<Project>("/api/v1/projects", data);
  return response.data;
}

export async function updateProject(
  id: string,
  data: ProjectUpdate
): Promise<Project> {
  const response = await apiClient.patch<Project>(
    `/api/v1/projects/${id}`,
    data
  );
  return response.data;
}

export async function deleteProject(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/projects/${id}`);
}
