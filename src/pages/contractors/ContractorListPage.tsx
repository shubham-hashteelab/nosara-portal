import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listContractors,
  createContractor,
  updateContractor,
  deleteContractor,
} from "@/api/contractors";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ContractorFormDialog } from "./ContractorFormDialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Contractor } from "@/types/api";

export default function ContractorListPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Contractor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contractor | null>(null);

  const { data: contractors, isLoading } = useQuery({
    queryKey: ["contractors"],
    queryFn: listContractors,
  });

  const createMutation = useMutation({
    mutationFn: createContractor,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["contractors"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateContractor>[1];
    }) => updateContractor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      setEditTarget(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContractor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      setDeleteTarget(null);
    },
  });

  const columns: Column<Contractor>[] = [
    { key: "name", header: "Name", sortable: true },
    { key: "trade", header: "Trade", sortable: true },
    { key: "phone", header: "Phone", render: (c) => c.phone ?? "--" },
    { key: "email", header: "Email", render: (c) => c.email ?? "--" },
    { key: "company", header: "Company", render: (c) => c.company ?? "--" },
    {
      key: "is_active",
      header: "Status",
      render: (c) => (
        <Badge variant={c.is_active ? "success" : "secondary"}>
          {c.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (c) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setEditTarget(c);
            }}
          >
            <Pencil className="h-4 w-4 text-gray-400" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(c);
            }}
          >
            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
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
          <h1 className="text-2xl font-bold text-gray-900">Contractors</h1>
          <p className="text-sm text-gray-500">
            Manage contractors for snag assignments
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Contractor
        </Button>
      </div>

      <DataTable
        data={contractors ?? []}
        columns={columns}
        searchable
        searchPlaceholder="Search contractors..."
        getRowKey={(c) => c.id}
      />

      {/* Create dialog */}
      <ContractorFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={async (data) => {
          await createMutation.mutateAsync(data);
        }}
      />

      {/* Edit dialog */}
      <ContractorFormDialog
        open={!!editTarget}
        onOpenChange={() => setEditTarget(null)}
        contractor={editTarget}
        onSubmit={async (data) => {
          if (!editTarget) return;
          await updateMutation.mutateAsync({
            id: editTarget.id,
            data,
          });
        }}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Contractor"
        description={`Delete "${deleteTarget?.name}"? Existing assignments will remain but the contractor will be removed.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
