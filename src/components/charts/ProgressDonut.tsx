import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface ProgressDonutProps {
  completed: number;
  inProgress: number;
  notStarted: number;
}

const COLORS = ["#22c55e", "#eab308", "#d1d5db"];

export function ProgressDonut({
  completed,
  inProgress,
  notStarted,
}: ProgressDonutProps) {
  const total = completed + inProgress + notStarted;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const data = [
    { name: "Completed", value: completed },
    { name: "In Progress", value: inProgress },
    { name: "Not Started", value: notStarted },
  ];

  return (
    <div className="relative w-full h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            dataKey="value"
            strokeWidth={2}
          >
            {data.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [value, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{pct}%</div>
          <div className="text-xs text-gray-500">Complete</div>
        </div>
      </div>
    </div>
  );
}
