import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Callout, Card, SectionHeading } from './ui';

/**
 * Explains a surface that cannot exist against a real workspace.
 *
 * Two things in this product are only meaningful in the demo: the guided
 * journey, which performs actions as several different organizations in turn,
 * and BID's own console, which is staff software. A signed-in account is one
 * organization and is not BID — so rather than let those screens quietly write
 * to an in-browser copy that the server will never see, they say what they are
 * and how to reach them.
 */
export function DemoOnly({
  title,
  description,
  reason,
  children,
}: {
  title: string;
  description: string;
  reason: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-5">
      <SectionHeading title={title} description={description} />
      <Card>
        <Callout tone="info" title="Not available in a signed-in workspace">
          {reason}
        </Callout>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          To use it, run the application without an API — the same engine runs in the browser against the fictional
          demo network, where acting as any organization is the point.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Meanwhile, everything under{' '}
          <Link to="/app" className="text-brand-700 underline underline-offset-2">
            your workspace
          </Link>{' '}
          is live: it reads from and writes to the server.
        </p>
        {children}
      </Card>
    </div>
  );
}
