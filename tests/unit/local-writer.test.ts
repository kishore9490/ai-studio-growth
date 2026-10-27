import { describe, expect, it } from "vitest";
import { extractPoints, formalise, localWrite, shorten } from "@/lib/tools/local-writer";

// The offline fallback must be deterministic and only use the user's own words.
describe("local writing fallback", () => {
  const notes = "finished the client dashboard · cut reporting time from 2 days to 3 hours · thank the team";

  it("extracts points from loosely formatted notes", () => {
    expect(extractPoints(notes).length).toBeGreaterThanOrEqual(3);
  });

  it("is deterministic", () => {
    const req = { action: "generate" as const, type: "email" as const, tone: "professional" as const, input: notes };
    expect(localWrite(req)).toBe(localWrite(req));
  });

  it("produces non-empty output for every format", () => {
    for (const type of ["email", "social", "linkedin", "summary", "blog", "rewrite"] as const) {
      expect(localWrite({ action: "generate", type, tone: "friendly", input: notes }).trim().length).toBeGreaterThan(10);
    }
  });

  it("shortens and formalises existing drafts", () => {
    const draft = "We basically just finished the project and it's really great. We can't wait to share more soon.";
    expect(shorten(draft).length).toBeLessThanOrEqual(draft.length);
    expect(formalise("We can't wait")).not.toContain("can't");
  });
});
