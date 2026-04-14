import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { capitalize } from "@/lib/utils";

interface SnagsByCategoryBarProps {
  data: Record<string, number>;
}

export function SnagsByCategoryBar({ data }: SnagsByCategoryBarProps) {
  const chartData = Object.entries(data).map(([category, count]) => ({
    category: capitalize(category),
    count,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
        No snag data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="category"
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
        <Bar dataKey="count" fill="#1a73e8" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
