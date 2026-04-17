import apiClient from "./client";
import type { InspectionEntry, InspectionEntryUpdate } from "@/types/api";

export async function listInspectionsByFlat(
  flatId: string
): Promise<InspectionEntry[]> {
  const response = await apiClient.get<InspectionEntry[]>(
    `/api/v1/flats/${flatId}/entries`
  );
  return response.data;
}

export async function getInspectionEntry(
  entryId: string
): Promise<InspectionEntry> {
  const response = await apiClient.get<InspectionEntry>(
    `/api/v1/entries/${entryId}`
  );
  return response.data;
}

export async function updateInspectionEntry(
  entryId: string,
  data: InspectionEntryUpdate
): Promise<InspectionEntry> {
  const response = await apiClient.patch<InspectionEntry>(
    `/api/v1/entries/${entryId}`,
    data
  );
  return response.data;
}

export async function listAllSnags(_params?: {
  project_id?: string;
  severity?: string;
  category?: string;
  snag_fix_status?: string;
  skip?: number;
  limit?: number;
}): Promise<InspectionEntry[]> {
  // No dedicated backend endpoint for snags — return empty array
  return [];
}
