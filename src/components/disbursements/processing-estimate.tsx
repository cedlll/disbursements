"use client";

import { cn } from "@/lib/utils";
import { MOCK_NOW } from "@/lib/mock-data";
import type { DisbursementStatus } from "@/lib/constants";

function formatTimeUtc(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(d);
}

interface ProcessingEstimateProps {
  status: DisbursementStatus;
  submittedAt: Date;
}

type StepState = "completed" | "current" | "future";

const STEP_DEFS = [
  { label: "Submitted" as const, range: "", hoursOffset: 0 },
  { label: "Processing" as const, range: "0–2 hrs", hoursOffset: 2 },
  { label: "In Transit" as const, range: "2–24 hrs", hoursOffset: 24 },
  { label: "Completed" as const, range: "", hoursOffset: 48 },
] as const;

type StepLabel = (typeof STEP_DEFS)[number]["label"];

interface EstimateStep {
  label: StepLabel;
  range: string;
  estimatedTime: Date;
  state: StepState;
}

function buildEstimateSteps(
  status: DisbursementStatus,
  submittedAt: Date
): EstimateStep[] {
  const now = MOCK_NOW;
  const statusIndex =
    status === "failed"
      ? 1
      : ["queued", "processing", "in_transit", "completed"].indexOf(status);

  return STEP_DEFS.map((step, i) => {
    const estimatedTime = new Date(
      submittedAt.getTime() + step.hoursOffset * 60 * 60 * 1000
    );

    let state: StepState;
    if (i < statusIndex) {
      state = "completed";
    } else if (i === statusIndex) {
      state = "current";
    } else {
      state = estimatedTime <= now ? "completed" : "future";
    }

    return { label: step.label, range: step.range, estimatedTime, state };
  });
}

const stateColors = {
  completed: {
    dot: "size-2.5 shrink-0 rounded-full bg-success",
    text: "text-foreground",
    time: "text-muted-foreground",
  },
  current: {
    dot: "size-3 shrink-0 rounded-full bg-primary ring-4 ring-primary/15",
    text: "text-primary",
    time: "text-primary",
  },
  future: {
    dot: "size-2.5 shrink-0 rounded-full border-2 border-input bg-card",
    text: "text-muted-foreground",
    time: "text-muted-foreground",
  },
};

function StepConnector({ state }: Readonly<{ state: StepState }>) {
  if (state === "completed") {
    return (
      <div
        className="mx-1.5 h-[2px] min-h-[2px] min-w-[0.75rem] flex-1 self-center rounded-full bg-success"
        aria-hidden
      />
    );
  }

  return (
    <div
      className="mx-1.5 h-0 min-w-[0.75rem] flex-1 self-center border-0 border-t-2 border-dashed border-border"
      aria-hidden
    />
  );
}

export function ProcessingEstimate({
  status,
  submittedAt,
}: Readonly<ProcessingEstimateProps>) {
  const steps = buildEstimateSteps(status, submittedAt);

  return (
    <div className="-mx-1 min-w-0 overflow-x-auto px-2 py-2 pb-2">
      <div className="flex min-w-[min(100%,32rem)] items-start sm:min-w-0">
        {steps.map((step, i) => {
          const colors = stateColors[step.state];
          const isLast = i === steps.length - 1;

          return (
            <div
              key={step.label}
              className={cn(
                "flex min-w-0 flex-col items-center",
                !isLast && "min-w-[4.5rem] flex-1"
              )}
            >
              <div className="flex min-h-8 w-full min-w-0 items-center">
                <div className={colors.dot} aria-hidden />
                {!isLast && <StepConnector state={step.state} />}
              </div>

              <div className="mt-2 flex flex-col items-start self-start">
                <span className={cn("text-[13px] font-medium", colors.text)}>
                  {step.label}
                </span>
                {step.range && (
                  <span className="text-[11px] text-muted-foreground">
                    {step.range}
                  </span>
                )}
                <span className={cn("mt-0.5 text-[11px]", colors.time)}>
                  {formatTimeUtc(step.estimatedTime)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
