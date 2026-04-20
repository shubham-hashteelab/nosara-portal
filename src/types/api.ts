import type {
  InspectionStatus,
  UserRole,
} from "./enums";

/* ───────── User ───────── */
export interface User {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  assigned_project_ids: string[];
  assigned_building_ids: string[];
  assigned_flat_ids: string[];
}

export interface UserCreate {
  username: string;
  password: string;
  full_name: string;
  role: UserRole;
}

export interface UserUpdate {
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
  password?: string;
}

/* ───────── Auth ───────── */
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

/* ───────── Project ───────── */
export interface Project {
  id: string;
  name: string;
  location: string;
  total_buildings: number;
  total_flats: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  location: string;
}

export interface ProjectUpdate {
  name?: string;
  location?: string;
}

/* ───────── Building ───────── */
export interface Building {
  id: string;
  project_id: string;
  name: string;
  total_floors: number;
  total_flats: number;
  created_at: string;
  updated_at: string;
}

export interface BuildingCreate {
  project_id: string;
  name: string;
}

export interface BuildingUpdate {
  name?: string;
}

/* ───────── Floor ───────── */
export interface Floor {
  id: string;
  building_id: string;
  floor_number: number;
  label: string;
  total_flats: number;
  created_at: string;
  updated_at: string;
}

export interface FloorCreate {
  building_id: string;
  floor_number: number;
  label: string;
}

export interface FloorUpdate {
  label?: string;
}

/* ───────── Flat ───────── */
export interface Flat {
  id: string;
  floor_id: string;
  flat_number: string;
  flat_type: string;
  inspection_status: InspectionStatus;
  created_at: string;
  updated_at: string;
}

export interface FlatCreate {
  floor_id: string;
  flat_number: string;
  flat_type: string;
}

export interface FlatUpdate {
  flat_number?: string;
  flat_type?: string;
}

/* ───────── Inspection Entry ───────── */
export interface InspectionEntry {
  id: string;
  flat_id: string;
  room_label: string;
  category: string;
  item_name: string;
  status: string;
  severity: string | null;
  snag_fix_status: string;
  notes: string | null;
  inspector_id: string | null;
  created_at: string;
  updated_at: string;
  images: SnagImage[];
  voice_notes: VoiceNote[];
  videos: InspectionVideo[];
}

export interface InspectionEntryUpdate {
  status?: string;
  severity?: string | null;
  snag_fix_status?: string | null;
  notes?: string | null;
}

/* ───────── Media ───────── */
export interface SnagImage {
  id: string;
  inspection_entry_id: string;
  minio_key: string;
  original_filename: string | null;
  file_size_bytes: number | null;
  created_at: string;
}

export interface VoiceNote {
  id: string;
  inspection_entry_id: string;
  minio_key: string;
  duration_ms: number;
  created_at: string;
}

export interface InspectionVideo {
  id: string;
  inspection_entry_id: string;
  minio_key: string;
  duration_ms: number;
  created_at: string;
}

/* ───────── Contractor ───────── */
export interface Contractor {
  id: string;
  name: string;
  trade: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContractorCreate {
  name: string;
  trade: string;
  phone?: string;
  email?: string;
  company?: string;
}

export interface ContractorUpdate {
  name?: string;
  trade?: string;
  phone?: string;
  email?: string;
  company?: string;
  is_active?: boolean;
}

export interface SnagContractorAssignment {
  id: string;
  entry_id: string;
  contractor_id: string;
  contractor_name: string;
  assigned_at: string;
  resolved_at: string | null;
}

/* ───────── Checklist Template ───────── */
export interface ChecklistTemplate {
  id: string;
  room_type: string;
  category: string;
  item_name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChecklistTemplateCreate {
  room_type: string;
  category: string;
  item_name: string;
  sort_order?: number;
}

export interface ChecklistTemplateUpdate {
  item_name?: string;
  sort_order?: number;
  is_active?: boolean;
}

/* ───────── Flat Type Rooms ───────── */
export interface FlatTypeRoom {
  id: string;
  flat_type: string;
  room_type: string;
  label: string;
  sort_order: number;
}

export interface FlatTypeRoomCreate {
  flat_type: string;
  room_type: string;
  label: string;
  sort_order?: number;
}

/* ───────── Floor Plan Layout ───────── */
export interface FloorPlanLayout {
  id: string;
  project_id: string | null;
  flat_type: string;
  room_label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FloorPlanLayoutCreate {
  project_id?: string | null;
  flat_type: string;
  room_label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/* ───────── Dashboard / Stats ───────── */
export interface ProjectStats {
  project_id: string;
  project_name: string;
  total_buildings: number;
  total_flats: number;
  inspected_flats: number;
  in_progress_flats: number;
  not_started_flats: number;
  total_snags: number;
  open_snags: number;
  fixed_snags: number;
  verified_snags: number;
  critical_snags: number;
  major_snags: number;
  minor_snags: number;
  snags_by_category: Record<string, number>;
}

export interface BuildingStats {
  building_id: string;
  building_name: string;
  total_flats: number;
  inspected_flats: number;
  in_progress_flats: number;
  total_snags: number;
  open_snags: number;
}

export interface InspectorActivity {
  inspector_id: string;
  inspector_name: string;
  date: string;
  entries_checked: number;
  snags_found: number;
}

export interface FloorProgress {
  floor_id: string;
  floor_number: number;
  label: string;
  total_flats: number;
  inspected_flats: number;
  in_progress_flats: number;
  not_started_flats: number;
  completion_pct: number;
  open_snags: number;
}

export interface TowerProgress {
  building_id: string;
  building_name: string;
  total_flats: number;
  inspected_flats: number;
  in_progress_flats: number;
  not_started_flats: number;
  completion_pct: number;
  total_snags: number;
  open_snags: number;
  critical_snags: number;
  major_snags: number;
  minor_snags: number;
  floors: FloorProgress[];
}

export interface TowerStatsResponse {
  project_id: string;
  project_name: string;
  total_flats: number;
  inspected_flats: number;
  in_progress_flats: number;
  not_started_flats: number;
  completion_pct: number;
  towers: TowerProgress[];
}

export interface TowerMini {
  building_id: string;
  building_name: string;
  total_flats: number;
  inspected_flats: number;
  in_progress_flats: number;
  not_started_flats: number;
  completion_pct: number;
}

export interface ProjectOverview {
  project_id: string;
  project_name: string;
  location: string;
  total_buildings: number;
  total_flats: number;
  inspected_flats: number;
  in_progress_flats: number;
  not_started_flats: number;
  completion_pct: number;
  towers: TowerMini[];
}

export interface ProjectsOverviewResponse {
  projects: ProjectOverview[];
}

/* ───────── Assignment mutations ───────── */
export type AssignmentLevel = "project" | "building" | "flat";

export interface AssignmentRemoval {
  user_id: string;
  user_name: string;
  level: AssignmentLevel;
  entity_id: string;
}

export interface AssignmentResult {
  detail: string;
  unassigned: AssignmentRemoval[];
}

export interface AssignmentConflict {
  user_id: string;
  full_name: string;
}

// Returned as `detail` on a 409 when another user already holds the same-level
// assignment. Portal reads this to show a reassign confirmation dialog.
export interface ExclusiveConflictDetail {
  code: "EXCLUSIVE_CONFLICT";
  level: AssignmentLevel;
  message: string;
  conflicts: AssignmentConflict[];
}

/* ───────── Assignment Coverage ───────── */
export type InspectorSource = "PROJECT" | "BUILDING" | "FLAT";

export interface InspectorRef {
  id: string;
  full_name: string;
  username: string;
  source: InspectorSource;
}

export interface FlatCoverage {
  flat_id: string;
  flat_number: string;
  flat_type: string;
  inspection_status: InspectionStatus;
  assigned_inspectors: InspectorRef[];
}

export interface FloorCoverage {
  floor_id: string;
  floor_number: number;
  label: string;
  total_flats: number;
  covered_flats: number;
  unassigned_flats: number;
  flats: FlatCoverage[];
}

export interface BuildingCoverage {
  building_id: string;
  building_name: string;
  total_flats: number;
  covered_flats: number;
  unassigned_flats: number;
  building_inspectors: InspectorRef[];
  floors: FloorCoverage[];
}

export interface AssignmentCoverageResponse {
  project_id: string;
  project_name: string;
  total_flats: number;
  covered_flats: number;
  unassigned_flats: number;
  project_inspectors: InspectorRef[];
  buildings: BuildingCoverage[];
}

export interface UsersSummary {
  total_users: number;
  total_managers: number;
  total_inspectors: number;
  idle_inspectors: number;
  total_unassigned_flats: number;
}

/* ───────── User Scope Details ───────── */
export interface ScopedProject {
  project_id: string;
  project_name: string;
  location: string;
  total_buildings: number;
  total_flats: number;
}

export interface ScopedBuilding {
  building_id: string;
  building_name: string;
  project_id: string;
  project_name: string;
  total_floors: number;
  total_flats: number;
}

export interface ScopedFlat {
  flat_id: string;
  flat_number: string;
  flat_type: string;
  floor_id: string;
  floor_number: number;
  floor_label: string;
  building_id: string;
  building_name: string;
  project_id: string;
  project_name: string;
}

export interface UserScopeDetails {
  user_id: string;
  role: UserRole;
  projects: ScopedProject[];
  buildings: ScopedBuilding[];
  flats: ScopedFlat[];
}

/* ───────── Sync ───────── */
export interface SyncPullResponse {
  flats: Flat[];
  inspection_entries: InspectionEntry[];
  checklist_templates: ChecklistTemplate[];
  flat_type_rooms: FlatTypeRoom[];
  server_timestamp: string;
}

/* ───────── Pagination ───────── */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

/* ───────── Health ───────── */
export interface HealthResponse {
  status: string;
  version?: string;
}
