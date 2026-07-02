"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/disbursements/status-badge";
import { DisbursementDrawer } from "@/components/disbursements/disbursement-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useAppStore } from "@/lib/store";
import {
  formatUtcMediumDate,
  formatUtcMonthToDateThrough,
  formatUtcShortDateTime,
} from "@/lib/date-display";
import {
  getMonthlyTotal,
  getPendingCount,
  getFailedCount,
  MOCK_NOW,
} from "@/lib/mock-data";
import { formatPHP } from "@/lib/constants";
import { useFadeIn, useTableReveal } from "@/lib/use-gsap";
import type { Disbursement } from "@/lib/mock-data";

const RECENT_PAGE_SIZE = 10;

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  subtitle: string;
}

function StatCard({
  label,
  value,
  change,
  changeType,
  subtitle,
}: Readonly<StatCardProps>) {
  let changeClass = "text-success";
  if (changeType === "negative") {
    changeClass = "text-danger";
  } else if (changeType === "neutral") {
    changeClass = "text-muted-foreground";
  }

  let TrendIcon: typeof TrendingUp | typeof TrendingDown | null = TrendingUp;
  if (changeType === "negative") {
    TrendIcon = TrendingDown;
  } else if (changeType === "neutral") {
    TrendIcon = null;
  }

  return (
    <div className="@container flex min-h-0 min-w-0 flex-col bg-card p-4 sm:p-5 md:p-6">
      <p className="min-w-0 text-[13px] leading-tight text-muted-foreground">
        {label}
      </p>

      <div className="mt-2.5 min-w-0 sm:mt-3">
        <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <p className="font-display display-nums inline-block min-w-0 whitespace-nowrap text-lg font-semibold leading-none text-foreground @min-[11rem]:text-xl @min-[14rem]:text-2xl @min-[17rem]:text-[26px]">
            {value}
          </p>
        </div>
        <p className="mt-2.5 flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-xs leading-snug text-muted-foreground sm:mt-3">
          <span
            className={`inline-flex items-center gap-1 font-medium ${changeClass}`}
          >
            {TrendIcon ? (
              <TrendIcon className="size-3 shrink-0" aria-hidden />
            ) : null}
            {change}
          </span>
          <span aria-hidden>·</span>
          <span className="min-w-0 text-pretty">{subtitle}</span>
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { disbursements, balance } = useAppStore();
  const [selectedDisbursement, setSelectedDisbursement] =
    useState<Disbursement | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [recentPage, setRecentPage] = useState(0);
  const [activityQuery, setActivityQuery] = useState("");

  const monthlyTotal = getMonthlyTotal();
  const pending = getPendingCount();
  const failed = getFailedCount();

  const sortedRecent = useMemo(
    () =>
      [...disbursements].sort(
        (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime(),
      ),
    [disbursements],
  );

  const filteredRecent = useMemo(() => {
    const q = activityQuery.trim().toLowerCase();
    if (!q) return sortedRecent;
    return sortedRecent.filter(
      (d) =>
        d.recipientName.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q),
    );
  }, [sortedRecent, activityQuery]);

  const recentTotal = filteredRecent.length;
  const recentPageCount = Math.max(
    1,
    Math.ceil(recentTotal / RECENT_PAGE_SIZE),
  );
  const recentPageSafe = Math.min(recentPage, recentPageCount - 1);
  const recentStart = recentTotal === 0 ? 0 : recentPageSafe * RECENT_PAGE_SIZE + 1;
  const recentEnd = Math.min(
    (recentPageSafe + 1) * RECENT_PAGE_SIZE,
    recentTotal,
  );
  const recentDisbursements = filteredRecent.slice(
    recentPageSafe * RECENT_PAGE_SIZE,
    recentPageSafe * RECENT_PAGE_SIZE + RECENT_PAGE_SIZE,
  );

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(recentTotal / RECENT_PAGE_SIZE) - 1);
    setRecentPage((p) => Math.min(p, maxPage));
  }, [recentTotal]);

  useEffect(() => {
    setRecentPage(0);
  }, [activityQuery]);

  const cardsRef = useFadeIn<HTMLDivElement>({ y: 10 });
  const tableRef = useTableReveal<HTMLDivElement>();

  const disbursedCoverage = formatUtcMonthToDateThrough(MOCK_NOW);
  const snapshotCoverage = formatUtcMediumDate(MOCK_NOW);

  let failedCaption: string;
  if (failed.count === 0) failedCaption = "All clear";
  else if (failed.count === 1) failedCaption = "1 needs action";
  else failedCaption = `${failed.count} need action`;

  const recentActivityEmptyMessage =
    sortedRecent.length === 0
      ? "No disbursements yet."
      : "No matches for your search.";

  function openDrawer(d: Disbursement) {
    setSelectedDisbursement(d);
    setDrawerOpen(true);
  }

  return (
    <AppShell title="Dashboard">
      <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10">
        <div
          ref={cardsRef}
          className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border shadow-card lg:grid-cols-4"
        >
          <StatCard
            label="Disbursed"
            value={formatPHP(monthlyTotal)}
            change="10.5%"
            changeType="positive"
            subtitle={disbursedCoverage}
          />
          <StatCard
            label="Available"
            value={formatPHP(balance.available)}
            change="13.5%"
            changeType="positive"
            subtitle={snapshotCoverage}
          />
          <StatCard
            label="In transit"
            value={formatPHP(pending.total)}
            change={`${pending.count} payout${pending.count === 1 ? "" : "s"}`}
            changeType="neutral"
            subtitle={snapshotCoverage}
          />
          <StatCard
            label="Failed"
            value={formatPHP(failed.total)}
            change={failedCaption}
            changeType={failed.count > 0 ? "negative" : "positive"}
            subtitle={snapshotCoverage}
          />
        </div>

        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Recent activity
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Latest disbursements across your workspace
              </p>
            </div>
            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={activityQuery}
                onChange={(e) => setActivityQuery(e.currentTarget.value)}
                placeholder="Search recipients…"
                className="h-9 rounded-lg border-border bg-background pl-9"
                aria-label="Search recent activity"
              />
            </div>
          </div>
          <div ref={tableRef} className="overflow-x-auto">
            <table className="w-full min-w-[36rem]">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-muted-foreground">
                    Recipient
                  </th>
                  <th className="hidden px-5 py-3.5 text-left text-xs font-medium text-muted-foreground sm:table-cell">
                    Submitted (UTC)
                  </th>
                  <th className="hidden px-5 py-3.5 text-left text-xs font-medium text-muted-foreground md:table-cell">
                    Est. done (UTC)
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentDisbursements.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-sm text-muted-foreground"
                    >
                      {recentActivityEmptyMessage}
                    </td>
                  </tr>
                ) : (
                  recentDisbursements.map((d) => (
                    <tr
                      key={d.id}
                      tabIndex={0}
                      className="cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      aria-label={`Open disbursement details for ${d.recipientName}, ${formatPHP(d.amount)}`}
                      onClick={() => openDrawer(d)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openDrawer(d);
                        }
                      }}
                    >
                      <td className="px-5 py-3.5 text-sm font-medium text-foreground">
                        {d.recipientName}
                      </td>
                      <td className="hidden px-5 py-3.5 text-sm text-muted-foreground sm:table-cell">
                        {formatUtcShortDateTime(d.submittedAt)}
                      </td>
                      <td className="hidden px-5 py-3.5 text-sm text-muted-foreground md:table-cell">
                        {formatUtcShortDateTime(d.estimatedCompletion)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm font-medium tabular-nums text-foreground">
                        {formatPHP(d.amount)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end">
                          <StatusBadge status={d.status} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {recentTotal > 0 ? (
            <div className="flex flex-col gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-sm text-muted-foreground">
                Showing rows {recentStart}–{recentEnd} of {recentTotal}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={recentPageSafe <= 0}
                  onClick={() => setRecentPage((p) => Math.max(0, p - 1))}
                  className="text-muted-foreground disabled:opacity-40"
                >
                  <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                  Prev
                </Button>
                <span className="text-xs tabular-nums text-muted-foreground">
                  Page {recentPageSafe + 1} of {recentPageCount}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={recentPageSafe >= recentPageCount - 1}
                  onClick={() =>
                    setRecentPage((p) =>
                      Math.min(recentPageCount - 1, p + 1),
                    )
                  }
                  className="text-muted-foreground disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <DisbursementDrawer
        disbursement={selectedDisbursement}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </AppShell>
  );
}
