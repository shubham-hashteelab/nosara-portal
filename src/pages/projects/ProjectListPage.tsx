import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createProject, deleteProject } from "@/api/projects";
import { getProjectsOverview } from "@/api/dashboard";
import { seedDefaults, seedHierarchy } from "@/api/checklists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { ProjectFormDialog } from "./ProjectFormDialog";
import { TowerProgressCard } from "@/components/dashboard/TowerProgressCard";
import {
  Plus,
  Trash2,
  Database,
  Search,
  MapPin,
  Building2,
  ClipboardCheck,
} from "lucide-react";
import type { ProjectOverview } from "@/types/api";

export default function ProjectListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectOverview | null>(
    null
  );
  const [search, setSearch] = useState("");

  const { data: overview, isLoading } = useQuery({
    queryKey: ["projectsOverview"],
    queryFn: getProjectsOverview,
  });

  const projects = overview?.projects ?? [];

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    queryClient.invalidateQueries({ queryKey: ["projectsOverview"] });
  };

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: invalidateAll,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      invalidateAll();
      setDeleteTarget(null);
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      // Defaults must be seeded first — seed-hierarchy auto-initializes each
      // flat's checklist from flat_type_rooms + checklist_templates, which
      // seed-defaults populates. Reversed order leaves all flats with 0 entries.
      await seedDefaults();
      await seedHierarchy();
    },
    onSuccess: invalidateAll,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return projects;
    const term = search.toLowerCase();
    return projects.filter(
      (p) =>
        p.project_name.toLowerCase().includes(term) ||
        p.location.toLowerCase().includes(term)
    );
  }, [projects, search]);

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
          {!projects.length && (
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

      {projects.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              title="No projects yet"
              description="Create a project or seed demo data to get started."
            />
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-gray-500">
            No projects match "{search}".
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((project) => (
            <ProjectRowCard
              key={project.project_id}
              project={project}
              onOpen={() => navigate(`/projects/${project.project_id}`)}
              onDelete={() => setDeleteTarget(project)}
            />
          ))}
        </div>
      )}

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
        description={`Are you sure you want to delete "${deleteTarget?.project_name}"? This will also delete all buildings, floors, flats, and inspection data.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.project_id);
        }}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

function ProjectRowCard({
  project,
  onOpen,
  onDelete,
}: {
  project: ProjectOverview;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3">
          <button
            type="button"
            onClick={onOpen}
            className="flex-1 text-left group"
          >
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {project.project_name}
            </h3>
            {project.location && (
              <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <MapPin className="h-3 w-3" />
                {project.location}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
              <MetaPill
                icon={<Building2 className="h-3.5 w-3.5" />}
                label={`${project.total_buildings} towers`}
              />
              <MetaPill
                icon={<ClipboardCheck className="h-3.5 w-3.5" />}
                label={`${project.inspected_flats}/${project.total_flats} flats`}
              />
              <span className="inline-flex items-center gap-1 font-semibold text-gray-900">
                <span className="tabular-nums">{project.completion_pct}%</span>
                <span className="font-normal text-gray-500">complete</span>
              </span>
            </div>
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label={`Delete ${project.project_name}`}
          >
            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
          </Button>
        </div>

        {/* Tower mini-cards strip */}
        <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4">
          {project.towers.length === 0 ? (
            <p className="text-xs text-gray-400 italic">
              No towers yet — open the project to add one.
            </p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {project.towers.map((tower) => (
                <div key={tower.building_id} className="shrink-0">
                  <TowerProgressCard
                    variant="mini"
                    tower={tower}
                    projectId={project.project_id}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MetaPill({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-gray-600">
      {icon}
      {label}
    </span>
  );
}
