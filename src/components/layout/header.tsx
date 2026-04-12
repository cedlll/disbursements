"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CheckCheck,
  AlertCircle,
  Info,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Plus,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatPHP } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const notificationIcons: Record<string, typeof Info> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
};

const notificationColors: Record<string, string> = {
  success: "text-[#2D6E2D]",
  info: "text-[#1A52C4]",
  warning: "text-[#8A6200]",
  error: "text-[#B33E3E]",
};

type TeamPresence =
  | { status: "online" }
  | { status: "away"; lastSeenMinutesAgo: number };

const teamMembers: readonly {
  name: string;
  role: "admin" | "member";
  avatarUrl: string;
  presence: TeamPresence;
}[] = [
  {
    name: "Cedric",
    role: "admin",
    avatarUrl: "https://i.pravatar.cc/128?img=15",
    presence: { status: "online" },
  },
  {
    name: "Elena",
    role: "member",
    avatarUrl: "https://i.pravatar.cc/128?img=32",
    presence: { status: "away", lastSeenMinutesAgo: 4 },
  },
  {
    name: "Jordan",
    role: "member",
    avatarUrl: "https://i.pravatar.cc/128?img=59",
    presence: { status: "away", lastSeenMinutesAgo: 32 },
  },
];

function roleLabel(role: (typeof teamMembers)[number]["role"]) {
  return role === "admin" ? "Admin" : "Member";
}

function presenceLabel(presence: TeamPresence) {
  if (presence.status === "online") return "Online";
  const n = presence.lastSeenMinutesAgo;
  if (n < 1) return "Last seen just now";
  if (n === 1) return "Last seen 1 min ago";
  return `Last seen ${n} mins ago`;
}

/** Away first (left), online last (right); stable within each group. */
function sortTeamMembersByPresence<
  T extends { presence: TeamPresence },
>(members: readonly T[]): T[] {
  return [...members]
    .map((m, i) => ({ m, i }))
    .sort((a, b) => {
      const ao = a.m.presence.status === "online" ? 1 : 0;
      const bo = b.m.presence.status === "online" ? 1 : 0;
      if (ao !== bo) return ao - bo;
      return a.i - b.i;
    })
    .map(({ m }) => m);
}

interface HeaderProps {
  title: string;
}

export function Header({ title }: Readonly<HeaderProps>) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const settingsActive = pathname === "/settings" || pathname.startsWith("/settings/");

  const notifications = useAppStore((s) => s.notifications);
  const balance = useAppStore((s) => s.balance);
  const markNotificationRead = useAppStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useAppStore(
    (s) => s.markAllNotificationsRead,
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <header className="header-scroll-backdrop sticky top-0 z-10 flex min-h-14 items-center justify-between gap-4 border-b border-border bg-background/90 px-4 py-3 sm:min-h-16 sm:px-6 lg:px-8">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          {title}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden items-center -space-x-2 pr-1 md:flex">
          {sortTeamMembersByPresence(teamMembers).map((member) => {
            const online = member.presence.status === "online";
            const statusText = presenceLabel(member.presence);
            return (
              <Tooltip key={member.avatarUrl}>
                <TooltipTrigger
                  render={
                    <div
                      className={`relative size-9 shrink-0 cursor-default outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                        online ? "z-20" : "z-[1]"
                      }`}
                    />
                  }
                  aria-label={`${member.name}, ${roleLabel(member.role)}, ${statusText}`}
                >
                  <div className="isolate size-full overflow-hidden rounded-full border-2 border-background bg-secondary [transform:translateZ(0)]">
                    <Image
                      src={member.avatarUrl}
                      alt=""
                      width={36}
                      height={36}
                      className={`size-full object-cover transition-[filter,opacity] duration-200 ${
                        online
                          ? "grayscale-0 opacity-100 saturate-100 contrast-100"
                          : "grayscale opacity-[0.78]"
                      }`}
                    />
                  </div>
                  <span
                    className={`pointer-events-none absolute bottom-0 right-0 z-10 size-2.5 rounded-full border-2 border-background shadow-sm ${
                      online ? "bg-emerald-500" : "bg-muted-foreground/55"
                    }`}
                    aria-hidden
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="flex-col items-stretch gap-1 px-3 py-2.5">
                  <span className="text-sm font-semibold leading-tight">
                    {member.name}
                  </span>
                  <span className="text-xs font-normal leading-tight text-white/75">
                    {roleLabel(member.role)}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-normal leading-tight text-white/75">
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${
                        online ? "bg-emerald-400" : "bg-white/45"
                      }`}
                      aria-hidden
                    />
                    {statusText}
                  </span>
                </TooltipContent>
              </Tooltip>
            );
          })}
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full border-2 border-dashed border-border bg-background text-muted-foreground transition-colors hover:border-emerald-500/50 hover:text-emerald-600"
            aria-label="Invite team member"
            title="Invite"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <Link
          href="/settings"
          className={`flex size-10 items-center justify-center rounded-xl transition-colors hover:bg-secondary hover:text-foreground ${
            settingsActive ? "bg-secondary text-foreground" : "text-muted-foreground"
          }`}
          aria-label="Settings"
          title="Settings"
        >
          <Settings className="size-[20px]" aria-hidden />
        </Link>

        <section
          className="hidden items-center rounded-full border border-border bg-card px-3.5 py-1.5 shadow-card sm:flex"
          aria-label="Available for disbursement"
          title="Available for disbursement"
        >
          <span className="font-mono text-xs font-semibold tabular-nums text-foreground md:text-[13px]">
            {formatPHP(balance.available)}
          </span>
        </section>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="relative flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : "Notifications"
            }
          >
            <Bell className="size-[20px]" />
            {unreadCount > 0 && (
              <span
                className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-background"
                aria-hidden
              />
            )}
          </button>

          {open && (
            <div className="absolute right-0 z-50 mt-3 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-border bg-popover shadow-modal sm:w-96">
              <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-5 sm:px-6 sm:py-5">
                <span className="pt-0.5 text-sm font-semibold leading-tight text-[#1A1D18]">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllNotificationsRead()}
                    className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-emerald-600 underline-offset-2 transition-colors hover:bg-emerald-500/10 hover:underline"
                  >
                    <CheckCheck className="size-4 shrink-0" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
                {notifications.length === 0 ? (
                  <div className="px-2 py-16 text-center text-sm leading-relaxed text-[#74796F]">
                    No notifications
                  </div>
                ) : (
                  <ul className="flex flex-col gap-3 sm:gap-4">
                    {notifications.map((n) => {
                      const Icon = notificationIcons[n.type] ?? Info;
                      const color =
                        notificationColors[n.type] ?? "text-[#74796F]";

                      return (
                        <li key={n.id}>
                          <button
                            type="button"
                            onClick={() => {
                              if (!n.read) markNotificationRead(n.id);
                            }}
                            className={`w-full rounded-2xl px-5 py-4 text-left transition-colors hover:bg-[#F5F6F3] sm:py-5 ${
                              n.read ? "" : "bg-[#F5F6F3]/60"
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <Icon
                                className={`mt-1 size-[18px] shrink-0 ${color}`}
                                aria-hidden
                              />
                              <div className="min-w-0 flex-1 space-y-2">
                                <p
                                  className={`text-sm leading-relaxed ${
                                    n.read
                                      ? "text-[#74796F]"
                                      : "font-medium text-[#1A1D18]"
                                  }`}
                                >
                                  {n.message}
                                </p>
                                <p
                                  className="text-xs leading-relaxed text-[#74796F]"
                                  suppressHydrationWarning
                                >
                                  {formatDistanceToNow(n.timestamp, {
                                    addSuffix: true,
                                  })}
                                </p>
                              </div>
                              {!n.read && (
                                <span
                                  className="mt-2 size-2 shrink-0 rounded-full bg-emerald-500"
                                  aria-hidden
                                />
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
