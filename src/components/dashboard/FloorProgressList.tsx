import type { FloorProgress } from "@/types/api";

interface FloorProgressListProps {
  floors: FloorProgress[];
}

export function FloorProgressList({ floors }: FloorProgressListProps) {
  if (floors.length === 0) {
    return (
      <p className="text-xs text-gray-400 italic">No floors configured</p>
    );
  }

  return (
    <ul className="space-y-1.5">
      {floors.map((floor) => (
        <FloorRow key={floor.floor_id} floor={floor} />
      ))}
    </ul>
  );
}

function FloorRow({ floor }: { floor: FloorProgress }) {
  const {
    label,
    total_flats,
    inspected_flats,
    in_progress_flats,
    not_started_flats,
    completion_pct,
    open_snags,
  } = floor;

  const pct = (count: number) =>
    total_flats > 0 ? (count / total_flats) * 100 : 0;

  return (
    <li className="flex items-center gap-2">
      <span className="w-16 text-xs font-medium text-gray-700 truncate">
        {label}
      </span>
      <div className="relative flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
        {total_flats > 0 && (
          <div className="absolute inset-y-0 left-0 flex">
            <div
              className="bg-green-500 h-full"
              style={{ width: `${pct(inspected_flats)}%` }}
            />
            <div
              className="bg-yellow-500 h-full"
              style={{ width: `${pct(in_progress_flats)}%` }}
            />
          </div>
        )}
      </div>
      <span className="w-9 text-right text-xs tabular-nums text-gray-600">
        {completion_pct}%
      </span>
      {open_snags > 0 ? (
        <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-red-50 text-red-600 text-[10px] font-semibold">
          {open_snags}
        </span>
      ) : (
        <span className="inline-block w-5" />
      )}
      <span className="w-14 text-right text-[10px] text-gray-400 tabular-nums">
        {inspected_flats}/{total_flats} {not_started_flats === 0 ? "" : ""}
      </span>
    </li>
  );
}
