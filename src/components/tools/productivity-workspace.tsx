"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Pause, Play, RotateCcw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Label, Textarea } from "@/components/ui/form";
import { Panel } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import { SavedLabel } from "./editor-bits";
import { usePersistentState } from "./use-persistent-state";

type Priority = { text: string; done: boolean };
type Workspace = { priorities: Priority[]; notes: string; sessions: number; preset: number };

const EMPTY_PRIORITIES: Priority[] = [
  { text: "", done: false },
  { text: "", done: false },
  { text: "", done: false },
];
const INITIAL: Workspace = { priorities: EMPTY_PRIORITIES, notes: "", sessions: 0, preset: 25 };
const PRESETS = [
  { minutes: 25, label: "Focus 25" },
  { minutes: 50, label: "Deep 50" },
  { minutes: 5, label: "Break 5" },
];

function fmt(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function ProductivityWorkspace() {
  const [w, setW, loaded] = usePersistentState<Workspace>("lifeos.tool.productivity", INITIAL);
  // null = untouched, i.e. the full length of the current preset (derived, so it
  // stays correct when the stored preset loads after mount).
  const [left, setLeft] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const endAt = useRef<number | null>(null);

  const total = w.preset * 60;
  const remaining = left ?? total;
  const progress = total ? 1 - remaining / total : 0;

  // Tick against a wall-clock deadline so the timer stays accurate in background tabs.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const secs = Math.max(0, Math.round(((endAt.current ?? Date.now()) - Date.now()) / 1000));
      setLeft(secs);
      if (secs === 0) {
        clearInterval(id);
        setRunning(false);
        endAt.current = null;
        const isBreak = w.preset === 5;
        setAnnouncement(isBreak ? "Break finished. Ready for the next session." : "Focus session complete. Take a short break.");
        if (!isBreak) setW((s) => ({ ...s, sessions: s.sessions + 1 }));
      }
    }, 250);
    return () => clearInterval(id);
  }, [running, w.preset, setW]);

  useEffect(() => {
    document.title = running ? `${fmt(remaining)} · Focus` : "Productivity Workspace · LifeOS Digital";
  }, [running, remaining]);

  const start = () => {
    endAt.current = Date.now() + remaining * 1000;
    setRunning(true);
    setAnnouncement(`Timer started: ${Math.ceil(remaining / 60)} minutes.`);
  };
  const pause = () => {
    setRunning(false);
    endAt.current = null;
    setAnnouncement(`Paused at ${fmt(remaining)}.`);
  };
  const reset = () => {
    setRunning(false);
    endAt.current = null;
    setLeft(null);
  };
  const choosePreset = (minutes: number) => {
    setW((s) => ({ ...s, preset: minutes }));
    reset();
  };

  const setPriority = (i: number, patch: Partial<Priority>) =>
    setW((s) => ({ ...s, priorities: s.priorities.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) }));
  const done = w.priorities.filter((p) => p.text.trim() && p.done).length;
  const set = w.priorities.filter((p) => p.text.trim()).length;
  const circumference = 2 * Math.PI * 54;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SavedLabel loaded={loaded} />
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="sm">
              <RotateCcw /> New day
            </Button>
          }
          title="Start a new day?"
          description="This clears today's priorities, notes and session count from this browser."
          confirmLabel="Clear and start fresh"
          onConfirm={() => {
            setW((s) => ({ ...INITIAL, preset: s.preset }));
            reset();
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <Panel className="p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[15px] font-semibold tracking-[-0.015em]">Today&apos;s top three</h2>
              <span className="text-[12.5px] tabular-nums text-ink-3" aria-live="polite">
                {done}/{set || 3} done
              </span>
            </div>
            <p className="mt-1 text-[13px] text-ink-2">If you only finished three things today, which would matter most?</p>
            <ol className="mt-4 space-y-2">
              {w.priorities.map((p, i) => (
                <li key={i} className={cn("flex items-center gap-3 rounded-[12px] border px-3 py-2 transition-colors", p.done ? "border-line bg-sunken" : "border-line bg-surface")}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={p.done}
                    aria-label={`Mark priority ${i + 1} as done`}
                    disabled={!p.text.trim()}
                    onClick={() => setPriority(i, { done: !p.done })}
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-full border transition-colors disabled:opacity-40",
                      p.done ? "border-success bg-success text-white" : "border-line-strong hover:border-ink-3",
                    )}
                  >
                    {p.done && <Check className="size-3" />}
                  </button>
                  <label htmlFor={`priority-${i}`} className="sr-only">
                    Priority {i + 1}
                  </label>
                  <input
                    id={`priority-${i}`}
                    value={p.text}
                    maxLength={120}
                    onChange={(e) => setPriority(i, { text: e.target.value, done: e.target.value.trim() ? p.done : false })}
                    placeholder={["The one thing that moves a goal forward", "Something that removes stress", "A small, certain win"][i]}
                    className={cn("h-9 flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-ink-3", p.done && "text-ink-3 line-through")}
                  />
                </li>
              ))}
            </ol>
          </Panel>

          <Panel className="p-5">
            <Label htmlFor="notes" className="text-[15px] font-semibold tracking-[-0.015em]">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={w.notes}
              onChange={(e) => setW((s) => ({ ...s, notes: e.target.value }))}
              placeholder="Capture thoughts, links and follow-ups so they don't interrupt your focus…"
              rows={10}
              maxLength={10000}
              className="mt-3 border-none bg-sunken/60 focus:shadow-none"
            />
          </Panel>
        </div>

        <Panel className="flex flex-col items-center p-6 text-center">
          <div className="flex w-full items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-[15px] font-semibold tracking-[-0.015em]">
              <Timer className="size-4" /> Focus timer
            </h2>
            <span className="text-[12.5px] text-ink-3">
              {w.sessions} session{w.sessions === 1 ? "" : "s"} today
            </span>
          </div>
          <div className="mt-4 flex rounded-[10px] border border-line bg-surface p-0.5" role="group" aria-label="Timer length">
            {PRESETS.map((p) => (
              <button
                key={p.minutes}
                type="button"
                aria-pressed={w.preset === p.minutes}
                onClick={() => choosePreset(p.minutes)}
                disabled={running}
                className={cn(
                  "h-8 rounded-[8px] px-3 text-[13px] transition-colors disabled:opacity-50",
                  w.preset === p.minutes ? "bg-sunken font-medium text-ink" : "text-ink-2 hover:text-ink",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="relative mt-6 size-[220px]">
            <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
              <circle cx="60" cy="60" r="54" fill="none" stroke="var(--color-sunken)" strokeWidth="6" />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke={w.preset === 5 ? "var(--color-success)" : "var(--color-accent)"}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                className="transition-[stroke-dashoffset] duration-300"
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div>
                <p className="font-mono text-[46px] font-medium tabular-nums tracking-[-0.04em]" role="timer" aria-label={`${fmt(remaining)} remaining`}>
                  {fmt(remaining)}
                </p>
                <p className="text-[12.5px] text-ink-3">{running ? "In progress" : remaining === total ? "Ready" : "Paused"}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            {running ? (
              <Button onClick={pause} size="lg" variant="secondary">
                <Pause /> Pause
              </Button>
            ) : (
              <Button onClick={start} size="lg" disabled={remaining === 0}>
                <Play /> {remaining === total ? "Start" : "Resume"}
              </Button>
            )}
            <Button onClick={reset} size="lg" variant="ghost" disabled={remaining === total && !running}>
              <RotateCcw /> Reset
            </Button>
          </div>
          <p className="sr-only" aria-live="assertive">
            {announcement}
          </p>
          {announcement && !running && remaining === 0 && <p className="mt-4 text-[13px] text-success">{announcement}</p>}
        </Panel>
      </div>
    </div>
  );
}
