import type { Metadata } from "next";
import Link from "next/link";
import { PlanCards } from "@/components/membership/plan-cards";
import { ButtonLink } from "@/components/ui/button";
import { getPlans } from "@/lib/server/catalog";

export const metadata: Metadata = {
  title: "Membership",
  description: "Free forever, with optional Premium for the expanded library and premium tools.",
};

const FAQ = [
  {
    q: "Do I need Premium to use LifeOS?",
    a: "No. A free account includes selected tools, free resources, marketplace purchases and the optional affiliate programme. Premium is entirely optional.",
  },
  {
    q: "What's the difference between buying a product and Premium?",
    a: "A one-time purchase is yours to keep permanently. Premium gives access to Premium-included products, tools and resources while your membership is active.",
  },
  {
    q: "How does cancellation work?",
    a: "Cancel from the Membership page at any time. You keep Premium until the end of the period you've paid for, and you won't be charged again.",
  },
  {
    q: "Are these prices final?",
    a: "The prices shown are illustrative and configurable while the platform is in development. Any change will be shown clearly before you pay.",
  },
];

export default async function MembershipPage() {
  const plans = await getPlans();
  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-24 pt-14 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Membership</p>
        <h1 className="text-headline mt-3">
          Free to start. <span className="serif-accent">Premium if it helps.</span>
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-ink-2">
          Everything essential works on a free account. Premium adds the expanded library, premium tools and monthly releases —
          cancel any time.
        </p>
      </div>
      <div className="mt-14">
        <PlanCards
          plans={plans}
          renderAction={(plan) =>
            plan.interval === "NONE" ? (
              <ButtonLink href="/sign-up" variant="secondary" size="lg" className="w-full">
                Create free account
              </ButtonLink>
            ) : (
              <ButtonLink href="/app/membership" size="lg" className="w-full" variant={plan.code === "PREMIUM_MONTHLY" ? "primary" : "secondary"}>
                Choose {plan.name}
              </ButtonLink>
            )
          }
        />
      </div>

      <div className="mx-auto mt-24 grid grid-cols-1 max-w-[1000px] gap-12 md:grid-cols-[1fr_1.6fr]">
        <div>
          <h2 className="text-[28px] font-semibold tracking-[-0.03em]">Questions</h2>
          <p className="mt-2 text-[15px] text-ink-2">
            Something else? <Link href="/contact" className="underline underline-offset-4">Contact us</Link>.
          </p>
        </div>
        <dl className="divide-y divide-line border-y border-line">
          {FAQ.map((f) => (
            <div key={f.q} className="py-5">
              <dt className="text-[15.5px] font-medium">{f.q}</dt>
              <dd className="mt-2 text-[14.5px] leading-relaxed text-ink-2">{f.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
