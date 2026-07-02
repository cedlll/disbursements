"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Bell,
  CheckCheck,
  AlertCircle,
  Info,
  CheckCircle2,
  AlertTriangle,
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
  success: "text-primary",
  info: "text-chart-3",
  warning: "text-chart-4",
  error: "text-destructive",
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
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        <h1 className="font-display truncate text-balance text-xl font-semibold text-foreground sm:text-[22px]">
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
                      online ? "bg-primary" : "bg-muted-foreground/55"
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
                        online ? "bg-sidebar-primary" : "bg-white/45"
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
            className="flex size-9 items-center justify-center rounded-full border-2 border-dashed border-border bg-background text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            aria-label="Invite team member"
            title="Invite"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <section
          className="hidden flex-col items-end border-r border-border pr-3 leading-tight sm:flex sm:pr-4"
          aria-label="Available for disbursement"
          title="Available for disbursement"
        >
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Available
          </span>
          <span className="text-[13px] font-semibold tabular-nums text-foreground">
            {formatPHP(balance.available)}
          </span>
        </section>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="relative flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
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
            <div className="absolute right-0 z-40 mt-3 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-border bg-popover shadow-modal sm:w-96">
              <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-5 sm:px-6 sm:py-5">
                <span className="pt-0.5 text-sm font-semibold leading-tight text-foreground">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllNotificationsRead()}
                    className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-primary underline-offset-2 transition-colors hover:bg-primary/10 hover:underline"
                  >
                    <CheckCheck className="size-4 shrink-0" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
                {notifications.length === 0 ? (
                  <div className="px-2 py-16 text-center text-sm leading-relaxed text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  <ul className="flex flex-col gap-3 sm:gap-4">
                    {notifications.map((n) => {
                      const Icon = notificationIcons[n.type] ?? Info;
                      const color =
                        notificationColors[n.type] ?? "text-muted-foreground";

                      return (
                        <li key={n.id}>
                          <button
                            type="button"
                            onClick={() => {
                              if (!n.read) markNotificationRead(n.id);
                            }}
                            className={`w-full rounded-lg px-5 py-4 text-left transition-colors hover:bg-muted sm:py-5 ${
                              n.read ? "" : "bg-muted/60"
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
                                      ? "text-muted-foreground"
                                      : "font-medium text-foreground"
                                  }`}
                                >
                                  {n.message}
                                </p>
                                <p
                                  className="text-xs leading-relaxed text-muted-foreground"
                                  suppressHydrationWarning
                                >
                                  {formatDistanceToNow(n.timestamp, {
                                    addSuffix: true,
                                  })}
                                </p>
                              </div>
                              {!n.read && (
                                <span
                                  className="mt-2 size-2 shrink-0 rounded-full bg-primary"
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
