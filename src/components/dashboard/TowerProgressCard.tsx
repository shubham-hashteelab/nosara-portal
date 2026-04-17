import { useNavigate } from "react-router-dom";
import { ProgressDonut } from "@/components/charts/ProgressDonut";
import { FloorProgressList } from "./FloorProgressList";
import type { FloorProgress, TowerMini, TowerProgress } from "@/types/api";
import { Building2 } from "lucide-react";

interface DetailedProps {
  variant?: "detailed";
  tower: TowerProgress;
  projectId: string;
}

interface MiniProps {
  variant: "mini";
  tower: TowerMini;
  projectId: string;
}

type Props = DetailedProps | MiniProps;

export function TowerProgressCard(props: Props) {
  const navigate = useNavigate();
  const { tower, projectId, variant = "detailed" } = props as DetailedProps;
  const isDetailed = variant === "detailed";

  const goToTower = () => {
    navigate(`/projects/${projectId}/buildings/${tower.building_id}`);
  };

  if (!isDetailed) {
    return (
      <button
        type="button"
        onClick={goToTower}
        className="group flex flex-col items-center justify-start rounded-lg border border-gray-200 bg-white p-3 min-w-[140px] hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
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

  const detailed = props as DetailedProps;
  const floors: FloorProgress[] = detailed.tower.floors;
  const tw = detailed.tower;

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={goToTower}
        className="w-full flex flex-col items-center rounded-lg border border-gray-200 bg-white p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer text-left"
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded bg-blue-50 text-blue-600 shrink-0">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {tw.building_name}
            </p>
          </div>
          <span className="text-[11px] text-gray-400 tabular-nums shrink-0">
            {tw.total_flats} flats
          </span>
        </div>

        {/* Donut */}
        <ProgressDonut
          completed={tw.inspected_flats}
          inProgress={tw.in_progress_flats}
          notStarted={tw.not_started_flats}
          size={130}
          centerClassName="text-lg"
          showLabel={false}
        />

        {/* Flat status row */}
        <div className="w-full mt-2 grid grid-cols-3 gap-1 text-[10px] text-center">
          <FlatCountPill
            label="Done"
            count={tw.inspected_flats}
            color="text-green-600 bg-green-50"
          />
          <FlatCountPill
            label="Active"
            count={tw.in_progress_flats}
            color="text-yellow-700 bg-yellow-50"
          />
          <FlatCountPill
            label="Pending"
            count={tw.not_started_flats}
            color="text-gray-600 bg-gray-100"
          />
        </div>

        {/* Snag severity dots */}
        <div className="w-full mt-2 flex items-center justify-between gap-1 text-[11px]">
          <SeverityDot
            color="bg-red-500"
            count={tw.critical_snags}
            label="Crit"
          />
          <SeverityDot
            color="bg-orange-500"
            count={tw.major_snags}
            label="Major"
          />
          <SeverityDot
            color="bg-yellow-500"
            count={tw.minor_snags}
            label="Minor"
          />
          <span className="text-[10px] text-gray-500 tabular-nums">
            {tw.open_snags} open
          </span>
        </div>
      </button>

      {/* Hover popover — floor breakdown */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-150 z-30 pointer-events-none"
        role="tooltip"
      >
        <div className="rounded-lg border border-gray-200 bg-white shadow-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-700">
              {tw.building_name} · Floor breakdown
            </p>
            <span className="text-[10px] text-gray-400">
              {floors.length} floors
            </span>
          </div>
          <FloorProgressList floors={floors} />
        </div>
        {/* Arrow */}
        <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-1 w-2 h-2 rotate-45 bg-white border-r border-b border-gray-200" />
      </div>
    </div>
  );
}

function FlatCountPill({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className={`rounded px-1 py-0.5 ${color}`}>
      <div className="font-semibold tabular-nums">{count}</div>
      <div className="text-[9px] opacity-80">{label}</div>
    </div>
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
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="tabular-nums text-gray-700">{count}</span>
      <span className="text-[10px] text-gray-400">{label}</span>
    </span>
  );
}
