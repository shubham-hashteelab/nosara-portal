import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listOrphanedAssignments } from "@/api/inspections";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { UserX, ArrowRight } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { OrphanedAssignment } from "@/types/api";

export default function OrphanedAssignmentsPage() {
  const navigate = useNavigate();

  const { data: orphans, isLoading } = useQuery({
    queryKey: ["orphaned-assignments"],
    queryFn: listOrphanedAssignments,
  });

  const columns: Column<OrphanedAssignment>[] = [
    { key: "contractor_name", header: "Business Associate", sortable: true },
    {
      key: "contractor_is_active",
      header: "Status",
      render: (o) =>
        !o.contractor_is_active ? (
          <Badge variant="secondary">Deactivated</Badge>
        ) : o.contractor_role !== "CONTRACTOR" ? (
          <Badge variant="secondary">Role changed</Badge>
        ) : (
          <Badge variant="success">Active</Badge>
        ),
    },
    {
      key: "assigned_at",
      header: "Assigned",
      render: (o) => formatDateTime(o.assigned_at),
      sortable: true,
      accessor: (o) => o.assigned_at,
    },
    {
      key: "actions",
      header: "",
      render: (o) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(`/inspections/${o.inspection_entry_id}`)}
        >
          Reassign
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      ),
    },
  ];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <UserX className="h-6 w-6 text-amber-600" />
          Orphaned Assignments
        </h1>
        <p className="text-sm text-gray-500">
          Snag assignments pointing at deactivated or role-changed Business
          Associates. Click Reassign to pick a new one on the inspection
          detail page.
        </p>
      </div>

      {orphans && orphans.length > 0 ? (
        <DataTable
          data={orphans}
          columns={columns}
          getRowKey={(o) => o.assignment_id}
        />
      ) : (
        <EmptyState
          title="No orphaned assignments"
          description="Every active snag is assigned to a valid Business Associate."
        />
      )}
    </div>
  );
}
