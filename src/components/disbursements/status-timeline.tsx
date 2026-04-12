"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { formatUtcLongDateAtTime } from "@/lib/date-display";
import type { DisbursementStatus } from "@/lib/constants";

interface StatusTimelineProps {
  disbursement: {
    status: DisbursementStatus;
    submittedAt: Date;
    processingAt: Date | null;
    inTransitAt: Date | null;
    completedAt: Date | null;
    failedAt: Date | null;
    failureReason: string | null;
    estimatedCompletion: Date;
  };
}

type StepState = "completed" | "current" | "future" | "failed";

function stepIndicator(state: StepState): ReactNode {
  if (state === "completed") {
    return (
      <Check
        aria-hidden
        className="size-2 shrink-0"
        strokeWidth={2.75}
      />
    );
  }
  if (state === "failed") {
    return <span aria-hidden>!</span>;
  }
  return null;
}

interface TimelineStep {
  label: string;
  state: StepState;
  timestamp: Date | null;
  failureReason?: string | null;
}

const STATUS_ORDER: DisbursementStatus[] = [
  "queued",
  "processing",
  "in_transit",
  "completed",
];

function getStepIndex(status: DisbursementStatus): number {
  if (status === "failed") return -1;
  return STATUS_ORDER.indexOf(status);
}

function formatTimestamp(date: Date): string {
  return formatUtcLongDateAtTime(date);
}

function estimateStepTime(
  submittedAt: Date,
  estimatedCompletion: Date,
  stepIndex: number
): Date {
  const total = estimatedCompletion.getTime() - submittedAt.getTime();
  const fractions = [0, 0.05, 0.25, 1];
  return new Date(submittedAt.getTime() + total * fractions[stepIndex]);
}

function buildSteps(
  disbursement: StatusTimelineProps["disbursement"]
): TimelineStep[] {
  const {
    status,
    submittedAt,
    processingAt,
    inTransitAt,
    completedAt,
    failedAt,
    failureReason,
    estimatedCompletion,
  } = disbursement;

  const currentIdx = getStepIndex(status);
  const isFailed = status === "failed";

  let failedStepIdx = -1;
  if (isFailed) {
    if (processingAt && !inTransitAt) {
      failedStepIdx = 2;
    } else if (processingAt) {
      failedStepIdx = 1;
    } else {
      failedStepIdx = 0;
    }
  }

  const timestamps: (Date | null)[] = [
    submittedAt,
    processingAt,
    inTransitAt,
    completedAt,
  ];

  const labels = ["Submitted", "Processing", "In Transit", "Completed"];

  return labels.map((label, i) => {
    if (isFailed && i === failedStepIdx) {
      return {
        label,
        state: "failed" as const,
        timestamp: failedAt,
        failureReason,
      };
    }

    if (isFailed && i > failedStepIdx) {
      return {
        label,
        state: "future" as const,
        timestamp: estimateStepTime(submittedAt, estimatedCompletion, i),
      };
    }

    if (isFailed && i < failedStepIdx) {
      return {
        label,
        state: "completed" as const,
        timestamp: timestamps[i],
      };
    }

    if (i < currentIdx || (i === currentIdx && status === "completed")) {
      return {
        label,
        state: "completed" as const,
        timestamp: timestamps[i],
      };
    }

    if (i === currentIdx) {
      return {
        label,
        state: "current" as const,
        timestamp: timestamps[i],
      };
    }

    return {
      label,
      state: "future" as const,
      timestamp: estimateStepTime(submittedAt, estimatedCompletion, i),
    };
  });
}

const stateStyles: Record<
  StepState,
  { dot: string; line: string; label: string; time: string }
> = {
  completed: {
    dot: "bg-[#4E8F4E]",
    line: "w-0.5 bg-[#4E8F4E]",
    label: "text-[#1A1D18]",
    time: "text-[#5C6057]",
  },
  current: {
    dot: "bg-[#F96B2F] ring-4 ring-[#F96B2F]/20",
    line: "w-0.5 border-l-2 border-dashed border-[#D4D9CE]",
    label: "text-[#1A1D18]",
    time: "text-[#D4541A]",
  },
  future: {
    dot: "border-2 border-[#D4D9CE] bg-white",
    line: "w-0.5 border-l-2 border-dashed border-[#D4D9CE]",
    label: "text-[#74796F]",
    time: "text-[#74796F]",
  },
  failed: {
    dot: "bg-[#C94A4A]",
    line: "w-0.5 border-l-2 border-dashed border-[#D4D9CE]",
    label: "text-[#B33E3E]",
    time: "text-[#B33E3E]",
  },
};

export function StatusTimeline({ disbursement }: Readonly<StatusTimelineProps>) {
  const steps = buildSteps(disbursement);

  return (
    <div className="flex flex-col">
      {steps.map((step, i) => {
        const style = stateStyles[step.state];
        const isLast = i === steps.length - 1;

        return (
          <div key={step.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex size-3 shrink-0 items-center justify-center rounded-full text-[7px] font-bold leading-none text-white",
                  style.dot
                )}
              >
                {stepIndicator(step.state)}
              </div>
              {!isLast && (
                <div className={cn("grow min-h-8", style.line)} />
              )}
            </div>

            <div className={cn("pb-6 -mt-0.5", isLast && "pb-0")}>
              <p className={cn("text-[15px] font-semibold leading-4", style.label)}>
                {step.label}
              </p>
              {step.timestamp && (
                <p className={cn("mt-1 text-[13px]", style.time)}>
                  {step.state === "future"
                    ? `Est. ${formatTimestamp(step.timestamp)}`
                    : formatTimestamp(step.timestamp)}
                </p>
              )}
              {step.state === "failed" && step.failureReason && (
                <div className="mt-2 rounded-xl border border-[#F5C5C5] bg-[#FCEAEA] px-3 py-2.5 text-[13px] leading-relaxed text-[#7D3535]">
                  {step.failureReason}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
