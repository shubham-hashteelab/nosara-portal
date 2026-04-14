import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listProjects } from "@/api/projects";
import { listBuildingsByProject } from "@/api/buildings";
import { listFlatsByFloor } from "@/api/flats";
import { listFloorsByBuilding } from "@/api/floors";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  Plus,
  X,
  ChevronRight,
  ChevronDown,
  Building2,
  Home,
  FolderOpen,
} from "lucide-react";
import type { User, Floor } from "@/types/api";

interface ProjectAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export function ProjectAssignmentDialog({
  open,
  onOpenChange,
  user,
}: ProjectAssignmentDialogProps) {
  const queryClient = useQueryClient();
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [expandedBuilding, setExpandedBuilding] = useState<string | null>(null);

  // Live user data — refetches after every mutation
  const { data: liveUser } = useQuery({
    queryKey: ["user", user?.id],
    queryFn: () => getUser(user!.id),
    enabled: open && !!user,
  });

  // Use live data if available, fall back to prop
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

  const { data: floors } = useQuery({
    queryKey: ["floors", expandedBuilding],
    queryFn: () => listFloorsByBuilding(expandedBuilding!),
    enabled: !!expandedBuilding,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
    queryClient.invalidateQueries({ queryKey: ["user", user?.id] });
  };

  const projectMutation = useMutation({
    mutationFn: ({
      action,
      projectId,
    }: {
      action: "assign" | "unassign";
      projectId: string;
    }) =>
      action === "assign"
        ? assignProject(user!.id, projectId)
        : unassignProject(user!.id, projectId),
    onSuccess: invalidate,
  });

  const buildingMutation = useMutation({
    mutationFn: ({
      action,
      buildingId,
    }: {
      action: "assign" | "unassign";
      buildingId: string;
    }) =>
      action === "assign"
        ? assignBuilding(user!.id, buildingId)
        : unassignBuilding(user!.id, buildingId),
    onSuccess: invalidate,
  });

  const flatMutation = useMutation({
    mutationFn: ({
      action,
      flatId,
    }: {
      action: "assign" | "unassign";
      flatId: string;
    }) =>
      action === "assign"
        ? assignFlat(user!.id, flatId)
        : unassignFlat(user!.id, flatId),
    onSuccess: invalidate,
  });

  if (!user) return null;

  const assignedProjects = new Set(currentUser?.assigned_project_ids ?? []);
  const assignedBuildings = new Set(currentUser?.assigned_building_ids ?? []);
  const assignedFlats = new Set(currentUser?.assigned_flat_ids ?? []);

  const totalAssignments =
    assignedProjects.size + assignedBuildings.size + assignedFlats.size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
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

        {isLoading ? (
          <LoadingSpinner />
        ) : !projects?.length ? (
          <p className="text-sm text-gray-400">
            No projects exist. Seed hierarchy data first.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 mb-3">
              Assign at project level for full access, or drill into towers/flats
              for granular control.
            </p>
            {projects.map((project) => {
              const isProjectAssigned = assignedProjects.has(project.id);
              const isExpanded = expandedProject === project.id;

              return (
                <div key={project.id} className="border rounded-lg">
                  {/* Project row */}
                  <div className="flex items-center gap-2 p-3">
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-600"
                      onClick={() =>
                        setExpandedProject(isExpanded ? null : project.id)
                      }
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
                          projectMutation.mutate({
                            action: "assign",
                            projectId: project.id,
                          })
                        }
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Assign All
                      </Button>
                    )}
                  </div>

                  {/* Expanded: buildings */}
                  {isExpanded && buildings && (
                    <div className="border-t bg-gray-50/50 px-3 pb-3">
                      {buildings.map((building) => {
                        const isBuildingAssigned = assignedBuildings.has(
                          building.id
                        );
                        const isBuildingExpanded =
                          expandedBuilding === building.id;

                        return (
                          <div key={building.id} className="mt-2">
                            <div className="flex items-center gap-2 py-1.5 pl-6">
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
                                    buildingMutation.mutate({
                                      action: "assign",
                                      buildingId: building.id,
                                    })
                                  }
                                >
                                  <Plus className="h-3 w-3 mr-0.5" />
                                  Tower
                                </Button>
                              )}
                            </div>

                            {/* Expanded: flats */}
                            {isBuildingExpanded && (
                              <FlatsPanel
                                buildingId={building.id}
                                floors={floors ?? []}
                                assignedFlats={assignedFlats}
                                isProjectAssigned={isProjectAssigned}
                                isBuildingAssigned={isBuildingAssigned}
                                onAssignFlat={(flatId) =>
                                  flatMutation.mutate({
                                    action: "assign",
                                    flatId,
                                  })
                                }
                                onUnassignFlat={(flatId) =>
                                  flatMutation.mutate({
                                    action: "unassign",
                                    flatId,
                                  })
                                }
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
      </DialogContent>
    </Dialog>
  );
}

function FlatsPanel({
  buildingId: _buildingId,
  floors,
  assignedFlats,
  isProjectAssigned,
  isBuildingAssigned,
  onAssignFlat,
  onUnassignFlat,
}: {
  buildingId: string;
  floors: Floor[];
  assignedFlats: Set<string>;
  isProjectAssigned: boolean;
  isBuildingAssigned: boolean;
  onAssignFlat: (flatId: string) => void;
  onUnassignFlat: (flatId: string) => void;
}) {
  const hasParentAccess = isProjectAssigned || isBuildingAssigned;

  return (
    <div className="pl-14 space-y-1 mt-1">
      {floors.map((floor) => (
        <FloorFlats
          key={floor.id}
          floor={floor}
          assignedFlats={assignedFlats}
          hasParentAccess={hasParentAccess}
          onAssignFlat={onAssignFlat}
          onUnassignFlat={onUnassignFlat}
        />
      ))}
    </div>
  );
}

function FloorFlats({
  floor,
  assignedFlats,
  hasParentAccess,
  onAssignFlat,
  onUnassignFlat,
}: {
  floor: Floor;
  assignedFlats: Set<string>;
  hasParentAccess: boolean;
  onAssignFlat: (flatId: string) => void;
  onUnassignFlat: (flatId: string) => void;
}) {
  const { data: flats } = useQuery({
    queryKey: ["flats", floor.id],
    queryFn: () => listFlatsByFloor(floor.id),
  });

  if (!flats?.length) return null;

  return (
    <div>
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mt-1">
        Floor {floor.floor_number}
      </p>
      <div className="flex flex-wrap gap-1.5 mt-0.5">
        {flats.map((flat) => {
          const isAssigned = assignedFlats.has(flat.id);
          return (
            <button
              key={flat.id}
              type="button"
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs transition-colors ${
                hasParentAccess
                  ? "bg-blue-50 border-blue-200 text-blue-600 cursor-default"
                  : isAssigned
                    ? "bg-green-50 border-green-300 text-green-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                    : "bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600"
              }`}
              onClick={() => {
                if (hasParentAccess) return;
                if (isAssigned) onUnassignFlat(flat.id);
                else onAssignFlat(flat.id);
              }}
            >
              <Home className="h-2.5 w-2.5" />
              {flat.flat_number}
              {hasParentAccess && (
                <span className="text-[9px] text-blue-400">inherited</span>
              )}
              {!hasParentAccess && isAssigned && (
                <X className="h-2.5 w-2.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
