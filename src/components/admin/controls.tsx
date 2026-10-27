"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/form";

type Result = { ok: true; message?: string } | { ok: false; error: string };

export function useActionToast() {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<Result>, onDone?: (r: Result) => void) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        if (r.message) toast.success(r.message);
      } else toast.error(r.error);
      onDone?.(r);
    });
  return { pending, run };
}

/** A button that runs a server action and reports the result as a toast. */
export function ActionButton({
  action,
  children,
  variant = "secondary",
  size = "sm",
  confirm,
}: {
  action: () => Promise<Result>;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  confirm?: { title: string; description: ReactNode; confirmLabel?: string; confirmVariant?: ButtonVariant };
}) {
  const { pending, run } = useActionToast();
  if (confirm) {
    return (
      <ConfirmDialog
        trigger={
          <Button variant={variant} size={size} disabled={pending}>
            {children}
          </Button>
        }
        title={confirm.title}
        description={confirm.description}
        confirmLabel={confirm.confirmLabel}
        confirmVariant={confirm.confirmVariant ?? "danger"}
        onConfirm={async () => {
          const r = await action();
          if (r.ok) {
            if (r.message) toast.success(r.message);
          } else toast.error(r.error);
        }}
      />
    );
  }
  return (
    <Button variant={variant} size={size} disabled={pending} onClick={() => run(action)}>
      {pending && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}

/**
 * Dialog that requires (or optionally accepts) a written reason before
 * running a destructive or financial action.
 */
export function ReasonDialog({
  trigger,
  title,
  description,
  label = "Reason",
  placeholder,
  confirmLabel,
  confirmVariant = "danger",
  required = true,
  minLength = 5,
  action,
  children,
}: {
  trigger: ReactNode;
  title: string;
  description: ReactNode;
  label?: string;
  placeholder?: string;
  confirmLabel: string;
  confirmVariant?: ButtonVariant;
  required?: boolean;
  minLength?: number;
  action: (reason: string) => Promise<Result>;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fieldId = `reason-${title.replace(/\W+/g, "-").toLowerCase()}`;

  const submit = () => {
    if (required && reason.trim().length < minLength) {
      setError(`Please write at least ${minLength} characters.`);
      return;
    }
    start(async () => {
      const r = await action(reason.trim());
      if (r.ok) {
        if (r.message) toast.success(r.message);
        setOpen(false);
        setReason("");
        setError(null);
      } else setError(r.error);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!pending) {
          setOpen(o);
          if (!o) setError(null);
        }
      }}
      trigger={trigger}
      title={title}
      description={description}
    >
      {children}
      <Field label={label} htmlFor={fieldId} optional={!required} error={error}>
        <Textarea
          id={fieldId}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={placeholder}
          rows={3}
          maxLength={500}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
        />
      </Field>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </Button>
        <Button variant={confirmVariant} onClick={submit} disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {pending ? "Working…" : confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
