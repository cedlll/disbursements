"use client";

import { useState } from "react";
import { formatUtcLongDate } from "@/lib/date-display";
import { CalendarClock, Check } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppStore } from "@/lib/store";
import { useStaggerReveal } from "@/lib/use-gsap";
import { MOCK_NOW } from "@/lib/mock-data";
import type { PayoutFrequency } from "@/lib/constants";

const SCHEDULE_OPTIONS: {
  value: PayoutFrequency;
  label: string;
  description: string;
}[] = [
  {
    value: "monthly",
    label: "Monthly",
    description: "Payouts are processed on the 1st of each month",
  },
  {
    value: "biweekly",
    label: "Bi-weekly",
    description: "Payouts are processed every two weeks",
  },
  {
    value: "on_demand",
    label: "On-Demand",
    description: "Request payouts at any time",
  },
];

function computeNextPayoutDate(freq: PayoutFrequency): Date {
  const now = MOCK_NOW;
  if (freq === "on_demand") return new Date(now);
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const day = now.getUTCDate();
  if (freq === "biweekly") {
    const next = new Date(Date.UTC(y, m, day));
    next.setUTCDate(day + (14 - (day % 14)));
    return next;
  }
  return new Date(Date.UTC(y, m + 1, 1));
}

export default function SchedulePage() {
  const { payoutFrequency, nextPayoutDate, setPayoutFrequency } =
    useAppStore();

  const [selected, setSelected] = useState<PayoutFrequency>(payoutFrequency);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const hasChanges = selected !== payoutFrequency;
  const sectionsRef = useStaggerReveal<HTMLDivElement>({ y: 18, stagger: 0.12 });

  function handleConfirm() {
    setPayoutFrequency(selected);
    setConfirmOpen(false);
    toast.success(
      `Payout schedule updated to ${SCHEDULE_OPTIONS.find((o) => o.value === selected)?.label}`
    );
  }

  const selectedLabel =
    SCHEDULE_OPTIONS.find((o) => o.value === selected)?.label ?? selected;
  const nextDateForSelected = computeNextPayoutDate(selected);
  const activeScheduleLabel =
    SCHEDULE_OPTIONS.find((o) => o.value === payoutFrequency)?.label ??
    payoutFrequency;

  return (
    <AppShell title="Schedule">
      <div ref={sectionsRef} className="flex flex-col gap-5 sm:gap-6">
        <Card className="rounded-xl border border-border bg-card shadow-card ring-0">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                <CalendarClock
                  className="size-5 text-primary"
                  aria-hidden
                />
              </span>
              <div className="min-w-0">
                <CardTitle className="text-foreground">
                  Current schedule
                </CardTitle>
                <CardDescription>
                  Active payout cadence and next settlement date
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            <dl className="divide-y divide-border">
              <div className="grid grid-cols-1 gap-1.5 py-3.5 first:pt-0 md:grid-cols-[11rem_1fr] md:items-center md:gap-x-6 md:gap-y-0">
                <dt className="text-xs font-medium text-muted-foreground">
                  Frequency
                </dt>
                <dd className="min-w-0 truncate text-sm font-semibold text-foreground md:justify-self-end md:text-right">
                  {activeScheduleLabel}
                </dd>
              </div>
              <div className="grid grid-cols-1 gap-1 py-3.5 md:grid-cols-[11rem_1fr] md:items-center md:gap-x-6 md:gap-y-0">
                <dt className="text-xs font-medium text-muted-foreground">
                  Next payout
                </dt>
                <dd className="min-w-0 text-sm font-semibold text-foreground md:justify-self-end md:text-right">
                  {payoutFrequency === "on_demand"
                    ? "Available now"
                    : formatUtcLongDate(nextPayoutDate)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <div>
        <h2 className="mb-5 text-sm font-semibold text-foreground">
          Change frequency
        </h2>
        <RadioGroup
          value={selected}
          onValueChange={(val: PayoutFrequency) => setSelected(val)}
          className="grid gap-4"
        >
          {SCHEDULE_OPTIONS.map((opt) => {
            const isSelected = selected === opt.value;

            const optionStyle = isSelected
              ? "border-primary/60 bg-primary/[0.04]"
              : "border-border bg-card hover:border-input";

            const rowId = `schedule-${opt.value}`;
            return (
              <div key={opt.value}>
                <label
                  htmlFor={rowId}
                  className={`flex w-full cursor-pointer items-start gap-4 rounded-xl border p-5 text-left transition-colors sm:p-6 ${optionStyle}`}
                >
                  <div className="pt-0.5">
                    <RadioGroupItem value={opt.value} id={rowId} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {opt.label}
                      </span>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
                      )}
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {opt.description}
                    </p>
                  </div>
                </label>
              </div>
            );
          })}
        </RadioGroup>

        <div className="mt-8">
          <Button
            disabled={!hasChanges}
            onClick={() => setConfirmOpen(true)}
            className="h-11 rounded-lg bg-primary px-6 text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            Save
          </Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="gap-4 rounded-xl p-5 pr-11 shadow-modal sm:max-w-sm sm:gap-4 sm:pr-12">
          <DialogHeader>
            <DialogTitle className="font-semibold text-foreground">
              Confirm Schedule Change
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="leading-relaxed">
            {`Changing to `}
            <span className="font-medium text-foreground">{selectedLabel}</span>
            {` payouts means your next payout will be `}
            <span className="font-medium text-foreground">
              {selected === "on_demand"
                ? "available immediately"
                : formatUtcLongDate(nextDateForSelected)}
            </span>
            {`. Confirm?`}
          </DialogDescription>
          <DialogFooter className="-mb-5 -ml-5 -mr-11 mt-0 gap-2 p-4 sm:-mr-12 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              className="bg-secondary text-secondary-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </AppShell>
  );
}
