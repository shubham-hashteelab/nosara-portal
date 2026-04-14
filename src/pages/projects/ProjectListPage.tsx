import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listProjects, createProject, deleteProject } from "@/api/projects";
import { seedDefaults, seedHierarchy } from "@/api/checklists";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ProjectFormDialog } from "./ProjectFormDialog";
import { Plus, Trash2, Database } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Project } from "@/types/api";

export default function ProjectListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
  });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setDeleteTarget(null);
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      await seedHierarchy();
      await seedDefaults();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const columns: Column<Project>[] = [
    { key: "name", header: "Name", sortable: true },
    { key: "developer_name", header: "Developer", sortable: true },
    { key: "address", header: "Address" },
    {
      key: "total_buildings",
      header: "Buildings",
      sortable: true,
    },
    {
      key: "total_flats",
      header: "Flats",
      sortable: true,
    },
    {
      key: "created_at",
      header: "Created",
      render: (p) => formatDate(p.created_at),
      sortable: true,
      accessor: (p) => p.created_at,
    },
    {
      key: "actions",
      header: "",
      render: (p) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            setDeleteTarget(p);
          }}
        >
          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
        </Button>
      ),
    },
  ];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500">
            Manage your inspection projects
          </p>
        </div>
        <div className="flex gap-2">
          {!projects?.length && (
            <Button
              variant="outline"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
            >
              <Database className="h-4 w-4 mr-2" />
              {seedMutation.isPending ? "Seeding..." : "Seed Demo Data"}
            </Button>
          )}
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      <DataTable
        data={projects ?? []}
        columns={columns}
        searchable
        searchPlaceholder="Search projects..."
        getRowKey={(p) => p.id}
        onRowClick={(p) => navigate(`/projects/${p.id}`)}
      />

      <ProjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={async (data) => {
          await createMutation.mutateAsync(data);
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Project"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This will also delete all buildings, floors, flats, and inspection data.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
