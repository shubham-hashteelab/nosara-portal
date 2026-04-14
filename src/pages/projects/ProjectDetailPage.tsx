import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProject, updateProject } from "@/api/projects";
import {
  listBuildingsByProject,
  createBuilding,
  deleteBuilding,
} from "@/api/buildings";
import { getProjectStats } from "@/api/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { DataTable, type Column } from "@/components/common/DataTable";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ProjectFormDialog } from "./ProjectFormDialog";
import { ProgressDonut } from "@/components/charts/ProgressDonut";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  Building2,
  Layers,
  Home,
} from "lucide-react";
import type { Building } from "@/types/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const buildingSchema = z.object({
  name: z.string().min(1, "Building name is required"),
});

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = id!;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [addBuildingOpen, setAddBuildingOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Building | null>(null);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId),
  });

  const { data: buildings } = useQuery({
    queryKey: ["buildings", projectId],
    queryFn: () => listBuildingsByProject(projectId),
  });

  const { data: stats } = useQuery({
    queryKey: ["projectStats", projectId],
    queryFn: () => getProjectStats(projectId),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; address: string; developer_name: string }) =>
      updateProject(projectId, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["project", projectId] }),
  });

  const createBuildingMutation = useMutation({
    mutationFn: (data: { name: string }) =>
      createBuilding({ project_id: projectId, name: data.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setAddBuildingOpen(false);
    },
  });

  const deleteBuildingMutation = useMutation({
    mutationFn: deleteBuilding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setDeleteTarget(null);
    },
  });

  const buildingForm = useForm<{ name: string }>({
    resolver: zodResolver(buildingSchema),
    defaultValues: { name: "" },
  });

  const buildingColumns: Column<Building>[] = [
    { key: "name", header: "Building Name", sortable: true },
    { key: "total_floors", header: "Floors", sortable: true },
    { key: "total_flats", header: "Flats", sortable: true },
    {
      key: "actions",
      header: "",
      render: (b) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            setDeleteTarget(b);
          }}
        >
          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
        </Button>
      ),
    },
  ];

  if (isLoading) return <LoadingSpinner />;
  if (!project) return <div>Project not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/projects")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-sm text-gray-500">
            {project.developer_name} — {project.address}
          </p>
        </div>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{project.total_buildings}</p>
              <p className="text-xs text-gray-500">Buildings</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <Layers className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{project.total_flats}</p>
              <p className="text-xs text-gray-500">Total Flats</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-50">
              <Home className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {stats?.inspected_flats ?? 0}
              </p>
              <p className="text-xs text-gray-500">Inspected</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <ProgressDonut
              completed={stats?.inspected_flats ?? 0}
              inProgress={stats?.in_progress_flats ?? 0}
              notStarted={stats?.not_started_flats ?? 0}
            />
          </CardContent>
        </Card>
      </div>

      {/* Buildings table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Buildings</CardTitle>
          <Button size="sm" onClick={() => setAddBuildingOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Building
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            data={buildings ?? []}
            columns={buildingColumns}
            getRowKey={(b) => b.id}
            onRowClick={(b) =>
              navigate(`/projects/${projectId}/buildings/${b.id}`)
            }
          />
        </CardContent>
      </Card>

      {/* Edit project dialog */}
      <ProjectFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
        onSubmit={async (data) => {
          await updateMutation.mutateAsync(data);
        }}
      />

      {/* Add building dialog */}
      <Dialog open={addBuildingOpen} onOpenChange={setAddBuildingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Building</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={buildingForm.handleSubmit(async (data) => {
              await createBuildingMutation.mutateAsync(data);
              buildingForm.reset();
            })}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="buildingName">Building Name</Label>
              <Input
                id="buildingName"
                {...buildingForm.register("name")}
              />
              {buildingForm.formState.errors.name && (
                <p className="text-sm text-red-500">
                  {buildingForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddBuildingOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createBuildingMutation.isPending}
              >
                Add Building
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete building confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Building"
        description={`Delete "${deleteTarget?.name}"? All floors, flats, and inspections inside will be deleted.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) deleteBuildingMutation.mutate(deleteTarget.id);
        }}
        loading={deleteBuildingMutation.isPending}
      />
    </div>
  );
}
