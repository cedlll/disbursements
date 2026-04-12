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
  standard: "bg-[#F0F2ED] text-[#5C6057] ring-1 ring-[#E8EAE4]/80",
  verified: "bg-[#D6E8D6] text-[#1C5C1C] ring-1 ring-[#C5DCC2]/60",
  premium: "bg-[#FDF3CC] text-[#6B5200] ring-1 ring-[#E8D9A8]/80",
};

const INITIAL_NOTIFICATION_PREFS = {
  payoutAlerts: true,
  weeklyDigest: false,
} as const;

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
          className="cursor-pointer text-sm font-medium text-[#1A1D18]"
        >
          {label}
        </Label>
        {description ? (
          <p className="mt-0.5 text-xs leading-snug text-[#74796F]">
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

  const [payoutAlerts, setPayoutAlerts] = useState(
    INITIAL_NOTIFICATION_PREFS.payoutAlerts,
  );
  const [weeklyDigest, setWeeklyDigest] = useState(
    INITIAL_NOTIFICATION_PREFS.weeklyDigest,
  );
  const savedNotificationPrefsRef = useRef({ ...INITIAL_NOTIFICATION_PREFS });

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
        <Card className="rounded-2xl border-[#E8EAE4] shadow-none ring-0">
          <CardHeader className="border-b border-[#F0F2ED] pb-4">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F0F2ED]">
                <Building2 className="size-5 text-[#1C5C1C]" aria-hidden />
              </span>
              <div className="min-w-0">
                <CardTitle className="text-[#1A1D18]">Account</CardTitle>
                <CardDescription>
                  Merchant profile and verification tier
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            <dl className="divide-y divide-[#F0F2ED]">
              <div className="grid grid-cols-1 gap-1.5 py-3.5 first:pt-0 md:grid-cols-[11rem_1fr] md:items-center md:gap-x-6 md:gap-y-0">
                <dt className="text-xs font-medium text-[#74796F]">
                  Registered as
                </dt>
                <dd className="flex min-w-0 flex-wrap items-center gap-2 md:justify-self-end">
                  <span className="text-sm font-semibold text-[#1A1D18]">
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
                <dt className="text-xs font-medium text-[#74796F]">
                  Email
                </dt>
                <dd className="min-w-0 truncate text-sm text-[#1A1D18] md:justify-self-end md:text-right">
                  admin@merchant.ph
                </dd>
              </div>
              <div className="grid grid-cols-1 gap-1 py-3.5 md:grid-cols-[11rem_1fr] md:items-center md:gap-x-6 md:gap-y-0">
                <dt className="text-xs font-medium text-[#74796F]">
                  Available balance
                </dt>
                <dd className="min-w-0 font-mono text-sm font-semibold tabular-nums text-[#1A1D18] md:justify-self-end md:text-right">
                  {formatPHP(balance.available)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[#E8EAE4] shadow-none ring-0">
          <CardHeader className="border-b border-[#F0F2ED] pb-4">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F0F2ED]">
                <Bell className="size-5 text-[#1C5C1C]" aria-hidden />
              </span>
              <div className="min-w-0">
                <CardTitle className="text-[#1A1D18]">Notifications</CardTitle>
                <CardDescription>
                  Choose how we reach you about payouts and activity
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-4">
            <div className="divide-y divide-[#F0F2ED]">
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
            <div className="mt-4 flex justify-end border-t border-[#F0F2ED] pt-4">
              <Button
                type="button"
                onClick={handleSaveNotificationPrefs}
                className="h-11 rounded-xl bg-[#1C5C1C] px-6 text-white transition-colors hover:bg-[#144A14]"
              >
                Save preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[#E8EAE4] shadow-none ring-0">
          <CardHeader className="border-b border-[#F0F2ED] pb-4">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F0F2ED]">
                <CalendarClock
                  className="size-5 text-[#1C5C1C]"
                  aria-hidden
                />
              </span>
              <div className="min-w-0">
                <CardTitle className="text-[#1A1D18]">Payouts</CardTitle>
                <CardDescription>
                  Cadence and next run date live on the schedule screen
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-4">
            <Link
              href="/schedule"
              className="flex items-center justify-between gap-3 rounded-xl border border-[#E8EAE4] bg-[#FAFAF8] px-4 py-3.5 text-left transition-colors hover:border-[#C5DCC2] hover:bg-white"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium text-[#1A1D18]">
                  Payout schedule
                </span>
                <span className="block text-xs text-[#74796F]">
                  Change frequency and view next payout
                </span>
              </span>
              <ChevronRight
                className="size-5 shrink-0 text-[#D4D9CE]"
                aria-hidden
              />
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[#E8EAE4] shadow-none ring-0">
          <CardHeader className="border-b border-[#F0F2ED] pb-4">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F0F2ED]">
                <Shield className="size-5 text-[#1C5C1C]" aria-hidden />
              </span>
              <div className="min-w-0">
                <CardTitle className="text-[#1A1D18]">Security</CardTitle>
                <CardDescription>
                  Sign-in and session controls (coming soon)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-4">
            <p className="text-sm text-[#74796F]">
              Password changes and two-factor authentication will appear here in
              a future release.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
