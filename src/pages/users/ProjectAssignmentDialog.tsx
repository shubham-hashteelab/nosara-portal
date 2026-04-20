import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { listProjects } from "@/api/projects";
import { listBuildingsByProject } from "@/api/buildings";
import { listFloorsByBuilding } from "@/api/floors";
import { getAssignmentCoverage } from "@/api/coverage";
import {
  getUser,
  assignProject,
  unassignProject,
  assignBuilding,
  unassignBuilding,
  assignFlat,
  unassignFlat,
} from "@/api/users";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { TowerGridPanel } from "@/components/users/TowerGridPanel";
import {
  Plus,
  X,
  ChevronRight,
  ChevronDown,
  Building2,
  FolderOpen,
  AlertTriangle,
} from "lucide-react";
import type {
  AssignmentResult,
  InspectorRef,
  User,
} from "@/types/api";

interface ProjectAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

// The action the manager has requested but not yet confirmed because it
// would reassign a scope currently held by other inspectors.
type PendingReassign =
  | {
      kind: "project";
      projectId: string;
      label: string;
      conflicts: InspectorRef[];
    }
  | {
      kind: "building";
      buildingId: string;
      label: string;
      conflicts: InspectorRef[];
    }
  | {
      kind: "flat";
      flatId: string;
      label: string;
      conflicts: InspectorRef[];
    };

export function ProjectAssignmentDialog({
  open,
  onOpenChange,
  user,
}: ProjectAssignmentDialogProps) {
  const queryClient = useQueryClient();
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [expandedBuilding, setExpandedBuilding] = useState<string | null>(null);
  const [pendingFlatIds, setPendingFlatIds] = useState<Set<string>>(new Set());
  const [pendingReassign, setPendingReassign] =
    useState<PendingReassign | null>(null);
  const [reassignSummary, setReassignSummary] = useState<string | null>(null);

  const toggleProject = (projectId: string) => {
    setExpandedProject((p) => (p === projectId ? null : projectId));
    setExpandedBuilding(null);
  };

  const { data: liveUser } = useQuery({
    queryKey: ["user", user?.id],
    queryFn: () => getUser(user!.id),
    enabled: open && !!user,
  });

  const currentUser = liveUser ?? user;

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
    enabled: open,
  });

  const { data: buildings } = useQuery({
    queryKey: ["buildings", expandedProject],
    queryFn: () => listBuildingsByProject(expandedProject!),
    enabled: !!expandedProject,
  });

  const { data: floors, isLoading: isLoadingFloors } = useQuery({
    queryKey: ["floors", expandedBuilding],
    queryFn: () => listFloorsByBuilding(expandedBuilding!),
    enabled: !!expandedBuilding,
  });

  // Coverage tells us who ELSE is assigned inside this project so we can
  // render chips and compute reassign conflicts without an extra call per
  // row. Fetched only when a project is expanded.
  const { data: coverage } = useQuery({
    queryKey: ["assignment-coverage", expandedProject],
    queryFn: () => getAssignmentCoverage(expandedProject!),
    enabled: !!expandedProject,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
    queryClient.invalidateQueries({ queryKey: ["user", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["assignment-coverage"] });
    queryClient.invalidateQueries({ queryKey: ["users-summary"] });
  };

  const formatRemovals = (result: AssignmentResult) => {
    if (!result.unassigned?.length) return null;
    const grouped = new Map<string, string[]>();
    for (const r of result.unassigned) {
      const list = grouped.get(r.user_name) ?? [];
      list.push(r.level);
      grouped.set(r.user_name, list);
    }
    return [...grouped.entries()]
      .map(
        ([name, levels]) =>
          `${name} (${levels.length} ${levels.length === 1 ? "assignment" : "assignments"})`
      )
      .join(", ");
  };

  const projectMutation = useMutation({
    mutationFn: ({
      action,
      projectId,
      force,
    }: {
      action: "assign" | "unassign";
      projectId: string;
      force?: boolean;
    }) =>
      action === "assign"
        ? assignProject(user!.id, projectId, force)
        : unassignProject(user!.id, projectId),
    onSuccess: (result) => {
      invalidate();
      if (result && typeof result === "object" && "unassigned" in result) {
        const msg = formatRemovals(result);
        if (msg) setReassignSummary(`Reassigned from ${msg}.`);
      }
    },
  });

  const buildingMutation = useMutation({
    mutationFn: ({
      action,
      buildingId,
      force,
    }: {
      action: "assign" | "unassign";
      buildingId: string;
      force?: boolean;
    }) =>
      action === "assign"
        ? assignBuilding(user!.id, buildingId, force)
        : unassignBuilding(user!.id, buildingId),
    onSuccess: (result) => {
      invalidate();
      if (result && typeof result === "object" && "unassigned" in result) {
        const msg = formatRemovals(result);
        if (msg) setReassignSummary(`Reassigned from ${msg}.`);
      }
    },
  });

  const flatMutation = useMutation({
    mutationFn: ({
      action,
      flatId,
      force,
    }: {
      action: "assign" | "unassign";
      flatId: string;
      force?: boolean;
    }) =>
      action === "assign"
        ? assignFlat(user!.id, flatId, force)
        : unassignFlat(user!.id, flatId),
    onMutate: ({ flatId }) => {
      setPendingFlatIds((prev) => new Set(prev).add(flatId));
    },
    onSettled: (_data, _err, { flatId }) => {
      setPendingFlatIds((prev) => {
        const next = new Set(prev);
        next.delete(flatId);
        return next;
      });
    },
    onSuccess: (result) => {
      invalidate();
      if (result && typeof result === "object" && "unassigned" in result) {
        const msg = formatRemovals(result);
        if (msg) setReassignSummary(`Reassigned from ${msg}.`);
      }
    },
  });

  // ---- Conflict maps from coverage ----
  // Only inspectors OTHER than the user being edited are treated as
  // conflicts — a user can of course re-acquire a level they already lost.
  const {
    projectOtherInspectors,
    buildingOtherInspectors,
    flatOtherInspectors,
  } = useMemo(() => {
    const empty = {
      projectOtherInspectors: [] as InspectorRef[],
      buildingOtherInspectors: new Map<string, InspectorRef[]>(),
      flatOtherInspectors: new Map<string, InspectorRef[]>(),
    };
    if (!coverage || !currentUser) return empty;

    const isOther = (i: InspectorRef) => i.id !== currentUser.id;

    const projectOther = coverage.project_inspectors.filter(isOther);
    const buildingMap = new Map<string, InspectorRef[]>();
    const flatMap = new Map<string, InspectorRef[]>();

    for (const b of coverage.buildings) {
      const directBuildingOther = b.building_inspectors.filter(
        (i) => i.source === "BUILDING" && isOther(i)
      );
      if (directBuildingOther.length) {
        buildingMap.set(b.building_id, directBuildingOther);
      }
      for (const f of b.floors) {
        for (const flat of f.flats) {
          const directFlatOther = flat.assigned_inspectors.filter(
            (i) => i.source === "FLAT" && isOther(i)
          );
          if (directFlatOther.length) {
            flatMap.set(flat.flat_id, directFlatOther);
          }
        }
      }
    }

    return {
      projectOtherInspectors: projectOther,
      buildingOtherInspectors: buildingMap,
      flatOtherInspectors: flatMap,
    };
  }, [coverage, currentUser]);

  // ---- Pre-assign conflict-check gates ----
  const tryAssignProject = (projectId: string, projectName: string) => {
    const conflicts = projectOtherInspectors;
    if (conflicts.length === 0) {
      projectMutation.mutate({ action: "assign", projectId, force: false });
      return;
    }
    setPendingReassign({
      kind: "project",
      projectId,
      label: projectName,
      conflicts,
    });
  };

  const tryAssignBuilding = (buildingId: string, buildingName: string) => {
    const conflicts = buildingOtherInspectors.get(buildingId) ?? [];
    if (conflicts.length === 0) {
      buildingMutation.mutate({ action: "assign", buildingId, force: false });
      return;
    }
    setPendingReassign({
      kind: "building",
      buildingId,
      label: buildingName,
      conflicts,
    });
  };

  const toggleFlat = (flatId: string, currentlyAssigned: boolean) => {
    if (currentlyAssigned) {
      flatMutation.mutate({ action: "unassign", flatId });
      return;
    }
    const conflicts = flatOtherInspectors.get(flatId) ?? [];
    if (conflicts.length === 0) {
      flatMutation.mutate({ action: "assign", flatId, force: false });
      return;
    }
    // We don't have a nice label for the flat this deep; use ID suffix.
    setPendingReassign({
      kind: "flat",
      flatId,
      label: `Flat ${flatId.slice(0, 8)}`,
      conflicts,
    });
  };

  const confirmReassign = () => {
    if (!pendingReassign) return;
    if (pendingReassign.kind === "project") {
      projectMutation.mutate({
        action: "assign",
        projectId: pendingReassign.projectId,
        force: true,
      });
    } else if (pendingReassign.kind === "building") {
      buildingMutation.mutate({
        action: "assign",
        buildingId: pendingReassign.buildingId,
        force: true,
      });
    } else {
      flatMutation.mutate({
        action: "assign",
        flatId: pendingReassign.flatId,
        force: true,
      });
    }
    setPendingReassign(null);
  };

  if (!user) return null;

  const assignedProjects = new Set(currentUser?.assigned_project_ids ?? []);
  const assignedBuildings = new Set(currentUser?.assigned_building_ids ?? []);
  const assignedFlats = new Set(currentUser?.assigned_flat_ids ?? []);

  const totalAssignments =
    assignedProjects.size + assignedBuildings.size + assignedFlats.size;

  // Any mutation error that's a plain axios failure (not a 409 we already
  // surfaced via the pre-check) — e.g., race condition if someone else
  // assigned between our coverage fetch and the submit.
  const raceError =
    projectMutation.error ??
    buildingMutation.error ??
    flatMutation.error ??
    null;
  const raceErrorMsg =
    raceError && isAxiosError(raceError)
      ? extractConflictMessage(raceError) ??
        raceError.message
      : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
            <DialogTitle className="flex items-center gap-2">
              Access Control — {currentUser?.full_name}
              {totalAssignments > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {assignedProjects.size} projects, {assignedBuildings.size}{" "}
                  towers, {assignedFlats.size} flats
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {reassignSummary && (
            <div className="mx-6 mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span className="flex-1">{reassignSummary}</span>
              <button
                type="button"
                className="text-amber-700 hover:text-amber-900"
                onClick={() => setReassignSummary(null)}
                aria-label="Dismiss"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {raceErrorMsg && (
            <div className="mx-6 mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              {raceErrorMsg}
            </div>
          )}

          <div className="max-h-[75vh] overflow-y-auto px-6 py-4">
            {isLoading ? (
              <LoadingSpinner />
            ) : !projects?.length ? (
              <p className="text-sm text-gray-400">
                No projects exist. Seed hierarchy data first.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-3">
                  Assign at project level for full access, or drill into
                  towers/flats for granular control. Chips show other
                  inspectors already on a scope — reassigning will remove them.
                </p>
                {projects.map((project) => {
                  const isProjectAssigned = assignedProjects.has(project.id);
                  const isExpanded = expandedProject === project.id;
                  const projectOthers = isExpanded
                    ? projectOtherInspectors
                    : [];

                  return (
                    <div key={project.id} className="border rounded-lg">
                      <div className="flex items-center gap-2 p-3 flex-wrap">
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-600"
                          onClick={() => toggleProject(project.id)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        <FolderOpen className="h-4 w-4 text-blue-500" />
                        <span className="flex-1 font-medium text-sm">
                          {project.name}
                        </span>
                        {projectOthers.length > 0 && (
                          <AssigneeChips
                            inspectors={projectOthers}
                            label="Assigned to"
                          />
                        )}
                        <span className="text-xs text-gray-400">
                          {project.location ?? ""}
                        </span>
                        {isProjectAssigned ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 h-7 px-2"
                            onClick={() =>
                              projectMutation.mutate({
                                action: "unassign",
                                projectId: project.id,
                              })
                            }
                          >
                            <X className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() =>
                              tryAssignProject(project.id, project.name)
                            }
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Assign All
                          </Button>
                        )}
                      </div>

                      {isExpanded && buildings && (
                        <div className="border-t bg-gray-50/50 px-3 pb-3">
                          {buildings.map((building) => {
                            const isBuildingAssigned = assignedBuildings.has(
                              building.id
                            );
                            const isBuildingExpanded =
                              expandedBuilding === building.id;
                            const bldOthers =
                              buildingOtherInspectors.get(building.id) ?? [];

                            return (
                              <div key={building.id} className="mt-2">
                                <div className="flex items-center gap-2 py-1.5 pl-6 flex-wrap">
                                  <button
                                    type="button"
                                    className="text-gray-400 hover:text-gray-600"
                                    onClick={() =>
                                      setExpandedBuilding(
                                        isBuildingExpanded ? null : building.id
                                      )
                                    }
                                  >
                                    {isBuildingExpanded ? (
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    ) : (
                                      <ChevronRight className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                  <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                                  <span className="flex-1 text-sm">
                                    {building.name}
                                  </span>
                                  {bldOthers.length > 0 && (
                                    <AssigneeChips
                                      inspectors={bldOthers}
                                      label="Tower"
                                    />
                                  )}
                                  {isProjectAssigned ? (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] h-5"
                                    >
                                      via project
                                    </Badge>
                                  ) : isBuildingAssigned ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-500 h-6 px-1.5 text-xs"
                                      onClick={() =>
                                        buildingMutation.mutate({
                                          action: "unassign",
                                          buildingId: building.id,
                                        })
                                      }
                                    >
                                      <X className="h-3 w-3 mr-0.5" />
                                      Remove
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-6 px-1.5 text-xs"
                                      onClick={() =>
                                        tryAssignBuilding(
                                          building.id,
                                          building.name
                                        )
                                      }
                                    >
                                      <Plus className="h-3 w-3 mr-0.5" />
                                      Tower
                                    </Button>
                                  )}
                                </div>

                                {isBuildingExpanded && (
                                  <TowerGridPanel
                                    floors={floors ?? []}
                                    assignedFlats={assignedFlats}
                                    otherInspectorsByFlat={flatOtherInspectors}
                                    isProjectAssigned={isProjectAssigned}
                                    isBuildingAssigned={isBuildingAssigned}
                                    pendingFlatIds={pendingFlatIds}
                                    isLoadingFloors={isLoadingFloors}
                                    onToggleFlat={toggleFlat}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ReassignConfirmDialog
        pending={pendingReassign}
        onCancel={() => setPendingReassign(null)}
        onConfirm={confirmReassign}
        targetUserName={currentUser?.full_name ?? ""}
      />
    </>
  );
}

function AssigneeChips({
  inspectors,
  label,
}: {
  inspectors: InspectorRef[];
  label: string;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-[10px] uppercase tracking-wide text-gray-400">
        {label}:
      </span>
      {inspectors.map((i) => (
        <span
          key={i.id}
          className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800"
          title={`Assigned at ${i.source.toLowerCase()} level`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          {i.full_name}
        </span>
      ))}
    </div>
  );
}

function ReassignConfirmDialog({
  pending,
  onCancel,
  onConfirm,
  targetUserName,
}: {
  pending: PendingReassign | null;
  onCancel: () => void;
  onConfirm: () => void;
  targetUserName: string;
}) {
  const kindLabel =
    pending?.kind === "project"
      ? "project"
      : pending?.kind === "building"
        ? "tower"
        : "flat";

  const cascadeWarning =
    pending?.kind === "project"
      ? "This will also remove any tower- or flat-level direct assignments that other inspectors hold inside this project."
      : pending?.kind === "building"
        ? "This will also remove any flat-level direct assignments that other inspectors hold inside this tower."
        : null;

  return (
    <Dialog
      open={!!pending}
      onOpenChange={(o) => {
        if (!o) onCancel();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-4 w-4" />
            Reassign {kindLabel}?
          </DialogTitle>
        </DialogHeader>

        {pending && (
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              <span className="font-medium">{pending.label}</span> is currently
              assigned to:
            </p>
            <ul className="space-y-1 pl-1">
              {pending.conflicts.map((c) => (
                <li key={c.id} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span>{c.full_name}</span>
                </li>
              ))}
            </ul>
            <p>
              Continuing will remove their access and assign this{" "}
              {kindLabel} to{" "}
              <span className="font-medium">{targetUserName}</span>.
            </p>
            {cascadeWarning && (
              <p className="text-xs text-gray-500">{cascadeWarning}</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
          >
            Reassign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Pulls a human-readable message out of the backend's structured 409 body
// if present. Falls back to the raw detail or a generic string.
function extractConflictMessage(err: unknown): string | null {
  if (!isAxiosError(err)) return null;
  const detail = err.response?.data?.detail;
  if (!detail) return null;
  if (typeof detail === "string") return detail;
  if (typeof detail === "object" && "message" in detail) {
    const msg = (detail as { message?: unknown }).message;
    return typeof msg === "string" ? msg : null;
  }
  return null;
}

