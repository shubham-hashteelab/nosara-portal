import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUser, getUserScopeDetails } from "@/api/users";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  Globe,
  FolderOpen,
  Building2,
  Home,
  UserIcon,
  Pencil,
  ChevronRight,
} from "lucide-react";
import { capitalize } from "@/lib/utils";
import type {
  ScopedFlat,
  User,
  UserScopeDetails,
} from "@/types/api";

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
  const { data: liveUser } = useQuery({
    queryKey: ["user", user?.id],
    queryFn: () => getUser(user!.id),
    enabled: open && !!user,
  });

  const { data: scope, isLoading: scopeLoading } = useQuery({
    queryKey: ["user-scope", user?.id],
    queryFn: () => getUserScopeDetails(user!.id),
    enabled: open && !!user && (liveUser ?? user)?.role === "INSPECTOR",
  });

  const current = liveUser ?? user;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[480px] flex flex-col"
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

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {current.role === "MANAGER" ? (
                <ManagerScope />
              ) : scopeLoading || !scope ? (
                <LoadingSpinner />
              ) : (
                <InspectorScope scope={scope} />
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

function InspectorScope({ scope }: { scope: UserScopeDetails }) {
  const hasNothing =
    scope.projects.length === 0 &&
    scope.buildings.length === 0 &&
    scope.flats.length === 0;

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

  return (
    <>
      {/* Stats strip */}
      <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Assignments
        </p>
        <div className="mt-2 grid grid-cols-3 gap-3">
          <ScopeStat
            icon={<FolderOpen className="h-3.5 w-3.5 text-blue-500" />}
            value={scope.projects.length}
            label="projects"
          />
          <ScopeStat
            icon={<Building2 className="h-3.5 w-3.5 text-indigo-500" />}
            value={scope.buildings.length}
            label="towers"
          />
          <ScopeStat
            icon={<Home className="h-3.5 w-3.5 text-green-600" />}
            value={scope.flats.length}
            label="flats"
          />
        </div>
      </div>

      {scope.projects.length > 0 && <ProjectsSection scope={scope} />}
      {scope.buildings.length > 0 && <BuildingsSection scope={scope} />}
      {scope.flats.length > 0 && <FlatsSection scope={scope} />}
    </>
  );
}

function ProjectsSection({ scope }: { scope: UserScopeDetails }) {
  return (
    <Section
      title="Full-project access"
      hint="Covers every tower and flat in these projects."
    >
      {scope.projects.map((p) => (
        <div
          key={p.project_id}
          className="rounded-xl border border-blue-100 bg-blue-50/40 px-3 py-2.5 flex items-center gap-2"
        >
          <FolderOpen className="h-4 w-4 text-blue-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {p.project_name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {p.location || "—"}
              {" · "}
              {p.total_buildings} {p.total_buildings === 1 ? "tower" : "towers"}
              {" · "}
              {p.total_flats} flats
            </p>
          </div>
        </div>
      ))}
    </Section>
  );
}

function BuildingsSection({ scope }: { scope: UserScopeDetails }) {
  return (
    <Section
      title="Tower-level access"
      hint="Covers every flat in these towers."
    >
      {scope.buildings.map((b) => (
        <div
          key={b.building_id}
          className="rounded-xl border border-indigo-100 bg-indigo-50/30 px-3 py-2.5 flex items-center gap-2"
        >
          <Building2 className="h-4 w-4 text-indigo-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {b.building_name}
            </p>
            <p className="text-xs text-gray-500 truncate flex items-center gap-1">
              <span className="truncate">{b.project_name}</span>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <span className="shrink-0">
                {b.total_floors} {b.total_floors === 1 ? "floor" : "floors"}
                {" · "}
                {b.total_flats} flats
              </span>
            </p>
          </div>
        </div>
      ))}
    </Section>
  );
}

function FlatsSection({ scope }: { scope: UserScopeDetails }) {
  // Group flats by project+building, then by floor number. Preserves the
  // order the backend returned (project → building → floor → flat number).
  const groups = useMemo(() => {
    const byBuilding = new Map<
      string,
      {
        projectName: string;
        buildingName: string;
        byFloor: Map<number, ScopedFlat[]>;
      }
    >();
    for (const f of scope.flats) {
      const key = `${f.project_id}::${f.building_id}`;
      let group = byBuilding.get(key);
      if (!group) {
        group = {
          projectName: f.project_name,
          buildingName: f.building_name,
          byFloor: new Map(),
        };
        byBuilding.set(key, group);
      }
      const floorFlats = group.byFloor.get(f.floor_number) ?? [];
      floorFlats.push(f);
      group.byFloor.set(f.floor_number, floorFlats);
    }
    return Array.from(byBuilding.entries()).map(([key, group]) => ({
      key,
      projectName: group.projectName,
      buildingName: group.buildingName,
      floors: Array.from(group.byFloor.entries())
        .sort(([a], [b]) => a - b)
        .map(([floorNumber, flats]) => ({ floorNumber, flats })),
    }));
  }, [scope.flats]);

  return (
    <Section
      title="Flat-level access"
      hint="Individual flats this inspector can see."
    >
      {groups.map((g) => (
        <div
          key={g.key}
          className="rounded-xl border border-green-100 bg-green-50/20 px-3 py-2.5"
        >
          <p className="text-xs text-gray-500 flex items-center gap-1 min-w-0">
            <span className="truncate">{g.projectName}</span>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="font-medium text-gray-700 truncate">
              {g.buildingName}
            </span>
          </p>
          <div className="mt-2 space-y-1">
            {g.floors.map((floor) => (
              <div
                key={floor.floorNumber}
                className="flex items-start gap-2 text-sm"
              >
                <span className="text-xs font-medium text-gray-500 min-w-[60px] mt-0.5">
                  Floor {floor.floorNumber}
                </span>
                <div className="flex flex-wrap gap-1">
                  {floor.flats.map((f) => (
                    <span
                      key={f.flat_id}
                      className="inline-flex items-center gap-1 rounded-md bg-white border border-green-200 px-1.5 py-0.5 text-xs text-green-700"
                    >
                      <Home className="h-2.5 w-2.5" />
                      {f.flat_number}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </Section>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {title}
        </p>
        {hint && <p className="text-[10px] text-gray-400">{hint}</p>}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
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
