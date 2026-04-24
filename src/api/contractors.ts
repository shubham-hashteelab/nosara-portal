/**
 * Contractor API — Phase 2+ of the contractor role rollout.
 *
 * Contractors are now users with role=CONTRACTOR. The old /api/v1/contractors
 * routes return 410 Gone. This module re-exports the user-based queries under
 * familiar names so existing import sites across the portal keep working.
 *
 * Backend does not currently support a `?role=` filter on /users, so
 * listContractors() fetches the full user list and filters client-side.
 * The user list is small (tens of rows), so this is acceptable.
 */
import { listUsers, createUser, getUser, updateUser } from "./users";
import { UserRole } from "@/types/enums";
import type { User, UserCreate, UserUpdate } from "@/types/api";

export async function listContractors(): Promise<User[]> {
  const users = await listUsers();
  return users.filter((u) => u.role === UserRole.CONTRACTOR);
}

export async function getContractor(id: string): Promise<User> {
  return getUser(id);
}

export async function createContractor(data: UserCreate): Promise<User> {
  return createUser({ ...data, role: UserRole.CONTRACTOR });
}

export async function updateContractor(
  id: string,
  data: UserUpdate,
  force = false
): Promise<User> {
  return updateUser(id, data, force);
}

// Assign / unassign endpoints live under /entries — re-exported from inspections.ts
// so pages can keep importing from @/api/contractors where convenient.
export {
  assignContractorToSnag,
  unassignContractorFromSnag,
} from "./inspections";
