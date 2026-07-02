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
} from "lucide-react";
import { isNavActive } from "@/lib/nav";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/disbursements/new", label: "Pay", icon: Send },
  { href: "/recipients", label: "People", icon: Users },
  { href: "/schedule", label: "Plan", icon: Calendar },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 pb-[max(0px,env(safe-area-inset-bottom))] lg:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isNavActive(pathname, href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              }`}
            >
              <Icon className="size-[22px] shrink-0" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
