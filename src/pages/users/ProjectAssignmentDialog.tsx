import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listProjects } from "@/api/projects";
import { assignProject, unassignProject } from "@/api/users";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Plus, X } from "lucide-react";
import type { User } from "@/types/api";

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

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
    enabled: open,
  });

  const assignMutation = useMutation({
    mutationFn: (projectId: string) =>
      assignProject(user!.id, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const unassignMutation = useMutation({
    mutationFn: (projectId: string) =>
      unassignProject(user!.id, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  if (!user) return null;

  const assignedIds = new Set(user.assigned_project_ids ?? []);
  const assignedProjects =
    projects?.filter((p) => assignedIds.has(p.id)) ?? [];
  const availableProjects =
    projects?.filter((p) => !assignedIds.has(p.id)) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Assign Projects — {user.full_name}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-5">
            {/* Assigned projects */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Assigned Projects
              </h3>
              {assignedProjects.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No projects assigned yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {assignedProjects.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <span className="font-medium text-gray-900">
                          {p.name}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          {p.address ?? ""}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => unassignMutation.mutate(p.id)}
                        disabled={unassignMutation.isPending}
                      >
                        <X className="h-4 w-4 text-red-400 hover:text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available projects */}
            {availableProjects.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Available Projects
                </h3>
                <div className="space-y-2">
                  {availableProjects.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-dashed p-3"
                    >
                      <div>
                        <span className="text-gray-700">{p.name}</span>
                        <span className="ml-2 text-xs text-gray-400">
                          {p.address ?? ""}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => assignMutation.mutate(p.id)}
                        disabled={assignMutation.isPending}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Assign
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!projects?.length && (
              <p className="text-sm text-gray-400">
                No projects exist. Seed hierarchy data first.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
