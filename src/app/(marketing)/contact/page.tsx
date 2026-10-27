import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Clock, Mail } from "lucide-react";
import { PageIntro } from "@/components/site/prose";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "Contact", description: "Get in touch with the LifeOS Digital team." };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
      <div className="grid grid-cols-1 gap-14 lg:grid-cols-[1fr_1.25fr]">
        <div>
          <PageIntro eyebrow="Contact" title="Talk to us." description="Questions about a purchase, your membership or the platform? Send a message and we'll reply by email." />
          <dl className="mt-12 space-y-7">
            {[
              { icon: Clock, t: "Response time", d: "We aim to reply within two working days." },
              { icon: BookOpen, t: "Quick answers", d: <>Many questions are answered in the <Link href="/help" className="text-ink underline underline-offset-[3px]">Help Centre</Link>.</> },
              { icon: Mail, t: "Account requests", d: "For privacy or deletion requests, write from the email address on your account." },
            ].map((x) => (
              <div key={x.t} className="flex gap-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-line bg-surface text-ink-2">
                  <x.icon className="size-4" strokeWidth={1.75} />
                </span>
                <div>
                  <dt className="text-[15px] font-semibold">{x.t}</dt>
                  <dd className="mt-0.5 text-[14.5px] text-ink-2">{x.d}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative lg:pt-8">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
