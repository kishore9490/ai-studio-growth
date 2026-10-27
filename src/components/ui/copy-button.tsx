"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button, type ButtonSize, type ButtonVariant } from "./button";

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers/contexts without the async clipboard API.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  variant = "secondary",
  size = "md",
  toastMessage,
  className,
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  toastMessage?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={!text}
      onClick={async () => {
        const ok = await copyText(text);
        if (ok) {
          setCopied(true);
          if (toastMessage) toast.success(toastMessage);
          setTimeout(() => setCopied(false), 1800);
        } else {
          toast.error("Couldn't copy automatically — select the text and copy it manually.");
        }
      }}
    >
      {copied ? <Check /> : <Copy />}
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </Button>
  );
}
