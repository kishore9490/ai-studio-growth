import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Reveal } from '@/components/motion/Reveal';

export function SectionHeading({
  eyebrow,
  title,
  body,
  id,
  align = 'left',
  className,
  as: Heading = 'h2',
}: {
  eyebrow?: string;
  title: ReactNode;
  body?: ReactNode;
  id?: string;
  align?: 'left' | 'center';
  className?: string;
  as?: 'h2' | 'h3';
}) {
  return (
    <Reveal className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && <p className={cn('eyebrow', align === 'center' && 'justify-center')}>{eyebrow}</p>}
      <Heading id={id} className="display-lg mt-5">
        {title}
      </Heading>
      {body && <div className="lead mt-6 opacity-85">{body}</div>}
    </Reveal>
  );
}
