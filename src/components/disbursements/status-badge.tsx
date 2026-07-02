"use client";

import { cn } from "@/lib/utils";
import { STATUS_CONFIG, type DisbursementStatus } from "@/lib/constants";

interface StatusBadgeProps {
  status: DisbursementStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "sm" }: Readonly<StatusBadgeProps>) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center font-medium leading-4",
        config.color,
        size === "sm" && "gap-1.5 text-xs",
        size === "md" && "gap-2 text-sm"
      )}
    >
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          config.dotColor,
          status === "failed" && "animate-pulse-dot"
        )}
        aria-hidden
      />
      {config.label}
    </span>
  );
}
