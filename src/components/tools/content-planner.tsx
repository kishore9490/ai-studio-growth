"use client";

import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { SavedLabel } from "./editor-bits";
import { uid, usePersistentState } from "./use-persistent-state";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const CHANNELS = ["Instagram", "LinkedIn", "YouTube", "Newsletter", "Blog", "X"] as const;
const STATUSES = [
  { key: "idea", label: "Idea", cls: "bg-sunken text-ink-2" },
  { key: "draft", label: "Draft", cls: "bg-warning-soft text-warning" },
  { key: "scheduled", label: "Scheduled", cls: "bg-lavender text-accent-ink" },
  { key: "published", label: "Published", cls: "bg-success-soft text-success" },
] as const;
type Channel = (typeof CHANNELS)[number];
type Status = (typeof STATUSES)[number]["key"];
type Post = { id: string; title: string; channel: Channel; status: Status; day: number; notes: string };
type Planner = { posts: Post[] };

const CHANNEL_HUE: Record<Channel, number> = { Instagram: 330, LinkedIn: 210, YouTube: 10, Newsletter: 40, Blog: 150, X: 250 };

const SAMPLE: Planner = {
  posts: [
    { id: "p1", title: "3 mistakes beginners make with budgets", channel: "Instagram", status: "scheduled", day: 0, notes: "Carousel, 6 slides" },
    { id: "p2", title: "What I learned from my first client", channel: "LinkedIn", status: "draft", day: 1, notes: "" },
    { id: "p3", title: "Weekly planning routine (Short)", channel: "YouTube", status: "idea", day: 2, notes: "Film at desk, 45s" },
    { id: "p4", title: "Five links worth your time", channel: "Newsletter", status: "idea", day: 3, notes: "" },
    { id: "p5", title: "Behind the scenes: studio tour", channel: "Instagram", status: "published", day: 4, notes: "" },
  ],
};

type Draft = Omit<Post, "id"> & { id?: string };
const blank = (day = 0): Draft => ({ title: "", channel: "Instagram", status: "idea", day, notes: "" });

function PostForm({ initial, onSave, onCancel }: { initial: Draft; onSave: (d: Draft) => void; onCancel: () => void }) {
  const [d, setD] = useState<Draft>(initial);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!d.title.trim()) {
          setError("Give the post a working title.");
          return;
        }
        onSave({ ...d, title: d.title.trim().slice(0, 140) });
      }}
      noValidate
    >
      <Field label="Title" htmlFor="post-title" error={error}>
        <Input id="post-title" autoFocus value={d.title} maxLength={140} aria-invalid={error ? true : undefined} onChange={(e) => setD({ ...d, title: e.target.value })} />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Channel" htmlFor="post-channel">
          <Select id="post-channel" value={d.channel} onChange={(e) => setD({ ...d, channel: e.target.value as Channel })}>
            {CHANNELS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Day" htmlFor="post-day">
          <Select id="post-day" value={d.day} onChange={(e) => setD({ ...d, day: Number(e.target.value) })}>
            {DAYS.map((day, i) => (
              <option key={day} value={i}>
                {day}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status" htmlFor="post-status">
          <Select id="post-status" value={d.status} onChange={(e) => setD({ ...d, status: e.target.value as Status })}>
            {STATUSES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Notes" htmlFor="post-notes" optional>
        <Textarea id="post-notes" rows={3} value={d.notes} maxLength={500} onChange={(e) => setD({ ...d, notes: e.target.value })} />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initial.id ? "Save changes" : "Add post"}</Button>
      </div>
    </form>
  );
}

export function ContentPlanner() {
  const [state, setState, loaded] = usePersistentState<Planner>("lifeos.tool.content-planner", SAMPLE);
  const [filter, setFilter] = useState<Channel | "all">("all");
  const [editing, setEditing] = useState<Draft | null>(null);
  const posts = state.posts;
  const setPosts = (fn: (p: Post[]) => Post[]) => setState((s) => ({ posts: fn(s.posts) }));
  const update = (id: string, patch: Partial<Post>) => setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const visible = filter === "all" ? posts : posts.filter((p) => p.channel === filter);
  const counts = STATUSES.map((s) => ({ ...s, n: posts.filter((p) => p.status === s.key).length }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <SavedLabel loaded={loaded} />
          <span className="flex flex-wrap gap-1.5 text-[12px]">
            {counts.map((c) => (
              <span key={c.key} className={cn("rounded-full px-2 py-0.5 font-medium", c.cls)}>
                {c.n} {c.label.toLowerCase()}
              </span>
            ))}
          </span>
        </div>
        <div className="flex gap-2">
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="sm" disabled={posts.length === 0}>
                <RotateCcw /> Clear week
              </Button>
            }
            title="Clear the whole week?"
            description={`This removes all ${posts.length} posts from this browser.`}
            confirmLabel="Clear week"
            onConfirm={() => setPosts(() => [])}
          />
          <Button size="sm" onClick={() => setEditing(blank())}>
            <Plus /> New post
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by channel">
        {(["all", ...CHANNELS] as const).map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={filter === c}
            onClick={() => setFilter(c)}
            className={cn(
              "h-8 rounded-full border px-3 text-[13px] transition-colors",
              filter === c ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink",
            )}
          >
            {c === "all" ? "All channels" : c}
          </button>
        ))}
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <div className="grid min-w-[980px] grid-cols-7 gap-3">
          {DAYS.map((day, di) => {
            const items = visible.filter((p) => p.day === di);
            return (
              <section key={day} aria-label={day} className="flex min-h-[340px] flex-col rounded-[14px] border border-line bg-[#fbfaf8] p-2">
                <div className="flex items-center justify-between px-1.5 py-1">
                  <h2 className="text-[13px] font-semibold">{day}</h2>
                  <span className="text-[11.5px] tabular-nums text-ink-3">{items.length}</span>
                </div>
                <ul className="mt-1 flex flex-1 flex-col gap-2">
                  {items.map((p) => {
                    const status = STATUSES.find((s) => s.key === p.status)!;
                    const nextStatus = STATUSES[STATUSES.findIndex((s) => s.key === p.status) + 1];
                    return (
                      <li key={p.id} className="group rounded-[11px] border border-line bg-surface p-2.5 shadow-soft">
                        <div className="flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full" style={{ background: `hsl(${CHANNEL_HUE[p.channel]} 60% 55%)` }} aria-hidden />
                          <span className="text-[11px] text-ink-3">{p.channel}</span>
                        </div>
                        <p className="mt-1 text-[13px] font-medium leading-snug">{p.title}</p>
                        {p.notes && <p className="mt-1 line-clamp-2 text-[11.5px] text-ink-3">{p.notes}</p>}
                        <div className="mt-2 flex items-center justify-between gap-1">
                          <button
                            type="button"
                            disabled={!nextStatus}
                            onClick={() => nextStatus && update(p.id, { status: nextStatus.key })}
                            className={cn("inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-medium transition-opacity disabled:cursor-default", status.cls, nextStatus && "hover:opacity-80")}
                            aria-label={nextStatus ? `${status.label}. Move "${p.title}" to ${nextStatus.label}` : `${status.label}`}
                            title={nextStatus ? `Move to ${nextStatus.label}` : undefined}
                          >
                            {status.label}
                            {nextStatus && <ArrowRight className="size-3" aria-hidden />}
                          </button>
                        </div>
                        <div className="mt-2 flex items-center justify-between border-t border-line pt-1.5 opacity-70 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                          <div className="flex">
                            <Button variant="ghost" size="icon-sm" className="size-7" aria-label={`Move "${p.title}" to previous day`} disabled={p.day === 0} onClick={() => update(p.id, { day: p.day - 1 })}>
                              <ChevronLeft />
                            </Button>
                            <Button variant="ghost" size="icon-sm" className="size-7" aria-label={`Move "${p.title}" to next day`} disabled={p.day === 6} onClick={() => update(p.id, { day: p.day + 1 })}>
                              <ChevronRight />
                            </Button>
                          </div>
                          <div className="flex">
                            <Button variant="ghost" size="icon-sm" className="size-7" aria-label={`Edit "${p.title}"`} onClick={() => setEditing(p)}>
                              <Pencil />
                            </Button>
                            <ConfirmDialog
                              trigger={
                                <Button variant="ghost" size="icon-sm" className="size-7 hover:text-danger" aria-label={`Delete "${p.title}"`}>
                                  <Trash2 />
                                </Button>
                              }
                              title="Delete this post?"
                              description={`“${p.title}” will be removed from your planner.`}
                              confirmLabel="Delete"
                              onConfirm={() => setPosts((ps) => ps.filter((x) => x.id !== p.id))}
                            />
                          </div>
                        </div>
                      </li>
                    );
                  })}
                  <li className="mt-auto">
                    <button
                      type="button"
                      onClick={() => setEditing({ ...blank(di), channel: filter === "all" ? "Instagram" : filter })}
                      className="flex w-full items-center justify-center gap-1 rounded-[10px] border border-dashed border-line-strong py-2 text-[12px] text-ink-3 transition-colors hover:border-ink-3 hover:text-ink"
                      aria-label={`Add post on ${day}`}
                    >
                      <Plus className="size-3.5" /> Add
                    </button>
                  </li>
                </ul>
              </section>
            );
          })}
        </div>
      </div>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} title={editing?.id ? "Edit post" : "New post"} className="max-w-lg">
        {editing && (
          <PostForm
            key={editing.id ?? "new"}
            initial={editing}
            onCancel={() => setEditing(null)}
            onSave={(d) => {
              if (d.id) update(d.id, d);
              else setPosts((ps) => [...ps, { ...d, id: uid() }]);
              setEditing(null);
            }}
          />
        )}
      </Dialog>
    </div>
  );
}
