// Renders the lightweight resource format: blank-line separated blocks,
// "## " headings and "- " bullet lists. Plain text only — no HTML injection.

export function ResourceBody({ body }: { body: string }) {
  const blocks = body.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-5 text-[16.5px] leading-[1.75] text-ink">
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) {
          const [heading, ...rest] = block.split("\n");
          return (
            <div key={i} className="space-y-3 pt-3">
              <h2 className="text-[21px] font-semibold tracking-[-0.025em]">{heading.slice(3)}</h2>
              {rest.length > 0 && <ResourceBody body={rest.join("\n")} />}
            </div>
          );
        }
        const lines = block.split("\n");
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="space-y-2 pl-1">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-3">
                  <span className="mt-[11px] size-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{l.slice(2)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-ink-2">
            {block}
          </p>
        );
      })}
    </div>
  );
}
