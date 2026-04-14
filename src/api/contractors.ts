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
  const response = await apiClient.put<Contractor>(
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
  contractorId: string
): Promise<SnagContractorAssignment> {
  const response = await apiClient.post<SnagContractorAssignment>(
    `/api/v1/inspections/${entryId}/assign-contractor`,
    { contractor_id: contractorId }
  );
  return response.data;
}

export async function unassignContractorFromSnag(
  assignmentId: string
): Promise<void> {
  await apiClient.delete(`/api/v1/contractor-assignments/${assignmentId}`);
}
