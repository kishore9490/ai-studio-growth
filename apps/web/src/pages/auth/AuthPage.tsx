import { useState, type FormEvent } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Button, Callout, Field, Select, TextInput } from '../../components/ui';
import { ApiError, ApiUnreachableError, login, register } from '../../api/client';

type Tab = 'SIGN_IN' | 'SIGN_UP';

const INDUSTRIES = [
  'GENERIC',
  'IT',
  'MANUFACTURING',
  'HEALTHCARE',
  'LOGISTICS',
  'RECRUITMENT',
  'FINANCIAL_SERVICES',
  'CONSTRUCTION',
  'RETAIL',
  'EDUCATION',
  'HOSPITALITY',
  'PHARMA',
  'ENERGY',
  'TEXTILES',
  'FACILITIES',
] as const;

/**
 * Sign in or register an organization.
 *
 * Registering here creates a real organization, workspace and owner on the
 * server — it is the same call the API documents, not a form that pretends.
 */
export function AuthPage({ onAuthenticated }: { onAuthenticated: () => Promise<void> }) {
  const [tab, setTab] = useState<Tab>('SIGN_IN');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('priya.nair@abc-technologies.example');
  const [password, setPassword] = useState('bid-demo-password');

  const [legalName, setLegalName] = useState('');
  const [industry, setIndustry] = useState<string>('GENERIC');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (tab === 'SIGN_IN') await login(email, password);
      else await register({ legalName, industry, city: city || undefined, name, email, password });
      await onAuthenticated();
    } catch (submitError) {
      // Three different failures, three different things for the person to do:
      // fix the input, try again later, or tell someone the server is down.
      if (submitError instanceof ApiUnreachableError) {
        setError('The BID Trust API is not responding. Check that it is running and try again.');
      } else if (submitError instanceof ApiError) {
        setError(submitError.message);
      } else {
        setError(submitError instanceof Error ? submitError.message : String(submitError));
      }
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-navy-950 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-600 text-base font-bold text-white">
            B
          </span>
          <div>
            <p className="text-sm font-semibold tracking-wide text-white">BID TRUST</p>
            <p className="text-2xs text-navy-200">Trust, backed by verification.</p>
          </div>
        </div>

        <div className="rounded-lg border border-navy-800 bg-white p-5 shadow-lg">
          <div className="mb-4 flex gap-1 rounded-md bg-slate-100 p-1">
            {(
              [
                ['SIGN_IN', 'Sign in'],
                ['SIGN_UP', 'Register an organization'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setTab(value);
                  setError(null);
                }}
                className={
                  tab === value
                    ? 'flex-1 rounded px-3 py-1.5 text-xs font-medium bg-white text-navy-900 shadow-sm'
                    : 'flex-1 rounded px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-navy-800'
                }
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {tab === 'SIGN_UP' && (
              <>
                <Field label="Registered legal name" required>
                  <TextInput
                    value={legalName}
                    onChange={(event) => setLegalName(event.target.value)}
                    placeholder="Example Supplies Private Limited"
                    required
                    minLength={2}
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Industry">
                    <Select value={industry} onChange={(event) => setIndustry(event.target.value)}>
                      {INDUSTRIES.map((value) => (
                        <option key={value} value={value}>
                          {value.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="City">
                    <TextInput value={city} onChange={(event) => setCity(event.target.value)} placeholder="Bengaluru" />
                  </Field>
                </div>
                <Field label="Your name" required>
                  <TextInput
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Meera Raghavan"
                    required
                    minLength={2}
                  />
                </Field>
              </>
            )}

            <Field label="Work email" required>
              <TextInput
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </Field>

            <Field
              label="Password"
              required
              hint={tab === 'SIGN_UP' ? 'At least 12 characters. A passphrase beats a short complex string.' : undefined}
            >
              <TextInput
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={tab === 'SIGN_IN' ? 'current-password' : 'new-password'}
                required
              />
            </Field>

            {error && <Callout tone="exception">{error}</Callout>}

            <Button type="submit" variant="primary" loading={busy} className="w-full">
              {tab === 'SIGN_IN' ? 'Sign in' : 'Create the workspace'}
            </Button>
          </form>

          {tab === 'SIGN_UP' && (
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Registering makes your organization a <strong>BID Member</strong>: you can maintain your profile,
              respond to verification requests and hold credentials. Verifying <em>others</em> is a paid requester
              capability you can add later.
            </p>
          )}
        </div>

        <div className="mt-4 rounded-md border border-navy-800 bg-navy-900/60 p-3">
          <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-widest text-brand-300">
            <ShieldCheck className="h-3.5 w-3.5" /> Demo credentials
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-navy-100">
            The seeded network signs in with any of its accounts and the password{' '}
            <code className="rounded bg-navy-800 px-1 py-0.5 font-mono text-[11px] text-white">bid-demo-password</code>.
            Every organization and person in it is fictional.
          </p>
          <ul className="mt-2 space-y-0.5 font-mono text-[11px] text-navy-200">
            <li>priya.nair@abc-technologies.example — ABC Technologies (customer)</li>
            <li>anil.sharma@xyz-hr.example — XYZ HR Consultants (verified member)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
