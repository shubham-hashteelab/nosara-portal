import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listUsers, createUser, updateUser } from "@/api/users";
import { listProjects } from "@/api/projects";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { UserFormDialog } from "./UserFormDialog";
import { ProjectAssignmentDialog } from "./ProjectAssignmentDialog";
import { AccessSummary } from "./AccessSummary";
import { UserDetailPanel } from "./UserDetailPanel";
import { UsersSummaryStrip } from "./UsersSummaryStrip";
import { ProjectCoverageView } from "./ProjectCoverageView";
import { Plus } from "lucide-react";
import { capitalize, formatDate } from "@/lib/utils";
import type { UserRole } from "@/types/enums";
import type { User } from "@/types/api";

export default function UserListPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"users" | "coverage">("users");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [assignTarget, setAssignTarget] = useState<User | null>(null);
  const [detailTarget, setDetailTarget] = useState<User | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
  });

  // Projects are also needed by the Access column to show project names.
  // We fetch once at page level so the cache is warm for the detail panel
  // and the coverage view.
  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users-summary"] });
    },
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
      queryClient.invalidateQueries({ queryKey: ["users-summary"] });
      setEditTarget(null);
    },
  });

  const openAssignFor = (user: User) => {
    setDetailTarget(null);
    setAssignTarget(user);
  };

  const openEditFor = (user: User) => {
    setDetailTarget(null);
    setEditTarget(user);
  };

  const columns: Column<User>[] = [
    { key: "full_name", header: "Name", sortable: true },
    { key: "username", header: "Username", sortable: true },
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
      key: "access",
      header: "Access",
      render: (u) => <AccessSummary user={u} projects={projects} />,
    },
    {
      key: "created_at",
      header: "Created",
      render: (u) => formatDate(u.created_at),
      sortable: true,
      accessor: (u) => u.created_at,
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

      <UsersSummaryStrip onReviewUnassigned={() => setTab("coverage")} />

      <Tabs
        defaultValue="users"
        value={tab}
        onValueChange={(v) => setTab(v as "users" | "coverage")}
      >
        <TabsList>
          <TabsTrigger value="users">By User</TabsTrigger>
          <TabsTrigger value="coverage">By Project</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <DataTable
            data={users ?? []}
            columns={columns}
            searchable
            searchPlaceholder="Search users..."
            getRowKey={(u) => u.id}
            onRowClick={(u) => setDetailTarget(u)}
          />
        </TabsContent>

        <TabsContent value="coverage" className="mt-4">
          <ProjectCoverageView />
        </TabsContent>
      </Tabs>

      {/* User detail side panel (click row) */}
      <UserDetailPanel
        user={detailTarget}
        open={!!detailTarget}
        onOpenChange={(open) => !open && setDetailTarget(null)}
        onEditAccess={openAssignFor}
        onEditProfile={openEditFor}
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

      {/* Edit profile dialog */}
      <UserFormDialog
        open={!!editTarget}
        onOpenChange={() => setEditTarget(null)}
        user={editTarget}
        onSubmit={async (data) => {
          if (!editTarget) return;
          const updateData: {
            full_name?: string;
            role?: UserRole;
            password?: string;
          } = {
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

      {/* Assignment dialog (opened from detail panel's "Edit access") */}
      <ProjectAssignmentDialog
        open={!!assignTarget}
        onOpenChange={() => setAssignTarget(null)}
        user={assignTarget}
      />
    </div>
  );
}
