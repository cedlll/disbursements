"use client";

import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/disbursements/status-badge";
import { StatusTimeline } from "@/components/disbursements/status-timeline";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { formatPHP, maskAccount, getBankName } from "@/lib/constants";
import { useFadeIn, useStaggerReveal } from "@/lib/use-gsap";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export default function DisbursementDetailPage() {
  const params = useParams();
  const disbursements = useAppStore((s) => s.disbursements);
  const updateDisbursement = useAppStore((s) => s.updateDisbursement);

  const disbursement = disbursements.find((d) => d.id === params.id);

  if (!disbursement) {
    return (
      <AppShell title="Disbursement">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="max-w-md rounded-xl border border-border bg-card p-8 shadow-card">
            <p className="text-lg font-medium text-foreground">
              Disbursement not found
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              The disbursement you&apos;re looking for doesn&apos;t exist or has
              been removed.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              render={<Link href="/dashboard" />}
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  function handleMarkResolved() {
    if (!disbursement) return;
    updateDisbursement(disbursement.id, {
      status: "completed",
      completedAt: new Date(),
      failedAt: null,
      failureReason: null,
    });
    toast.success("Disbursement marked as resolved");
  }

  const heroRef = useFadeIn<HTMLDivElement>({ y: 14 });
  const gridRef = useStaggerReveal<HTMLDivElement>({ y: 20, stagger: 0.12, delay: 0.2 });

  return (
    <AppShell title="Disbursement">
      <div ref={heroRef} className="mb-8 space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          Back
        </Link>

        <div className="min-w-0 space-y-2">
          <h2 className="min-w-0 text-balance text-lg font-medium text-foreground sm:text-xl">
            {disbursement.recipientName}
          </h2>
          <p className="font-display display-nums text-3xl font-semibold text-foreground sm:text-4xl">
            {formatPHP(disbursement.amount)}
          </p>
          <StatusBadge status={disbursement.status} size="md" />
        </div>
      </div>

      {disbursement.status === "failed" && (
        <div className="mb-8 rounded-xl border border-danger/25 bg-danger-light/60 p-5 sm:p-6">
          <p className="text-sm font-semibold text-danger">
            Couldn&apos;t complete
          </p>
          {disbursement.failureReason && (
            <p className="mt-2 text-pretty text-sm leading-relaxed text-foreground/80">
              {disbursement.failureReason}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/disbursements/new" />}
            >
              Edit &amp; Retry
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary"
              onClick={handleMarkResolved}
            >
              Mark as Resolved
            </Button>
          </div>
        </div>
      )}

      <div ref={gridRef} className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-card sm:p-8 lg:col-span-2">
          <h2 className="mb-6 text-sm font-semibold text-foreground">
            Timeline
          </h2>
          <StatusTimeline disbursement={disbursement} />
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card sm:p-8 lg:col-span-1">
          <h2 className="mb-5 text-sm font-semibold text-foreground">
            Details
          </h2>
          <dl className="space-y-5">
            <DetailRow label="Bank" value={getBankName(disbursement.bankCode)} />
            <DetailRow
              label="Account"
              value={maskAccount(disbursement.accountNumber)}
            />
            <DetailRow label="Reference" value={disbursement.reference} />
            <DetailRow label="Batch ID" value={disbursement.batchId} />
            <DetailRow label="Submitted by" value={disbursement.submittedBy} />
            <DetailRow label="Purpose" value={disbursement.purpose} />
          </dl>
        </div>
      </div>
    </AppShell>
  );
}

function DetailRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
