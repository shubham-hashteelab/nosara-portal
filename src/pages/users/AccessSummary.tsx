import { Globe, FolderOpen, Building2, Home } from "lucide-react";
import type { User, Project } from "@/types/api";

interface AccessSummaryProps {
  user: User;
  projects: Project[] | undefined;
}

export function AccessSummary({ user, projects }: AccessSummaryProps) {
  if (user.role === "MANAGER") {
    return (
      <span className="inline-flex items-center gap-1.5 text-gray-600 text-sm">
        <Globe className="h-3.5 w-3.5 text-primary-500" />
        All projects
      </span>
    );
  }

  const projectIds = user.assigned_project_ids ?? [];
  const buildingCount = user.assigned_building_ids?.length ?? 0;
  const flatCount = user.assigned_flat_ids?.length ?? 0;

  if (projectIds.length === 0 && buildingCount === 0 && flatCount === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-orange-600 text-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
        No access
      </span>
    );
  }

  if (projectIds.length > 0) {
    const byId = new Map((projects ?? []).map((p) => [p.id, p]));
    const names = projectIds
      .map((id) => byId.get(id)?.name)
      .filter((n): n is string => Boolean(n));
    const label =
      names.length === 0
        ? `${projectIds.length} project${projectIds.length === 1 ? "" : "s"}`
        : names.length === 1
          ? names[0]
          : `${names[0]} +${names.length - 1} more`;
    return (
      <span className="inline-flex items-center gap-1.5 text-gray-700 text-sm">
        <FolderOpen className="h-3.5 w-3.5 text-blue-500" />
        <span className="font-medium">Full project:</span>
        <span>{label}</span>
      </span>
    );
  }

  if (buildingCount > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-gray-700 text-sm">
        <Building2 className="h-3.5 w-3.5 text-indigo-500" />
        {buildingCount} {buildingCount === 1 ? "tower" : "towers"}
        {flatCount > 0 && (
          <span className="text-gray-400">
            · {flatCount} {flatCount === 1 ? "flat" : "flats"}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-gray-700 text-sm">
      <Home className="h-3.5 w-3.5 text-green-600" />
      {flatCount} {flatCount === 1 ? "flat" : "flats"}
    </span>
  );
}
