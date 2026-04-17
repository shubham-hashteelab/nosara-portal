import { useQuery } from "@tanstack/react-query";
import { getUsersSummary } from "@/api/coverage";
import { Users, UserX, AlertTriangle } from "lucide-react";

interface UsersSummaryStripProps {
  onReviewUnassigned?: () => void;
}

export function UsersSummaryStrip({ onReviewUnassigned }: UsersSummaryStripProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["users-summary"],
    queryFn: getUsersSummary,
  });

  if (isLoading || !data) {
    return (
      <div className="h-16 rounded-2xl border border-gray-100 bg-gray-50/50 animate-pulse" />
    );
  }

  const hasIdle = data.idle_inspectors > 0;
  const hasUnassigned = data.total_unassigned_flats > 0;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 flex items-center gap-6 flex-wrap">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Users className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs text-gray-500">Team</p>
          <p className="text-sm font-semibold text-gray-900">
            {data.total_inspectors} inspector
            {data.total_inspectors === 1 ? "" : "s"}
            <span className="text-gray-400 font-normal">
              {" · "}
              {data.total_managers} manager
              {data.total_managers === 1 ? "" : "s"}
            </span>
          </p>
        </div>
      </div>

      <div className="h-8 w-px bg-gray-100" />

      <div className="flex items-center gap-2">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            hasIdle ? "bg-yellow-50 text-yellow-700" : "bg-gray-50 text-gray-400"
          }`}
        >
          <UserX className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs text-gray-500">Idle inspectors</p>
          <p
            className={`text-sm font-semibold ${
              hasIdle ? "text-yellow-700" : "text-gray-900"
            }`}
          >
            {data.idle_inspectors}
            <span className="text-gray-400 font-normal"> no assignments</span>
          </p>
        </div>
      </div>

      <div className="h-8 w-px bg-gray-100" />

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            hasUnassigned
              ? "bg-orange-50 text-orange-600"
              : "bg-green-50 text-green-600"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500">Coverage gap</p>
          <p
            className={`text-sm font-semibold ${
              hasUnassigned ? "text-orange-700" : "text-gray-900"
            }`}
          >
            {data.total_unassigned_flats} unassigned flat
            {data.total_unassigned_flats === 1 ? "" : "s"}
            <span className="text-gray-400 font-normal"> across all projects</span>
          </p>
        </div>
        {hasUnassigned && onReviewUnassigned && (
          <button
            type="button"
            onClick={onReviewUnassigned}
            className="ml-auto text-sm font-medium text-primary-600 hover:text-primary-700 whitespace-nowrap"
          >
            Review →
          </button>
        )}
      </div>
    </div>
  );
}
