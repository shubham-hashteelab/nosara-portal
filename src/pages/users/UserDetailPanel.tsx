import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUser, getUserScopeDetails } from "@/api/users";
import { listFloorsByBuilding } from "@/api/floors";
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
  ChevronDown,
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

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {current.role === "MANAGER" ? (
                <ManagerScope />
              ) : current.role === "CONTRACTOR" ? (
                <ContractorScope user={current} />
              ) : scopeLoading || !scope ? (
                <LoadingSpinner />
              ) : (
                <InspectorScope scope={scope} />
              )}
            </div>

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

function ContractorScope({ user }: { user: User }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
        <p className="text-sm font-medium text-gray-900">Business Associate</p>
        <p className="text-xs text-gray-600 mt-1">
          Manage this account's trades, company, and contact details from the
          Business Associates page.
        </p>
      </div>
      {user.trades && user.trades.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Trades</p>
          <div className="flex flex-wrap gap-1">
            {user.trades.map((t) => (
              <Badge key={t} variant="secondary" className="text-xs">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {user.company && (
        <div>
          <p className="text-xs text-gray-500">Company</p>
          <p className="text-sm">{user.company}</p>
        </div>
      )}
    </div>
  );
}

/* ─────────── Tree model ─────────── */

type BuildingSource = "BUILDING" | "FLAT";

interface BuildingNode {
  building_id: string;
  building_name: string;
  source: BuildingSource;
  // Known only for tower-level assignments — for flat-level we count from
  // the flats list below, since the scope endpoint doesn't send totals
  // for a building the user only partially covers.
  total_floors?: number;
  total_flats?: number;
  // Populated only when source === "FLAT"; grouped by floor on render.
  flats: ScopedFlat[];
}

interface ProjectNode {
  project_id: string;
  project_name: string;
  location: string;
  isFullProject: boolean;
  total_buildings?: number;
  total_flats?: number;
  buildings: BuildingNode[];
}

function buildTree(scope: UserScopeDetails): ProjectNode[] {
  const byId = new Map<string, ProjectNode>();
  const getOrCreate = (id: string, name: string, location = ""): ProjectNode => {
    const existing = byId.get(id);
    if (existing) return existing;
    const node: ProjectNode = {
      project_id: id,
      project_name: name,
      location,
      isFullProject: false,
      buildings: [],
    };
    byId.set(id, node);
    return node;
  };

  for (const p of scope.projects) {
    const node = getOrCreate(p.project_id, p.project_name, p.location);
    node.isFullProject = true;
    node.total_buildings = p.total_buildings;
    node.total_flats = p.total_flats;
  }

  for (const b of scope.buildings) {
    const proj = getOrCreate(b.project_id, b.project_name);
    if (proj.isFullProject) continue; // inherited, no need to re-show
    proj.buildings.push({
      building_id: b.building_id,
      building_name: b.building_name,
      source: "BUILDING",
      total_floors: b.total_floors,
      total_flats: b.total_flats,
      flats: [],
    });
  }

  for (const f of scope.flats) {
    const proj = getOrCreate(f.project_id, f.project_name);
    if (proj.isFullProject) continue;
    let bld = proj.buildings.find((x) => x.building_id === f.building_id);
    if (bld && bld.source === "BUILDING") continue; // inherited via tower
    if (!bld) {
      bld = {
        building_id: f.building_id,
        building_name: f.building_name,
        source: "FLAT",
        flats: [],
      };
      proj.buildings.push(bld);
    }
    bld.flats.push(f);
  }

  return Array.from(byId.values());
}

/* ─────────── Inspector render ─────────── */

function InspectorScope({ scope }: { scope: UserScopeDetails }) {
  const tree = useMemo(() => buildTree(scope), [scope]);

  if (tree.length === 0) {
    return (
      <div className="rounded-xl border border-orange-100 bg-orange-50/40 p-4">
        <p className="text-sm font-medium text-orange-800">No access yet</p>
        <p className="text-xs text-orange-700 mt-1">
          Assign this inspector to a project, tower, or flat — otherwise they
          won&apos;t see any work in the app.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Assigned scope
      </p>
      {tree.map((p) => (
        <ProjectCard key={p.project_id} node={p} />
      ))}
    </div>
  );
}

function ProjectCard({ node }: { node: ProjectNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2 border-b border-gray-100 bg-gray-50/60">
        <FolderOpen className="h-4 w-4 text-blue-500 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">
            {node.project_name}
          </p>
          {node.location && (
            <p className="text-xs text-gray-500 truncate">{node.location}</p>
          )}
        </div>
        {node.isFullProject && (
          <Badge variant="default" className="text-[10px] uppercase">
            Full project
          </Badge>
        )}
      </div>

      {node.isFullProject ? (
        <p className="px-4 py-3 text-xs text-gray-600">
          {node.total_buildings}{" "}
          {node.total_buildings === 1 ? "tower" : "towers"} ·{" "}
          {node.total_flats} flats — all covered
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {node.buildings.map((b) => (
            <BuildingRow key={b.building_id} building={b} />
          ))}
        </div>
      )}
    </div>
  );
}

function BuildingRow({ building }: { building: BuildingNode }) {
  // Tower-level: collapsed by default, expand to lazy-load floor list.
  // Flat-level: always expanded — the whole point is showing *which* flats.
  const [expanded, setExpanded] = useState(building.source === "FLAT");
  const isTower = building.source === "BUILDING";

  const { data: floors, isLoading: floorsLoading } = useQuery({
    queryKey: ["floors", building.building_id],
    queryFn: () => listFloorsByBuilding(building.building_id),
    enabled: isTower && expanded,
  });

  const flatCount =
    building.total_flats ??
    (building.source === "FLAT" ? building.flats.length : 0);
  const floorCount = building.total_floors;

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50/80 text-left"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
        )}
        <Building2 className="h-4 w-4 text-indigo-500 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">
            {building.building_name}
          </p>
          <p className="text-xs text-gray-500">
            {isTower
              ? `${floorCount} ${floorCount === 1 ? "floor" : "floors"} · ${flatCount} flats`
              : `${building.flats.length} ${building.flats.length === 1 ? "flat" : "flats"} assigned`}
          </p>
        </div>
        <SourceBadge source={building.source} />
      </button>

      {expanded && (
        <div className="pl-9 pr-4 pb-3">
          {isTower ? (
            floorsLoading ? (
              <p className="text-xs text-gray-400 py-1">Loading floors…</p>
            ) : (
              <FloorList
                floors={(floors ?? []).map((f) => ({
                  floor_number: f.floor_number,
                  label: f.label,
                  flat_count: f.total_flats,
                }))}
              />
            )
          ) : (
            <FlatFloorGroups flats={building.flats} />
          )}
        </div>
      )}
    </div>
  );
}

function FloorList({
  floors,
}: {
  floors: { floor_number: number; label: string; flat_count: number }[];
}) {
  if (floors.length === 0) {
    return <p className="text-xs text-gray-400 py-1">No floors.</p>;
  }
  return (
    <ul className="space-y-0.5 border-l border-gray-100 pl-3">
      {floors.map((f) => (
        <li
          key={f.floor_number}
          className="flex items-center justify-between text-xs text-gray-600 py-0.5"
        >
          <span>{f.label || `Floor ${f.floor_number}`}</span>
          <span className="text-gray-400">
            {f.flat_count} {f.flat_count === 1 ? "flat" : "flats"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function FlatFloorGroups({ flats }: { flats: ScopedFlat[] }) {
  const groups = useMemo(() => {
    const byFloor = new Map<number, ScopedFlat[]>();
    for (const f of flats) {
      const arr = byFloor.get(f.floor_number) ?? [];
      arr.push(f);
      byFloor.set(f.floor_number, arr);
    }
    return Array.from(byFloor.entries())
      .sort(([a], [b]) => a - b)
      .map(([floor_number, flats]) => ({ floor_number, flats }));
  }, [flats]);

  return (
    <div className="space-y-2 border-l border-gray-100 pl-3">
      {groups.map((g) => (
        <div key={g.floor_number}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            Floor {g.floor_number}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {g.flats.map((f) => (
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
  );
}

function SourceBadge({ source }: { source: BuildingSource }) {
  if (source === "BUILDING") {
    return (
      <Badge
        variant="outline"
        className="text-[10px] uppercase border-indigo-200 text-indigo-700 bg-indigo-50"
      >
        Tower-level
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="text-[10px] uppercase border-green-200 text-green-700 bg-green-50"
    >
      Partial
    </Badge>
  );
}
