import apiClient from "./client";
import type {
  AssignmentCoverageResponse,
  UsersSummary,
} from "@/types/api";

export async function getAssignmentCoverage(
  projectId: string
): Promise<AssignmentCoverageResponse> {
  const response = await apiClient.get<AssignmentCoverageResponse>(
    `/api/v1/dashboard/projects/${projectId}/assignment-coverage`
  );
  return response.data;
}

export async function getUsersSummary(): Promise<UsersSummary> {
  const response = await apiClient.get<UsersSummary>(
    "/api/v1/dashboard/users/summary"
  );
  return response.data;
}
