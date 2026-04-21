import apiClient from "./client";
import type {
  Contractor,
  ContractorCreate,
  ContractorUpdate,
  SnagContractorAssignment,
} from "@/types/api";

export async function listContractors(): Promise<Contractor[]> {
  const response = await apiClient.get<Contractor[]>("/api/v1/contractors");
  return response.data;
}

export async function getContractor(id: string): Promise<Contractor> {
  const response = await apiClient.get<Contractor>(
    `/api/v1/contractors/${id}`
  );
  return response.data;
}

export async function createContractor(
  data: ContractorCreate
): Promise<Contractor> {
  const response = await apiClient.post<Contractor>(
    "/api/v1/contractors",
    data
  );
  return response.data;
}

export async function updateContractor(
  id: string,
  data: ContractorUpdate
): Promise<Contractor> {
  const response = await apiClient.patch<Contractor>(
    `/api/v1/contractors/${id}`,
    data
  );
  return response.data;
}

export async function deleteContractor(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/contractors/${id}`);
}

export async function assignContractorToSnag(
  entryId: string,
  contractorId: string,
  body?: { due_date?: string; notes?: string }
): Promise<SnagContractorAssignment> {
  const response = await apiClient.post<SnagContractorAssignment>(
    `/api/v1/entries/${entryId}/assign-contractor/${contractorId}`,
    body ?? {}
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
