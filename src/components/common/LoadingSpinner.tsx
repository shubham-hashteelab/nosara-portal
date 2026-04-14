import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: number;
  text?: string;
}

export function LoadingSpinner({
  className,
  size = 24,
  text = "Loading...",
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 gap-3",
        className
      )}
    >
      <Loader2 className="animate-spin text-primary-500" size={size} />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
}
