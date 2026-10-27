export const INTERESTS = [
  { key: "productivity", label: "Productivity", description: "Planning, focus and routines" },
  { key: "ai", label: "AI and technology", description: "Prompts and AI-assisted workflows" },
  { key: "career", label: "Career development", description: "Resumes, interviews, learning" },
  { key: "content", label: "Content creation", description: "Publishing and design" },
  { key: "business", label: "Business", description: "Clients, proposals, operations" },
  { key: "organisation", label: "Personal organisation", description: "Money and life admin" },
] as const;

export const DASHBOARD_WIDGETS = [
  { key: "quick-tools", label: "Quick-access tools", description: "Shortcuts to the tools you use most" },
  { key: "recent", label: "Recently viewed", description: "Pick up where you left off" },
  { key: "recommended", label: "Recommended products", description: "Based on your interests" },
  { key: "purchases", label: "Recent purchases", description: "Your latest library additions" },
  { key: "membership", label: "Membership status", description: "Your plan at a glance" },
  { key: "referrals", label: "Referral overview", description: "Only shown if you join the affiliate programme" },
] as const;

export const DEFAULT_WIDGETS = DASHBOARD_WIDGETS.map((w) => w.key);

/** Map onboarding interests to product categories and tool categories for recommendations. */
export const INTEREST_TO_CATEGORIES: Record<string, { products: string[]; tools: string[] }> = {
  productivity: { products: ["productivity"], tools: ["productivity"] },
  ai: { products: ["ai-technology"], tools: ["ai", "writing"] },
  career: { products: ["career-learning"], tools: ["career"] },
  content: { products: ["content-creation"], tools: ["business", "writing"] },
  business: { products: ["business"], tools: ["business"] },
  organisation: { products: ["personal-organisation"], tools: ["organisation"] },
};
