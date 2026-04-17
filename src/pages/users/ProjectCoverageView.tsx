import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listProjects } from "@/api/projects";
import { listUsers, assignBuilding } from "@/api/users";
import { getAssignmentCoverage } from "@/api/coverage";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronRight,
  Building2,
  Check,
  UserPlus,
  AlertTriangle,
} from "lucide-react";
import type {
  AssignmentCoverageResponse,
  BuildingCoverage,
  FloorCoverage,
  InspectorRef,
  InspectorSource,
  User,
} from "@/types/api";

export function ProjectCoverageView() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
  });

  useEffect(() => {
    if (projects?.length && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const { data: coverage, isLoading } = useQuery({
    queryKey: ["assignment-coverage", selectedProjectId],
    queryFn: () => getAssignmentCoverage(selectedProjectId!),
    enabled: !!selectedProjectId,
  });

  if (!projects?.length) {
    return (
      <EmptyState
        title="No projects yet"
        description="Create or seed a project first to see inspector coverage."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Project selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Project</label>
        <select
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          value={selectedProjectId ?? ""}
          onChange={(e) => setSelectedProjectId(e.target.value)}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading || !coverage ? (
        <LoadingSpinner />
      ) : (
        <CoverageTree coverage={coverage} />
      )}
    </div>
  );
}

function CoverageTree({ coverage }: { coverage: AssignmentCoverageResponse }) {
  const projectCoveragePct =
    coverage.total_flats === 0
      ? 0
      : Math.round((coverage.covered_flats / coverage.total_flats) * 100);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white">
      {/* Project header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {coverage.project_name}
          </h3>
          <div className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">
              {coverage.covered_flats} / {coverage.total_flats}
            </span>{" "}
            flats covered
            {coverage.unassigned_flats > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-orange-600">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                {coverage.unassigned_flats} unassigned
              </span>
            )}
          </div>
        </div>
        <CoverageBar percent={projectCoveragePct} className="mt-3" />
        {coverage.project_inspectors.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-gray-500">
              Full-project inspectors:
            </span>
            {coverage.project_inspectors.map((i) => (
              <InspectorChip key={i.id} inspector={i} />
            ))}
          </div>
        )}
      </div>

      {/* Buildings */}
      <div className="divide-y divide-gray-100">
        {coverage.buildings.length === 0 ? (
          <div className="px-5 py-6">
            <EmptyState
              title="No towers in this project"
              description="Create a tower before assigning inspectors."
            />
          </div>
        ) : (
          coverage.buildings.map((b) => (
            <BuildingRow
              key={b.building_id}
              building={b}
              hasProjectCoverage={coverage.project_inspectors.length > 0}
            />
          ))
        )}
      </div>
    </div>
  );
}

function BuildingRow({
  building,
  hasProjectCoverage,
}: {
  building: BuildingCoverage;
  hasProjectCoverage: boolean;
}) {
  // Auto-expand towers that have unassigned flats — draws attention where
  // needed. Fully-covered towers start collapsed to keep the view calm.
  const [expanded, setExpanded] = useState(building.unassigned_flats > 0);

  const pct =
    building.total_flats === 0
      ? 0
      : Math.round((building.covered_flats / building.total_flats) * 100);

  const isFullyCovered = building.unassigned_flats === 0 && building.total_flats > 0;
  const isEmpty = building.total_flats === 0;

  // Inspectors with direct building-level assignment (exclude inherited from
  // project — those are already shown in the project header).
  const directBuildingInspectors = building.building_inspectors.filter(
    (i) => i.source === "BUILDING"
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 text-left"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
        )}
        <Building2 className="h-4 w-4 text-indigo-500 shrink-0" />
        <span className="font-medium text-gray-900">{building.building_name}</span>

        <div className="ml-auto flex items-center gap-3">
          {isEmpty ? (
            <span className="text-xs text-gray-400">No flats</span>
          ) : isFullyCovered ? (
            <Badge variant="success" className="gap-1">
              <Check className="h-3 w-3" />
              {building.total_flats} / {building.total_flats}
            </Badge>
          ) : (
            <>
              <span className="text-xs text-gray-600">
                {building.covered_flats} / {building.total_flats}
              </span>
              {building.unassigned_flats > 0 && (
                <Badge variant="orange" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {building.unassigned_flats} unassigned
                </Badge>
              )}
            </>
          )}
          <div className="w-24">
            <CoverageBar percent={pct} />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-4 pl-12 space-y-3">
          {/* Building-level inspectors + quick-assign */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">Assigned to tower:</span>
            {hasProjectCoverage && (
              <span className="text-xs text-gray-400 italic">
                inherited via project
              </span>
            )}
            {directBuildingInspectors.map((i) => (
              <InspectorChip key={i.id} inspector={i} />
            ))}
            {!hasProjectCoverage && directBuildingInspectors.length === 0 && (
              <span className="text-xs text-gray-400">
                No tower-level inspectors
              </span>
            )}
            {!hasProjectCoverage && (
              <QuickAssignTower buildingId={building.building_id} />
            )}
          </div>

          {/* Floors */}
          {building.floors.length > 0 && (
            <div className="space-y-1.5">
              {building.floors.map((f) => (
                <FloorRow key={f.floor_id} floor={f} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FloorRow({ floor }: { floor: FloorCoverage }) {
  const pct =
    floor.total_flats === 0
      ? 0
      : Math.round((floor.covered_flats / floor.total_flats) * 100);
  const isEmpty = floor.total_flats === 0;
  const isFullyCovered = !isEmpty && floor.unassigned_flats === 0;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2">
      <span className="text-sm text-gray-700 min-w-[80px]">{floor.label}</span>
      <div className="flex-1">
        <CoverageBar percent={pct} size="sm" />
      </div>
      <span className="text-xs text-gray-600 min-w-[56px] text-right">
        {isEmpty
          ? "—"
          : `${floor.covered_flats}/${floor.total_flats}`}
      </span>
      {isFullyCovered ? (
        <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
      ) : floor.unassigned_flats > 0 ? (
        <Badge variant="orange" className="text-[10px] px-1.5 py-0 h-5">
          {floor.unassigned_flats}
        </Badge>
      ) : (
        <span className="w-3.5" />
      )}
    </div>
  );
}

function InspectorChip({ inspector }: { inspector: InspectorRef }) {
  const sourceColor: Record<InspectorSource, string> = {
    PROJECT: "bg-blue-50 text-blue-700 border-blue-200",
    BUILDING: "bg-indigo-50 text-indigo-700 border-indigo-200",
    FLAT: "bg-green-50 text-green-700 border-green-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${sourceColor[inspector.source]}`}
      title={`Assigned at ${inspector.source.toLowerCase()} level`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {inspector.full_name}
    </span>
  );
}

function QuickAssignTower({ buildingId }: { buildingId: string }) {
  const queryClient = useQueryClient();
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
  });

  const inspectors = useMemo(
    () =>
      (users ?? []).filter(
        (u: User) => u.role === "INSPECTOR" && u.is_active
      ),
    [users]
  );

  const mutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      assignBuilding(userId, buildingId),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["assignment-coverage"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", vars.userId] });
      queryClient.invalidateQueries({ queryKey: ["users-summary"] });
    },
  });

  if (inspectors.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center gap-1 rounded-md border border-dashed border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:border-primary-400 hover:text-primary-600"
      >
        <UserPlus className="h-3 w-3" />
        Assign inspector
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[200px]">
        <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
          Assign full tower to
        </div>
        {inspectors.map((u) => (
          <DropdownMenuItem
            key={u.id}
            onClick={() => mutation.mutate({ userId: u.id })}
          >
            {u.full_name}
            <span className="ml-auto text-[10px] text-gray-400">
              @{u.username}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CoverageBar({
  percent,
  className = "",
  size = "md",
}: {
  percent: number;
  className?: string;
  size?: "sm" | "md";
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const h = size === "sm" ? "h-1.5" : "h-2";
  const barColor =
    clamped === 100
      ? "bg-green-500"
      : clamped === 0
        ? "bg-orange-400"
        : "bg-primary-500";
  return (
    <div
      className={`${h} w-full rounded-full bg-gray-100 overflow-hidden ${className}`}
    >
      <div
        className={`${h} ${barColor} transition-all`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
