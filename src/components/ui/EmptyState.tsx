import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/** Honest, polished notice for sections awaiting verified content. */
export function EmptyState({
  icon: Icon,
  title,
  body,
  listTitle,
  items,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  listTitle?: string;
  items?: ReactNode[];
}) {
  return (
    <div className="card relative overflow-hidden p-8 sm:p-12">
      <div aria-hidden className="bg-grid-light pointer-events-none absolute inset-0" />
      <div className="relative grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <div>
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-line-dark bg-ivory text-gold-ink">
            <Icon aria-hidden className="h-6 w-6" />
          </span>
          <h2 className="display-md mt-6">{title}</h2>
          <p className="mt-4 max-w-xl text-ink-muted">{body}</p>
        </div>
        {items && items.length > 0 && (
          <div>
            {listTitle && <h3 className="eyebrow">{listTitle}</h3>}
            <ul className="mt-5 divide-y divide-line-dark border-y border-line-dark">
              {items.map((item, index) => (
                <li key={index} className="flex items-center gap-4 py-3.5 font-display font-medium">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
