import type { PointerEvent as ReactPointerEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ProgressDonut } from "@/components/charts/ProgressDonut";
import { TowerBuildingViz } from "./TowerBuildingViz";
import type { TowerMini, TowerProgress } from "@/types/api";

interface DetailedProps {
  variant?: "detailed";
  tower: TowerProgress;
  projectId: string;
  onClick?: (tower: TowerProgress) => void;
  onPointerDown?: (e: ReactPointerEvent<HTMLElement>) => void;
  shouldSuppressClick?: () => boolean;
}

interface MiniProps {
  variant: "mini";
  tower: TowerMini;
  projectId: string;
}

type Props = DetailedProps | MiniProps;

export function TowerProgressCard(props: Props) {
  const navigate = useNavigate();
  const variant = props.variant ?? "detailed";

  if (variant === "mini") {
    const { tower, projectId } = props as MiniProps;
    return (
      <button
        type="button"
        onClick={() => navigate(`/projects/${projectId}/buildings/${tower.building_id}`)}
        className="group flex flex-col items-center justify-start rounded-2xl border border-gray-100 bg-white p-3 min-w-[140px] hover:border-primary-200 hover:shadow-md transition-all cursor-pointer"
      >
        <ProgressDonut
          completed={tower.inspected_flats}
          inProgress={tower.in_progress_flats}
          notStarted={tower.not_started_flats}
          size={90}
          centerClassName="text-base"
          showLabel={false}
        />
        <p className="mt-1 text-sm font-semibold text-gray-900 truncate w-full text-center">
          {tower.building_name}
        </p>
        <p className="text-[11px] text-gray-500">
          {tower.inspected_flats}/{tower.total_flats} flats
        </p>
      </button>
    );
  }

  const { tower, onClick, onPointerDown, shouldSuppressClick } =
    props as DetailedProps;
  const phase = phaseLabel(tower.completion_pct);
  const badge = badgeLetter(tower.building_name);

  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      onClick={() => {
        if (shouldSuppressClick?.()) return;
        onClick?.(tower);
      }}
      className="group w-full flex flex-col rounded-2xl border border-gray-100 bg-white p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-grab active:cursor-grabbing text-left touch-none"
    >
      {/* Header */}
      <div className="w-full flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md bg-gray-900 text-white text-xs font-semibold">
            {badge}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {tower.building_name}
            </p>
            <p className="text-[11px] text-gray-500 truncate">
              {tower.total_flats} flats · {tower.floors.length} floors · {phase}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-2xl font-bold text-gray-900 tabular-nums">
            {Math.round(tower.completion_pct)}
            <span className="text-sm font-medium">%</span>
          </span>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">complete</p>
        </div>
      </div>

      {/* Building visualization */}
      <div className="w-full flex justify-center my-3">
        <TowerBuildingViz floors={tower.floors} size="compact" />
      </div>

      {/* Flat status row */}
      <div className="w-full flex items-center justify-between gap-2 text-[11px]">
        <StatusDot color="bg-emerald-500" count={tower.inspected_flats} label="Done" />
        <StatusDot color="bg-amber-500" count={tower.in_progress_flats} label="Active" />
        <StatusDot color="bg-stone-300" count={tower.not_started_flats} label="Pending" />
      </div>

      {/* Snag severity row */}
      <div className="w-full mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-3">
          <SeverityDot color="bg-red-600" count={tower.critical_snags} label="critical" />
          <SeverityDot color="bg-amber-500" count={tower.major_snags} label="major" />
          <SeverityDot color="bg-gray-400" count={tower.minor_snags} label="minor" />
        </div>
        <span className="text-[10px] text-gray-500 tabular-nums whitespace-nowrap">
          {tower.open_snags} open <span aria-hidden>→</span>
        </span>
      </div>
    </button>
  );
}

function phaseLabel(pct: number): string {
  if (pct >= 95) return "Handover ready";
  if (pct >= 60) return "Final snagging";
  if (pct >= 25) return "Active inspection";
  if (pct > 0) return "Early inspection";
  return "Pre-inspection";
}

function badgeLetter(name: string): string {
  const m = name.match(/[A-Za-z]/g);
  return (m ? m[m.length - 1] : name.charAt(0)).toUpperCase();
}

function StatusDot({
  color,
  count,
  label,
}: {
  color: string;
  count: number;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <span className="font-semibold tabular-nums text-gray-900">{count}</span>
      <span className="text-gray-500">{label}</span>
    </span>
  );
}

function SeverityDot({
  color,
  count,
  label,
}: {
  color: string;
  count: number;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1">
      <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <span className="font-semibold tabular-nums text-gray-900">{count}</span>
      <span className="text-gray-500">{label}</span>
    </span>
  );
}
