import apiClient from "./client";
import type { Flat, FlatUpdate } from "@/types/api";

export async function listFlatsByFloor(floorId: string): Promise<Flat[]> {
  const response = await apiClient.get<Flat[]>(
    `/api/v1/floors/${floorId}/flats`
  );
  return response.data;
}

export async function getFlat(id: string): Promise<Flat> {
  const response = await apiClient.get<Flat>(`/api/v1/flats/${id}`);
  return response.data;
}

export async function createFlat(
  floorId: string,
  data: { flat_number: string; flat_type: string }
): Promise<Flat> {
  const response = await apiClient.post<Flat>(
    `/api/v1/floors/${floorId}/flats`,
    data
  );
  return response.data;
}

export async function updateFlat(
  id: string,
  data: FlatUpdate
): Promise<Flat> {
  const response = await apiClient.patch<Flat>(
    `/api/v1/flats/${id}`,
    data
  );
  return response.data;
}

export async function deleteFlat(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/flats/${id}`);
}
