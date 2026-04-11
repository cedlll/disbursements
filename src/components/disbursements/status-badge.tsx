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
        "inline-flex shrink-0 items-center gap-1.5 rounded-[6px] font-semibold leading-4",
        config.color,
        config.bgColor,
        size === "sm" && "px-2 py-0.5 text-[11px]",
        size === "md" && "px-2.5 py-1 text-[13px]"
      )}
    >
      <span
        className={cn(
          "size-[3px] shrink-0 rounded-full ring-1 ring-white/80",
          config.dotColor,
          status === "failed" && "animate-pulse"
        )}
        aria-hidden
      />
      {config.label}
    </span>
  );
}
