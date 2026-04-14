import type {
  CheckStatus,
  Severity,
  SnagFixStatus,
  InspectionStatus,
  UserRole,
  ChecklistCategory,
  RoomType,
} from "./enums";

/* ───────── User ───────── */
export interface User {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  assigned_project_ids: number[];
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
  id: number;
  name: string;
  address: string;
  developer_name: string;
  total_buildings: number;
  total_flats: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  address: string;
  developer_name: string;
}

export interface ProjectUpdate {
  name?: string;
  address?: string;
  developer_name?: string;
}

/* ───────── Building ───────── */
export interface Building {
  id: number;
  project_id: number;
  name: string;
  total_floors: number;
  total_flats: number;
  created_at: string;
  updated_at: string;
}

export interface BuildingCreate {
  project_id: number;
  name: string;
}

export interface BuildingUpdate {
  name?: string;
}

/* ───────── Floor ───────── */
export interface Floor {
  id: number;
  building_id: number;
  floor_number: number;
  label: string;
  total_flats: number;
  created_at: string;
  updated_at: string;
}

export interface FloorCreate {
  building_id: number;
  floor_number: number;
  label: string;
}

export interface FloorUpdate {
  label?: string;
}

/* ───────── Flat ───────── */
export interface Flat {
  id: number;
  floor_id: number;
  flat_number: string;
  flat_type: string;
  inspection_status: InspectionStatus;
  created_at: string;
  updated_at: string;
}

export interface FlatCreate {
  floor_id: number;
  flat_number: string;
  flat_type: string;
}

export interface FlatUpdate {
  flat_number?: string;
  flat_type?: string;
}

/* ───────── Inspection Entry ───────── */
export interface InspectionEntry {
  id: number;
  flat_id: number;
  room_type: RoomType;
  room_label: string;
  category: ChecklistCategory;
  checklist_item: string;
  check_status: CheckStatus;
  severity: Severity | null;
  snag_fix_status: SnagFixStatus | null;
  notes: string | null;
  inspector_id: number | null;
  inspector_name: string | null;
  created_at: string;
  updated_at: string;
  images: SnagImage[];
  voice_notes: VoiceNote[];
  contractor_assignments: SnagContractorAssignment[];
}

export interface InspectionEntryUpdate {
  check_status?: CheckStatus;
  severity?: Severity | null;
  snag_fix_status?: SnagFixStatus | null;
  notes?: string | null;
}

/* ───────── Media ───────── */
export interface SnagImage {
  id: number;
  entry_id: number;
  minio_key: string;
  caption: string | null;
  uploaded_at: string;
}

export interface VoiceNote {
  id: number;
  entry_id: number;
  minio_key: string;
  duration_seconds: number | null;
  transcript: string | null;
  uploaded_at: string;
}

/* ───────── Contractor ───────── */
export interface Contractor {
  id: number;
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
  id: number;
  entry_id: number;
  contractor_id: number;
  contractor_name: string;
  assigned_at: string;
  resolved_at: string | null;
}

/* ───────── Checklist Template ───────── */
export interface ChecklistTemplate {
  id: number;
  room_type: RoomType;
  category: ChecklistCategory;
  item_label: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChecklistTemplateCreate {
  room_type: RoomType;
  category: ChecklistCategory;
  item_label: string;
  sort_order?: number;
}

export interface ChecklistTemplateUpdate {
  item_label?: string;
  sort_order?: number;
  is_active?: boolean;
}

/* ───────── Flat Type Rooms ───────── */
export interface FlatTypeRoom {
  id: number;
  flat_type: string;
  room_type: RoomType;
  room_label: string;
  sort_order: number;
  created_at: string;
}

export interface FlatTypeRoomCreate {
  flat_type: string;
  room_type: RoomType;
  room_label: string;
  sort_order?: number;
}

/* ───────── Floor Plan Layout ───────── */
export interface FloorPlanLayout {
  id: number;
  project_id: number | null;
  flat_type: string;
  room_label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FloorPlanLayoutCreate {
  project_id?: number | null;
  flat_type: string;
  room_label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/* ───────── Dashboard / Stats ───────── */
export interface ProjectStats {
  project_id: number;
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
  building_id: number;
  building_name: string;
  total_flats: number;
  inspected_flats: number;
  in_progress_flats: number;
  total_snags: number;
  open_snags: number;
}

export interface OverdueSnag {
  entry_id: number;
  flat_number: string;
  building_name: string;
  checklist_item: string;
  severity: Severity;
  days_open: number;
  contractor_name: string | null;
}

export interface InspectorActivity {
  inspector_id: number;
  inspector_name: string;
  date: string;
  entries_checked: number;
  snags_found: number;
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
