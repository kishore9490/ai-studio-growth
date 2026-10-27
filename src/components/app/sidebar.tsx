"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import {
  Banknote,
  BarChart3,
  BookOpen,
  CircleDollarSign,
  Crown,
  FolderTree,
  LayoutDashboard,
  Library,
  Menu,
  Package,
  PanelLeft,
  Receipt,
  RotateCcw,
  ScrollText,
  Settings,
  Share2,
  ShoppingBag,
  SlidersHorizontal,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/ui/logo";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NavItem } from "./nav-config";

const ICONS: Record<string, LucideIcon> = {
  Banknote,
  BarChart3,
  BookOpen,
  CircleDollarSign,
  Crown,
  FolderTree,
  LayoutDashboard,
  Library,
  Package,
  Receipt,
  RotateCcw,
  ScrollText,
  Settings,
  Share2,
  ShoppingBag,
  SlidersHorizontal,
  Users,
  Wrench,
};

type Nav = { section?: string; items: NavItem[] }[];

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

// Collapsed state persists per browser. Read through useSyncExternalStore so the
// server render and first client render agree (expanded), then it settles.
const STORAGE_KEY = "lifeos.sidebar.collapsed";
const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function readCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}
function writeCollapsed(v: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
  } catch {
    /* storage unavailable: state just won't persist */
  }
  listeners.forEach((l) => l());
}

type NavListProps = { nav: Nav; collapsed?: boolean; onNavigate?: () => void };

// usePathname() is request data, so the active-state list renders inside a
// Suspense boundary; the fallback is the same list without highlighting.
function NavList(props: NavListProps) {
  return (
    <Suspense fallback={<NavListView {...props} pathname={null} />}>
      <ActiveNavList {...props} />
    </Suspense>
  );
}

function ActiveNavList(props: NavListProps) {
  return <NavListView {...props} pathname={usePathname()} />;
}

function NavListView({ nav, collapsed, onNavigate, pathname }: NavListProps & { pathname: string | null }) {
  return (
    <nav aria-label="Application" className="flex flex-col gap-5">
      {nav.map((group, gi) => (
        <div key={gi}>
          {group.section && !collapsed && <p className="mb-1.5 px-2.5 text-[11.5px] font-medium text-ink-3">{group.section}</p>}
          {group.section && collapsed && <div className="mx-auto mb-2 h-px w-6 bg-line" />}
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const Icon = ICONS[item.icon] ?? LayoutDashboard;
              const active = pathname !== null && isActive(pathname, item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "group flex h-9 items-center gap-2.5 rounded-[9px] px-2.5 text-[13.5px] transition-colors",
                      collapsed && "justify-center px-0",
                      active ? "bg-surface font-medium text-ink shadow-soft ring-1 ring-line" : "text-ink-2 hover:bg-sunken hover:text-ink",
                    )}
                  >
                    <Icon className={cn("size-[17px] shrink-0", active ? "text-ink" : "text-ink-3 group-hover:text-ink-2")} strokeWidth={1.75} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar({ nav, footer, homeHref = "/app", badge }: { nav: Nav; footer?: React.ReactNode; homeHref?: string; badge?: React.ReactNode }) {
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);
  return (
    <aside
      className={cn(
        "print-hidden sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-canvas transition-[width] duration-200 md:flex",
        collapsed ? "w-[68px]" : "w-[244px]",
      )}
    >
      <div className={cn("flex h-14 items-center", collapsed ? "justify-center" : "justify-between px-4")}>
        {collapsed ? (
          <Link href={homeHref} aria-label="Home">
            <LogoMark />
          </Link>
        ) : (
          <Logo href={homeHref} />
        )}
        {!collapsed && badge}
      </div>
      <div className={cn("flex-1 overflow-y-auto pb-4 pt-2", collapsed ? "px-3" : "px-3")}>
        <NavList nav={nav} collapsed={collapsed} />
      </div>
      {!collapsed && footer && <div className="px-3 pb-3">{footer}</div>}
      <div className={cn("border-t border-line p-3", collapsed && "flex justify-center")}>
        <button
          type="button"
          onClick={() => writeCollapsed(!collapsed)}
          className={cn(buttonClasses("ghost", "sm"), "w-full justify-start text-ink-3", collapsed && "w-auto justify-center")}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
        >
          <PanelLeft />
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}

export function MobileSidebar({ nav, footer, homeHref = "/app" }: { nav: Nav; footer?: React.ReactNode; homeHref?: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div className="md:hidden">
      <button type="button" className={buttonClasses("ghost", "icon-sm")} onClick={() => setOpen(true)} aria-label="Open navigation" aria-expanded={open}>
        <Menu />
      </button>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 animate-fade-in bg-ink/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[280px] animate-fade-in flex-col bg-canvas shadow-float">
            <div className="flex h-14 items-center justify-between px-4">
              <Logo href={homeHref} />
              <button type="button" className={buttonClasses("ghost", "icon-sm")} onClick={() => setOpen(false)} aria-label="Close navigation">
                <X />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2">
              <NavList nav={nav} onNavigate={() => setOpen(false)} />
            </div>
            {footer && <div className="p-3">{footer}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
