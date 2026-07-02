"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/disbursements/status-badge";
import { StatusTimeline } from "@/components/disbursements/status-timeline";
import { formatPHP, maskAccount, getBankName } from "@/lib/constants";
import type { Disbursement } from "@/lib/mock-data";

interface DisbursementDrawerProps {
  disbursement: Disbursement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailRow({
  label,
  value,
  mono = false,
}: Readonly<{ label: string; value: string; mono?: boolean }>) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="shrink-0 pt-0.5 text-xs text-muted-foreground">{label}</dt>
      <dd
        className={[
          "min-w-0 max-w-[min(100%,14rem)] flex-1 text-right text-sm font-medium text-foreground sm:max-w-[min(100%,16rem)]",
          mono
            ? "font-mono text-[13px] leading-snug tabular-nums"
            : "break-words",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}

export function DisbursementDrawer({
  disbursement,
  open,
  onOpenChange,
}: Readonly<DisbursementDrawerProps>) {
  if (!disbursement) return null;

  const isFailed = disbursement.status === "failed";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-md"
      >
        <SheetHeader className="border-b border-border/60 px-5 pb-5 sm:px-6">
          <div className="min-w-0 space-y-1.5 pr-10 sm:pr-11">
            <SheetTitle className="min-w-0 truncate text-lg font-medium text-foreground">
              {disbursement.recipientName}
            </SheetTitle>
            <p className="font-display display-nums text-[28px] font-medium leading-tight text-foreground">
              {formatPHP(disbursement.amount)}
            </p>
            <StatusBadge status={disbursement.status} size="md" />
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-8 p-5 sm:p-6">
          {isFailed && (
            <div className="rounded-xl border border-danger/25 bg-danger-light/60 p-4">
              <p className="text-sm font-semibold text-danger">
                Disbursement Failed
              </p>
              {disbursement.failureReason && (
                <p className="mt-2 text-pretty text-sm leading-relaxed text-foreground/80">
                  {disbursement.failureReason}
                </p>
              )}
              <div className="mt-4 flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1 bg-destructive text-white hover:bg-destructive/90"
                  render={<Link href="/disbursements/new" />}
                >
                  Edit &amp; Retry
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-muted-foreground hover:bg-muted"
                  onClick={() => onOpenChange(false)}
                >
                  Mark as Resolved
                </Button>
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Timeline
            </h3>
            <StatusTimeline disbursement={disbursement} />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Details
            </h3>
            <dl className="divide-y divide-border/60 rounded-xl border border-border bg-background px-4 py-1">
              <DetailRow
                label="Bank"
                value={getBankName(disbursement.bankCode)}
              />
              <DetailRow
                label="Account"
                value={maskAccount(disbursement.accountNumber)}
                mono
              />
              <DetailRow
                label="Reference"
                value={disbursement.reference}
                mono
              />
              <DetailRow label="Batch ID" value={disbursement.batchId} mono />
              <DetailRow
                label="Submitted by"
                value={disbursement.submittedBy}
              />
            </dl>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
