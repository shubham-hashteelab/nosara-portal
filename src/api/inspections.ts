import apiClient from "./client";
import type { InspectionEntry, InspectionEntryUpdate } from "@/types/api";

export async function listInspectionsByFlat(
  flatId: number
): Promise<InspectionEntry[]> {
  const response = await apiClient.get<InspectionEntry[]>(
    `/api/v1/flats/${flatId}/inspections`
  );
  return response.data;
}

export async function getInspectionEntry(
  entryId: number
): Promise<InspectionEntry> {
  const response = await apiClient.get<InspectionEntry>(
    `/api/v1/inspections/${entryId}`
  );
  return response.data;
}

export async function updateInspectionEntry(
  entryId: number,
  data: InspectionEntryUpdate
): Promise<InspectionEntry> {
  const response = await apiClient.put<InspectionEntry>(
    `/api/v1/inspections/${entryId}`,
    data
  );
  return response.data;
}

export async function initializeChecklist(flatId: number): Promise<void> {
  await apiClient.post(`/api/v1/flats/${flatId}/initialize-checklist`);
}

export async function listAllSnags(params?: {
  project_id?: number;
  severity?: string;
  category?: string;
  snag_fix_status?: string;
  skip?: number;
  limit?: number;
}): Promise<InspectionEntry[]> {
  const response = await apiClient.get<InspectionEntry[]>(
    "/api/v1/inspections/snags",
    { params }
  );
  return response.data;
}
