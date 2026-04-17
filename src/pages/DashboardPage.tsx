import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listProjects } from "@/api/projects";
import {
  getProjectStats,
  getInspectorActivity,
  getTowerStats,
} from "@/api/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { SnagsByCategoryBar } from "@/components/charts/SnagsByCategoryBar";
import { InspectorActivityLine } from "@/components/charts/InspectorActivityLine";
import { TowerProgressCard } from "@/components/dashboard/TowerProgressCard";
import {
  Building2,
  ClipboardCheck,
  AlertTriangle,
  Clock,
} from "lucide-react";

export default function DashboardPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
  });

  const projectId = selectedProjectId ?? projects?.[0]?.id ?? null;

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["projectStats", projectId],
    queryFn: () => getProjectStats(projectId!),
    enabled: !!projectId,
  });

  const { data: towerStats, isLoading: loadingTowers } = useQuery({
    queryKey: ["towerStats", projectId],
    queryFn: () => getTowerStats(projectId!),
    enabled: !!projectId,
  });

  const { data: activity } = useQuery({
    queryKey: ["inspectorActivity", projectId],
    queryFn: () => getInspectorActivity(projectId!, 7),
    enabled: !!projectId,
  });

  if (loadingProjects) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Overview of your inspection projects
          </p>
        </div>
        <Select
          className="w-64"
          value={projectId?.toString() ?? ""}
          onChange={(e) => setSelectedProjectId(e.target.value || null)}
        >
          {!projects?.length && (
            <option value="">No projects available</option>
          )}
          {projects?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>

      {!projectId ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-500">
            No projects found. Create a project to get started.
          </CardContent>
        </Card>
      ) : loadingStats ? (
        <LoadingSpinner />
      ) : stats ? (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Flats"
              value={stats.total_flats}
              icon={<Building2 className="h-5 w-5" />}
              color="bg-blue-50 text-blue-600"
            />
            <StatCard
              title="Inspected"
              value={stats.inspected_flats}
              icon={<ClipboardCheck className="h-5 w-5" />}
              color="bg-green-50 text-green-600"
            />
            <StatCard
              title="In Progress"
              value={stats.in_progress_flats}
              icon={<Clock className="h-5 w-5" />}
              color="bg-yellow-50 text-yellow-600"
            />
            <StatCard
              title="Snags Found"
              value={stats.total_snags}
              icon={<AlertTriangle className="h-5 w-5" />}
              color="bg-red-50 text-red-600"
              subtitle={`${stats.open_snags} open, ${stats.critical_snags} critical`}
            />
          </div>

          {/* Tower progress grid */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Tower Progress</CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  Hover a tower for the floor breakdown · click to open
                </p>
              </div>
              {towerStats && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 tabular-nums">
                    {towerStats.completion_pct}%
                  </div>
                  <div className="text-[11px] text-gray-500">
                    project complete
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {loadingTowers ? (
                <div className="py-8 flex justify-center">
                  <LoadingSpinner />
                </div>
              ) : !towerStats || towerStats.towers.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  No towers configured for this project yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {towerStats.towers.map((tower) => (
                    <TowerProgressCard
                      key={tower.building_id}
                      tower={tower}
                      projectId={projectId}
                    />
                  ))}
                </div>
              )}
              {/* Legend */}
              <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-gray-500">
                <LegendDot color="bg-green-500" label="Completed" />
                <LegendDot color="bg-yellow-500" label="In Progress" />
                <LegendDot color="bg-gray-300" label="Not Started" />
              </div>
            </CardContent>
          </Card>

          {/* Snags by category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Snags by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <SnagsByCategoryBar data={stats.snags_by_category ?? {}} />
            </CardContent>
          </Card>

          {/* Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Inspector Activity (7 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InspectorActivityLine data={activity ?? []} />
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className={`w-3 h-3 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}
