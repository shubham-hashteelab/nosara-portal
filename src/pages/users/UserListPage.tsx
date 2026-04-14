import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listUsers, createUser, updateUser } from "@/api/users";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { UserFormDialog } from "./UserFormDialog";
import { ProjectAssignmentDialog } from "./ProjectAssignmentDialog";
import { Plus, Pencil, FolderOpen } from "lucide-react";
import { capitalize, formatDate } from "@/lib/utils";
import type { UserRole } from "@/types/enums";
import type { User } from "@/types/api";

export default function UserListPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [assignTarget, setAssignTarget] = useState<User | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { full_name?: string; role?: UserRole; password?: string };
    }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditTarget(null);
    },
  });

  const columns: Column<User>[] = [
    { key: "username", header: "Username", sortable: true },
    { key: "full_name", header: "Full Name", sortable: true },
    {
      key: "role",
      header: "Role",
      render: (u) => (
        <Badge variant={u.role === "MANAGER" ? "default" : "secondary"}>
          {capitalize(u.role)}
        </Badge>
      ),
      sortable: true,
      accessor: (u) => u.role,
    },
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
      key: "assigned_project_ids",
      header: "Projects",
      render: (u) => (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-gray-600"
          onClick={(e) => {
            e.stopPropagation();
            setAssignTarget(u);
          }}
        >
          <FolderOpen className="h-3.5 w-3.5" />
          {u.assigned_project_ids?.length ?? 0}
        </Button>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      render: (u) => formatDate(u.created_at),
      sortable: true,
      accessor: (u) => u.created_at,
    },
    {
      key: "actions",
      header: "",
      render: (u) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            setEditTarget(u);
          }}
        >
          <Pencil className="h-4 w-4 text-gray-400" />
        </Button>
      ),
    },
  ];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500">
            Manage managers and inspectors
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      <DataTable
        data={users ?? []}
        columns={columns}
        searchable
        searchPlaceholder="Search users..."
        getRowKey={(u) => u.id}
      />

      {/* Create dialog */}
      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={async (data) => {
          await createMutation.mutateAsync({
            username: data.username,
            password: data.password!,
            full_name: data.full_name,
            role: data.role,
          });
        }}
      />

      {/* Edit dialog */}
      <UserFormDialog
        open={!!editTarget}
        onOpenChange={() => setEditTarget(null)}
        user={editTarget}
        onSubmit={async (data) => {
          if (!editTarget) return;
          const updateData: { full_name?: string; role?: UserRole; password?: string } = {
            full_name: data.full_name,
            role: data.role,
          };
          if (data.password) updateData.password = data.password;
          await updateMutation.mutateAsync({
            id: editTarget.id,
            data: updateData,
          });
        }}
      />

      {/* Project assignment dialog */}
      <ProjectAssignmentDialog
        open={!!assignTarget}
        onOpenChange={() => setAssignTarget(null)}
        user={assignTarget}
      />
    </div>
  );
}
