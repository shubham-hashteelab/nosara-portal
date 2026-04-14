import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listProjects } from "@/api/projects";
import { getProjectStats, getInspectorActivity, getOverdueSnags } from "@/api/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ProgressDonut } from "@/components/charts/ProgressDonut";
import { SnagsByCategoryBar } from "@/components/charts/SnagsByCategoryBar";
import { InspectorActivityLine } from "@/components/charts/InspectorActivityLine";
import { SeverityBadge } from "@/components/common/SeverityBadge";
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

  const { data: activity } = useQuery({
    queryKey: ["inspectorActivity", projectId],
    queryFn: () => getInspectorActivity(projectId!, 7),
    enabled: !!projectId,
  });

  const { data: overdueSnags } = useQuery({
    queryKey: ["overdueSnags", projectId],
    queryFn: () => getOverdueSnags(projectId!),
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
          onChange={(e) =>
            setSelectedProjectId(
              e.target.value || null
            )
          }
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
          {/* Stats cards */}
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

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Inspection Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressDonut
                  completed={stats.inspected_flats}
                  inProgress={stats.in_progress_flats}
                  notStarted={stats.not_started_flats}
                />
                <div className="flex justify-center gap-4 mt-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    Completed
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    In Progress
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-gray-300" />
                    Not Started
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Snags by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <SnagsByCategoryBar
                  data={stats.snags_by_category ?? {}}
                />
              </CardContent>
            </Card>
          </div>

          {/* Activity & Overdue */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Overdue Snags</CardTitle>
              </CardHeader>
              <CardContent>
                {!overdueSnags?.length ? (
                  <p className="text-sm text-gray-400 py-8 text-center">
                    No overdue snags
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {overdueSnags.slice(0, 10).map((snag) => (
                      <div
                        key={snag.entry_id}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {snag.checklist_item}
                          </p>
                          <p className="text-xs text-gray-500">
                            {snag.building_name} — {snag.flat_number}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <SeverityBadge severity={snag.severity} />
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {snag.days_open}d
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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
