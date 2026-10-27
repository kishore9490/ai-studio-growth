import { Suspense } from "react";
import { db } from "@/lib/core/db";
import { getMembership } from "@/lib/core/membership";
import { getCurrentUser } from "@/lib/server/auth";
import { CommandPalette } from "./command-palette";
import { MobileSidebar } from "./sidebar";
import { CartButton, NotificationsMenu, UserMenu } from "./topbar-menus";
import type { NavItem } from "./nav-config";

async function AccountCluster({ context }: { context: "app" | "admin" }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const [notifications, unread, cartCount, membership] = await Promise.all([
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 12 }),
    db.notification.count({ where: { userId: user.id, readAt: null } }),
    db.cartItem.count({ where: { userId: user.id } }),
    getMembership(user.id),
  ]);
  return (
    <div className="flex items-center gap-1">
      {context === "app" && <CartButton count={cartCount} />}
      <NotificationsMenu
        unread={unread}
        items={notifications.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          href: n.href,
          readAt: n.readAt?.toISOString() ?? null,
          createdAt: n.createdAt.toISOString(),
        }))}
      />
      <div className="ml-1.5">
        <UserMenu
          context={context}
          isPremium={membership.isPremium}
          user={{ name: user.name, email: user.email, avatarHue: user.avatarHue, role: user.role }}
        />
      </div>
    </div>
  );
}

export function TopBar({
  nav,
  context = "app",
  mobileFooter,
}: {
  nav: { section?: string; items: NavItem[] }[];
  context?: "app" | "admin";
  mobileFooter?: React.ReactNode;
}) {
  return (
    <header className="print-hidden sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur-xl sm:px-6">
      <MobileSidebar nav={nav} footer={mobileFooter} homeHref={context === "admin" ? "/admin" : "/app"} />
      <div className="min-w-0 flex-1">
        <CommandPalette scope={context} />
      </div>
      <Suspense fallback={<div className="h-8 w-32" aria-hidden />}>
        <AccountCluster context={context} />
      </Suspense>
    </header>
  );
}
