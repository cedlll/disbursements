"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Building2,
  CalendarClock,
  ChevronRight,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/lib/store";
import { formatPHP, type MerchantTier } from "@/lib/constants";
import { useStaggerReveal } from "@/lib/use-gsap";

const tierLabel: Record<MerchantTier, string> = {
  standard: "Standard",
  verified: "Verified",
  premium: "Premium",
};

const tierPillClass: Record<MerchantTier, string> = {
  standard: "text-muted-foreground ring-1 ring-border",
  verified: "text-success ring-1 ring-success/25",
  premium: "text-warning ring-1 ring-warning/25",
};

const INITIAL_NOTIFICATION_PREFS = {
  payoutAlerts: true,
  weeklyDigest: false,
} satisfies Record<"payoutAlerts" | "weeklyDigest", boolean>;

function SwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: Readonly<{
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}>) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <Label
          htmlFor={id}
          className="cursor-pointer text-sm font-medium text-foreground"
        >
          {label}
        </Label>
        {description ? (
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

export default function SettingsPage() {
  const balance = useAppStore((s) => s.balance);
  const merchantTier = useAppStore((s) => s.merchantTier);

  const [payoutAlerts, setPayoutAlerts] = useState<boolean>(
    INITIAL_NOTIFICATION_PREFS.payoutAlerts,
  );
  const [weeklyDigest, setWeeklyDigest] = useState<boolean>(
    INITIAL_NOTIFICATION_PREFS.weeklyDigest,
  );
  const savedNotificationPrefsRef = useRef<{
    payoutAlerts: boolean;
    weeklyDigest: boolean;
  }>({ ...INITIAL_NOTIFICATION_PREFS });

  function handleSaveNotificationPrefs() {
    const saved = savedNotificationPrefsRef.current;
    if (
      payoutAlerts === saved.payoutAlerts &&
      weeklyDigest === saved.weeklyDigest
    ) {
      return;
    }
    savedNotificationPrefsRef.current = { payoutAlerts, weeklyDigest };
    toast.success("Notification preferences saved");
  }

  const sectionsRef = useStaggerReveal<HTMLDivElement>({
    y: 18,
    stagger: 0.1,
  });

  return (
    <AppShell title="Settings">
      <div ref={sectionsRef} className="flex flex-col gap-5 sm:gap-6">
        <Card className="rounded-xl border border-border bg-card shadow-card ring-0">
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                <Building2 className="size-5 text-primary" aria-hidden />
              </span>
              <div className="min-w-0">
                <CardTitle className="text-foreground">Account</CardTitle>
                <CardDescription>
                  Merchant profile and verification tier
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            <dl className="divide-y divide-border/60">
              <div className="grid grid-cols-1 gap-1.5 py-3.5 first:pt-0 md:grid-cols-[11rem_1fr] md:items-center md:gap-x-6 md:gap-y-0">
                <dt className="text-xs font-medium text-muted-foreground">
                  Registered as
                </dt>
                <dd className="flex min-w-0 flex-wrap items-center gap-2 md:justify-self-end">
                  <span className="text-sm font-semibold text-foreground">
                    Merchant
                  </span>
                  <span
                    className={cn(
                      "inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
                      tierPillClass[merchantTier],
                    )}
                  >
                    {tierLabel[merchantTier]}
                  </span>
                </dd>
              </div>
              <div className="grid grid-cols-1 gap-1 py-3.5 md:grid-cols-[11rem_1fr] md:items-center md:gap-x-6 md:gap-y-0">
                <dt className="text-xs font-medium text-muted-foreground">
                  Email
                </dt>
                <dd className="min-w-0 truncate text-sm text-foreground md:justify-self-end md:text-right">
                  admin@merchant.ph
                </dd>
              </div>
              <div className="grid grid-cols-1 gap-1 py-3.5 md:grid-cols-[11rem_1fr] md:items-center md:gap-x-6 md:gap-y-0">
                <dt className="text-xs font-medium text-muted-foreground">
                  Available balance
                </dt>
                <dd className="min-w-0 text-sm font-semibold tabular-nums text-foreground md:justify-self-end md:text-right">
                  {formatPHP(balance.available)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-border bg-card shadow-card ring-0">
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                <Bell className="size-5 text-primary" aria-hidden />
              </span>
              <div className="min-w-0">
                <CardTitle className="text-foreground">Notifications</CardTitle>
                <CardDescription>
                  Choose how we reach you about payouts and activity
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-4">
            <div className="divide-y divide-border/60">
              <SwitchRow
                id="settings-payout-alerts"
                label="Payout status alerts"
                description="Email when a disbursement completes or fails"
                checked={payoutAlerts}
                onCheckedChange={setPayoutAlerts}
              />
              <SwitchRow
                id="settings-weekly-digest"
                label="Weekly summary"
                description="A recap of volume and recipients"
                checked={weeklyDigest}
                onCheckedChange={setWeeklyDigest}
              />
            </div>
            <div className="mt-4 flex justify-end border-t border-border/60 pt-4">
              <Button
                type="button"
                onClick={handleSaveNotificationPrefs}
                className="h-11 rounded-lg bg-primary px-6 text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Save preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-border bg-card shadow-card ring-0">
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                <CalendarClock
                  className="size-5 text-primary"
                  aria-hidden
                />
              </span>
              <div className="min-w-0">
                <CardTitle className="text-foreground">Payouts</CardTitle>
                <CardDescription>
                  Cadence and next run date live on the schedule screen
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-4">
            <Link
              href="/schedule"
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3.5 text-left transition-colors hover:border-input hover:bg-card"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">
                  Payout schedule
                </span>
                <span className="block text-xs text-muted-foreground">
                  Change frequency and view next payout
                </span>
              </span>
              <ChevronRight
                className="size-5 shrink-0 text-muted-foreground/50"
                aria-hidden
              />
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-border bg-card shadow-card ring-0">
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                <Shield className="size-5 text-primary" aria-hidden />
              </span>
              <div className="min-w-0">
                <CardTitle className="text-foreground">Security</CardTitle>
                <CardDescription>
                  Sign-in and session controls (coming soon)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              Password changes and two-factor authentication will appear here in
              a future release.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
