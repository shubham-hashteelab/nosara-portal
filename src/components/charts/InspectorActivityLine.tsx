import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { InspectorActivity } from "@/types/api";

interface InspectorActivityLineProps {
  data: InspectorActivity[];
}

export function InspectorActivityLine({ data }: InspectorActivityLineProps) {
  // Group by date, summing across inspectors
  const byDate = data.reduce<
    Record<string, { date: string; entries_checked: number; snags_found: number }>
  >((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = { date: item.date, entries_checked: 0, snags_found: 0 };
    }
    acc[item.date].entries_checked += item.entries_checked;
    acc[item.date].snags_found += item.snags_found;
    return acc;
  }, {});

  const chartData = Object.values(byDate).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
        No activity data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "#e5e7eb" }}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "#e5e7eb" }}
          allowDecimals={false}
        />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="entries_checked"
          stroke="#1a73e8"
          name="Entries Checked"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="snags_found"
          stroke="#ef4444"
          name="Snags Found"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
