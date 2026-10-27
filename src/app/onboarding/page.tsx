import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/ui/logo";
import { Skeleton } from "@/components/ui/misc";
import { db } from "@/lib/core/db";
import { DEFAULT_WIDGETS } from "@/lib/preferences";
import { requireUser } from "@/lib/server/auth";
import { OnboardingFlow } from "./onboarding-flow";

export const metadata: Metadata = { title: "Welcome" };

async function Flow({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser("/onboarding");
  const [prefs, sp] = await Promise.all([db.userPreference.findUnique({ where: { userId: user.id } }), searchParams]);
  return (
    <OnboardingFlow
      firstName={user.name.split(" ")[0]}
      note={typeof sp.note === "string" ? sp.note.slice(0, 200) : undefined}
      initialInterests={prefs?.interests ?? []}
      initialWidgets={prefs?.dashboardWidgets.length ? prefs.dashboardWidgets : DEFAULT_WIDGETS}
    />
  );
}

export default function OnboardingPage(props: PageProps<"/onboarding">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-4 py-6 sm:px-10">
        <Logo />
      </header>
      <main id="main" className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:pt-12">
        <div className="w-full max-w-[640px]">
          <Suspense
            fallback={
              <div className="space-y-4">
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-10 w-72" />
                <Skeleton className="h-48 w-full" />
              </div>
            }
          >
            <Flow searchParams={props.searchParams} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
