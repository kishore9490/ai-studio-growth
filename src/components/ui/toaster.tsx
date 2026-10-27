"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "!rounded-[14px] !border !border-line !bg-surface !text-ink !shadow-float !font-sans !text-sm !gap-2.5",
          description: "!text-ink-2",
          actionButton: "!bg-ink !text-white !rounded-lg",
          success: "[&_[data-icon]]:!text-success",
          error: "[&_[data-icon]]:!text-danger",
        },
      }}
    />
  );
}
