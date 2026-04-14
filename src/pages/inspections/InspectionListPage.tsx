import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listAllSnags } from "@/api/inspections";
import { listProjects } from "@/api/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { capitalize } from "@/lib/utils";
import { Severity, SnagFixStatus, ChecklistCategory } from "@/types/enums";
import type { InspectionEntry } from "@/types/api";

export default function InspectionListPage() {
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState<string>("");
  const [severity, setSeverity] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [fixStatus, setFixStatus] = useState<string>("");

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
  });

  const { data: snags, isLoading } = useQuery({
    queryKey: ["snags", projectId, severity, category, fixStatus],
    queryFn: () =>
      listAllSnags({
        project_id: projectId || undefined,
        severity: severity || undefined,
        category: category || undefined,
        snag_fix_status: fixStatus || undefined,
      }),
  });

  const columns: Column<InspectionEntry>[] = [
    {
      key: "id",
      header: "ID",
      sortable: true,
    },
    {
      key: "room_label",
      header: "Room",
      sortable: true,
    },
    {
      key: "category",
      header: "Category",
      render: (e) => capitalize(e.category),
      accessor: (e) => e.category,
      sortable: true,
    },
    {
      key: "item_name",
      header: "Item",
    },
    {
      key: "status",
      header: "Status",
      render: (e) => <StatusBadge status={e.status} />,
    },
    {
      key: "severity",
      header: "Severity",
      render: (e) => <SeverityBadge severity={e.severity} />,
      accessor: (e) => e.severity ?? "",
      sortable: true,
    },
    {
      key: "snag_fix_status",
      header: "Fix Status",
      render: (e) =>
        e.snag_fix_status ? (
          <StatusBadge status={e.snag_fix_status} />
        ) : (
          <span className="text-gray-400 text-sm">--</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inspections</h1>
        <p className="text-sm text-gray-500">
          View and manage all snag entries across projects
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Project
              </label>
              <Select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">All Projects</option>
                {projects?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Severity
              </label>
              <Select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option value="">All</option>
                {Object.values(Severity).map((s) => (
                  <option key={s} value={s}>
                    {capitalize(s)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Category
              </label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All</option>
                {Object.values(ChecklistCategory).map((c) => (
                  <option key={c} value={c}>
                    {capitalize(c)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Fix Status
              </label>
              <Select
                value={fixStatus}
                onChange={(e) => setFixStatus(e.target.value)}
              >
                <option value="">All</option>
                {Object.values(SnagFixStatus).map((s) => (
                  <option key={s} value={s}>
                    {capitalize(s)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Snag Entries
            {snags && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({snags.length} results)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <DataTable
              data={snags ?? []}
              columns={columns}
              searchable
              searchPlaceholder="Search snags..."
              getRowKey={(e) => e.id}
              onRowClick={(e) => navigate(`/inspections/${e.id}`)}
              pageSize={15}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
