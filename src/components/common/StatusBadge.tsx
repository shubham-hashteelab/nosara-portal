import { Badge } from "@/components/ui/badge";
import { CheckStatus, InspectionStatus, SnagFixStatus } from "@/types/enums";
import { capitalize } from "@/lib/utils";

interface StatusBadgeProps {
  status: CheckStatus | InspectionStatus | SnagFixStatus;
}

const statusConfig: Record<
  string,
  { variant: "default" | "success" | "warning" | "destructive" | "secondary" | "orange" }
> = {
  [CheckStatus.PASS]: { variant: "success" },
  [CheckStatus.FAIL]: { variant: "destructive" },
  [CheckStatus.NA]: { variant: "secondary" },
  [InspectionStatus.NOT_STARTED]: { variant: "secondary" },
  [InspectionStatus.IN_PROGRESS]: { variant: "warning" },
  [InspectionStatus.COMPLETED]: { variant: "success" },
  [SnagFixStatus.OPEN]: { variant: "destructive" },
  [SnagFixStatus.FIXED]: { variant: "orange" },
  [SnagFixStatus.VERIFIED]: { variant: "success" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { variant: "secondary" as const };
  return <Badge variant={config.variant}>{capitalize(status)}</Badge>;
}
