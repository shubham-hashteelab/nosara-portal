import apiClient from "./client";
import type {
  InspectionEntry,
  InspectionEntryUpdate,
  OrphanedAssignment,
  SnagContractorAssignment,
} from "@/types/api";

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

export async function listAllSnags(params?: {
  project_id?: string;
  severity?: string;
  category?: string;
  snag_fix_status?: string;
  contractor_id?: string;
  skip?: number;
  limit?: number;
}): Promise<InspectionEntry[]> {
  const response = await apiClient.get<InspectionEntry[]>(
    "/api/v1/entries/snags",
    { params }
  );
  return response.data;
}

// ───── Contractor assignment (MANAGER only) ─────
//
// force=true atomically replaces an existing assignment on this entry.
// Without force, a pre-existing assignment triggers 409 EXCLUSIVE_CONFLICT
// with `existing_contractor_id` in the error body.

export async function assignContractorToSnag(
  entryId: string,
  contractorId: string,
  body?: { due_date?: string; notes?: string },
  force = false
): Promise<SnagContractorAssignment> {
  const response = await apiClient.post<SnagContractorAssignment>(
    `/api/v1/entries/${entryId}/assign-contractor/${contractorId}`,
    body ?? {},
    { params: force ? { force: true } : undefined }
  );
  return response.data;
}

export async function unassignContractorFromSnag(
  entryId: string,
  contractorId: string
): Promise<void> {
  await apiClient.delete(
    `/api/v1/entries/${entryId}/assign-contractor/${contractorId}`
  );
}

// ───── Manager verification flow ─────

export async function listVerificationQueue(params?: {
  project_id?: string;
  skip?: number;
  limit?: number;
}): Promise<InspectionEntry[]> {
  const response = await apiClient.get<InspectionEntry[]>(
    "/api/v1/entries/verification-queue",
    { params }
  );
  return response.data;
}

export async function verifyEntry(
  entryId: string,
  body: { verification_remark: string }
): Promise<InspectionEntry> {
  const response = await apiClient.post<InspectionEntry>(
    `/api/v1/entries/${entryId}/verify`,
    body
  );
  return response.data;
}

export async function rejectEntry(
  entryId: string,
  body: { rejection_remark: string }
): Promise<InspectionEntry> {
  const response = await apiClient.post<InspectionEntry>(
    `/api/v1/entries/${entryId}/reject`,
    body
  );
  return response.data;
}

export async function listOrphanedAssignments(): Promise<OrphanedAssignment[]> {
  const response = await apiClient.get<OrphanedAssignment[]>(
    "/api/v1/entries/orphaned-assignments"
  );
  return response.data;
}
