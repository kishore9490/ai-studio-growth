import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { BidLogo } from './domain';
import { Button, cx } from './ui';

const NAV = [
  { to: '/scenarios', label: 'Scenarios' },
  { to: '/demo', label: 'Policy demo' },
  { to: '/story', label: 'Network story' },
  { to: '/architecture', label: 'Architecture' },
  { to: '/profile/BID-BUS-00231', label: 'Sample profile' },
];

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6">
          <Link to="/" className="text-navy-900">
            <BidLogo />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cx(
                    'rounded px-2.5 py-1.5 text-sm transition',
                    isActive ? 'bg-slate-100 text-navy-900' : 'text-slate-600 hover:bg-slate-50 hover:text-navy-900',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/app" className="hidden sm:block">
              <Button>Open the product</Button>
            </Link>
            <Link to="/app/verifications/new">
              <Button variant="primary">Start verification</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 bg-navy-950 text-navy-200">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-4">
          <div>
            <div className="text-white">
              <BidLogo />
            </div>
            <p className="mt-3 max-w-xs text-xs leading-relaxed">
              BID Trust is an independent private trust and verification platform. It is not a government authority, does not
              certify businesses, and does not guarantee outcomes.
            </p>
          </div>
          <FooterColumn
            title="Product"
            links={[
              { to: '/app', label: 'Organization dashboard' },
              { to: '/app/policies', label: 'Policy engine' },
              { to: '/app/monitoring', label: 'Monitoring' },
              { to: '/admin', label: 'Admin console' },
            ]}
          />
          <FooterColumn
            title="Explore"
            links={[
              { to: '/scenarios', label: 'Business scenarios' },
              { to: '/demo', label: 'Generate a policy' },
              { to: '/story', label: 'Network story' },
              { to: '/architecture', label: 'Architecture explorer' },
            ]}
          />
          <FooterColumn
            title="Trust"
            links={[
              { to: '/profile/BID-BUS-00231', label: 'Sample public profile' },
              { to: '/app/audit', label: 'Audit & events' },
              { to: '/#security', label: 'Security posture' },
              { to: '/#faq', label: 'FAQ' },
            ]}
          />
        </div>
        <div className="border-t border-navy-900">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-2xs sm:px-6">
            <span>© {new Date().getFullYear()} BID Trust · bidtrust.in · Demo environment with fictional organizations.</span>
            <span className="inline-flex items-center gap-1">
              Trust, backed by verification. <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterColumn({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <p className="text-2xs font-semibold uppercase tracking-wider text-navy-400">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {links.map((link) => (
          <li key={link.to + link.label}>
            <Link to={link.to} className="text-xs text-navy-200 hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
