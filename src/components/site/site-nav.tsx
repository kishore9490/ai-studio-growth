"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/button";

type Item = { href: string; label: string };

export function NavLinks({ items }: { items: Item[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden lg:block">
      <ul className="flex items-center gap-0.5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-[13.5px] transition-colors",
                  active ? "text-ink" : "text-ink-2 hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileNav({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // Close the sheet whenever the route changes. Tracking the previous path in
  // state (rather than an effect) avoids a cascading render.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className={buttonClasses("ghost", "icon")}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <X /> : <Menu />}
      </button>
      {open && (
        <div id="mobile-nav" className="fixed inset-x-0 bottom-0 top-16 z-40 animate-fade-in bg-canvas px-4 pb-8 pt-4">
          <nav aria-label="Mobile">
            <ul className="divide-y divide-line border-y border-line">
              {items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="flex items-center justify-between py-4 text-lg font-medium tracking-[-0.02em]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Link href="/sign-in" className={buttonClasses("secondary", "lg")}>
              Sign In
            </Link>
            <Link href="/sign-up" className={buttonClasses("primary", "lg")}>
              Get Started
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
