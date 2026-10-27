import { Suspense } from "react";
import { Logo } from "@/components/ui/logo";
import { getCurrentUser } from "@/lib/server/auth";
import { ButtonLink } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { MobileNav, NavLinks } from "./site-nav";

export const SITE_NAV = [
  { href: "/explore", label: "Explore" },
  { href: "/tools", label: "Digital Tools" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/membership", label: "Membership" },
  { href: "/how-it-works", label: "How It Works" },
];

async function HeaderAuth() {
  const user = await getCurrentUser();
  if (user) {
    return (
      <div className="flex items-center gap-2">
        <ButtonLink href="/app" variant="primary" size="sm" className="h-9 px-3.5">
          Open app
        </ButtonLink>
        <Avatar name={user.name} hue={user.avatarHue} size={32} />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <ButtonLink href="/sign-in" variant="ghost" size="sm" className="h-9 px-3 max-sm:hidden">
        Sign In
      </ButtonLink>
      <ButtonLink href="/sign-up" variant="primary" size="sm" className="h-9 px-3.5">
        Get Started
      </ButtonLink>
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/80 backdrop-blur-xl supports-[backdrop-filter]:bg-canvas/70">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-6 px-4 sm:px-6">
        <Logo />
        <NavLinks items={SITE_NAV} />
        <div className="ml-auto flex items-center gap-2">
          <Suspense fallback={<div className="h-9 w-40 max-sm:w-28" aria-hidden />}>
            <HeaderAuth />
          </Suspense>
          <MobileNav items={SITE_NAV} />
        </div>
      </div>
    </header>
  );
}
