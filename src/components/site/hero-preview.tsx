import { BookOpen, Check, Copy, Crown, LayoutDashboard, Library, PenLine, Search, ShoppingBag, Sparkles, Wrench } from "lucide-react";
import { ProductArt } from "@/components/product-art";

// A static, carefully composed preview of the real application: the Writing
// Workspace in the foreground, with the resource library and a marketplace
// product tucked alongside. Purely presentational (aria-hidden).

function SidebarIcon({ icon: Icon, active }: { icon: typeof PenLine; active?: boolean }) {
  return (
    <span
      className={
        active
          ? "grid size-8 place-items-center rounded-[9px] bg-surface text-ink shadow-soft ring-1 ring-line"
          : "grid size-8 place-items-center rounded-[9px] text-ink-3"
      }
    >
      <Icon className="size-4" strokeWidth={1.75} />
    </span>
  );
}

export function HeroPreview() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-[1080px] select-none">
      {/* App window */}
      <div className="relative overflow-hidden rounded-[22px] border border-line bg-surface shadow-float">
        <div className="flex h-11 items-center gap-2 border-b border-line bg-[#fbfaf8] px-4">
          <span className="size-2.5 rounded-full bg-[#e5e1d9]" />
          <span className="size-2.5 rounded-full bg-[#e5e1d9]" />
          <span className="size-2.5 rounded-full bg-[#e5e1d9]" />
          <div className="mx-auto flex h-6 items-center gap-1.5 rounded-md border border-line bg-surface px-3 text-[11px] text-ink-3">
            <span className="size-1.5 rounded-full bg-success" /> app.lifeos.digital/tools/writing
          </div>
        </div>

        <div className="grid grid-cols-[56px_1fr] md:grid-cols-[56px_1fr_300px]">
          {/* Rail */}
          <div className="flex flex-col items-center gap-2 border-r border-line bg-[#fbfaf8] py-4">
            <SidebarIcon icon={LayoutDashboard} />
            <SidebarIcon icon={Wrench} active />
            <SidebarIcon icon={ShoppingBag} />
            <SidebarIcon icon={Library} />
            <SidebarIcon icon={BookOpen} />
          </div>

          {/* Writing workspace */}
          <div className="min-w-0 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] text-ink-3">Digital Tools</p>
                <p className="text-[15px] font-semibold tracking-[-0.02em]">AI Writing Workspace</p>
              </div>
              <div className="hidden h-8 items-center gap-2 rounded-lg border border-line px-2.5 text-[11.5px] text-ink-3 sm:flex">
                <Search className="size-3.5" /> Search tools…
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {["Email", "LinkedIn post", "Summary", "Blog intro"].map((t, i) => (
                <span
                  key={t}
                  className={
                    i === 1
                      ? "rounded-full bg-ink px-2.5 py-1 text-[11.5px] font-medium text-white"
                      : "rounded-full border border-line px-2.5 py-1 text-[11.5px] text-ink-2"
                  }
                >
                  {t}
                </span>
              ))}
              <span className="ml-auto rounded-full bg-lavender px-2.5 py-1 text-[11.5px] font-medium text-accent-ink">Tone · Confident</span>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-[12px] border border-line bg-[#fcfbf9] p-3.5">
                <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-ink-3">Your notes</p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">
                  finished the client dashboard project · cut reporting time from 2 days to 3 hours · thank the team · open to new
                  projects in Jan
                </p>
              </div>
              <div className="relative rounded-[12px] border border-accent/25 bg-surface p-3.5 shadow-[0_0_0_4px_rgb(117_87_246/0.06)]">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-[0.08em] text-accent-ink">
                    <Sparkles className="size-3" /> Draft
                  </p>
                  <span className="flex items-center gap-1 rounded-md border border-line px-1.5 py-0.5 text-[10.5px] text-ink-3">
                    <Copy className="size-3" /> Copy
                  </span>
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-ink">
                  We just shipped a new reporting dashboard for a client — and cut their monthly reporting from two days to three
                  hours.
                </p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-ink">
                  Huge thanks to the team who made it happen. I&apos;m taking on new projects from January
                  <span className="ml-0.5 inline-block h-3.5 w-px translate-y-0.5 animate-pulse bg-accent" />
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-ink px-3 text-[12px] font-medium text-white">
                <PenLine className="size-3.5" /> Improve draft
              </span>
              <span className="inline-flex h-8 items-center rounded-lg border border-line px-3 text-[12px] text-ink-2">Shorter</span>
              <span className="hidden h-8 items-center rounded-lg border border-line px-3 text-[12px] text-ink-2 sm:inline-flex">
                More formal
              </span>
              <span className="ml-auto hidden text-[11px] text-ink-3 sm:block">86 words · 2 paragraphs</span>
            </div>
          </div>

          {/* Right column: library + marketplace */}
          <div className="hidden flex-col gap-4 border-l border-line bg-[#fbfaf8] p-5 md:flex">
            <div>
              <p className="text-[11px] font-medium text-ink-3">Continue reading</p>
              <ul className="mt-2.5 space-y-1.5">
                {[
                  { t: "The three-priority method", m: "Guide · 4 min", h: 40 },
                  { t: "Writing outcome bullets", m: "Guide · 5 min", h: 205 },
                  { t: "Batching a month of content", m: "Playbook · Premium", h: 330, p: true },
                ].map((r) => (
                  <li key={r.t} className="flex items-center gap-2.5 rounded-[10px] border border-line bg-surface p-2">
                    <span className="h-8 w-1 rounded-full" style={{ background: `hsl(${r.h} 65% 70%)` }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-medium">{r.t}</span>
                      <span className="flex items-center gap-1 text-[10.5px] text-ink-3">
                        {r.p && <Crown className="size-2.5 text-accent" />}
                        {r.m}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="overflow-hidden rounded-[12px] border border-line bg-surface">
              <ProductArt artwork="proposal" hue={22} className="aspect-[16/10] w-full" />
              <div className="p-3">
                <p className="text-[10.5px] text-ink-3">Business · Templates</p>
                <p className="text-[12.5px] font-semibold tracking-[-0.01em]">Business Proposal Templates</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[12.5px] font-medium">₹899</span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-success-soft px-1.5 py-0.5 text-[10.5px] font-medium text-success">
                    <Check className="size-3" /> In your library
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating detail: focus timer */}
      <div className="absolute -bottom-6 -left-3 hidden w-56 rounded-[16px] border border-line bg-surface p-3.5 shadow-lift sm:block lg:-left-10">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium text-ink-3">Focus session</p>
          <span className="rounded-full bg-warning-soft px-1.5 py-0.5 text-[10px] font-medium text-warning">2 of 3</span>
        </div>
        <p className="mt-1 font-mono text-[26px] font-medium tracking-[-0.04em] tabular-nums">18:42</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sunken">
          <div className="h-full w-[62%] rounded-full bg-accent" />
        </div>
        <p className="mt-2 truncate text-[11.5px] text-ink-2">Draft the Q4 proposal for Nimbus Studio</p>
      </div>
    </div>
  );
}
