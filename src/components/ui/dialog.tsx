"use client";

import { AlertDialog, Dialog as D } from "radix-ui";
import { X } from "lucide-react";
import { useState, useTransition, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button, type ButtonVariant } from "./button";

const overlay = "fixed inset-0 z-50 bg-[#191919]/30 backdrop-blur-[2px] data-[state=open]:animate-fade-in";
const content =
  "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-panel)] border border-line bg-surface p-6 shadow-float data-[state=open]:animate-fade-up focus:outline-none";

export function Dialog({
  trigger,
  title,
  description,
  children,
  open,
  onOpenChange,
  className,
}: {
  trigger?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <D.Trigger asChild>{trigger}</D.Trigger>}
      <D.Portal>
        <D.Overlay className={overlay} />
        <D.Content className={cn(content, className)}>
          <D.Title className="pr-8 text-[17px] font-semibold tracking-[-0.02em]">{title}</D.Title>
          {description ? (
            <D.Description className="mt-1.5 text-sm text-ink-2">{description}</D.Description>
          ) : (
            <D.Description className="sr-only">{typeof title === "string" ? title : "Dialog"}</D.Description>
          )}
          <div className="mt-5">{children}</div>
          <D.Close
            className="absolute right-4 top-4 grid size-8 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
            aria-label="Close"
          >
            <X className="size-4" />
          </D.Close>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

export const DialogClose = D.Close;

/**
 * Confirmation for destructive or irreversible actions. `onConfirm` may be
 * async (e.g. a server action); the dialog stays open with a pending state
 * until it settles.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  confirmVariant = "danger",
  onConfirm,
  children,
}: {
  trigger: ReactNode;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  confirmVariant?: ButtonVariant;
  onConfirm: () => void | Promise<unknown>;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <AlertDialog.Root open={open} onOpenChange={(o) => !pending && setOpen(o)}>
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={overlay} />
        <AlertDialog.Content className={content}>
          <AlertDialog.Title className="text-[17px] font-semibold tracking-[-0.02em]">{title}</AlertDialog.Title>
          <AlertDialog.Description className="mt-1.5 text-sm leading-relaxed text-ink-2">{description}</AlertDialog.Description>
          {children && <div className="mt-4">{children}</div>}
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary" disabled={pending}>
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <Button
              variant={confirmVariant}
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await onConfirm();
                  setOpen(false);
                })
              }
            >
              {pending ? "Working…" : confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
