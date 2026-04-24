import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatDateTime } from "@/lib/utils";
import type { InspectionEntry } from "@/types/api";

type NodeState = "done" | "pending" | "rejected";

interface TimelineNode {
  label: string;
  sub?: string | null;
  date: string | null;
  state: NodeState;
}

interface FixTimelineProps {
  entry: InspectionEntry;
}

export function FixTimeline({ entry }: FixTimelineProps) {
  // Timeline only meaningful for FAIL entries (snags).
  if (entry.status !== "FAIL") return null;

  const active = entry.contractor_assignments[0] ?? null;
  // Rejection banner must check `rejected_at` — `snag_fix_status === "OPEN"`
  // is ambiguous between a fresh open snag and one that was rejected back.
  const wasRejected = entry.rejected_at !== null;

  const nodes: TimelineNode[] = [
    {
      label: "Snag recorded",
      date: entry.created_at,
      state: "done",
    },
    {
      label: "Assigned to Business Associate",
      sub: active?.contractor_name ?? null,
      date: active?.assigned_at ?? null,
      state: active ? "done" : "pending",
    },
    {
      label: "Fixed by Business Associate",
      sub: active?.contractor_name ?? null,
      date: entry.fixed_at,
      state: entry.fixed_at ? "done" : "pending",
    },
  ];

  if (wasRejected && entry.snag_fix_status === "OPEN") {
    nodes.push({
      label: "Rejected — needs rework",
      sub: entry.rejection_remark,
      date: entry.rejected_at,
      state: "rejected",
    });
  }

  nodes.push({
    label: "Verified by manager",
    sub: entry.verification_remark,
    date: entry.verified_at,
    state: entry.verified_at ? "done" : "pending",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Fix Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {nodes.map((node, idx) => (
            <li key={idx} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full shrink-0",
                    node.state === "done" && "bg-emerald-500",
                    node.state === "pending" && "bg-gray-300",
                    node.state === "rejected" && "bg-red-500"
                  )}
                />
                {idx < nodes.length - 1 && (
                  <span
                    className={cn(
                      "w-px flex-1 mt-1",
                      node.state === "done"
                        ? "bg-emerald-200"
                        : "bg-gray-200"
                    )}
                  />
                )}
              </div>
              <div className="pb-3 flex-1">
                <div
                  className={cn(
                    "text-sm font-medium",
                    node.state === "rejected" && "text-red-700"
                  )}
                >
                  {node.label}
                </div>
                <div className="text-xs text-gray-500">
                  {node.date ? formatDateTime(node.date) : "—"}
                </div>
                {node.sub && (
                  <p
                    className={cn(
                      "text-xs mt-1",
                      node.state === "rejected"
                        ? "text-red-600 italic"
                        : "text-gray-600"
                    )}
                  >
                    {node.sub}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
