// Registry of interactive tools. Tools are product features (code), so they
// live here rather than in the database.

export type ToolCategory = {
  slug: string;
  name: string;
  description: string;
};

export const TOOL_CATEGORIES: ToolCategory[] = [
  { slug: "writing", name: "Writing & Communication", description: "Draft, rewrite and polish everyday writing." },
  { slug: "career", name: "Career & Learning", description: "Present your experience and plan your growth." },
  { slug: "business", name: "Business & Marketing", description: "Win clients and plan what you publish." },
  { slug: "productivity", name: "Productivity", description: "Plan the day and protect your focus." },
  { slug: "organisation", name: "Personal Organisation", description: "Money, admin and the rest of life." },
  { slug: "ai", name: "AI Workflows", description: "Repeatable workflows built on the writing engine." },
];

export type ToolAccess = "free" | "premium";
export type ToolStatus = "available" | "planned";

export type Tool = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  access: ToolAccess;
  status: ToolStatus;
  icon: string; // lucide icon name, resolved in components/tool-icon.tsx
  hue: number;
  highlights: string[];
  /** Optional deep link into another tool (used by preset workflows). */
  opens?: string;
};

export const TOOLS: Tool[] = [
  {
    slug: "ai-writing-workspace",
    name: "AI Writing Workspace",
    tagline: "Draft and refine emails, posts and summaries.",
    description:
      "Pick a format and tone, paste your notes, and get an editable draft you can refine and copy. Uses Claude when an API key is configured; otherwise a clearly labelled local rewrite mode.",
    category: "writing",
    access: "free",
    status: "available",
    icon: "PenLine",
    hue: 258,
    highlights: ["Six content formats", "Five tones", "Editable output with copy"],
  },
  {
    slug: "resume-builder",
    name: "Resume Builder",
    tagline: "A clean, ATS-friendly resume with live preview.",
    description:
      "Fill in your details, experience, education and skills, and watch a print-ready resume update as you type. Save to PDF from your browser's print dialog.",
    category: "career",
    access: "free",
    status: "available",
    icon: "FileUser",
    hue: 200,
    highlights: ["Live preview", "Reorderable sections", "Print & save as PDF"],
  },
  {
    slug: "proposal-builder",
    name: "Business Proposal Builder",
    tagline: "Professional proposals with pricing and timeline.",
    description:
      "Describe the project, list deliverables and line-item pricing, set milestones, and produce a formatted proposal ready to send as a PDF.",
    category: "business",
    access: "premium",
    status: "available",
    icon: "Briefcase",
    hue: 28,
    highlights: ["Line-item pricing with tax", "Milestone timeline", "Print-ready layout"],
  },
  {
    slug: "budget-planner",
    name: "Personal Budget Planner",
    tagline: "See where your money goes each month.",
    description:
      "List income and expenses by category, set a savings goal, and see your monthly surplus and spending breakdown at a glance.",
    category: "organisation",
    access: "free",
    status: "available",
    icon: "Wallet",
    hue: 150,
    highlights: ["Category breakdown", "Savings goal tracking", "Saved in your browser"],
  },
  {
    slug: "content-planner",
    name: "Content Planner",
    tagline: "Plan a week of posts across channels.",
    description:
      "Lay out ideas across a weekly board, assign channels, move posts from idea to published, and keep your publishing rhythm consistent.",
    category: "business",
    access: "premium",
    status: "available",
    icon: "CalendarRange",
    hue: 320,
    highlights: ["Weekly board", "Channel tags", "Idea → draft → scheduled → published"],
  },
  {
    slug: "productivity-workspace",
    name: "Productivity Workspace",
    tagline: "Today's priorities, a focus timer and notes.",
    description:
      "Choose up to three priorities, work in focused sessions with a built-in timer, and capture notes in one calm space.",
    category: "productivity",
    access: "free",
    status: "available",
    icon: "Timer",
    hue: 40,
    highlights: ["Top-three priorities", "Focus timer", "Scratchpad notes"],
  },
  {
    slug: "email-reply-assistant",
    name: "Email Reply Assistant",
    tagline: "Turn rough notes into a courteous reply.",
    description:
      "A preset workflow that opens the AI Writing Workspace configured for email replies, with a professional tone.",
    category: "ai",
    access: "free",
    status: "available",
    icon: "Reply",
    hue: 230,
    highlights: ["Preset of the Writing Workspace", "Professional tone by default"],
    opens: "/app/tools/ai-writing-workspace?type=email&tone=professional",
  },
  {
    slug: "social-caption-workflow",
    name: "Social Caption Workflow",
    tagline: "Draft a caption from a few bullet points.",
    description:
      "A preset workflow for short social posts, opening the Writing Workspace with the social format and a friendly tone.",
    category: "ai",
    access: "free",
    status: "available",
    icon: "Sparkles",
    hue: 290,
    highlights: ["Preset of the Writing Workspace", "Friendly tone by default"],
    opens: "/app/tools/ai-writing-workspace?type=social&tone=friendly",
  },
  {
    slug: "study-planner",
    name: "Study Planner",
    tagline: "Spaced revision plans for exams and courses.",
    description:
      "Planned for a future release. Break a syllabus into topics and get a spaced-repetition revision calendar.",
    category: "career",
    access: "free",
    status: "planned",
    icon: "GraduationCap",
    hue: 180,
    highlights: ["Planned — not yet available"],
  },
  {
    slug: "meeting-notes-summariser",
    name: "Meeting Notes Summariser",
    tagline: "Decisions and action items from raw notes.",
    description:
      "Planned for a future release. Paste meeting notes and get decisions, owners and next steps.",
    category: "ai",
    access: "premium",
    status: "planned",
    icon: "ListChecks",
    hue: 10,
    highlights: ["Planned — not yet available"],
  },
];

export function getTool(slug: string) {
  return TOOLS.find((t) => t.slug === slug) ?? null;
}

export function getToolCategory(slug: string) {
  return TOOL_CATEGORIES.find((c) => c.slug === slug) ?? null;
}

export const FEATURED_TOOL_SLUGS = [
  "ai-writing-workspace",
  "resume-builder",
  "content-planner",
  "proposal-builder",
  "budget-planner",
  "productivity-workspace",
];
