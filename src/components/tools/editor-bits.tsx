"use client";

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Collapsible editor section used by the document builders. */
export function EditorSection({
  title,
  description,
  children,
  defaultOpen = true,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  action?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = `section-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <section className="rounded-[var(--radius-panel)] border border-line bg-surface">
      <div className="flex items-center gap-2 px-5 py-3.5">
        <button
          type="button"
          className="flex flex-1 items-center justify-between gap-3 text-left"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
        >
          <span>
            <span className="block text-[14.5px] font-semibold tracking-[-0.015em]">{title}</span>
            {description && <span className="block text-[12.5px] text-ink-3">{description}</span>}
          </span>
          <ChevronDown className={cn("size-4 shrink-0 text-ink-3 transition-transform", open && "rotate-180")} aria-hidden />
        </button>
        {action}
      </div>
      <div id={id} hidden={!open} className="border-t border-line px-5 pb-5 pt-4">
        {children}
      </div>
    </section>
  );
}

/** Move / remove controls for an item in a repeatable list. */
export function ItemControls({
  index,
  count,
  label,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  label: string;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <Button variant="ghost" size="icon-sm" aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => onMove(index, index - 1)}>
        <ChevronUp />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label={`Move ${label} down`} disabled={index === count - 1} onClick={() => onMove(index, index + 1)}>
        <ChevronDown />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label={`Remove ${label}`} onClick={onRemove} className="hover:text-danger">
        <Trash2 />
      </Button>
    </div>
  );
}

export function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function SavedLabel({ loaded }: { loaded: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-3" aria-live="polite">
      <span className={cn("size-1.5 rounded-full", loaded ? "bg-success" : "bg-line-strong")} aria-hidden />
      Saved in this browser
    </span>
  );
}
