import { useQuery } from "@tanstack/react-query";
import { listProjects } from "@/api/projects";
import { getUser } from "@/api/users";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Globe,
  FolderOpen,
  Building2,
  Home,
  UserIcon,
  Pencil,
} from "lucide-react";
import { capitalize } from "@/lib/utils";
import type { User } from "@/types/api";

interface UserDetailPanelProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditAccess: (user: User) => void;
  onEditProfile: (user: User) => void;
}

export function UserDetailPanel({
  user,
  open,
  onOpenChange,
  onEditAccess,
  onEditProfile,
}: UserDetailPanelProps) {
  // Live-refresh user data (assignments may change while panel is open).
  const { data: liveUser } = useQuery({
    queryKey: ["user", user?.id],
    queryFn: () => getUser(user!.id),
    enabled: open && !!user,
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
    enabled: open && !!user,
  });

  const current = liveUser ?? user;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[440px] flex flex-col"
      >
        {current && (
          <>
            {/* Header */}
            <div className="px-6 pt-6 pb-5 border-b border-gray-100">
              <div className="flex items-center gap-3 pr-8">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">
                    {current.full_name}
                  </h2>
                  <p className="text-xs text-gray-500 truncate">
                    @{current.username}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onEditProfile(current)}
                  className="ml-auto text-gray-400 hover:text-gray-600"
                  aria-label="Edit profile"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Badge
                  variant={current.role === "MANAGER" ? "default" : "secondary"}
                >
                  {capitalize(current.role)}
                </Badge>
                <Badge variant={current.is_active ? "success" : "secondary"}>
                  {current.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            {/* Scope body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {current.role === "MANAGER" ? (
                <ManagerScope />
              ) : (
                <InspectorScope user={current} projects={projects ?? []} />
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {current.role === "INSPECTOR" && (
                <Button onClick={() => onEditAccess(current)}>
                  <Pencil className="h-4 w-4 mr-1.5" />
                  Edit access
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ManagerScope() {
  return (
    <div className="rounded-xl border border-primary-100 bg-primary-50/40 p-4 flex items-start gap-3">
      <Globe className="h-5 w-5 text-primary-600 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium text-gray-900">Global access</p>
        <p className="text-xs text-gray-600 mt-1">
          Managers see every project, tower, and flat in the system. No explicit
          assignments are needed.
        </p>
      </div>
    </div>
  );
}

function InspectorScope({
  user,
  projects,
}: {
  user: User;
  projects: { id: string; name: string; location: string }[];
}) {
  const projectIds = user.assigned_project_ids ?? [];
  const buildingCount = user.assigned_building_ids?.length ?? 0;
  const flatCount = user.assigned_flat_ids?.length ?? 0;
  const hasNothing =
    projectIds.length === 0 && buildingCount === 0 && flatCount === 0;

  if (hasNothing) {
    return (
      <div className="rounded-xl border border-orange-100 bg-orange-50/40 p-4">
        <p className="text-sm font-medium text-orange-800">No access yet</p>
        <p className="text-xs text-orange-700 mt-1">
          This inspector won&apos;t see any flats in the app until you assign
          them to a project, tower, or flat.
        </p>
      </div>
    );
  }

  const byId = new Map(projects.map((p) => [p.id, p]));
  const assignedProjects = projectIds
    .map((id) => byId.get(id))
    .filter((p): p is (typeof projects)[number] => Boolean(p));

  return (
    <>
      {/* Summary card */}
      <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Assignments
        </p>
        <div className="mt-2 grid grid-cols-3 gap-3">
          <ScopeStat
            icon={<FolderOpen className="h-3.5 w-3.5 text-blue-500" />}
            value={projectIds.length}
            label="projects"
          />
          <ScopeStat
            icon={<Building2 className="h-3.5 w-3.5 text-indigo-500" />}
            value={buildingCount}
            label="towers"
          />
          <ScopeStat
            icon={<Home className="h-3.5 w-3.5 text-green-600" />}
            value={flatCount}
            label="flats"
          />
        </div>
      </div>

      {/* Assigned projects list */}
      {assignedProjects.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
            Full-project access
          </p>
          <div className="space-y-2">
            {assignedProjects.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-blue-100 bg-blue-50/40 px-3 py-2.5 flex items-center gap-2"
              >
                <FolderOpen className="h-4 w-4 text-blue-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {p.name}
                  </p>
                  {p.location && (
                    <p className="text-xs text-gray-500 truncate">
                      {p.location}
                    </p>
                  )}
                </div>
                <span className="text-[10px] font-medium uppercase text-blue-600">
                  Full
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Partial access note */}
      {(buildingCount > 0 || flatCount > 0) && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
            Partial access
          </p>
          <div className="rounded-xl border border-gray-100 p-3 space-y-1.5">
            {buildingCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                {buildingCount} {buildingCount === 1 ? "tower" : "towers"}{" "}
                directly assigned
              </div>
            )}
            {flatCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Home className="h-3.5 w-3.5 text-green-600" />
                {flatCount} {flatCount === 1 ? "flat" : "flats"} directly
                assigned
              </div>
            )}
            <p className="text-xs text-gray-400 pt-1">
              Open <span className="font-medium">Edit access</span> to see the
              full hierarchy.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function ScopeStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-lg font-semibold text-gray-900">{value}</span>
      </div>
      <p className="text-[11px] text-gray-500">{label}</p>
    </div>
  );
}
