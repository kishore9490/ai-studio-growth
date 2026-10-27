import { DemoBanner } from "@/components/demo-banner";
import { APP_NAV } from "@/components/app/nav-config";
import { Sidebar } from "@/components/app/sidebar";
import { TopBar } from "@/components/app/topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBanner />
      <div className="flex min-h-dvh">
        <Sidebar nav={APP_NAV} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar nav={APP_NAV} />
          <main id="main" className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
