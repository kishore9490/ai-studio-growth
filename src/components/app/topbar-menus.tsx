"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Bell, Crown, LayoutDashboard, LogOut, Settings, Shield, ShoppingCart, UserRound } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { markNotificationsRead } from "@/actions/notifications";
import { Avatar } from "@/components/ui/misc";
import { buttonClasses } from "@/components/ui/button";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { cn, relativeTime } from "@/lib/utils";

export type NotificationItem = { id: string; title: string; body: string; href: string | null; readAt: string | null; createdAt: string };

export function NotificationsMenu({ items, unread }: { items: NotificationItem[]; unread: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Menu>
      <MenuTrigger asChild>
        <button
          type="button"
          className={cn(buttonClasses("ghost", "icon-sm"), "relative")}
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell />
          {unread > 0 && (
            <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-4 text-white ring-2 ring-canvas">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </MenuTrigger>
      <MenuContent className="w-[360px] max-w-[calc(100vw-24px)] p-0">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <button
              type="button"
              disabled={pending}
              onClick={() => start(() => markNotificationsRead())}
              className="text-[12.5px] text-ink-2 hover:text-ink disabled:opacity-50"
            >
              Mark all as read
            </button>
          )}
        </div>
        <div className="max-h-[380px] overflow-y-auto p-1.5">
          {items.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-ink-3">You&apos;re all caught up.</p>
          ) : (
            items.map((n) => (
              <MenuItem
                key={n.id}
                className="items-start gap-3 py-2.5"
                onSelect={() => {
                  if (!n.readAt) start(() => markNotificationsRead([n.id]));
                  if (n.href) router.push(n.href);
                }}
              >
                <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-accent")} aria-hidden />
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-medium text-ink">{n.title}</span>
                  <span className="block text-[12.5px] leading-snug text-ink-2">{n.body}</span>
                  <span className="mt-1 block text-[11.5px] text-ink-3">{relativeTime(n.createdAt)}</span>
                </span>
              </MenuItem>
            ))
          )}
        </div>
      </MenuContent>
    </Menu>
  );
}

export function CartButton({ count }: { count: number }) {
  return (
    <Link href="/app/cart" className={cn(buttonClasses("ghost", "icon-sm"), "relative")} aria-label={count ? `Cart, ${count} items` : "Cart"}>
      <ShoppingCart />
      {count > 0 && (
        <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-ink px-1 text-[10px] font-semibold leading-4 text-white ring-2 ring-canvas">
          {count}
        </span>
      )}
    </Link>
  );
}

export function UserMenu({
  user,
  isPremium,
  context = "app",
}: {
  user: { name: string; email: string; avatarHue: number; role: string };
  isPremium: boolean;
  context?: "app" | "admin";
}) {
  return (
    <Menu>
      <MenuTrigger asChild>
        <button type="button" className="rounded-full outline-offset-2" aria-label="Account menu">
          <Avatar name={user.name} hue={user.avatarHue} size={30} />
        </button>
      </MenuTrigger>
      <MenuContent className="w-64">
        <div className="flex items-center gap-3 px-2.5 py-2">
          <Avatar name={user.name} hue={user.avatarHue} size={36} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-ink-3">{user.email}</p>
          </div>
        </div>
        <div className="px-2.5 pb-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium",
              isPremium ? "bg-lavender text-accent-ink" : "bg-sunken text-ink-2",
            )}
          >
            {isPremium && <Crown className="size-3" />} {isPremium ? "Premium" : "Free plan"}
          </span>
        </div>
        <MenuSeparator />
        {context === "admin" ? (
          <MenuItem asChild>
            <Link href="/app">
              <LayoutDashboard /> Back to app
            </Link>
          </MenuItem>
        ) : (
          <>
            <MenuItem asChild>
              <Link href="/app/settings">
                <UserRound /> Profile & preferences
              </Link>
            </MenuItem>
            <MenuItem asChild>
              <Link href="/app/membership">
                <Crown /> Membership
              </Link>
            </MenuItem>
            <MenuItem asChild>
              <Link href="/app/settings#security">
                <Settings /> Account settings
              </Link>
            </MenuItem>
          </>
        )}
        {user.role === "ADMIN" && context === "app" && (
          <>
            <MenuSeparator />
            <MenuLabel>Administration</MenuLabel>
            <MenuItem asChild>
              <Link href="/admin">
                <Shield /> Admin dashboard
              </Link>
            </MenuItem>
          </>
        )}
        <MenuSeparator />
        <MenuItem onSelect={() => signOut()}>
          <LogOut /> Sign out
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
