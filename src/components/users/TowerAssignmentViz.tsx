import { useEffect, useMemo, useRef, useState } from "react";
import type { Flat, InspectorRef } from "@/types/api";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export interface FloorWithFlats {
  floor_id: string;
  floor_number: number;
  flats: Flat[];
}

interface Props {
  floors: FloorWithFlats[];
  assignedFlatIds: Set<string>;
  otherInspectorsByFlat?: Map<string, InspectorRef[]>;
  hasParentAccess: boolean;
  parentAccessSource?: "project" | "building";
  onToggleFlat: (flatId: string, currentlyAssigned: boolean) => void;
  isLoading?: boolean;
  pendingFlatIds?: Set<string>;
}

const TOKENS = {
  floorH: 20,
  blockMinW: 26,
  blockGap: 2,
  floorGap: 3,
  roofH: 22,
  labelFont: 10,
  labelColW: 22,
  bodyPad: 6,
  rowRadius: 3,
};

export function TowerAssignmentViz({
  floors,
  assignedFlatIds,
  otherInspectorsByFlat,
  hasParentAccess,
  parentAccessSource,
  onToggleFlat,
  isLoading,
  pendingFlatIds,
}: Props) {
  const [hoveredFlat, setHoveredFlat] = useState<{
    flat: Flat;
    x: number;
    y: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Clear tooltip on any ancestor scroll — dialog has its own scroll container
  useEffect(() => {
    if (!hoveredFlat) return;
    const clear = () => setHoveredFlat(null);
    window.addEventListener("scroll", clear, true);
    return () => window.removeEventListener("scroll", clear, true);
  }, [hoveredFlat]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6 pl-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (!floors.length) {
    return (
      <div className="text-xs text-gray-400 italic py-4 pl-6">
        No floors in this tower yet.
      </div>
    );
  }

  const sorted = [...floors].sort((a, b) => b.floor_number - a.floor_number);

  const maxFlats = Math.max(1, ...floors.map((f) => f.flats.length));
  const bodyW =
    maxFlats * TOKENS.blockMinW +
    (maxFlats - 1) * TOKENS.blockGap +
    TOKENS.bodyPad * 2;

  return (
    <div className="relative inline-block" ref={containerRef}>
      <div className="flex items-stretch">
        <div
          className="flex flex-col items-end pr-1.5 select-none"
          style={{
            width: TOKENS.labelColW,
            paddingTop: TOKENS.roofH + TOKENS.bodyPad,
            gap: TOKENS.floorGap,
            color: "#9ca3af",
            fontSize: TOKENS.labelFont,
          }}
        >
          {sorted.map((f) => (
            <span
              key={f.floor_id}
              className="leading-none tabular-nums flex items-center"
              style={{ height: TOKENS.floorH }}
            >
              {String(f.floor_number).padStart(2, "0")}
            </span>
          ))}
        </div>

        <div className="relative flex flex-col items-center">
          <Roof width={bodyW + 10} height={TOKENS.roofH} />

          <div
            className="flex flex-col bg-stone-50/70 border-x border-stone-200"
            style={{
              width: bodyW,
              padding: TOKENS.bodyPad,
              gap: TOKENS.floorGap,
            }}
          >
            {sorted.map((floor) => (
              <FloorRow
                key={floor.floor_id}
                floor={floor}
                assignedFlatIds={assignedFlatIds}
                otherInspectorsByFlat={otherInspectorsByFlat}
                hasParentAccess={hasParentAccess}
                pendingFlatIds={pendingFlatIds}
                onToggleFlat={onToggleFlat}
                onHoverFlat={(flat, x, y) =>
                  setHoveredFlat(flat ? { flat, x, y } : null)
                }
              />
            ))}
          </div>

          <div
            className="border-b border-dashed border-gray-300 mt-1"
            style={{ width: bodyW + 10 }}
          />
        </div>
      </div>

      {hoveredFlat && (
        <FlatTooltip
          flat={hoveredFlat.flat}
          isAssigned={assignedFlatIds.has(hoveredFlat.flat.id)}
          otherInspectors={
            otherInspectorsByFlat?.get(hoveredFlat.flat.id) ?? []
          }
          hasParentAccess={hasParentAccess}
          parentAccessSource={parentAccessSource}
          x={hoveredFlat.x}
          y={hoveredFlat.y}
        />
      )}
    </div>
  );
}

function FloorRow({
  floor,
  assignedFlatIds,
  otherInspectorsByFlat,
  hasParentAccess,
  pendingFlatIds,
  onToggleFlat,
  onHoverFlat,
}: {
  floor: FloorWithFlats;
  assignedFlatIds: Set<string>;
  otherInspectorsByFlat?: Map<string, InspectorRef[]>;
  hasParentAccess: boolean;
  pendingFlatIds?: Set<string>;
  onToggleFlat: (flatId: string, currentlyAssigned: boolean) => void;
  onHoverFlat: (flat: Flat | null, x: number, y: number) => void;
}) {
  const sortedFlats = useMemo(
    () =>
      [...floor.flats].sort((a, b) =>
        a.flat_number.localeCompare(b.flat_number, undefined, { numeric: true })
      ),
    [floor.flats]
  );

  if (!sortedFlats.length) {
    return (
      <div
        className="flex items-center text-[9px] text-gray-400 italic pl-1"
        style={{ height: TOKENS.floorH }}
      >
        no flats
      </div>
    );
  }

  return (
    <div
      className="flex items-stretch"
      style={{ height: TOKENS.floorH, gap: TOKENS.blockGap }}
    >
      {sortedFlats.map((flat) => {
        const isAssigned = assignedFlatIds.has(flat.id);
        const isPending = pendingFlatIds?.has(flat.id) ?? false;
        const isOtherAssigned =
          !isAssigned && (otherInspectorsByFlat?.get(flat.id)?.length ?? 0) > 0;
        return (
          <FlatBlock
            key={flat.id}
            isAssigned={isAssigned}
            isOtherAssigned={isOtherAssigned}
            hasParentAccess={hasParentAccess}
            isPending={isPending}
            onClick={() => {
              if (hasParentAccess || isPending) return;
              onToggleFlat(flat.id, isAssigned);
            }}
            onMouseEnter={(e) => {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              onHoverFlat(flat, rect.left + rect.width / 2, rect.top);
            }}
            onMouseLeave={() => onHoverFlat(null, 0, 0)}
          />
        );
      })}
    </div>
  );
}

function FlatBlock({
  isAssigned,
  isOtherAssigned,
  hasParentAccess,
  isPending,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  isAssigned: boolean;
  isOtherAssigned: boolean;
  hasParentAccess: boolean;
  isPending: boolean;
  onClick: () => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}) {
  const state = hasParentAccess
    ? "inherited"
    : isAssigned
      ? "direct"
      : isOtherAssigned
        ? "other"
        : "unassigned";

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={hasParentAccess || isPending}
      className={cn(
        "flex-1 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-400",
        state === "unassigned" &&
          "bg-white border border-gray-300 hover:border-primary-400 hover:bg-primary-50 cursor-pointer",
        state === "direct" &&
          "bg-primary-500 border border-primary-600 hover:bg-red-500 hover:border-red-600 cursor-pointer",
        state === "other" &&
          "bg-amber-200 border border-amber-400 hover:bg-amber-300 cursor-pointer",
        state === "inherited" &&
          "bg-blue-100 border border-blue-200 cursor-not-allowed",
        isPending && "opacity-50 cursor-wait"
      )}
      style={{
        borderRadius: TOKENS.rowRadius,
        minWidth: TOKENS.blockMinW,
      }}
      aria-label={`Flat (${state})`}
      aria-busy={isPending}
    />
  );
}

function Roof({ width, height }: { width: number; height: number }) {
  const antennaH = Math.round(height * 0.35);
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block"
      aria-hidden
    >
      <line
        x1={width / 2}
        y1={0}
        x2={width / 2}
        y2={antennaH}
        stroke="#1f2937"
        strokeWidth={1}
      />
      <polygon
        points={`0,${antennaH} ${width},${antennaH} ${width - 4},${height} 4,${height}`}
        fill="#1f2937"
      />
    </svg>
  );
}

function FlatTooltip({
  flat,
  isAssigned,
  otherInspectors,
  hasParentAccess,
  parentAccessSource,
  x,
  y,
}: {
  flat: Flat;
  isAssigned: boolean;
  otherInspectors: InspectorRef[];
  hasParentAccess: boolean;
  parentAccessSource?: "project" | "building";
  x: number;
  y: number;
}) {
  const stateLabel = hasParentAccess
    ? `Inherited from ${parentAccessSource ?? "parent"}`
    : isAssigned
      ? "Assigned directly"
      : otherInspectors.length > 0
        ? "Held by another inspector"
        : "Unassigned";

  return (
    <div
      className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full"
      style={{ left: x, top: y - 8 }}
    >
      <div className="rounded-md bg-gray-900 text-white px-3 py-2 shadow-lg whitespace-nowrap">
        <div className="text-[11px] font-semibold">Flat {flat.flat_number}</div>
        <div className="text-[10px] text-gray-300">{flat.flat_type}</div>
        <div className="text-[10px] text-gray-400 mt-0.5">{stateLabel}</div>
        {otherInspectors.length > 0 && !hasParentAccess && !isAssigned && (
          <div className="text-[10px] text-amber-300 mt-1 font-medium">
            {otherInspectors.map((i) => i.full_name).join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}
