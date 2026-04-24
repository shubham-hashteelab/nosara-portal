import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  listContractors,
  createContractor,
  updateContractor,
} from "@/api/contractors";
import { listOrphanedAssignments } from "@/api/inspections";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { UserFormDialog } from "../users/UserFormDialog";
import { DeactivateContractorDialog } from "./DeactivateContractorDialog";
import { Plus, Pencil, UserX, AlertOctagon } from "lucide-react";
import { UserRole } from "@/types/enums";
import type {
  DeactivateConflictDetail,
  OpenAssignmentEntry,
  User,
  UserCreate,
  UserUpdate,
} from "@/types/api";

export default function ContractorListPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);
  const [openAssignments, setOpenAssignments] = useState<
    OpenAssignmentEntry[] | null
  >(null);

  const { data: contractors, isLoading } = useQuery({
    queryKey: ["contractors"],
    queryFn: listContractors,
  });

  // Orphan count badge — shown as a small link next to the header.
  const { data: orphans } = useQuery({
    queryKey: ["orphaned-assignments"],
    queryFn: listOrphanedAssignments,
  });

  const createMutation = useMutation({
    mutationFn: createContractor,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["contractors"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdate }) =>
      updateContractor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      setEditTarget(null);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: ({ id, force }: { id: string; force: boolean }) =>
      updateContractor(id, { is_active: false }, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      queryClient.invalidateQueries({ queryKey: ["orphaned-assignments"] });
      setDeactivateTarget(null);
      setOpenAssignments(null);
    },
    onError: (err) => {
      if (!isAxiosError(err)) return;
      if (err.response?.status === 409) {
        const detail = err.response.data?.detail;
        if (
          detail &&
          typeof detail === "object" &&
          (detail as DeactivateConflictDetail).code === "OPEN_ASSIGNMENTS"
        ) {
          setOpenAssignments((detail as DeactivateConflictDetail).entries);
        }
      }
    },
  });

  const columns: Column<User>[] = [
    { key: "full_name", header: "Name", sortable: true },
    { key: "username", header: "Username", sortable: true },
    {
      key: "trades",
      header: "Trades",
      render: (u) =>
        u.trades && u.trades.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {u.trades.map((t) => (
              <Badge key={t} variant="secondary" className="text-xs">
                {t}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-gray-400">--</span>
        ),
    },
    { key: "company", header: "Company", render: (u) => u.company ?? "--" },
    { key: "phone", header: "Phone", render: (u) => u.phone ?? "--" },
    { key: "email", header: "Email", render: (u) => u.email ?? "--" },
    {
      key: "is_active",
      header: "Status",
      render: (u) => (
        <Badge variant={u.is_active ? "success" : "secondary"}>
          {u.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (u) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setEditTarget(u);
            }}
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4 text-gray-400" />
          </Button>
          {u.is_active && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setOpenAssignments(null);
                setDeactivateTarget(u);
              }}
              aria-label="Deactivate"
            >
              <UserX className="h-4 w-4 text-gray-400 hover:text-red-500" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) return <LoadingSpinner />;

  const orphanCount = orphans?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Business Associates
          </h1>
          <p className="text-sm text-gray-500">
            Manage Business Associate accounts for snag assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          {orphanCount > 0 && (
            <Link to="/orphaned-assignments">
              <Button variant="outline" size="sm">
                <AlertOctagon className="h-4 w-4 mr-2 text-amber-500" />
                {orphanCount} orphaned assignment
                {orphanCount === 1 ? "" : "s"}
              </Button>
            </Link>
          )}
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Business Associate
          </Button>
        </div>
      </div>

      <DataTable
        data={contractors ?? []}
        columns={columns}
        searchable
        searchPlaceholder="Search Business Associates..."
        getRowKey={(u) => u.id}
      />

      {/* Create */}
      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        lockedRole={UserRole.CONTRACTOR}
        onSubmit={async (payload) => {
          await createMutation.mutateAsync(payload as UserCreate);
        }}
      />

      {/* Edit */}
      <UserFormDialog
        open={!!editTarget}
        onOpenChange={() => setEditTarget(null)}
        lockedRole={UserRole.CONTRACTOR}
        user={editTarget}
        onSubmit={async (payload) => {
          if (!editTarget) return;
          await updateMutation.mutateAsync({
            id: editTarget.id,
            data: payload as UserUpdate,
          });
        }}
      />

      {/* Deactivate with orphan guard */}
      <DeactivateContractorDialog
        open={!!deactivateTarget}
        user={deactivateTarget}
        openAssignments={openAssignments}
        pending={deactivateMutation.isPending}
        onClose={() => {
          setDeactivateTarget(null);
          setOpenAssignments(null);
        }}
        onDeactivate={() => {
          if (deactivateTarget) {
            deactivateMutation.mutate({
              id: deactivateTarget.id,
              force: false,
            });
          }
        }}
        onForceDeactivate={() => {
          if (deactivateTarget) {
            deactivateMutation.mutate({
              id: deactivateTarget.id,
              force: true,
            });
          }
        }}
      />
    </div>
  );
}
