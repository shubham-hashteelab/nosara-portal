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
  email: string | null;
  phone: string | null;
  company: string | null;
  trades: string[] | null;   // populated only when role === "CONTRACTOR"
  assigned_project_ids: string[];
  assigned_building_ids: string[];
  assigned_flat_ids: string[];
}

export interface UserCreate {
  username: string;
  password: string;
  full_name: string;
  role: UserRole;
  email?: string | null;
  phone?: string | null;
  // CONTRACTOR only — backend rejects trades/company on other roles.
  trades?: string[];
  company?: string | null;
}

// Role is not editable via PATCH — backend UserUpdate schema rejects it.
export interface UserUpdate {
  full_name?: string;
  is_active?: boolean;
  password?: string;
  email?: string | null;
  phone?: string | null;
  // CONTRACTOR only.
  trades?: string[];
  company?: string | null;
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

// Parent projectId goes in the URL (`POST /projects/{id}/buildings`), not the body.
export interface BuildingCreate {
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

// Parent buildingId goes in the URL. `label` is server-computed from floor_number.
export interface FloorCreate {
  floor_number: number;
}

export interface FloorUpdate {
  floor_number?: number;
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

// Parent floorId goes in the URL (`POST /floors/{id}/flats`).
export interface FlatCreate {
  flat_number: string;
  flat_type: string;
}

export interface FlatUpdate {
  flat_number?: string;
  flat_type?: string;
  inspection_status?: InspectionStatus;
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
  trade: string;
  fixed_at: string | null;
  fixed_by_id: string | null;
  verified_at: string | null;
  verified_by_id: string | null;
  verification_remark: string | null;
  rejection_remark: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
  images: SnagImage[];
  voice_notes: VoiceNote[];
  videos: InspectionVideo[];
  contractor_assignments: ContractorAssignmentBrief[];
}

export interface InspectionEntryUpdate {
  status?: string;
  severity?: string | null;
  notes?: string | null;
  // snag_fix_status can only be sent as an idempotent no-op; backend rejects
  // any transition here. Real state changes go through /mark-fixed, /verify,
  // or /reject endpoints.
  snag_fix_status?: string | null;
}

/* ───────── Media ───────── */
export interface SnagImage {
  id: string;
  inspection_entry_id: string;
  minio_key: string;
  original_filename: string | null;
  file_size_bytes: number | null;
  kind: string;   // "NC" (inspector-uploaded defect photo) | "CLOSURE" (contractor post-fix photo)
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

/* ───────── Contractor assignments ─────────
 * Contractors are users with role=CONTRACTOR. The old standalone Contractor
 * type is gone; use User wherever a contractor row is needed.
 */
export interface ContractorAssignmentBrief {
  id: string;
  inspection_entry_id: string;
  contractor_id: string;
  contractor_name: string;
  contractor_trades: string[];
  assigned_at: string;
  due_date: string | null;
  notes: string | null;
}

// Response shape returned by POST /entries/{id}/assign-contractor.
// Same fields as the brief embedded on InspectionEntry.contractor_assignments.
export type SnagContractorAssignment = ContractorAssignmentBrief;

export interface OrphanedAssignment {
  assignment_id: string;
  inspection_entry_id: string;
  contractor_id: string;
  contractor_name: string;
  contractor_role: string;
  contractor_is_active: boolean;
  assigned_at: string;
}

// Body of the 409 returned by PATCH /users/{id} with is_active=false on a
// CONTRACTOR that still has non-VERIFIED assignments.
export interface OpenAssignmentEntry {
  entry_id: string;
  item_name: string;
  snag_fix_status: string;
}

export interface DeactivateConflictDetail {
  code: "OPEN_ASSIGNMENTS";
  message: string;
  entries: OpenAssignmentEntry[];
}

/* ───────── Checklist Template ───────── */
export interface ChecklistTemplate {
  id: string;
  project_id: string | null;
  room_type: string;
  category: string;
  item_name: string;
  trade: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChecklistTemplateCreate {
  project_id?: string | null;
  room_type: string;
  category: string;
  item_name: string;
  trade: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface ChecklistTemplateUpdate {
  room_type?: string;
  category?: string;
  item_name?: string;
  trade?: string;
  sort_order?: number;
  is_active?: boolean;
}

/* ───────── Flat Type Rooms ───────── */
export interface FlatTypeRoom {
  id: string;
  project_id: string | null;
  flat_type: string;
  room_type: string;
  label: string;
  sort_order: number;
}

export interface FlatTypeRoomCreate {
  project_id?: string | null;
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

/* ───────── Sync ─────────
 * Shape mirrors backend `SyncPullResponse`. Portal does not call /sync directly
 * today — this interface exists for accuracy if/when a portal feature consumes it.
 */
export interface ScopeSnapshot {
  project_ids: string[];
  building_ids: string[];
  floor_ids: string[];
  flat_ids: string[];
}

export interface SyncPullResponse {
  projects: Project[];
  buildings: Building[];
  floors: Floor[];
  flats: Flat[];
  inspection_entries: InspectionEntry[];
  contractors: User[];   // post-Phase1 backend returns empty list; field kept for wire compatibility
  checklist_templates: ChecklistTemplate[];
  flat_type_rooms: FlatTypeRoom[];
  floor_plan_layouts: FloorPlanLayout[];
  deleted_ids: string[];
  scope_snapshot: ScopeSnapshot;
  server_time: string;
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
