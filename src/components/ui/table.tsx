import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function TableWrap({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("overflow-x-auto rounded-[var(--radius-panel)] border border-line bg-surface", className)} {...props} />;
}

export function Table({ className, ...props }: ComponentProps<"table">) {
  return <table className={cn("w-full min-w-[640px] border-collapse text-left text-[13.5px]", className)} {...props} />;
}

export function THead({ className, ...props }: ComponentProps<"thead">) {
  return <thead className={cn("border-b border-line bg-[#fbfaf8] text-[12px] text-ink-3", className)} {...props} />;
}

export function TH({ className, ...props }: ComponentProps<"th">) {
  return <th scope="col" className={cn("whitespace-nowrap px-4 py-2.5 font-medium first:pl-5 last:pr-5", className)} {...props} />;
}

export function TR({ className, ...props }: ComponentProps<"tr">) {
  return <tr className={cn("border-b border-line last:border-0 transition-colors hover:bg-[#fcfbf9]", className)} {...props} />;
}

export function TD({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-4 py-3 align-middle first:pl-5 last:pr-5", className)} {...props} />;
}
