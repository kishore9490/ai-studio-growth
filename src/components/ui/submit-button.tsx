"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";
import { Button } from "./button";

export function SubmitButton({
  children,
  pendingLabel,
  ...props
}: ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" {...props} disabled={pending || props.disabled} aria-disabled={pending}>
      {pending && <Loader2 className="animate-spin" />}
      {pending ? (pendingLabel ?? children) : children}
    </Button>
  );
}
