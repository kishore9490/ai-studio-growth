import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Check, ChevronDown, Info, X } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* utilities                                                           */
/* ------------------------------------------------------------------ */

export function cx(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(' ');
}

export type Tone = 'verified' | 'attention' | 'exception' | 'pending' | 'info' | 'neutral' | 'brand';

const TONE_CLASSES: Record<Tone, string> = {
  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  attention: 'bg-amber-50 text-amber-800 border-amber-200',
  exception: 'bg-red-50 text-red-700 border-red-200',
  pending: 'bg-slate-100 text-slate-600 border-slate-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  neutral: 'bg-white text-slate-700 border-slate-200',
  brand: 'bg-brand-50 text-brand-700 border-brand-200',
};

export const TONE_DOT: Record<Tone, string> = {
  verified: 'bg-emerald-500',
  attention: 'bg-amber-500',
  exception: 'bg-red-500',
  pending: 'bg-slate-400',
  info: 'bg-sky-500',
  neutral: 'bg-slate-400',
  brand: 'bg-brand-500',
};

/* ------------------------------------------------------------------ */
/* primitives                                                          */
/* ------------------------------------------------------------------ */

export function Badge({
  children,
  tone = 'neutral',
  dot,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {dot && <span className={cx('h-1.5 w-1.5 rounded-full', TONE_DOT[tone])} />}
      {children}
    </span>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle' | 'onDark';
  size?: 'sm' | 'md';
  icon?: ReactNode;
  loading?: boolean;
};

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-50';
  const sizes = { sm: 'px-2.5 py-1.5 text-xs', md: 'px-3.5 py-2 text-sm' };
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
    secondary: 'border border-slate-300 bg-white text-navy-800 hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    subtle: 'bg-navy-900 text-white hover:bg-navy-800',
    // For placement on the dark navy surfaces (hero, CTA bands).
    onDark: 'border border-navy-700 bg-navy-900 text-white hover:bg-navy-800',
  };
  return (
    <button
      className={cx(base, sizes[size], variants[variant], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cx('h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent', className)}
    />
  );
}

export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return <div className={cx('bid-card', padded && 'p-4', className)}>{children}</div>;
}

export function SectionHeading({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('flex flex-wrap items-start justify-between gap-3', className)}>
      <div>
        <h2 className="text-base font-semibold text-navy-900">{title}</h2>
        {description && <p className="mt-0.5 max-w-3xl text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sublabel,
  tone = 'neutral',
  icon,
  onClick,
}: {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
  onClick?: () => void;
}) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={cx(
        'bid-card flex w-full flex-col gap-1 p-4 text-left',
        onClick && 'transition hover:border-brand-300 hover:shadow-panel',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="bid-label">{label}</span>
        {icon ?? <span className={cx('h-2 w-2 rounded-full', TONE_DOT[tone])} />}
      </div>
      <span className="text-2xl font-semibold tracking-tight text-navy-900">{value}</span>
      {sublabel && <span className="text-xs text-slate-500">{sublabel}</span>}
    </Wrapper>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center">
      {icon && <div className="text-slate-400">{icon}</div>}
      <p className="text-sm font-semibold text-navy-800">{title}</p>
      {description && <p className="max-w-md text-sm text-slate-500">{description}</p>}
      {action}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  required,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="bid-label">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx('bid-input', props.className)} />;
}

export function Select({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={cx('bid-input appearance-none pr-8', props.className)}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-slate-400" />
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 text-sm text-slate-700"
    >
      <span
        className={cx(
          'relative h-5 w-9 rounded-full transition',
          checked ? 'bg-brand-600' : 'bg-slate-300',
        )}
      >
        <span
          className={cx(
            'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0',
          )}
        />
      </span>
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* overlays                                                            */
/* ------------------------------------------------------------------ */

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'max-w-xl',
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-navy-950/40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className={cx(
              'relative flex h-full w-full flex-col bg-white shadow-panel',
              width,
              // On mobile the drawer behaves as a bottom sheet.
              'max-sm:mt-auto max-sm:h-[85%] max-sm:max-w-none max-sm:rounded-t-lg',
            )}
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-navy-900">{title}</h3>
                {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="bid-scroll flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && <footer className="border-t border-slate-200 px-5 py-3">{footer}</footer>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-navy-950/45"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className={cx('relative w-full rounded-lg bg-white shadow-panel', width)}
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-navy-900">{title}</h3>
                {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
              </div>
              <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="bid-scroll max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
            {footer && <footer className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">{footer}</footer>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function Tooltip({ label, children }: { label: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span className="absolute bottom-full left-1/2 z-40 mb-1.5 w-max max-w-xs -translate-x-1/2 rounded bg-navy-900 px-2 py-1 text-2xs font-medium text-white shadow-panel">
          {label}
        </span>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* structure                                                           */
/* ------------------------------------------------------------------ */

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
}
const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({
  tabs,
  value,
  onChange,
  children,
}: {
  tabs: { id: string; label: ReactNode; badge?: ReactNode }[];
  value: string;
  onChange: (value: string) => void;
  children?: ReactNode;
}) {
  return (
    <TabsContext.Provider value={{ value, setValue: onChange }}>
      <div className="border-b border-slate-200">
        <nav className="bid-scroll -mb-px flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cx(
                'flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition',
                value === tab.id
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
              )}
            >
              {tab.label}
              {tab.badge}
            </button>
          ))}
        </nav>
      </div>
      {children}
    </TabsContext.Provider>
  );
}

export function TabPanel({ id, children }: { id: string; children: ReactNode }) {
  const context = useContext(TabsContext);
  if (!context || context.value !== id) return null;
  return <div className="animate-fade-in pt-4">{children}</div>;
}

export function DataList({ items }: { items: { label: ReactNode; value: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-slate-100">
      {items.map((item, index) => (
        <div key={index} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
          <dt className="text-xs font-medium text-slate-500">{item.label}</dt>
          <dd className="text-sm text-navy-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ProgressBar({ value, tone = 'brand' }: { value: number; tone?: Tone }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className={cx('h-full rounded-full transition-all', TONE_DOT[tone])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function Stepper({
  steps,
  current,
}: {
  steps: { id: string; label: string; description?: string }[];
  current: number;
}) {
  return (
    <ol className="flex flex-wrap gap-x-6 gap-y-3">
      {steps.map((step, index) => {
        const state = index < current ? 'done' : index === current ? 'active' : 'todo';
        return (
          <li key={step.id} className="flex items-start gap-2">
            <span
              className={cx(
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-2xs font-bold',
                state === 'done' && 'bg-emerald-600 text-white',
                state === 'active' && 'bg-brand-600 text-white',
                state === 'todo' && 'bg-slate-200 text-slate-500',
              )}
            >
              {state === 'done' ? <Check className="h-3 w-3" /> : index + 1}
            </span>
            <span>
              <span
                className={cx(
                  'block text-xs font-semibold',
                  state === 'todo' ? 'text-slate-400' : 'text-navy-900',
                )}
              >
                {step.label}
              </span>
              {step.description && <span className="block text-2xs text-slate-500">{step.description}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function Timeline({
  items,
}: {
  items: { title: ReactNode; time?: string; description?: ReactNode; tone?: Tone }[];
}) {
  return (
    <ol className="relative space-y-4 border-l border-slate-200 pl-4">
      {items.map((item, index) => (
        <li key={index} className="relative">
          <span
            className={cx(
              'absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white',
              TONE_DOT[item.tone ?? 'pending'],
            )}
          />
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-navy-900">{item.title}</p>
            {item.time && <span className="text-2xs text-slate-400">{item.time}</span>}
          </div>
          {item.description && <div className="mt-0.5 text-xs text-slate-600">{item.description}</div>}
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* messaging                                                           */
/* ------------------------------------------------------------------ */

export function Callout({
  tone = 'info',
  title,
  children,
  icon,
}: {
  tone?: Tone;
  title?: ReactNode;
  children: ReactNode;
  icon?: ReactNode;
}) {
  const iconByTone: Partial<Record<Tone, ReactNode>> = {
    info: <Info className="h-4 w-4" />,
    attention: <AlertTriangle className="h-4 w-4" />,
    exception: <AlertTriangle className="h-4 w-4" />,
    verified: <Check className="h-4 w-4" />,
  };
  return (
    <div className={cx('flex gap-2.5 rounded border p-3 text-sm', TONE_CLASSES[tone])}>
      <span className="mt-0.5 shrink-0">{icon ?? iconByTone[tone] ?? <Info className="h-4 w-4" />}</span>
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div className={cx(title ? 'mt-0.5' : '', 'text-[13px] leading-relaxed opacity-90')}>{children}</div>
      </div>
    </div>
  );
}

/** Marks behaviour that is simulated in this build rather than production-wired. */
export function DemoNote({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-2xs font-medium text-slate-500">
      <Info className="h-3 w-3" />
      {children}
    </span>
  );
}

export function Toast({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 4200);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-md bg-navy-900 px-4 py-2.5 text-sm text-white shadow-panel"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
