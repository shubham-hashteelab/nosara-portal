import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { TowerBuildingViz } from "./TowerBuildingViz";
import type { TowerProgress, FloorProgress } from "@/types/api";
import { cn } from "@/lib/utils";

type FilterMode = "all" | "with_snags" | "pending";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tower: TowerProgress | null;
  projectName?: string;
  projectId: string;
}

export function TowerDetailModal({
  open,
  onOpenChange,
  tower,
  projectName,
  projectId,
}: Props) {
  const [filter, setFilter] = useState<FilterMode>("all");
  const [highlightFloorId, setHighlightFloorId] = useState<string | null>(null);
  const navigate = useNavigate();

  const filteredFloors = useMemo(() => {
    if (!tower) return [];
    const sorted = [...tower.floors].sort(
      (a, b) => b.floor_number - a.floor_number
    );
    if (filter === "with_snags") return sorted.filter((f) => f.open_snags > 0);
    if (filter === "pending")
      return sorted.filter((f) => f.completion_pct < 100);
    return sorted;
  }, [tower, filter]);

  if (!tower) return null;

  const goToFloor = (floor: FloorProgress) => {
    navigate(
      `/buildings/${tower.building_id}/floors/${floor.floor_id}`
    );
    onOpenChange(false);
  };

  const goToTower = () => {
    navigate(`/projects/${projectId}/buildings/${tower.building_id}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">
            Tower detail
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <h2 className="text-2xl font-semibold text-gray-900">
              {tower.building_name}
            </h2>
            {projectName && (
              <span className="text-base text-gray-500">· {projectName}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 p-6 max-h-[75vh] overflow-y-auto">
          {/* Left: tall building */}
          <div className="flex justify-center md:justify-start">
            <TowerBuildingViz
              floors={tower.floors}
              size="tall"
              highlightFloorId={highlightFloorId}
            />
          </div>

          {/* Right: floors list */}
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">
                  Floors
                </p>
                <p className="text-sm text-gray-700 mt-0.5">
                  {tower.floors.length} floors · {tower.total_flats} flats ·{" "}
                  {tower.open_snags} snags open · {tower.completion_pct}% complete
                </p>
              </div>
              <FilterTabs value={filter} onChange={setFilter} />
            </div>

            <div className="space-y-1.5">
              {filteredFloors.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-6 text-center">
                  No floors match this filter.
                </p>
              ) : (
                filteredFloors.map((floor) => (
                  <FloorRow
                    key={floor.floor_id}
                    floor={floor}
                    onMouseEnter={() => setHighlightFloorId(floor.floor_id)}
                    onMouseLeave={() => setHighlightFloorId(null)}
                    onClick={() => goToFloor(floor)}
                  />
                ))
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={goToTower}
                className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                Open tower page →
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FilterTabs({
  value,
  onChange,
}: {
  value: FilterMode;
  onChange: (v: FilterMode) => void;
}) {
  const tabs: { id: FilterMode; label: string }[] = [
    { id: "all", label: "All" },
    { id: "with_snags", label: "With snags" },
    { id: "pending", label: "Pending" },
  ];
  return (
    <div className="inline-flex items-center bg-gray-100 rounded-lg p-0.5 text-xs">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            "px-3 py-1.5 rounded-md transition-colors font-medium",
            value === t.id
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function FloorRow({
  floor,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  floor: FloorProgress;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}) {
  const blocks: ("done" | "inProgress" | "pending")[] = [];
  for (let i = 0; i < floor.inspected_flats; i++) blocks.push("done");
  for (let i = 0; i < floor.in_progress_flats; i++) blocks.push("inProgress");
  for (
    let i = 0;
    i < floor.total_flats - floor.inspected_flats - floor.in_progress_flats;
    i++
  )
    blocks.push("pending");

  const blockColor = {
    done: "bg-emerald-500",
    inProgress: "bg-amber-500",
    pending: "bg-stone-200",
  };

  return (
    <button
      type="button"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors text-left"
    >
      <span className="font-mono text-xs text-gray-600 tabular-nums w-10">
        Fl {String(floor.floor_number).padStart(2, "0")}
      </span>

      <div className="flex items-center gap-1 shrink-0">
        {blocks.map((b, i) => (
          <span
            key={i}
            className={cn("h-3.5 w-3.5 rounded-sm", blockColor[b])}
          />
        ))}
      </div>

      <div className="flex-1 mx-2 h-1.5 rounded-full bg-stone-200 overflow-hidden">
        <div
          className="h-full bg-emerald-500"
          style={{ width: `${floor.completion_pct}%` }}
        />
      </div>

      <span className="text-sm font-semibold text-gray-900 tabular-nums w-10 text-right">
        {Math.round(floor.completion_pct)}%
      </span>

      {floor.open_snags > 0 ? (
        <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-md bg-red-50 text-red-600 text-[10px] font-semibold">
          {floor.open_snags}
        </span>
      ) : (
        <span className="inline-block w-5" />
      )}
    </button>
  );
}
