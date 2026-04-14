import apiClient from "./client";
import type { Flat, FlatCreate, FlatUpdate } from "@/types/api";

export async function listFlatsByFloor(floorId: number): Promise<Flat[]> {
  const response = await apiClient.get<Flat[]>(
    `/api/v1/floors/${floorId}/flats`
  );
  return response.data;
}

export async function getFlat(id: number): Promise<Flat> {
  const response = await apiClient.get<Flat>(`/api/v1/flats/${id}`);
  return response.data;
}

export async function createFlat(data: FlatCreate): Promise<Flat> {
  const response = await apiClient.post<Flat>("/api/v1/flats", data);
  return response.data;
}

export async function updateFlat(
  id: number,
  data: FlatUpdate
): Promise<Flat> {
  const response = await apiClient.put<Flat>(`/api/v1/flats/${id}`, data);
  return response.data;
}

export async function deleteFlat(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/flats/${id}`);
}
