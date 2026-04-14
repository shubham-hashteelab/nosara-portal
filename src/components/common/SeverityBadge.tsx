import { Badge } from "@/components/ui/badge";
import { Severity } from "@/types/enums";
import { capitalize } from "@/lib/utils";

interface SeverityBadgeProps {
  severity: string | null;
}

const severityConfig: Record<
  string,
  { variant: "destructive" | "orange" | "warning" }
> = {
  [Severity.CRITICAL]: { variant: "destructive" },
  [Severity.MAJOR]: { variant: "orange" },
  [Severity.MINOR]: { variant: "warning" },
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  if (!severity) return <span className="text-gray-400 text-sm">--</span>;
  const config = severityConfig[severity] ?? { variant: "warning" as const };
  return <Badge variant={config.variant}>{capitalize(severity)}</Badge>;
}
