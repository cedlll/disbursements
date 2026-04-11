"use client";

import { useState } from "react";
import { formatUtcLongDate } from "@/lib/date-display";
import { Calendar, Check } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
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

  return (
    <AppShell title="Schedule">
      <div ref={sectionsRef} className="flex flex-col gap-8 lg:gap-10">
      <div className="rounded-2xl bg-white/70 border border-[#E8EAE4]/60 backdrop-blur-sm p-5 shadow-card sm:p-7">
        <h2 className="text-sm font-semibold text-[#1A1D18]">
          Current schedule
        </h2>
        <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:gap-12">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#74796F]">
              Frequency
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Calendar className="size-4 shrink-0 text-[#1A52C4]" aria-hidden />
              <span className="text-sm font-medium text-[#1A1D18]">
                {SCHEDULE_OPTIONS.find((o) => o.value === payoutFrequency)
                  ?.label ?? payoutFrequency}
              </span>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#74796F]">
              Next payout
            </p>
            <p className="mt-2 text-sm font-semibold text-[#1A1D18]">
              {payoutFrequency === "on_demand"
                ? "Available now"
                : formatUtcLongDate(nextPayoutDate)}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-5 text-sm font-semibold text-[#1A1D18]">
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
              ? "border-[#1C5C1C] bg-[#1C5C1C]/[0.03] shadow-card"
              : "border-[#E8EAE4] bg-white hover:border-[#1C5C1C]/30 hover:shadow-card";

            const rowId = `schedule-${opt.value}`;
            return (
              <div key={opt.value}>
                <label
                  htmlFor={rowId}
                  className={`flex w-full cursor-pointer items-start gap-4 rounded-2xl border p-5 text-left transition-all sm:p-6 ${optionStyle}`}
                >
                  <div className="pt-0.5">
                    <RadioGroupItem value={opt.value} id={rowId} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#1A1D18]">
                        {opt.label}
                      </span>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-[#1C5C1C]" />
                      )}
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#74796F]">
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
            className="h-11 rounded-xl bg-[#1C5C1C] px-6 text-white hover:bg-[#144A14] disabled:opacity-40 transition-colors"
          >
            Save
          </Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="bg-white rounded-2xl shadow-modal">
          <DialogHeader>
            <DialogTitle className="text-[#1A1D18] font-semibold">
              Confirm Schedule Change
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-[#74796F]">
            {`Changing to `}
            <span className="font-medium text-[#1A1D18]">{selectedLabel}</span>
            {` payouts means your next payout will be `}
            <span className="font-medium text-[#1A1D18]">
              {selected === "on_demand"
                ? "available immediately"
                : formatUtcLongDate(nextDateForSelected)}
            </span>
            {`. Confirm?`}
          </DialogDescription>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              className="bg-[#F0F2ED] text-[#1A1D18] rounded-xl hover:bg-[#E8EAE4] transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="bg-[#1C5C1C] text-white rounded-xl hover:bg-[#144A14] transition-colors"
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
