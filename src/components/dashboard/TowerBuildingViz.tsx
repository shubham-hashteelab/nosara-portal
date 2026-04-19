import { useState, useMemo } from "react";
import type { FloorProgress } from "@/types/api";
import { cn } from "@/lib/utils";

type Size = "compact" | "tall";

interface Props {
  floors: FloorProgress[];
  size?: Size;
  highlightFloorId?: string | null;
  onFloorClick?: (floorId: string) => void;
}

const SIZE_TOKENS: Record<
  Size,
  {
    floorH: number;
    blockMinW: number;
    blockGap: number;
    floorGap: number;
    roofH: number;
    labelFont: number;
    labelColW: number;
    bodyPad: number;
    rowRadius: number;
  }
> = {
  compact: {
    floorH: 12,
    blockMinW: 26,
    blockGap: 2,
    floorGap: 2,
    roofH: 18,
    labelFont: 9,
    labelColW: 18,
    bodyPad: 4,
    rowRadius: 2,
  },
  tall: {
    floorH: 22,
    blockMinW: 42,
    blockGap: 3,
    floorGap: 3,
    roofH: 28,
    labelFont: 11,
    labelColW: 24,
    bodyPad: 6,
    rowRadius: 3,
  },
};

const STATUS_BG = {
  done: "bg-emerald-500",
  inProgress: "bg-amber-500",
  pending: "bg-stone-200",
};

export function TowerBuildingViz({
  floors,
  size = "compact",
  highlightFloorId,
  onFloorClick,
}: Props) {
  const [hoveredFloorId, setHoveredFloorId] = useState<string | null>(null);
  const tokens = SIZE_TOKENS[size];

  const sorted = useMemo(
    () => [...floors].sort((a, b) => b.floor_number - a.floor_number),
    [floors]
  );
  const maxFlats = Math.max(1, ...floors.map((f) => f.total_flats));
  const bodyW =
    maxFlats * tokens.blockMinW +
    (maxFlats - 1) * tokens.blockGap +
    tokens.bodyPad * 2;

  const hovered = hoveredFloorId
    ? sorted.find((f) => f.floor_id === hoveredFloorId)
    : null;

  // Show every Nth label so the column doesn't get crowded.
  const labelStep = sorted.length > 12 ? 5 : sorted.length > 6 ? 2 : 1;
  const shouldLabel = (i: number) =>
    i === 0 || i === sorted.length - 1 || (sorted.length - 1 - i) % labelStep === 0;

  return (
    <div className="relative inline-block">
      <div className="flex items-stretch">
        {/* Floor number column */}
        <div
          className="flex flex-col items-end justify-end pr-1.5 select-none"
          style={{
            width: tokens.labelColW,
            paddingTop: tokens.roofH,
            gap: tokens.floorGap,
            color: "#9ca3af",
            fontSize: tokens.labelFont,
          }}
        >
          {sorted.map((f, i) => (
            <span
              key={f.floor_id}
              className="leading-none tabular-nums flex items-center"
              style={{ height: tokens.floorH }}
            >
              {shouldLabel(i) ? String(f.floor_number).padStart(2, "0") : ""}
            </span>
          ))}
        </div>

        {/* Building */}
        <div
          className="relative flex flex-col items-center"
          onMouseLeave={() => setHoveredFloorId(null)}
        >
          <Roof width={bodyW + 10} height={tokens.roofH} />

          <div
            className="flex flex-col bg-stone-50/70 border-x border-stone-200"
            style={{
              width: bodyW,
              padding: tokens.bodyPad,
              gap: tokens.floorGap,
            }}
          >
            {sorted.map((floor) => (
              <FloorRow
                key={floor.floor_id}
                floor={floor}
                tokens={tokens}
                highlighted={
                  hoveredFloorId === floor.floor_id ||
                  highlightFloorId === floor.floor_id
                }
                onMouseEnter={() => setHoveredFloorId(floor.floor_id)}
                onClick={onFloorClick ? () => onFloorClick(floor.floor_id) : undefined}
              />
            ))}
          </div>

          <div
            className="border-b border-dashed border-gray-300 mt-1"
            style={{ width: bodyW + 10 }}
          />
        </div>
      </div>

      {hovered && <FloorTooltip floor={hovered} />}
    </div>
  );
}

function FloorRow({
  floor,
  tokens,
  highlighted,
  onMouseEnter,
  onClick,
}: {
  floor: FloorProgress;
  tokens: (typeof SIZE_TOKENS)[Size];
  highlighted: boolean;
  onMouseEnter: () => void;
  onClick?: () => void;
}) {
  const { total_flats, inspected_flats, in_progress_flats } = floor;
  const blocks: ("done" | "inProgress" | "pending")[] = [];
  for (let i = 0; i < inspected_flats; i++) blocks.push("done");
  for (let i = 0; i < in_progress_flats; i++) blocks.push("inProgress");
  for (let i = 0; i < total_flats - inspected_flats - in_progress_flats; i++)
    blocks.push("pending");

  return (
    <div
      className={cn(
        "flex items-stretch transition-shadow rounded-sm",
        highlighted && "ring-1 ring-gray-900/40 ring-offset-1 ring-offset-stone-50"
      )}
      style={{ height: tokens.floorH, gap: tokens.blockGap }}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      {blocks.length === 0 ? (
        <div
          className="flex-1 bg-stone-100 rounded-sm"
          style={{ borderRadius: tokens.rowRadius }}
        />
      ) : (
        blocks.map((status, i) => (
          <div
            key={i}
            className={cn("flex-1", STATUS_BG[status])}
            style={{
              borderRadius: tokens.rowRadius,
              minWidth: tokens.blockMinW,
            }}
          />
        ))
      )}
    </div>
  );
}

function Roof({ width, height }: { width: number; height: number }) {
  // Trapezoid body slightly wider than building, with a thin antenna on top.
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

function FloorTooltip({ floor }: { floor: FloorProgress }) {
  return (
    <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-3 -translate-y-full z-30">
      <div className="rounded-md bg-gray-900 text-white px-3 py-2 shadow-lg whitespace-nowrap">
        <div className="flex items-center justify-between gap-6 mb-1">
          <span className="text-[11px] font-semibold">
            Floor {floor.floor_number}
          </span>
          <span className="text-[11px] tabular-nums text-gray-300">
            {floor.completion_pct}%
          </span>
        </div>
        <Row label="Done" value={`${floor.inspected_flats}/${floor.total_flats}`} />
        <Row label="In progress" value={floor.in_progress_flats} />
        <Row label="Open snags" value={floor.open_snags} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between gap-6 text-[11px]">
      <span className="text-gray-400">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
