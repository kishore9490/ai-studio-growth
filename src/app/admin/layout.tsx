import { Suspense } from "react";
import { Shield } from "lucide-react";
import { DemoBanner } from "@/components/demo-banner";
import { ADMIN_NAV } from "@/components/app/nav-config";
import { Sidebar } from "@/components/app/sidebar";
import { TopBar } from "@/components/app/topbar";
import { Badge, Skeleton } from "@/components/ui/misc";
import { requireAdmin } from "@/lib/server/auth";

// The whole admin shell renders only after the server has confirmed the
// session belongs to an ADMIN (role read from the database). Non-admins get a
// 404 and never see admin navigation. Every page and server action re-checks.
async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="flex min-h-dvh">
      <Sidebar
        nav={ADMIN_NAV}
        homeHref="/admin"
        badge={
          <Badge tone="dark" icon={Shield}>
            Admin
          </Badge>
        }
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar nav={ADMIN_NAV} context="admin" />
        <main id="main" className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-dvh" aria-busy="true" aria-label="Loading admin">
      <div className="hidden w-[244px] shrink-0 border-r border-line p-4 md:block">
        <Skeleton className="h-7 w-32" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-40" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-10">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-8 h-40 w-full" />
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBanner />
      <Suspense fallback={<ShellSkeleton />}>
        <AdminGate>{children}</AdminGate>
      </Suspense>
    </>
  );
}
