import {
  Briefcase,
  CalendarRange,
  FileUser,
  GraduationCap,
  ListChecks,
  PenLine,
  Reply,
  Sparkles,
  Timer,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Briefcase,
  CalendarRange,
  FileUser,
  GraduationCap,
  ListChecks,
  PenLine,
  Reply,
  Sparkles,
  Timer,
  Wallet,
};

export function ToolIcon({ icon, hue, size = "md", className }: { icon: string; hue: number; size?: "sm" | "md" | "lg"; className?: string }) {
  const Icon = ICONS[icon] ?? Wrench;
  const dims = { sm: "size-8 rounded-[9px] [&_svg]:size-4", md: "size-10 rounded-[11px] [&_svg]:size-[18px]", lg: "size-14 rounded-[15px] [&_svg]:size-6" }[size];
  return (
    <span
      aria-hidden
      className={cn("inline-grid shrink-0 place-items-center border", dims, className)}
      style={{
        background: `linear-gradient(160deg, hsl(${hue} 80% 97%), hsl(${hue} 60% 92%))`,
        borderColor: `hsl(${hue} 40% 86%)`,
        color: `hsl(${hue} 45% 34%)`,
      }}
    >
      <Icon strokeWidth={1.75} />
    </span>
  );
}
