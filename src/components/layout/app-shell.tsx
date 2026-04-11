"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";

const SIDEBAR_COLLAPSED_KEY = "disb-sidebar-collapsed";

interface AppShellProps {
  children: React.ReactNode;
  title: string;
}

export function AppShell({ children, title }: Readonly<AppShellProps>) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1") {
        setSidebarCollapsed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        SIDEBAR_COLLAPSED_KEY,
        sidebarCollapsed ? "1" : "0",
      );
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() =>
          setSidebarCollapsed((prev) => !prev)
        }
      />

      <div
        className={cn(
          "flex min-h-screen flex-col transition-[margin] duration-200 ease-out",
          sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[260px]",
        )}
      >
        <Header title={title} />

        <main className="flex-1 px-4 pt-6 pb-24 sm:px-6 sm:pt-8 sm:pb-24 lg:px-10 lg:pt-8 lg:pb-10">
          <div className="mx-auto w-full max-w-[1280px]">{children}</div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
