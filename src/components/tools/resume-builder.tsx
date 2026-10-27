"use client";

import { Globe, Mail, MapPin, Phone, Plus, Printer, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/form";
import { EditorSection, ItemControls, SavedLabel, move } from "./editor-bits";
import { uid, usePersistentState } from "./use-persistent-state";

type Experience = { id: string; role: string; company: string; location: string; start: string; end: string; bullets: string };
type Education = { id: string; degree: string; school: string; year: string; detail: string };
type Resume = {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string;
};

const SAMPLE: Resume = {
  name: "Aditi Sharma",
  title: "Product Designer",
  email: "aditi.sharma@example.com",
  phone: "+91 98765 43210",
  location: "Bengaluru, India",
  website: "aditi.design",
  summary:
    "Product designer with five years of experience shipping consumer fintech and productivity apps. I turn research into clear, accessible interfaces and work closely with engineering to ship quickly.",
  experience: [
    {
      id: "e1",
      role: "Senior Product Designer",
      company: "Northwind Finance",
      location: "Bengaluru",
      start: "2023",
      end: "Present",
      bullets:
        "Redesigned onboarding, lifting completion from 48% to 71% in one quarter\nBuilt the first shared design system, adopted by 4 product teams\nMentored two junior designers through their first launches",
    },
    {
      id: "e2",
      role: "Product Designer",
      company: "Tasklane",
      location: "Remote",
      start: "2020",
      end: "2023",
      bullets: "Led design for the mobile app from beta to 200k monthly users\nRan fortnightly usability sessions with customers",
    },
  ],
  education: [{ id: "d1", degree: "B.Des, Interaction Design", school: "National Institute of Design", year: "2020", detail: "" }],
  skills: "Product strategy, User research, Figma, Prototyping, Design systems, Accessibility (WCAG), HTML & CSS",
};

const EMPTY: Resume = { name: "", title: "", email: "", phone: "", location: "", website: "", summary: "", experience: [], education: [], skills: "" };

const isEmail = (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export function ResumeBuilder() {
  const [r, setR, loaded] = usePersistentState<Resume>("lifeos.tool.resume", SAMPLE);
  const set = <K extends keyof Resume>(k: K, v: Resume[K]) => setR((s) => ({ ...s, [k]: v }));
  const setExp = (id: string, patch: Partial<Experience>) =>
    set("experience", r.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const setEdu = (id: string, patch: Partial<Education>) =>
    set("education", r.education.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const skills = r.skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const experience = r.experience.filter((e) => e.role.trim() || e.company.trim() || e.bullets.trim());
  const education = r.education.filter((e) => e.degree.trim() || e.school.trim());
  const emailError = isEmail(r.email) ? null : "Enter a valid email address.";

  return (
    <div className="grid grid-cols-1 gap-6 print:block xl:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
      {/* Editor */}
      <div className="print-hidden space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SavedLabel loaded={loaded} />
          <div className="flex gap-2">
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="sm">
                  <RotateCcw /> Start over
                </Button>
              }
              title="Clear this resume?"
              description="All fields will be emptied in this browser. You can't undo this."
              confirmLabel="Clear resume"
              onConfirm={() => setR(EMPTY)}
            />
            <Button size="sm" onClick={() => window.print()}>
              <Printer /> Print / Save PDF
            </Button>
          </div>
        </div>

        <EditorSection title="Personal details">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name" htmlFor="r-name">
              <Input id="r-name" value={r.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />
            </Field>
            <Field label="Headline" htmlFor="r-title">
              <Input id="r-title" value={r.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Data Analyst" />
            </Field>
            <Field label="Email" htmlFor="r-email" error={emailError}>
              <Input id="r-email" type="email" value={r.email} onChange={(e) => set("email", e.target.value)} aria-invalid={emailError ? true : undefined} />
            </Field>
            <Field label="Phone" htmlFor="r-phone">
              <Input id="r-phone" type="tel" value={r.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Location" htmlFor="r-location">
              <Input id="r-location" value={r.location} onChange={(e) => set("location", e.target.value)} placeholder="City, Country" />
            </Field>
            <Field label="Website / LinkedIn" htmlFor="r-web" optional>
              <Input id="r-web" value={r.website} onChange={(e) => set("website", e.target.value)} />
            </Field>
          </div>
          <Field label="Summary" htmlFor="r-summary" className="mt-3" hint={`${r.summary.length}/600 · two or three sentences`}>
            <Textarea id="r-summary" value={r.summary} maxLength={600} rows={4} onChange={(e) => set("summary", e.target.value)} />
          </Field>
        </EditorSection>

        <EditorSection title="Experience" description="Most recent first. One achievement per line.">
          <div className="space-y-4">
            {r.experience.length === 0 && <p className="text-[13px] text-ink-3">No roles yet. Add your most recent role first.</p>}
            {r.experience.map((e, i) => (
              <fieldset key={e.id} className="rounded-[12px] border border-line p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <legend className="text-[13px] font-medium">{e.role || `Role ${i + 1}`}</legend>
                  <ItemControls
                    index={i}
                    count={r.experience.length}
                    label={e.role || `role ${i + 1}`}
                    onMove={(a, b) => set("experience", move(r.experience, a, b))}
                    onRemove={() => set("experience", r.experience.filter((x) => x.id !== e.id))}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Job title" htmlFor={`${e.id}-role`}>
                    <Input id={`${e.id}-role`} value={e.role} onChange={(ev) => setExp(e.id, { role: ev.target.value })} />
                  </Field>
                  <Field label="Company" htmlFor={`${e.id}-company`}>
                    <Input id={`${e.id}-company`} value={e.company} onChange={(ev) => setExp(e.id, { company: ev.target.value })} />
                  </Field>
                  <Field label="Start" htmlFor={`${e.id}-start`}>
                    <Input id={`${e.id}-start`} value={e.start} placeholder="2022" onChange={(ev) => setExp(e.id, { start: ev.target.value })} />
                  </Field>
                  <Field label="End" htmlFor={`${e.id}-end`}>
                    <Input id={`${e.id}-end`} value={e.end} placeholder="Present" onChange={(ev) => setExp(e.id, { end: ev.target.value })} />
                  </Field>
                </div>
                <Field label="Location" htmlFor={`${e.id}-loc`} className="mt-3" optional>
                  <Input id={`${e.id}-loc`} value={e.location} onChange={(ev) => setExp(e.id, { location: ev.target.value })} />
                </Field>
                <Field label="Achievements" htmlFor={`${e.id}-bullets`} className="mt-3" hint="Action verb + what you did + result.">
                  <Textarea id={`${e.id}-bullets`} rows={4} value={e.bullets} onChange={(ev) => setExp(e.id, { bullets: ev.target.value })} />
                </Field>
              </fieldset>
            ))}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => set("experience", [...r.experience, { id: uid(), role: "", company: "", location: "", start: "", end: "", bullets: "" }])}
            >
              <Plus /> Add role
            </Button>
          </div>
        </EditorSection>

        <EditorSection title="Education">
          <div className="space-y-4">
            {r.education.map((e, i) => (
              <fieldset key={e.id} className="rounded-[12px] border border-line p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <legend className="text-[13px] font-medium">{e.degree || `Qualification ${i + 1}`}</legend>
                  <ItemControls
                    index={i}
                    count={r.education.length}
                    label={e.degree || `qualification ${i + 1}`}
                    onMove={(a, b) => set("education", move(r.education, a, b))}
                    onRemove={() => set("education", r.education.filter((x) => x.id !== e.id))}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_96px]">
                  <Field label="Degree / course" htmlFor={`${e.id}-degree`}>
                    <Input id={`${e.id}-degree`} value={e.degree} onChange={(ev) => setEdu(e.id, { degree: ev.target.value })} />
                  </Field>
                  <Field label="Year" htmlFor={`${e.id}-year`}>
                    <Input id={`${e.id}-year`} value={e.year} inputMode="numeric" onChange={(ev) => setEdu(e.id, { year: ev.target.value })} />
                  </Field>
                </div>
                <Field label="Institution" htmlFor={`${e.id}-school`} className="mt-3">
                  <Input id={`${e.id}-school`} value={e.school} onChange={(ev) => setEdu(e.id, { school: ev.target.value })} />
                </Field>
                <Field label="Details" htmlFor={`${e.id}-detail`} className="mt-3" optional>
                  <Input id={`${e.id}-detail`} value={e.detail} placeholder="e.g. First class, 8.6 CGPA" onChange={(ev) => setEdu(e.id, { detail: ev.target.value })} />
                </Field>
              </fieldset>
            ))}
            <Button variant="secondary" size="sm" onClick={() => set("education", [...r.education, { id: uid(), degree: "", school: "", year: "", detail: "" }])}>
              <Plus /> Add qualification
            </Button>
          </div>
        </EditorSection>

        <EditorSection title="Skills">
          <Field label="Skills" htmlFor="r-skills" hint="Separate with commas. List only what you'd happily discuss in an interview.">
            <Textarea id="r-skills" rows={3} value={r.skills} onChange={(e) => set("skills", e.target.value)} />
          </Field>
        </EditorSection>
      </div>

      {/* Preview */}
      <div className="print-area xl:sticky xl:top-20 xl:self-start">
        <p className="print-hidden mb-2 text-[12.5px] text-ink-3">Live preview · A4</p>
        <article
          aria-label="Resume preview"
          className="print-document mx-auto aspect-[1/1.414] w-full max-w-[720px] rounded-[6px] border border-line bg-white px-[7%] py-[6%] text-[#1f1f1f] shadow-lift print:aspect-auto"
        >
          <header className="border-b border-[#e6e2da] pb-4">
            <h2 className="text-[clamp(20px,3vw,28px)] font-semibold tracking-[-0.03em]">{r.name || "Your name"}</h2>
            {r.title && <p className="mt-0.5 text-[clamp(12px,1.6vw,15px)] text-[#5f5b55]">{r.title}</p>}
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[clamp(9.5px,1.2vw,11.5px)] text-[#5f5b55]">
              {r.email && (
                <li className="flex items-center gap-1">
                  <Mail className="size-3" aria-hidden /> {r.email}
                </li>
              )}
              {r.phone && (
                <li className="flex items-center gap-1">
                  <Phone className="size-3" aria-hidden /> {r.phone}
                </li>
              )}
              {r.location && (
                <li className="flex items-center gap-1">
                  <MapPin className="size-3" aria-hidden /> {r.location}
                </li>
              )}
              {r.website && (
                <li className="flex items-center gap-1">
                  <Globe className="size-3" aria-hidden /> {r.website}
                </li>
              )}
            </ul>
          </header>

          <div className="space-y-5 pt-4 text-[clamp(10px,1.25vw,12.5px)] leading-relaxed">
            {r.summary && <p className="text-[#3a3834]">{r.summary}</p>}

            {experience.length > 0 && (
              <section>
                <h3 className="mb-2 text-[0.82em] font-semibold uppercase tracking-[0.12em] text-[#5f42e6]">Experience</h3>
                <div className="space-y-3">
                  {experience.map((e) => (
                    <div key={e.id} className="break-inside-avoid">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="font-semibold">
                          {e.role || "Role"}
                          {e.company && <span className="font-normal text-[#5f5b55]"> · {e.company}</span>}
                        </p>
                        <p className="shrink-0 text-[0.9em] tabular-nums text-[#8f8a82]">
                          {[e.start, e.end].filter(Boolean).join(" – ")}
                        </p>
                      </div>
                      {e.location && <p className="text-[0.9em] text-[#8f8a82]">{e.location}</p>}
                      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[#3a3834] marker:text-[#c9c3b8]">
                        {e.bullets
                          .split("\n")
                          .map((b) => b.replace(/^[-•*]\s*/, "").trim())
                          .filter(Boolean)
                          .map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {education.length > 0 && (
              <section>
                <h3 className="mb-2 text-[0.82em] font-semibold uppercase tracking-[0.12em] text-[#5f42e6]">Education</h3>
                <div className="space-y-2">
                  {education.map((e) => (
                    <div key={e.id} className="flex items-baseline justify-between gap-3 break-inside-avoid">
                      <div>
                        <p className="font-semibold">{e.degree || "Qualification"}</p>
                        <p className="text-[#5f5b55]">
                          {e.school}
                          {e.detail && ` · ${e.detail}`}
                        </p>
                      </div>
                      <p className="shrink-0 tabular-nums text-[#8f8a82]">{e.year}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {skills.length > 0 && (
              <section>
                <h3 className="mb-2 text-[0.82em] font-semibold uppercase tracking-[0.12em] text-[#5f42e6]">Skills</h3>
                <p className="text-[#3a3834]">{skills.join(" · ")}</p>
              </section>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
