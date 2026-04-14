import apiClient from "./client";
import type {
  ChecklistTemplate,
  ChecklistTemplateCreate,
  ChecklistTemplateUpdate,
  FlatTypeRoom,
  FlatTypeRoomCreate,
  FloorPlanLayout,
  FloorPlanLayoutCreate,
} from "@/types/api";

/* ───────── Checklist Templates ───────── */

export async function listTemplates(): Promise<ChecklistTemplate[]> {
  const response = await apiClient.get<ChecklistTemplate[]>(
    "/api/v1/checklist-templates"
  );
  return response.data;
}

export async function createTemplate(
  data: ChecklistTemplateCreate
): Promise<ChecklistTemplate> {
  const response = await apiClient.post<ChecklistTemplate>(
    "/api/v1/checklist-templates",
    data
  );
  return response.data;
}

export async function updateTemplate(
  id: string,
  data: ChecklistTemplateUpdate
): Promise<ChecklistTemplate> {
  const response = await apiClient.put<ChecklistTemplate>(
    `/api/v1/checklist-templates/${id}`,
    data
  );
  return response.data;
}

export async function deleteTemplate(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/checklist-templates/${id}`);
}

export async function seedDefaults(): Promise<void> {
  await apiClient.post("/api/v1/checklist-templates/seed-defaults");
}

/* ───────── Flat Type Rooms ───────── */

export async function listFlatTypeRooms(
  flatType?: string
): Promise<FlatTypeRoom[]> {
  const response = await apiClient.get<FlatTypeRoom[]>(
    "/api/v1/flat-type-rooms",
    { params: flatType ? { flat_type: flatType } : undefined }
  );
  return response.data;
}

export async function createFlatTypeRoom(
  data: FlatTypeRoomCreate
): Promise<FlatTypeRoom> {
  const response = await apiClient.post<FlatTypeRoom>(
    "/api/v1/flat-type-rooms",
    data
  );
  return response.data;
}

export async function deleteFlatTypeRoom(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/flat-type-rooms/${id}`);
}

/* ───────── Floor Plan Layouts ───────── */

export async function listFloorPlanLayouts(): Promise<FloorPlanLayout[]> {
  const response = await apiClient.get<FloorPlanLayout[]>(
    "/api/v1/floor-plan-layouts"
  );
  return response.data;
}

export async function createFloorPlanLayout(
  data: FloorPlanLayoutCreate
): Promise<FloorPlanLayout> {
  const response = await apiClient.post<FloorPlanLayout>(
    "/api/v1/floor-plan-layouts",
    data
  );
  return response.data;
}

export async function deleteFloorPlanLayout(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/floor-plan-layouts/${id}`);
}

/* ───────── Seed Hierarchy ───────── */

export async function seedHierarchy(): Promise<void> {
  await apiClient.post("/api/v1/seed-hierarchy");
}
