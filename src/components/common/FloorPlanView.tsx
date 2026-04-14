import type { FloorPlanLayout } from "@/types/api";

const WALL_COLOR = "#78909C";
const NOT_STARTED_FILL = "#FAFAFA";
const IN_PROGRESS_FILL = "#E3F2FD";
const COMPLETED_FILL = "#E8F5E9";
const COMPLETED_BORDER = "#4CAF50";

export interface RoomStatus {
  label: string;
  inspectedCount: number;
  totalCount: number;
}

interface FloorPlanViewProps {
  layouts: FloorPlanLayout[];
  roomStatuses?: RoomStatus[];
  onRoomClick?: (roomLabel: string) => void;
}

const CANVAS_W = 1000;
const CANVAS_H = Math.round(CANVAS_W / 1.4); // aspect 1.4:1
const WALL_PX = 3;
const CORNER_R = 8;

export function FloorPlanView({
  layouts,
  roomStatuses = [],
  onRoomClick,
}: FloorPlanViewProps) {
  if (layouts.length === 0) return null;

  const statusMap = new Map(roomStatuses.map((r) => [r.label, r]));

  return (
    <div className="space-y-3">
      <svg
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        className="w-full rounded-xl overflow-hidden"
        style={{ maxHeight: 420 }}
      >
        {/* Wall background */}
        <rect width={CANVAS_W} height={CANVAS_H} fill={WALL_COLOR} rx={12} />

        {layouts.map((room) => {
          const x = room.x * CANVAS_W + WALL_PX;
          const y = room.y * CANVAS_H + WALL_PX;
          const w = room.width * CANVAS_W - WALL_PX * 2;
          const h = room.height * CANVAS_H - WALL_PX * 2;
          if (w <= 0 || h <= 0) return null;

          const status = statusMap.get(room.room_label);
          let fill = NOT_STARTED_FILL;
          let strokeColor: string | undefined;
          if (status && status.totalCount > 0) {
            if (status.inspectedCount >= status.totalCount) {
              fill = COMPLETED_FILL;
              strokeColor = COMPLETED_BORDER;
            } else if (status.inspectedCount > 0) {
              fill = IN_PROGRESS_FILL;
            }
          }

          const progressText =
            status && status.totalCount > 0
              ? `${status.inspectedCount}/${status.totalCount}`
              : "";

          return (
            <g
              key={room.room_label}
              className={onRoomClick ? "cursor-pointer" : undefined}
              onClick={() => onRoomClick?.(room.room_label)}
            >
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={CORNER_R}
                fill={fill}
                stroke={strokeColor}
                strokeWidth={strokeColor ? WALL_PX : 0}
              />
              <text
                x={x + w / 2}
                y={y + h / 2 - (progressText ? 8 : 0)}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#37474F"
                fontSize={w < 120 ? 22 : 26}
                fontWeight={600}
              >
                {room.room_label}
              </text>
              {progressText && (
                <text
                  x={x + w / 2}
                  y={y + h / 2 + 18}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#546E7A"
                  fontSize={20}
                  fontWeight={500}
                >
                  {progressText}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
        <LegendDot color={NOT_STARTED_FILL} borderColor={WALL_COLOR} label="Not started" />
        <LegendDot color={IN_PROGRESS_FILL} borderColor="#90CAF9" label="In progress" />
        <LegendDot color={COMPLETED_FILL} borderColor={COMPLETED_BORDER} label="Completed" />
      </div>
    </div>
  );
}

function LegendDot({
  color,
  borderColor,
  label,
}: {
  color: string;
  borderColor: string;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block w-3 h-3 rounded-full"
        style={{
          backgroundColor: color,
          border: `1.5px solid ${borderColor}`,
        }}
      />
      {label}
    </span>
  );
}
