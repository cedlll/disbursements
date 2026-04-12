"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Send,
  Users,
  Calendar,
  History,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isNavActive } from "@/lib/nav";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/disbursements/new", label: "Disbursements", icon: Send },
  { href: "/recipients", label: "Recipients", icon: Users },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/history", label: "History", icon: History },
] as const;

const accountNav = [
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

function BrandMark({ className }: Readonly<{ className?: string }>) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[10px] border border-sidebar-border bg-sidebar-accent text-emerald-400/90",
        className,
      )}
      aria-hidden
    >
      <Banknote className="size-[19px]" strokeWidth={2.2} />
    </span>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  pathname,
  collapsed,
}: Readonly<{
  href: string;
  label: string;
  icon: (typeof mainNav)[number]["icon"];
  pathname: string | null;
  collapsed: boolean;
}>) {
  const active = isNavActive(pathname ?? "", href);

  const linkClass = cn(
    "flex items-center rounded-xl py-2.5 text-[13px] font-medium transition-colors outline-none ring-emerald-500/40 focus-visible:ring-2",
    collapsed
      ? "justify-center px-2"
      : "gap-3 px-3",
    active
      ? "bg-white/[0.08] text-white"
      : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200",
  );

  const icon = (
    <Icon
      className={cn(
        "size-[18px] shrink-0",
        active ? "text-emerald-400" : "text-slate-500",
      )}
      strokeWidth={active ? 2.25 : 1.75}
      aria-hidden
    />
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={<Link href={href} className={linkClass} aria-label={label} />}
        >
          {icon}
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link href={href} className={linkClass}>
      {icon}
      <span className="min-w-0 truncate">{label}</span>
    </Link>
  );
}

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function Sidebar({
  collapsed,
  onToggleCollapsed,
}: Readonly<SidebarProps>) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-20 hidden shrink-0 flex-col border-r border-sidebar bg-sidebar pb-6 pt-5 text-sidebar-foreground transition-[width,padding] duration-200 ease-out lg:flex",
        collapsed ? "w-[72px] px-2" : "w-[260px] px-4",
      )}
    >
      <div
        className={cn(
          "mb-6 flex items-center gap-2 px-1",
          collapsed && "flex-col",
        )}
      >
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  href="/dashboard"
                  className="flex shrink-0 items-center justify-center rounded-xl outline-none ring-emerald-500/40 transition-colors focus-visible:ring-2"
                  aria-label="DisbursePH — Dashboard"
                />
              }
            >
              <BrandMark className="size-9 shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              DisbursePH — Dashboard
            </TooltipContent>
          </Tooltip>
        ) : (
          <Link
            href="/dashboard"
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl outline-none ring-emerald-500/40 transition-colors focus-visible:ring-2"
            title="DisbursePH — Dashboard"
          >
            <BrandMark className="size-9 shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold tracking-tight text-white">
                DisbursePH
              </p>
              <p className="truncate text-[11px] text-slate-500">Merchant</p>
            </div>
          </Link>
        )}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white",
            collapsed ? "mt-1" : "ml-auto",
          )}
          aria-expanded={!collapsed}
          aria-controls="app-sidebar-nav"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronsRight className="size-[18px]" aria-hidden />
          ) : (
            <ChevronsLeft className="size-[18px]" aria-hidden />
          )}
        </button>
      </div>

      <nav
        id="app-sidebar-nav"
        className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overflow-x-hidden"
        aria-label="Main"
      >
        <div>
          <p
            className={cn(
              "mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500",
              collapsed && "sr-only",
            )}
          >
            Main menu
          </p>
          <div className="flex flex-col gap-0.5">
            {mainNav.map((item) => (
              <NavLink
                key={item.href}
                pathname={pathname}
                collapsed={collapsed}
                {...item}
              />
            ))}
          </div>
        </div>
        <div>
          <p
            className={cn(
              "mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500",
              collapsed && "sr-only",
            )}
          >
            Account
          </p>
          <div className="flex flex-col gap-0.5">
            {accountNav.map((item) => (
              <NavLink
                key={item.href}
                pathname={pathname}
                collapsed={collapsed}
                {...item}
              />
            ))}
          </div>
        </div>
      </nav>

      <div className="mt-4 border-t border-white/10 pt-4">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2 px-0 py-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <div
                    className="flex size-10 shrink-0 cursor-default items-center justify-center rounded-full bg-emerald-500 text-sm font-semibold text-emerald-950"
                    aria-label="Merchant, admin@merchant.ph"
                  />
                }
              >
                M
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                <span className="block font-semibold">Merchant</span>
                <span className="block text-xs font-normal text-white/75">
                  admin@merchant.ph
                </span>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                    aria-label="Log out"
                  />
                }
              >
                <LogOut className="size-4" aria-hidden />
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                Log out
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.04]">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-semibold text-emerald-950"
              aria-hidden
            >
              M
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                Merchant
              </p>
              <p className="truncate text-xs text-slate-500">admin@merchant.ph</p>
            </div>
            <button
              type="button"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="size-4" aria-hidden />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
