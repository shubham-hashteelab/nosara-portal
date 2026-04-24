import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listVerificationQueue,
  verifyEntry,
  rejectEntry,
} from "@/api/inspections";
import { listProjects } from "@/api/projects";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { RemarkDialog } from "@/components/inspection/RemarkDialog";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { capitalize, formatDateTime } from "@/lib/utils";
import type { InspectionEntry } from "@/types/api";

type Mode = { type: "verify" | "reject"; entry: InspectionEntry } | null;

export default function VerificationQueuePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState<string>("");
  const [mode, setMode] = useState<Mode>(null);

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
  });

  const { data: queue, isLoading } = useQuery({
    queryKey: ["verification-queue", projectId || "all"],
    queryFn: () =>
      listVerificationQueue(projectId ? { project_id: projectId } : undefined),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, remark }: { id: string; remark: string }) =>
      verifyEntry(id, { verification_remark: remark }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification-queue"] });
      setMode(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, remark }: { id: string; remark: string }) =>
      rejectEntry(id, { rejection_remark: remark }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification-queue"] });
      setMode(null);
    },
  });

  const columns: Column<InspectionEntry>[] = [
    { key: "item_name", header: "Item", sortable: true },
    { key: "room_label", header: "Room" },
    {
      key: "category",
      header: "Category",
      render: (e) => capitalize(e.category),
    },
    { key: "trade", header: "Trade", render: (e) => <Badge variant="secondary">{e.trade}</Badge> },
    {
      key: "severity",
      header: "Severity",
      render: (e) => <SeverityBadge severity={e.severity} />,
    },
    {
      key: "contractor",
      header: "Fixed by",
      render: (e) =>
        e.contractor_assignments[0]?.contractor_name ?? (
          <span className="text-gray-400">--</span>
        ),
    },
    {
      key: "fixed_at",
      header: "Fixed at",
      render: (e) => (e.fixed_at ? formatDateTime(e.fixed_at) : "--"),
      sortable: true,
      accessor: (e) => e.fixed_at ?? "",
    },
    {
      key: "actions",
      header: "",
      render: (e) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            onClick={(ev) => {
              ev.stopPropagation();
              setMode({ type: "verify", entry: e });
            }}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Verify
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={(ev) => {
              ev.stopPropagation();
              setMode({ type: "reject", entry: e });
            }}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Reject
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary-600" />
            Verification Queue
          </h1>
          <p className="text-sm text-gray-500">
            Snag entries marked fixed by Business Associates and awaiting your
            verification. Oldest first.
          </p>
        </div>
      </div>

      <div className="flex items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Project</Label>
          <Select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="min-w-[260px]"
          >
            <option value="">All projects</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {queue && queue.length > 0 ? (
        <DataTable
          data={queue}
          columns={columns}
          getRowKey={(e) => e.id}
          onRowClick={(e) => navigate(`/inspections/${e.id}`)}
        />
      ) : (
        <EmptyState
          title="Queue is empty"
          description="No Business Associate has marked a fix pending verification."
        />
      )}

      <RemarkDialog
        open={mode !== null}
        mode={mode?.type ?? "verify"}
        entryName={mode?.entry.item_name ?? ""}
        pending={verifyMutation.isPending || rejectMutation.isPending}
        onConfirm={async (remark) => {
          if (!mode) return;
          if (mode.type === "verify") {
            await verifyMutation.mutateAsync({ id: mode.entry.id, remark });
          } else {
            await rejectMutation.mutateAsync({ id: mode.entry.id, remark });
          }
        }}
        onCancel={() => setMode(null)}
      />
    </div>
  );
}
