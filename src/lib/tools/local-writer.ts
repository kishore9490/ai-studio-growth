// Deterministic, offline writing transformations used by the AI Writing
// Workspace when no AI provider is configured. This is NOT an AI model: it
// restructures the user's own notes into a chosen format and applies simple,
// rule-based tone and style edits. The UI labels it as local demo mode.

export const CONTENT_TYPES = [
  { key: "email", label: "Email" },
  { key: "social", label: "Social post" },
  { key: "linkedin", label: "LinkedIn post" },
  { key: "summary", label: "Summary" },
  { key: "blog", label: "Blog intro" },
  { key: "rewrite", label: "Rewrite" },
] as const;

export const TONES = [
  { key: "professional", label: "Professional" },
  { key: "friendly", label: "Friendly" },
  { key: "confident", label: "Confident" },
  { key: "concise", label: "Concise" },
  { key: "persuasive", label: "Persuasive" },
] as const;

export const ACTIONS = ["generate", "improve", "shorter", "formal"] as const;

export type ContentType = (typeof CONTENT_TYPES)[number]["key"];
export type Tone = (typeof TONES)[number]["key"];
export type WritingAction = (typeof ACTIONS)[number];

export type WritingRequest = {
  action: WritingAction;
  type: ContentType;
  tone: Tone;
  /** The user's notes / source text. */
  input: string;
  /** The current draft, used by improve / shorter / formal. */
  draft?: string;
};

const FILLERS = /\b(really|very|just|basically|actually|literally|quite|simply|totally|kind of|sort of)\s+/gi;

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function endSentence(s: string) {
  const t = s.trim();
  if (!t) return t;
  return /[.!?:]$/.test(t) ? t : `${t}.`;
}

/** Break free-form notes into clean, sentence-like points. */
export function extractPoints(input: string): string[] {
  return input
    .replace(/\r/g, "")
    .split(/\n+|\s[·•|]\s|;\s*|(?<=[.!?])\s+(?=[A-Z])/)
    .map((p) => p.replace(/^\s*([-*•·–—]|\d+[.)])\s*/, "").replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 1)
    .map((p) => capitalise(p.replace(/[.,;:]+$/, "")));
}

function keywords(points: string[], n = 3): string[] {
  const stop = new Set(
    "the a an and or but for with from into onto that this these those our your their my we you they i is are was were be been to of in on at by it its as about over new more most next from just than then them who what when where how".split(" "),
  );
  const counts = new Map<string, number>();
  for (const p of points) {
    for (const w of p.toLowerCase().match(/[a-z][a-z-]{3,}/g) ?? []) {
      if (stop.has(w)) continue;
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([w]) => w.replace(/-/g, ""));
}

const TONE_PHRASES: Record<Tone, { open: string; close: string; signoff: string; hook: string; cta: string }> = {
  professional: {
    open: "I'm writing with a short update.",
    close: "Please let me know if you have any questions.",
    signoff: "Kind regards,",
    hook: "A quick update worth sharing.",
    cta: "I'd welcome your thoughts.",
  },
  friendly: {
    open: "Hope you're doing well! Here's a quick update.",
    close: "Let me know what you think — happy to chat anytime.",
    signoff: "Cheers,",
    hook: "Some good news to share today.",
    cta: "Would love to hear what you think!",
  },
  confident: {
    open: "Here's where things stand.",
    close: "I'm ready to take the next step whenever you are.",
    signoff: "Best,",
    hook: "Here's what we delivered.",
    cta: "Let's talk about what's next.",
  },
  concise: {
    open: "Quick update:",
    close: "Questions welcome.",
    signoff: "Thanks,",
    hook: "In brief:",
    cta: "Thoughts?",
  },
  persuasive: {
    open: "I'd like to share something that could make a real difference.",
    close: "If this sounds useful, let's find a time this week to discuss it.",
    signoff: "Warm regards,",
    hook: "Here's why this matters.",
    cta: "If this resonates, let's connect.",
  },
};

function asSentences(points: string[]) {
  return points.map(endSentence);
}

function paragraphs(sentences: string[], perParagraph = 2) {
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i += perParagraph) out.push(sentences.slice(i, i + perParagraph).join(" "));
  return out;
}

function generate(type: ContentType, tone: Tone, input: string): string {
  const points = extractPoints(input);
  if (points.length === 0) return "";
  const t = TONE_PHRASES[tone];
  const sentences = asSentences(points);

  switch (type) {
    case "email":
      return [
        "Hi,",
        t.open,
        ...paragraphs(sentences, tone === "concise" ? 3 : 2),
        t.close,
        `${t.signoff}\n[Your name]`,
      ].join("\n\n");
    case "social": {
      const tags = keywords(points).map((k) => `#${capitalise(k)}`);
      const body = sentences.slice(1, tone === "concise" ? 3 : 4);
      return [sentences[0], ...body, t.cta, tags.join(" ")].filter(Boolean).join("\n\n");
    }
    case "linkedin": {
      const [first, ...rest] = sentences;
      return [
        tone === "concise" ? first : `${t.hook} ${first}`,
        rest.length ? rest.map((s) => `→ ${s}`).join("\n") : "",
        t.cta,
      ]
        .filter(Boolean)
        .join("\n\n");
    }
    case "summary": {
      const takeaway = sentences[0];
      return ["Summary", ...sentences.map((s) => `• ${s}`), `Key takeaway: ${takeaway}`].join("\n");
    }
    case "blog": {
      const topic = keywords(points, 2).join(" and ") || "this topic";
      const intro = tone === "persuasive" ? `What if ${topic} could be simpler than you think?` : `Let's talk about ${topic}.`;
      return [
        `${intro} ${sentences.slice(0, 2).join(" ")}`,
        sentences.length > 2 ? sentences.slice(2).join(" ") : "",
        `In this post, we'll walk through what that means in practice and how you can apply it.`,
      ]
        .filter(Boolean)
        .join("\n\n");
    }
    case "rewrite":
    default:
      return paragraphs(sentences, 3).join("\n\n");
  }
}

const IMPROVEMENTS: [RegExp, string][] = [
  [/\ba lot of\b/gi, "many"],
  [/\bin order to\b/gi, "to"],
  [/\bat this point in time\b/gi, "now"],
  [/\bdue to the fact that\b/gi, "because"],
  [/\bvery good\b/gi, "excellent"],
  [/\bvery bad\b/gi, "poor"],
  [/\bvery important\b/gi, "essential"],
  [/\bI think that\b/g, "I believe"],
  [/\bmake a decision\b/gi, "decide"],
  [/\bin the near future\b/gi, "soon"],
];

function tidy(text: string) {
  return text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").replace(/\s+([,.!?])/g, "$1").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/(^|[.!?]\s+|\n)([a-z])/g, (_, p, c) => p + c.toUpperCase())
    .trim();
}

export function improve(text: string): string {
  let out = text;
  for (const [re, rep] of IMPROVEMENTS) out = out.replace(re, rep);
  out = out.replace(FILLERS, "");
  return tidy(out);
}

/** Generic phrases this formatter adds; they are the first thing to cut when shortening. */
const BOILERPLATE = Object.values(TONE_PHRASES).flatMap((t) => [t.hook, t.open]);

export function shorten(text: string): string {
  let source = text;
  for (const phrase of BOILERPLATE) source = source.split(`${phrase} `).join("");
  const blocks = source.split(/\n{2,}/);
  const kept = blocks.map((block) => {
    if (/^(•|→|-)/m.test(block) || block.split("\n").length > 1) {
      const lines = block.split("\n");
      return lines.slice(0, Math.max(2, Math.ceil(lines.length * 0.6))).join("\n");
    }
    const sentences = block.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [block];
    return sentences.slice(0, Math.max(1, Math.ceil(sentences.length / 2))).join(" ");
  });
  return tidy(kept.join("\n\n").replace(FILLERS, ""));
}

const CONTRACTIONS: [RegExp, string][] = [
  [/\bcan't\b/gi, "cannot"],
  [/\bwon't\b/gi, "will not"],
  [/\bdon't\b/gi, "do not"],
  [/\bdoesn't\b/gi, "does not"],
  [/\bdidn't\b/gi, "did not"],
  [/\bisn't\b/gi, "is not"],
  [/\baren't\b/gi, "are not"],
  [/\bI'm\b/g, "I am"],
  [/\bI've\b/g, "I have"],
  [/\bI'll\b/g, "I will"],
  [/\bI'd\b/g, "I would"],
  [/\bwe're\b/gi, "we are"],
  [/\bwe've\b/gi, "we have"],
  [/\bwe'll\b/gi, "we will"],
  [/\byou're\b/gi, "you are"],
  [/\byou'll\b/gi, "you will"],
  [/\bit's\b/gi, "it is"],
  [/\bthat's\b/gi, "that is"],
  [/\bthere's\b/gi, "there is"],
  [/\blet's\b/gi, "let us"],
  [/\bhere's\b/gi, "here is"],
];

const FORMAL_SWAPS: [RegExp, string][] = [
  [/^(Hi|Hey|Hello)( there)?,/gm, "Dear [Name],"],
  [/\bThanks\b/g, "Thank you"],
  [/\bCheers,/g, "Kind regards,"],
  [/\bget back to you\b/gi, "respond"],
  [/\bASAP\b/g, "at your earliest convenience"],
  [/\bstuff\b/gi, "items"],
  [/\bhappy to chat anytime\b/gi, "available to discuss at your convenience"],
  [/\bawesome\b/gi, "excellent"],
  [/\bgreat\b/gi, "valuable"],
];

export function formalise(text: string): string {
  let out = text;
  for (const [re, rep] of CONTRACTIONS) out = out.replace(re, (m) => (m[0] === m[0].toUpperCase() ? capitalise(rep) : rep));
  for (const [re, rep] of FORMAL_SWAPS) out = out.replace(re, rep);
  out = out.replace(/!+/g, ".").replace(/ — /g, ", ");
  return tidy(out);
}

export function localWrite(req: WritingRequest): string {
  const base = req.draft?.trim() ? req.draft : generate(req.type, req.tone, req.input);
  switch (req.action) {
    case "generate":
      return generate(req.type, req.tone, req.input);
    case "improve":
      return improve(base);
    case "shorter":
      return shorten(base);
    case "formal":
      return formalise(base);
  }
}
