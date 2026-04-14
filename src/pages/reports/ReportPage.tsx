import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listProjects } from "@/api/projects";
import {
  getProjectStats,
  getBuildingStats,
} from "@/api/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ProgressDonut } from "@/components/charts/ProgressDonut";
import { SnagsByCategoryBar } from "@/components/charts/SnagsByCategoryBar";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { FileDown, Printer } from "lucide-react";

export default function ReportPage() {
  const [projectId, setProjectId] = useState<string>("");

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
  });

  const selectedId = projectId || projects?.[0]?.id ?? null;

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["projectStats", selectedId],
    queryFn: () => getProjectStats(selectedId!),
    enabled: !!selectedId,
  });

  const { data: buildingStats } = useQuery({
    queryKey: ["buildingStats", selectedId],
    queryFn: () => getBuildingStats(selectedId!),
    enabled: !!selectedId,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500">
            Project inspection reports and analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            className="w-64"
            value={projectId || selectedId?.toString() || ""}
            onChange={(e) => setProjectId(e.target.value)}
          >
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" disabled>
            <FileDown className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {!selectedId ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-500">
            Select a project to view reports.
          </CardContent>
        </Card>
      ) : loadingStats ? (
        <LoadingSpinner />
      ) : stats ? (
        <div className="space-y-6 print:space-y-4">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Project Summary: {stats.project_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Total Flats</p>
                  <p className="text-2xl font-bold">{stats.total_flats}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Inspected</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.inspected_flats}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.in_progress_flats}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Not Started</p>
                  <p className="text-2xl font-bold text-gray-400">
                    {stats.not_started_flats}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressDonut
                  completed={stats.inspected_flats}
                  inProgress={stats.in_progress_flats}
                  notStarted={stats.not_started_flats}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Snags by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <SnagsByCategoryBar data={stats.snags_by_category ?? {}} />
              </CardContent>
            </Card>
          </div>

          {/* Snag breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Snag Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-2xl font-bold">{stats.total_snags}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="p-3 rounded-lg bg-red-50">
                  <p className="text-2xl font-bold text-red-600">
                    {stats.open_snags}
                  </p>
                  <p className="text-xs text-gray-500">Open</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-50">
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.fixed_snags}
                  </p>
                  <p className="text-xs text-gray-500">Fixed</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50">
                  <p className="text-2xl font-bold text-green-600">
                    {stats.verified_snags}
                  </p>
                  <p className="text-xs text-gray-500">Verified</p>
                </div>
                <div className="p-3 rounded-lg bg-red-50">
                  <p className="text-2xl font-bold text-red-700">
                    {stats.critical_snags}
                  </p>
                  <p className="text-xs text-gray-500">Critical</p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-50">
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.minor_snags}
                  </p>
                  <p className="text-xs text-gray-500">Minor</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Building stats table */}
          {buildingStats && buildingStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">By Building</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Building</TableHead>
                      <TableHead>Total Flats</TableHead>
                      <TableHead>Inspected</TableHead>
                      <TableHead>In Progress</TableHead>
                      <TableHead>Total Snags</TableHead>
                      <TableHead>Open Snags</TableHead>
                      <TableHead>Completion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buildingStats.map((bs) => {
                      const pct =
                        bs.total_flats > 0
                          ? Math.round(
                              (bs.inspected_flats / bs.total_flats) * 100
                            )
                          : 0;
                      return (
                        <TableRow key={bs.building_id}>
                          <TableCell className="font-medium">
                            {bs.building_name}
                          </TableCell>
                          <TableCell>{bs.total_flats}</TableCell>
                          <TableCell>{bs.inspected_flats}</TableCell>
                          <TableCell>{bs.in_progress_flats}</TableCell>
                          <TableCell>{bs.total_snags}</TableCell>
                          <TableCell>{bs.open_snags}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600 w-10">
                                {pct}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}
