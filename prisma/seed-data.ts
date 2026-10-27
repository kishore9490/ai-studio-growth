// Sample catalogue for development and demos. Every product here is a
// provisional sample — replace before launch.

export const CATEGORIES = [
  { slug: "career-learning", name: "Career & Learning", description: "Resumes, interviews and study systems." },
  { slug: "content-creation", name: "Content Creation", description: "Plan, design and publish consistently." },
  { slug: "business", name: "Business", description: "Proposals, operations and client work." },
  { slug: "ai-technology", name: "AI & Technology", description: "Prompts and workflows for AI tools." },
  { slug: "productivity", name: "Productivity", description: "Planning systems that stay simple." },
  { slug: "personal-organisation", name: "Personal Organisation", description: "Money, admin and life logistics." },
];

type SeedAsset = { label: string; fileName: string; mimeType: string; content: string };

export type SeedProduct = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  priceInPaise: number;
  format: string;
  licence: "PERSONAL" | "COMMERCIAL";
  licenceSummary: string;
  includes: string[];
  fileFormats: string[];
  artwork: string;
  accentHue: number;
  includedWithPremium?: boolean;
  commissionEligible?: boolean;
  featured?: boolean;
  assets: SeedAsset[];
};

const md = "text/markdown";
const csv = "text/csv";

export const PRODUCTS: SeedProduct[] = [
  {
    slug: "ultimate-resume-toolkit",
    name: "The Ultimate Resume Toolkit",
    tagline: "Everything you need to write a resume that gets read.",
    description:
      "A structured toolkit for writing a clear, recruiter-friendly resume. Start with the section-by-section guide, choose from three layouts, and use the bullet-point formula and action-verb bank to turn duties into outcomes. Built for students and professionals applying in India and abroad.",
    category: "career-learning",
    priceInPaise: 79900,
    format: "Toolkit",
    licence: "PERSONAL",
    licenceSummary: "Personal use. Use for your own applications; do not resell or redistribute the templates.",
    includes: ["Section-by-section writing guide", "3 resume layouts (one-page & two-page)", "Bullet-point formula worksheet", "250 action verbs by skill", "Pre-submission checklist"],
    fileFormats: ["Markdown", "CSV", "Printable checklist"],
    artwork: "resume",
    accentHue: 205,
    featured: true,
    assets: [
      {
        label: "Resume writing guide",
        fileName: "resume-writing-guide.md",
        mimeType: md,
        content: `# Resume Writing Guide\n\n## 1. Header\nName, city, phone, email, and one portfolio or LinkedIn link. Skip date of birth, photo and full address unless an employer asks.\n\n## 2. Summary (optional)\nTwo lines: who you are, what you are good at, and what you want next.\n\n## 3. Experience\nUse the formula: **Action verb + what you did + measurable result**.\n- Weak: "Responsible for social media."\n- Strong: "Grew Instagram followers from 2k to 9k in six months by planning a weekly content calendar."\n\n## 4. Education\nDegree, institution, year. Add grades only if they help.\n\n## 5. Skills\nGroup by type (Tools, Languages, Methods). Only list what you could discuss in an interview.\n`,
      },
      {
        label: "Action verb bank",
        fileName: "action-verbs.csv",
        mimeType: csv,
        content: `skill,verbs\nLeadership,"Led, Directed, Coordinated, Mentored, Delegated"\nAnalysis,"Analysed, Evaluated, Forecast, Measured, Audited"\nCommunication,"Presented, Negotiated, Wrote, Persuaded, Facilitated"\nDelivery,"Launched, Delivered, Shipped, Streamlined, Implemented"\nGrowth,"Increased, Expanded, Grew, Accelerated, Improved"\n`,
      },
    ],
  },
  {
    slug: "creator-content-calendar",
    name: "Creator Content Calendar",
    tagline: "A 12-week publishing plan you will actually keep.",
    description:
      "A content calendar system for solo creators and small brands. Plan themes by month, batch ideas into weekly slots, and track each post from idea to published. Includes a hook library and a monthly review template so you learn what works.",
    category: "content-creation",
    priceInPaise: 59900,
    format: "Template",
    licence: "PERSONAL",
    licenceSummary: "Personal or single-brand use. Not for resale as a template.",
    includes: ["12-week calendar (CSV for any spreadsheet app)", "Content pillar planner", "60 hook starters", "Monthly performance review template"],
    fileFormats: ["CSV", "Markdown"],
    artwork: "calendar",
    accentHue: 330,
    featured: true,
    assets: [
      {
        label: "12-week calendar",
        fileName: "content-calendar-12-weeks.csv",
        mimeType: csv,
        content: `week,day,channel,pillar,idea,status\n1,Mon,Instagram,Education,"3 mistakes beginners make",Idea\n1,Wed,LinkedIn,Story,"What I learned from my first client",Draft\n1,Fri,YouTube Shorts,Behind the scenes,"My weekly planning routine",Scheduled\n2,Mon,Instagram,Education,"A 60-second explainer",Idea\n2,Thu,Newsletter,Roundup,"Five links worth your time",Idea\n`,
      },
      {
        label: "Hook starters",
        fileName: "hook-starters.md",
        mimeType: md,
        content: `# Hook starters\n\n- "Most people get ___ wrong. Here's the fix."\n- "I tried ___ for 30 days. What happened:"\n- "If you only remember one thing about ___, make it this."\n- "The ___ checklist I wish I had a year ago."\n- "Stop doing ___. Do this instead."\n`,
      },
    ],
  },
  {
    slug: "freelance-business-starter-kit",
    name: "Freelance Business Starter Kit",
    tagline: "Set up your freelance practice properly from day one.",
    description:
      "Templates and checklists for starting a freelance business: defining your offer, pricing your services, onboarding clients and invoicing. Written for designers, developers, writers and consultants starting out in India. Includes a GST-aware invoice template (consult a tax professional for your situation).",
    category: "business",
    priceInPaise: 149900,
    format: "Toolkit",
    licence: "COMMERCIAL",
    licenceSummary: "Commercial use within your own business. Customise freely; do not resell the kit itself.",
    includes: ["Offer & positioning worksheet", "Pricing calculator (CSV)", "Client onboarding checklist", "Service agreement outline", "Invoice template"],
    fileFormats: ["Markdown", "CSV"],
    artwork: "kit",
    accentHue: 28,
    featured: true,
    assets: [
      {
        label: "Pricing calculator",
        fileName: "pricing-calculator.csv",
        mimeType: csv,
        content: `item,monthly_amount_inr\nTarget take-home income,60000\nBusiness costs (software, internet),6000\nTax & savings buffer (30%),19800\nTotal needed,85800\nBillable hours per month,80\nMinimum hourly rate,1073\n`,
      },
      {
        label: "Client onboarding checklist",
        fileName: "client-onboarding-checklist.md",
        mimeType: md,
        content: `# Client onboarding checklist\n\n- Confirm scope, deliverables and what is out of scope\n- Agree timeline and review rounds\n- Send agreement and collect signature\n- Collect advance payment (typically 30–50%)\n- Set up a shared folder and communication channel\n- Schedule kickoff call and send agenda\n`,
      },
    ],
  },
  {
    slug: "ai-prompt-collection",
    name: "AI Prompt Collection",
    tagline: "120 tested prompts for writing, research and planning.",
    description:
      "A practical library of prompts organised by task: drafting, summarising, research, studying, planning and feedback. Each prompt includes the context it needs and a tip for improving results. Works with any capable AI assistant.",
    category: "ai-technology",
    priceInPaise: 49900,
    format: "Collection",
    licence: "PERSONAL",
    licenceSummary: "Personal and professional use. Do not republish the collection.",
    includes: ["120 prompts in 6 categories", "Prompt-writing framework", "Before/after examples"],
    fileFormats: ["Markdown"],
    artwork: "prompts",
    accentHue: 258,
    includedWithPremium: true,
    featured: true,
    assets: [
      {
        label: "Prompt collection",
        fileName: "prompt-collection.md",
        mimeType: md,
        content: `# AI Prompt Collection (excerpt)\n\n## Framework\nRole → Task → Context → Format → Constraints.\n\n## Summarising\n"Summarise the text below for a busy manager. Use 5 bullet points, each under 20 words, then list any decisions needed."\n\n## Studying\n"Quiz me on the topic below with 10 questions of increasing difficulty. Wait for my answer before revealing the next question."\n\n## Feedback\n"Review my draft as a sceptical editor. List the three weakest sentences and suggest rewrites."\n`,
      },
    ],
  },
  {
    slug: "business-proposal-templates",
    name: "Business Proposal Templates",
    tagline: "Five proposal templates that make saying yes easy.",
    description:
      "Proposal templates for common client projects — website builds, marketing retainers, consulting engagements, design projects and workshops. Each includes a recommended structure, sample copy and a pricing table you can adapt.",
    category: "business",
    priceInPaise: 89900,
    format: "Templates",
    licence: "COMMERCIAL",
    licenceSummary: "Use in proposals for your own clients. Do not resell the templates.",
    includes: ["5 proposal templates", "Pricing table patterns (fixed, phased, retainer)", "Follow-up email scripts"],
    fileFormats: ["Markdown"],
    artwork: "proposal",
    accentHue: 22,
    assets: [
      {
        label: "Website project proposal",
        fileName: "proposal-website-project.md",
        mimeType: md,
        content: `# Proposal: Website redesign for {Client}\n\n## The goal\n{One paragraph in the client's words.}\n\n## What we'll deliver\n- Discovery workshop and sitemap\n- Design for up to 6 page templates\n- Responsive build and launch support\n\n## Investment\n| Phase | Fee |\n|---|---|\n| Discovery | ₹25,000 |\n| Design | ₹60,000 |\n| Build | ₹90,000 |\n\n## Timeline\nSix weeks from kickoff.\n\n## Next step\nReply to approve, and we'll send the agreement and first invoice.\n`,
      },
    ],
  },
  {
    slug: "personal-productivity-planner",
    name: "Personal Productivity Planner",
    tagline: "A calm weekly planning system on one page.",
    description:
      "A printable planner built around a weekly review, three daily priorities and a simple habit tracker. Designed to take ten minutes a week to maintain.",
    category: "productivity",
    priceInPaise: 44900,
    format: "Printable",
    licence: "PERSONAL",
    licenceSummary: "Personal use. Print as many copies as you need for yourself.",
    includes: ["Weekly planning page", "Daily priorities page", "Habit tracker", "Weekly review prompts"],
    fileFormats: ["Markdown (print-ready)"],
    artwork: "planner",
    accentHue: 40,
    includedWithPremium: true,
    assets: [
      {
        label: "Weekly planner",
        fileName: "weekly-planner.md",
        mimeType: md,
        content: `# Weekly planner\n\n## This week's outcomes (max 3)\n1.\n2.\n3.\n\n## Calendar commitments\n\n## Daily priorities\n| Day | Priority 1 | Priority 2 | Priority 3 |\n|---|---|---|---|\n| Mon | | | |\n| Tue | | | |\n\n## Weekly review\n- What went well?\n- What got in the way?\n- What will I change next week?\n`,
      },
    ],
  },
  {
    slug: "social-media-design-pack",
    name: "Social Media Design Pack",
    tagline: "A consistent visual system for your posts.",
    description:
      "Layout specifications, type pairings and colour palettes for carousels, quote posts, announcements and stories, with sizing guides for major platforms. Use it as the brief for your design tool of choice.",
    category: "content-creation",
    priceInPaise: 119900,
    format: "Design system",
    licence: "COMMERCIAL",
    licenceSummary: "Use for your own or your clients' social accounts. Do not resell the pack.",
    includes: ["8 post layout specifications", "6 colour palettes with hex values", "Type pairing guide", "Platform size cheat sheet"],
    fileFormats: ["Markdown", "CSV"],
    artwork: "social",
    accentHue: 290,
    featured: true,
    assets: [
      {
        label: "Palettes",
        fileName: "palettes.csv",
        mimeType: csv,
        content: `palette,primary,secondary,accent,background\nCalm,#2F4858,#86BBD8,#F6AE2D,#F7F7F2\nWarm,#7A3E2E,#E9C46A,#F4A261,#FFF8F0\nModern,#191919,#7557F6,#EFEBFE,#F8F7F4\n`,
      },
      {
        label: "Size cheat sheet",
        fileName: "platform-sizes.md",
        mimeType: md,
        content: `# Platform sizes\n\n- Instagram portrait post: 1080 × 1350\n- Instagram story / reel cover: 1080 × 1920\n- LinkedIn post: 1200 × 1200 or 1080 × 1350\n- YouTube thumbnail: 1280 × 720\n`,
      },
    ],
  },
  {
    slug: "small-business-operations-toolkit",
    name: "Small Business Operations Toolkit",
    tagline: "SOPs, trackers and checklists to run day-to-day.",
    description:
      "A starter operations system for small teams: standard operating procedure templates, an inventory tracker, a customer follow-up log and a monthly close checklist. Helps owners document how the business runs so it can run without them.",
    category: "business",
    priceInPaise: 199900,
    format: "Toolkit",
    licence: "COMMERCIAL",
    licenceSummary: "Use inside your business, including with your team. Do not resell.",
    includes: ["SOP template + 5 examples", "Inventory tracker (CSV)", "Customer follow-up log", "Monthly close checklist"],
    fileFormats: ["Markdown", "CSV"],
    artwork: "ops",
    accentHue: 168,
    assets: [
      {
        label: "SOP template",
        fileName: "sop-template.md",
        mimeType: md,
        content: `# SOP: {Process name}\n\n**Owner:** {Role}\n**When:** {Trigger or schedule}\n\n## Steps\n1.\n2.\n3.\n\n## Done means\n- \n\n## Common mistakes\n- \n`,
      },
      {
        label: "Inventory tracker",
        fileName: "inventory-tracker.csv",
        mimeType: csv,
        content: `sku,item,on_hand,reorder_level,supplier,last_ordered\nSKU-001,Packaging boxes (M),120,50,Local supplier,2026-09-01\nSKU-002,Labels,800,300,Print shop,2026-08-20\n`,
      },
    ],
  },
  {
    slug: "interview-preparation-workbook",
    name: "Interview Preparation Workbook",
    tagline: "Prepare stories, not scripts.",
    description:
      "A workbook for preparing interview answers using the STAR method. Map your experience to common competencies, practise with 40 frequently asked questions, and prepare thoughtful questions for your interviewer.",
    category: "career-learning",
    priceInPaise: 39900,
    format: "Workbook",
    licence: "PERSONAL",
    licenceSummary: "Personal use.",
    includes: ["STAR story planner", "40 common questions by competency", "Questions to ask the interviewer", "Day-before checklist"],
    fileFormats: ["Markdown"],
    artwork: "interview",
    accentHue: 215,
    includedWithPremium: true,
    assets: [
      {
        label: "STAR story planner",
        fileName: "star-story-planner.md",
        mimeType: md,
        content: `# STAR story planner\n\nFor each story, write:\n- **Situation:** Where and when?\n- **Task:** What was your responsibility?\n- **Action:** What did *you* do?\n- **Result:** What changed? Use numbers if you can.\n\n## Competencies to cover\n- Handling conflict\n- Leading without authority\n- Recovering from a mistake\n- Learning something quickly\n`,
      },
    ],
  },
  {
    slug: "personal-finance-tracker",
    name: "Personal Finance Tracker",
    tagline: "Budget, track and review your money monthly.",
    description:
      "A spreadsheet-ready finance tracker with income, expense categories, savings goals and a monthly review. Simple enough to keep up, detailed enough to be useful. Educational only — not financial advice.",
    category: "personal-organisation",
    priceInPaise: 54900,
    format: "Template",
    licence: "PERSONAL",
    licenceSummary: "Personal use.",
    includes: ["Monthly budget sheet", "Expense categories guide", "Savings goals tracker", "Monthly money review"],
    fileFormats: ["CSV", "Markdown"],
    artwork: "finance",
    accentHue: 150,
    assets: [
      {
        label: "Monthly budget",
        fileName: "monthly-budget.csv",
        mimeType: csv,
        content: `category,planned_inr,actual_inr\nRent,18000,18000\nGroceries,7000,7650\nTransport,3000,2600\nUtilities,2500,2380\nSavings,10000,10000\nFun,4000,4800\n`,
      },
    ],
  },
  {
    slug: "student-study-system",
    name: "Student Study System",
    tagline: "Plan revision, take better notes, remember more.",
    description:
      "A study system for college and competitive-exam students: a semester planner, Cornell note template, spaced-repetition schedule and exam-week checklist.",
    category: "career-learning",
    priceInPaise: 34900,
    format: "System",
    licence: "PERSONAL",
    licenceSummary: "Personal use.",
    includes: ["Semester planner", "Cornell notes template", "Spaced repetition schedule", "Exam-week checklist"],
    fileFormats: ["Markdown", "CSV"],
    artwork: "study",
    accentHue: 185,
    includedWithPremium: true,
    assets: [
      {
        label: "Spaced repetition schedule",
        fileName: "spaced-repetition.csv",
        mimeType: csv,
        content: `review,days_after_first_study\n1,1\n2,3\n3,7\n4,14\n5,30\n`,
      },
    ],
  },
  {
    slug: "life-admin-dashboard",
    name: "Life Admin Dashboard",
    tagline: "Documents, renewals and bills in one place.",
    description:
      "A home base for life admin: a renewals calendar (insurance, subscriptions, ID documents), a bill tracker and a document checklist so important paperwork is never a scramble.",
    category: "personal-organisation",
    priceInPaise: 64900,
    format: "Template",
    licence: "PERSONAL",
    licenceSummary: "Personal or household use.",
    includes: ["Renewals calendar", "Bill tracker", "Important documents checklist", "Emergency information sheet"],
    fileFormats: ["CSV", "Markdown"],
    artwork: "dashboard",
    accentHue: 245,
    assets: [
      {
        label: "Renewals calendar",
        fileName: "renewals.csv",
        mimeType: csv,
        content: `item,provider,renews_on,amount_inr,auto_renew\nHealth insurance,{Insurer},2027-03-01,18000,no\nPhone plan,{Carrier},2026-11-15,599,yes\nPassport,Govt.,2031-06-10,,no\n`,
      },
    ],
  },
  {
    slug: "weekly-review-kit",
    name: "Weekly Review Kit",
    tagline: "A free 20-minute weekly reset.",
    description:
      "A short, free checklist for closing out the week: clear inboxes, review your calendar, pick next week's three outcomes. A good first step into the LifeOS planning system.",
    category: "productivity",
    priceInPaise: 0,
    format: "Checklist",
    licence: "PERSONAL",
    licenceSummary: "Free for personal use.",
    includes: ["Weekly reset checklist", "Three-outcome planning prompt"],
    fileFormats: ["Markdown"],
    artwork: "checklist",
    accentHue: 95,
    includedWithPremium: true,
    commissionEligible: false,
    assets: [
      {
        label: "Weekly reset checklist",
        fileName: "weekly-reset.md",
        mimeType: md,
        content: `# Weekly reset (20 minutes)\n\n- Empty your inboxes to zero or to a "later" list\n- Review last week's calendar for loose ends\n- Review next week's calendar and prepare\n- Pick three outcomes for next week\n- Tidy your desk and downloads folder\n`,
      },
    ],
  },
];

export const PLANS = [
  {
    code: "FREE",
    name: "Free",
    description: "Everything you need to get started.",
    priceInPaise: 0,
    interval: "NONE" as const,
    sortOrder: 0,
    benefits: ["Free account", "Selected digital tools", "Free resources and guides", "Marketplace browsing and purchases", "Optional affiliate participation"],
    billingTerms: "No payment details required.",
  },
  {
    code: "PREMIUM_MONTHLY",
    name: "Premium",
    description: "The full library and every tool, billed monthly.",
    priceInPaise: 49900,
    interval: "MONTH" as const,
    sortOrder: 1,
    benefits: ["Expanded resource library", "Monthly resource releases", "Premium productivity tools", "Selected training resources", "Premium-included marketplace products"],
    billingTerms: "Illustrative price. Billed monthly. Cancel any time; access continues until the end of the paid period. No refunds for partial months unless required by law.",
  },
  {
    code: "PREMIUM_ANNUAL",
    name: "Premium Annual",
    description: "The same Premium benefits, billed once a year.",
    priceInPaise: 499000,
    interval: "YEAR" as const,
    sortOrder: 2,
    benefits: ["Everything in Premium", "Billed once per year", "Price locked for the billing year"],
    billingTerms: "Illustrative price. Billed annually. Cancel any time; access continues until the end of the paid year. See the Refund Policy for the cooling-off period.",
  },
];

type SeedResource = { slug: string; title: string; summary: string; kind: string; access: "FREE" | "PREMIUM"; readingMinutes: number; body: string };

export const RESOURCE_COLLECTIONS: { slug: string; title: string; description: string; accentHue: number; items: SeedResource[] }[] = [
  {
    slug: "focus-foundations",
    title: "Focus Foundations",
    description: "Short, practical guides to planning your days and protecting your attention.",
    accentHue: 40,
    items: [
      {
        slug: "three-priority-method",
        title: "The three-priority method",
        summary: "Why three priorities beat a long to-do list, and how to choose them.",
        kind: "Guide",
        access: "FREE",
        readingMinutes: 4,
        body: `A long to-do list feels productive but rarely tells you what matters today. The three-priority method asks one question each morning: if I only finished three things today, which three would make the biggest difference?\n\n## How to choose\n- One priority should move a long-term goal forward.\n- One should remove a source of stress (an overdue reply, a bill).\n- One can be small and certain, so the day always has a win.\n\n## Making it stick\nWrite your three before opening email. Do the first one before lunch. Everything else is a bonus.\n\nTry it with the Productivity Workspace tool, which keeps your three priorities and a focus timer side by side.`,
      },
      {
        slug: "designing-a-weekly-review",
        title: "Designing a weekly review",
        summary: "A 20-minute ritual that keeps your week from running you.",
        kind: "Checklist",
        access: "FREE",
        readingMinutes: 5,
        body: `The weekly review is the habit that makes every other planning system work. It takes about twenty minutes, ideally at the same time each week.\n\n## The steps\n- Clear: empty inboxes and notes into one list.\n- Review: scan last week's calendar for follow-ups.\n- Look ahead: check next week's calendar and prepare.\n- Choose: pick three outcomes for the week.\n\n## Keep it short\nIf it takes longer than thirty minutes, you are doing project work, not reviewing. Schedule that work separately.`,
      },
      {
        slug: "deep-work-blocks",
        title: "Building deep work blocks",
        summary: "Structure 90-minute focus sessions around your energy.",
        kind: "Guide",
        access: "PREMIUM",
        readingMinutes: 7,
        body: `Deep work is focused, uninterrupted effort on something cognitively demanding. Most people can sustain two to four hours a day.\n\n## Find your window\nTrack your energy for a week. Most people have a clear peak in the morning or late evening. Protect that window first.\n\n## Set up the block\n- Decide the single outcome before you start.\n- Close messaging apps and put your phone in another room.\n- Work in 45–90 minute sessions with a real break between them.\n\n## Recover properly\nA walk or a short rest restores focus better than scrolling. Plan your breaks as deliberately as your work.`,
      },
    ],
  },
  {
    slug: "career-moves",
    title: "Career Moves",
    description: "Guides for applying, interviewing and negotiating with confidence.",
    accentHue: 205,
    items: [
      {
        slug: "writing-outcome-bullets",
        title: "Writing outcome-focused resume bullets",
        summary: "Turn job duties into evidence of impact.",
        kind: "Guide",
        access: "FREE",
        readingMinutes: 5,
        body: `Recruiters skim. Each bullet on your resume should show what changed because you were there.\n\n## The formula\nAction verb + what you did + the result.\n\n## Examples\n- Before: "Handled customer queries."\n- After: "Resolved 40+ customer queries a day with a 95% satisfaction score."\n\n## No numbers? Use scope\nIf you cannot measure the result, describe the scale: team size, budget, number of users, or frequency.`,
      },
      {
        slug: "salary-conversation",
        title: "Preparing for the salary conversation",
        summary: "Research, anchor and negotiate respectfully.",
        kind: "Playbook",
        access: "PREMIUM",
        readingMinutes: 8,
        body: `Negotiation is a normal part of hiring. Preparation makes it a calm conversation rather than a confrontation.\n\n## Research\nGather ranges from job posts, peers and salary surveys for your role, city and experience.\n\n## Decide your numbers\n- Target: what you would be happy with.\n- Walk-away: the lowest you would accept.\n\n## In the conversation\nThank them, express enthusiasm, then share your researched range with a reason. Pause and let them respond.\n\n## Beyond salary\nJoining date, learning budget, remote days and review timelines can all be negotiated.`,
      },
    ],
  },
  {
    slug: "creator-playbooks",
    title: "Creator Playbooks",
    description: "Systems for publishing consistently without burning out.",
    accentHue: 330,
    items: [
      {
        slug: "content-pillars",
        title: "Choosing your content pillars",
        summary: "Three to five themes that make planning easy.",
        kind: "Worksheet",
        access: "FREE",
        readingMinutes: 4,
        body: `Content pillars are the recurring themes you publish about. They make it easier to plan and help your audience know what to expect.\n\n## Pick three to five\n- What do you know well?\n- What does your audience repeatedly ask about?\n- What do you enjoy making?\n\n## Balance them\nA simple mix: education, stories, behind the scenes, and community. Rotate through them across the week.`,
      },
      {
        slug: "batching-content",
        title: "Batching a month of content in a day",
        summary: "A repeatable production day for solo creators.",
        kind: "Playbook",
        access: "PREMIUM",
        readingMinutes: 9,
        body: `Batching groups similar tasks so you switch context less. One focused production day can cover a month of posts.\n\n## Before the day\nList 12–16 ideas across your pillars. Draft hooks and outlines for each.\n\n## On the day\n- Morning: write captions and scripts.\n- Midday: record or design.\n- Afternoon: edit and schedule.\n\n## After\nReview performance at the end of the month and feed what you learn into next month's ideas.`,
      },
    ],
  },
  {
    slug: "money-basics",
    title: "Money Basics",
    description: "Plain-language guides to budgeting and saving. Educational only, not financial advice.",
    accentHue: 150,
    items: [
      {
        slug: "first-budget",
        title: "Building your first budget",
        summary: "A simple method that works on a variable income.",
        kind: "Guide",
        access: "FREE",
        readingMinutes: 6,
        body: `A budget is a plan for your money before the month starts. It does not need to be complicated.\n\n## Start with what's fixed\nRent, EMIs, utilities and insurance. These come first.\n\n## Pay yourself next\nMove savings out on the day income arrives, even if the amount is small.\n\n## Then the flexible spending\nGroceries, transport and fun. Track these weekly rather than monthly so you can adjust.\n\nThe Personal Budget Planner tool can help you set this up in a few minutes. This guide is for education and is not financial advice.`,
      },
      {
        slug: "emergency-fund",
        title: "Why an emergency fund comes first",
        summary: "How much to keep and where to keep it.",
        kind: "Guide",
        access: "FREE",
        readingMinutes: 4,
        body: `An emergency fund covers unexpected costs without debt. Many people aim for three to six months of essential expenses.\n\n## Build it in steps\nStart with one month of essentials, then grow it gradually.\n\n## Keep it accessible\nThe fund should be easy to reach quickly and kept separate from everyday spending.\n\nThis is general education, not personalised financial advice. Consider speaking with a qualified adviser.`,
      },
    ],
  },
];
