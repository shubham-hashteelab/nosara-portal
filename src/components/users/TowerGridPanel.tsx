import { useQueries } from "@tanstack/react-query";
import { listFlatsByFloor } from "@/api/flats";
import { cn } from "@/lib/utils";
import {
  TowerAssignmentViz,
  type FloorWithFlats,
} from "@/components/users/TowerAssignmentViz";
import type { Floor, Flat, InspectorRef } from "@/types/api";

interface TowerGridPanelProps {
  floors: Floor[];
  assignedFlats: Set<string>;
  /** Flats currently held by OTHER inspectors at the direct flat level.
   * Drives the amber visual + conflict-confirmation path. */
  otherInspectorsByFlat?: Map<string, InspectorRef[]>;
  isProjectAssigned: boolean;
  isBuildingAssigned: boolean;
  pendingFlatIds?: Set<string>;
  onToggleFlat: (flatId: string, currentlyAssigned: boolean) => void;
  isLoadingFloors?: boolean;
}

export function TowerGridPanel({
  floors,
  assignedFlats,
  otherInspectorsByFlat,
  isProjectAssigned,
  isBuildingAssigned,
  pendingFlatIds,
  onToggleFlat,
  isLoadingFloors,
}: TowerGridPanelProps) {
  const hasParentAccess = isProjectAssigned || isBuildingAssigned;
  const parentAccessSource = isProjectAssigned
    ? "project"
    : isBuildingAssigned
      ? "building"
      : undefined;

  const flatQueries = useQueries({
    queries: floors.map((floor) => ({
      queryKey: ["flats", floor.id],
      queryFn: () => listFlatsByFloor(floor.id),
    })),
  });

  const isLoading = isLoadingFloors || flatQueries.some((q) => q.isLoading);

  const floorsWithFlats: FloorWithFlats[] = floors.map((floor, i) => ({
    floor_id: floor.id,
    floor_number: floor.floor_number,
    flats: (flatQueries[i]?.data ?? []) as Flat[],
  }));

  const totalFlats = floorsWithFlats.reduce(
    (sum, f) => sum + f.flats.length,
    0
  );
  const assignedInTower = floorsWithFlats.reduce(
    (sum, f) =>
      sum + f.flats.filter((flat) => assignedFlats.has(flat.id)).length,
    0
  );
  const otherAssignedInTower = floorsWithFlats.reduce(
    (sum, f) =>
      sum +
      f.flats.filter((flat) => otherInspectorsByFlat?.has(flat.id)).length,
    0
  );

  return (
    <div className="pl-8 pr-2 py-3 flex gap-6 items-start">
      <TowerAssignmentViz
        floors={floorsWithFlats}
        assignedFlatIds={assignedFlats}
        otherInspectorsByFlat={otherInspectorsByFlat}
        hasParentAccess={hasParentAccess}
        parentAccessSource={parentAccessSource}
        pendingFlatIds={pendingFlatIds}
        onToggleFlat={onToggleFlat}
        isLoading={isLoading}
      />
      <div className="flex flex-col gap-2 text-xs text-gray-600 pt-4">
        <div className="font-medium text-gray-700">Legend</div>
        <LegendSwatch
          className="bg-white border border-gray-300"
          label="Unassigned"
        />
        <LegendSwatch className="bg-primary-500" label="Assigned to this user" />
        <LegendSwatch
          className="bg-amber-200 border border-amber-400"
          label="Assigned to another inspector"
        />
        <LegendSwatch
          className="bg-blue-100 border border-blue-200"
          label="Inherited"
        />
        {!isLoading && (
          <div className="mt-3 text-[11px] text-gray-500 tabular-nums space-y-0.5">
            {hasParentAccess ? (
              <div>Full tower access via {parentAccessSource}</div>
            ) : (
              <div>
                {assignedInTower} / {totalFlats} flats assigned
              </div>
            )}
            {otherAssignedInTower > 0 && (
              <div className="text-amber-700">
                {otherAssignedInTower} held by other inspectors
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LegendSwatch({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("inline-block w-3 h-3 rounded-sm", className)} />
      <span>{label}</span>
    </div>
  );
}
