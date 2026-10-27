import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "accent" | "secondary" | "ghost" | "danger" | "link";
export type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium select-none transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 active:translate-y-px [&_svg]:shrink-0";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ink text-white hover:bg-[#2b2b2b] shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]",
  accent:
    "bg-accent text-white hover:bg-accent-strong shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_1px_2px_rgb(74_50_184/0.25)]",
  secondary: "bg-surface text-ink border border-line hover:border-line-strong hover:bg-[#fcfbf9] shadow-soft",
  ghost: "text-ink-2 hover:text-ink hover:bg-sunken",
  danger: "bg-danger text-white hover:bg-[#99372a]",
  link: "text-accent-ink underline-offset-4 hover:underline px-0! h-auto!",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] rounded-[8px] [&_svg]:size-3.5",
  md: "h-10 px-4 text-sm rounded-[var(--radius-control)] [&_svg]:size-4",
  lg: "h-12 px-5 text-[15px] rounded-[12px] [&_svg]:size-4",
  icon: "size-10 rounded-[var(--radius-control)] [&_svg]:size-[18px]",
  "icon-sm": "size-8 rounded-[8px] [&_svg]:size-4",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize };

export function Button({ variant = "primary", size = "md", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize };

export function ButtonLink({ variant = "primary", size = "md", className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
