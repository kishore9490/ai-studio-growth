import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ACTIONS, CONTENT_TYPES, TONES, localWrite, type WritingRequest } from "@/lib/tools/local-writer";
import { getCurrentUser } from "@/lib/server/auth";
import { aiConfigured, env } from "@/lib/server/env";
import { limiters, retryMessage } from "@/lib/server/rate-limits";

// AI Writing Workspace backend. The API key is read on the server only.
// Without ANTHROPIC_API_KEY the request is served by a deterministic local
// transformation, and the response says so (`mode: "local"`).

const schema = z
  .object({
    action: z.enum(ACTIONS),
    type: z.enum(CONTENT_TYPES.map((t) => t.key) as [WritingRequest["type"], ...WritingRequest["type"][]]),
    tone: z.enum(TONES.map((t) => t.key) as [WritingRequest["tone"], ...WritingRequest["tone"][]]),
    input: z.string().max(6000, "Notes are limited to 6,000 characters."),
    draft: z.string().max(8000, "Drafts are limited to 8,000 characters.").optional(),
  })
  .refine((v) => (v.action === "generate" ? v.input.trim().length >= 3 : (v.draft ?? v.input).trim().length >= 3), {
    message: "Add a few words of notes first.",
  });

const SYSTEM_PROMPT = `You are the writing engine inside LifeOS Digital's AI Writing Workspace.
You turn a user's rough notes into polished, ready-to-send writing, or revise an existing draft.

Rules:
- Return only the finished text. No preamble, no explanations, no quotation marks around the result, no markdown headings unless the format calls for them.
- Use only facts present in the notes or draft. Never invent names, numbers, dates, results or quotes. If something essential is missing, leave a clear placeholder like [Name] or [date].
- Match the requested format and tone. Prefer plain, specific language over hype.
- Write in the same language as the notes. Use Indian/British English spelling when the notes are in English.

Formats:
- email: greeting, 2–4 short paragraphs, clear ask or next step, sign-off with [Your name].
- social: under 80 words, strong first line, short lines, up to 3 relevant hashtags at the end.
- linkedin: hook line, short paragraphs or arrow bullets, a closing question or call to action; under 200 words; no hashtags spam (max 3).
- summary: a one-line overview, then 3–6 bullet points, then a "Key takeaway" line.
- blog: an engaging 2–3 paragraph introduction that sets up the topic and promises what follows.
- rewrite: rewrite the text clearly in the requested tone, keeping the meaning.`;

function instruction(req: WritingRequest) {
  const type = CONTENT_TYPES.find((t) => t.key === req.type)!.label;
  const tone = TONES.find((t) => t.key === req.tone)!.label.toLowerCase();
  switch (req.action) {
    case "generate":
      return `Format: ${req.type} (${type}). Tone: ${tone}.\n\nNotes:\n${req.input}`;
    case "improve":
      return `Improve this ${type.toLowerCase()} for clarity, flow and impact. Keep the ${tone} tone, the format and all facts.\n\nDraft:\n${req.draft || req.input}`;
    case "shorter":
      return `Make this ${type.toLowerCase()} roughly 40% shorter without losing key facts. Keep the ${tone} tone and the format.\n\nDraft:\n${req.draft || req.input}`;
    case "formal":
      return `Rewrite this ${type.toLowerCase()} in a more formal register, keeping the facts and format.\n\nDraft:\n${req.draft || req.input}`;
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in to use the writing tool." }, { status: 401 });

  const limit = limiters.writing.check(`writing:${user.id}`);
  if (!limit.allowed) return NextResponse.json({ error: retryMessage(limit.retryAfterMs) }, { status: 429 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const req = parsed.data;

  if (!aiConfigured()) {
    return NextResponse.json({ mode: "local", output: localWrite(req) });
  }

  try {
    const client = new Anthropic({ apiKey: env.anthropicApiKey });
    const response = await client.beta.messages.create({
      model: env.aiModel,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: instruction(req) }],
    });
    if (response.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "The AI service declined this request. Try rephrasing your notes." },
        { status: 422 },
      );
    }
    const output = response.content
      .flatMap((b) => (b.type === "text" ? [b.text] : []))
      .join("")
      .trim();
    if (!output) return NextResponse.json({ error: "The AI service returned an empty draft. Please try again." }, { status: 502 });
    return NextResponse.json({ mode: "ai", model: response.model, output });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "The AI service is busy right now. Please try again in a minute." }, { status: 503 });
    }
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
      console.error("[writing] AI credentials rejected", error.status);
      return NextResponse.json({ error: "The AI service isn't configured correctly. Please contact support." }, { status: 503 });
    }
    if (error instanceof Anthropic.APIError) {
      console.error("[writing] AI API error", error.status, error.message);
      return NextResponse.json({ error: "The AI service had a problem generating your draft. Please try again." }, { status: 502 });
    }
    console.error("[writing] unexpected error", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
