import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface ProgressDonutProps {
  completed: number;
  inProgress: number;
  notStarted: number;
  /** Pixel height of the donut container. Defaults to 200. */
  size?: number;
  /** Inner radius (hole) in pixels. Defaults scaled from size. */
  innerRadius?: number;
  /** Outer radius in pixels. Defaults scaled from size. */
  outerRadius?: number;
  /** Font size of center percent (Tailwind class). Defaults to text-2xl. */
  centerClassName?: string;
  showLabel?: boolean;
}

const COLORS = ["#22c55e", "#eab308", "#d1d5db"];

export function ProgressDonut({
  completed,
  inProgress,
  notStarted,
  size = 200,
  innerRadius,
  outerRadius,
  centerClassName = "text-2xl",
  showLabel = true,
}: ProgressDonutProps) {
  const total = completed + inProgress + notStarted;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const computedInner = innerRadius ?? Math.round(size * 0.275);
  const computedOuter = outerRadius ?? Math.round(size * 0.4);

  const data = [
    { name: "Completed", value: completed },
    { name: "In Progress", value: inProgress },
    { name: "Not Started", value: notStarted },
  ];

  return (
    <div className="relative w-full" style={{ height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={computedInner}
            outerRadius={computedOuter}
            dataKey="value"
            strokeWidth={2}
          >
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [value, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className={`font-bold text-gray-900 ${centerClassName}`}>
            {pct}%
          </div>
          {showLabel && (
            <div className="text-xs text-gray-500">Complete</div>
          )}
        </div>
      </div>
    </div>
  );
}
