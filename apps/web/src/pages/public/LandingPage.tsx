import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  FileSearch,
  Fingerprint,
  Layers,
  Lock,
  Network,
  Repeat,
  ScrollText,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { DEFAULT_PLANS, PRICING_DISCLAIMER } from '@bid/core';
import { PublicLayout } from '../../components/PublicLayout';
import { Badge, Button, Card, cx } from '../../components/ui';
import { formatInr } from '../../lib/format';

const PROBLEMS = [
  {
    title: 'Onboarding packets rot',
    body: 'A supplier sends a PDF pack once. Two years later nobody knows which parts are still true, or who checked them.',
  },
  {
    title: 'Every relationship starts from zero',
    body: 'The same company is verified separately by six customers, six times, at six different depths, with six different answers.',
  },
  {
    title: 'Badges without provenance',
    body: 'A logo on a website says “verified”. It does not say by whom, from which source, under which policy, or when.',
  },
  {
    title: 'Point-in-time checks',
    body: 'A licence lapses, a registration changes, an insurance policy expires — and the buying organization finds out from an incident.',
  },
];

const PILLARS = [
  { icon: Fingerprint, title: 'Identity', body: 'A stable BID ID for every organization and person, separate from any tenant.' },
  { icon: Network, title: 'Relationship', body: 'Vendor, supplier, contractor, employer — a first-class object with its own lifecycle.' },
  { icon: ScrollText, title: 'Policy', body: 'What must be true, how deeply, who approves, and how often it is re-checked.' },
  { icon: FileSearch, title: 'Verification', body: 'Provider-neutral orchestration of the checks a policy requires.' },
  { icon: Layers, title: 'Evidence', body: 'What / source / method / when / result / scope / freshness, for every check.' },
  { icon: ShieldCheck, title: 'Assessment', body: 'An explainable verdict per category, bounded by the evidence collected.' },
  { icon: CheckCircle2, title: 'Credential', body: 'A portable outcome the verified organization can reuse with its next customer.' },
  { icon: Activity, title: 'Monitoring', body: 'Signals watched between verifications, with alerts and re-assessment.' },
];

const FAQ = [
  {
    q: 'Is BID a government authority or a certification body?',
    a: 'No. BID Trust is an independent private platform. It records what was checked, by which provider, from which source and when. It does not certify businesses and does not carry government endorsement.',
  },
  {
    q: 'Does BID replace our existing BGV or KYB provider?',
    a: 'No. Existing providers stay the execution layer. BID adds the policy, evidence, assessment, credential and monitoring layer around them, and can route the same check to different providers by cost, SLA, coverage or quality.',
  },
  {
    q: 'What is the difference between a BID Member and a BID Customer?',
    a: 'A member holds its identity, responds to verification requests and carries credentials — free. A customer initiates verification of others, which is the paid capability. Most customers start as members.',
  },
  {
    q: 'Can a company see who else has verified a counterparty?',
    a: 'No. Relationships and evidence belong to the workspace that created them. Public profiles show only what is safe to publish, and never raw evidence.',
  },
  {
    q: 'How do you handle personal data in background verification?',
    a: 'People verification runs only against a recorded consent whose purpose and scope are stored, evidence is classified restricted, and there is no public candidate database. BID does not sell personal data.',
  },
  {
    q: 'Is a verification valid forever?',
    a: 'No. Every policy sets a validity window and a re-verification interval, and every piece of evidence carries its own freshness. Monitoring covers the gap between verifications.',
  },
];

export function LandingPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-navy-950">
        <div className="absolute inset-0 opacity-40 [background:radial-gradient(60%_50%_at_70%_0%,#1d45d8_0%,transparent_60%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <Badge tone="brand" className="bg-brand-500/15 text-brand-200">
              Business Identity & Due Diligence
            </Badge>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl"
            >
              Trust, backed by verification.
            </motion.h1>
            <p className="mt-4 max-w-xl text-lg text-navy-100">
              Verify the businesses and people your organization does business with — with evidence you can inspect, policies
              you control, and monitoring that does not stop when the onboarding does.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/app/verifications/new">
                <Button variant="primary" size="md" icon={<ShieldCheck className="h-4 w-4" />}>
                  Start verification
                </Button>
              </Link>
              <Link to="/app">
                <Button variant="onDark">Explore BID</Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-navy-300">
              Independent private platform · not a government authority · demo environment with fictional organizations.
            </p>
          </div>

          <div className="relative">
            <div className="rounded-lg border border-navy-800 bg-navy-900/70 p-4 shadow-panel backdrop-blur">
              <p className="text-2xs uppercase tracking-wider text-navy-300">Evidence, not adjectives</p>
              <div className="mt-3 space-y-2">
                {[
                  { what: 'GST registration', source: 'Authorized GST data provider', result: 'VERIFIED', when: '17 May 2026' },
                  { what: 'Company registry identity', source: 'Registry data provider (MCA-derived)', result: 'VERIFIED', when: '17 May 2026' },
                  { what: 'Sanctions & watchlist', source: 'Screening data provider', result: 'CLEAR', when: '17 May 2026' },
                  { what: 'Statutory workforce compliance', source: 'Compliance data provider', result: 'ATTENTION', when: '29 Jul 2026' },
                ].map((row) => (
                  <div key={row.what} className="flex items-center justify-between gap-3 rounded border border-navy-800 bg-navy-950/60 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-white">{row.what}</p>
                      <p className="truncate text-2xs text-navy-300">{row.source}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={cx(
                          'rounded px-1.5 py-0.5 text-2xs font-bold',
                          row.result === 'ATTENTION' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300',
                        )}
                      >
                        {row.result}
                      </span>
                      <p className="mt-0.5 text-2xs text-navy-400">{row.when}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-2xs leading-relaxed text-navy-300">
                Every BID result answers: what was checked, from which source, by which provider, using which method, when,
                with what scope and how fresh it still is.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <Section
        eyebrow="The problem"
        title="Due diligence decays the moment it is finished"
        description="Most organizations verify counterparties once, in a spreadsheet, at the start of a relationship that then runs for years."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PROBLEMS.map((problem) => (
            <Card key={problem.title}>
              <p className="text-sm font-semibold text-navy-900">{problem.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{problem.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section
        eyebrow="How BID works"
        title="One engine. Configurable policy. Evidence at every step."
        description="BID is industry-agnostic by construction: a hospital verifying a medical supplier and a factory verifying a tier-1 supplier run identical code paths with different policies."
        tone="muted"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((pillar) => (
            <Card key={pillar.title}>
              <pillar.icon className="h-5 w-5 text-brand-600" />
              <p className="mt-2 text-sm font-semibold text-navy-900">{pillar.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{pillar.body}</p>
            </Card>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/demo">
            <Button icon={<ArrowRight className="h-4 w-4" />}>Generate a policy for your case</Button>
          </Link>
          <Link to="/scenarios">
            <Button>See seven industry scenarios</Button>
          </Link>
        </div>
      </Section>

      {/* Business + people verification */}
      <Section eyebrow="What you can verify" title="Businesses and the people inside them">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <Building2 className="h-5 w-5 text-brand-600" />
            <p className="mt-2 text-base font-semibold text-navy-900">Business verification</p>
            <p className="mt-1 text-sm text-slate-600">
              Identity and registry, statutory and sector compliance, banking and financial signals, sanctions and adverse
              media — composed by policy, executed by routed providers, recorded as evidence.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
              {['Vendors and suppliers', 'Contractors and service providers', 'Distributors and channel partners', 'Consultants and staffing partners'].map(
                (item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </Card>
          <Card>
            <Users className="h-5 w-5 text-brand-600" />
            <p className="mt-2 text-base font-semibold text-navy-900">People verification</p>
            <p className="mt-1 text-sm text-slate-600">
              Identity, address, education, employment and professional credentials — consent-gated, restricted by default, and
              visible only to the workspace that requested them.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
              {[
                'Consent recorded with purpose, scope, version and expiry',
                'No public candidate database, ever',
                'Evidence classified restricted by default',
                'Authorization to act on behalf is a separate object',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      {/* Providers */}
      <Section
        eyebrow="Provider ecosystem"
        title="BID does not replace your verification providers"
        description="Existing KYB, BGV, identity, banking and screening providers remain the execution layer. BID is the orchestration, evidence and assessment layer above them."
        tone="muted"
      >
        <Card>
          <div className="grid gap-3 text-center text-xs font-medium text-slate-600 md:grid-cols-9 md:items-center">
            {['Enterprise', 'BID policy', 'Provider router', 'Provider', 'Normalized result', 'Evidence', 'Assessment', 'Credential', 'Monitoring'].map(
              (label, index, array) => (
                <div key={label} className="flex items-center justify-center gap-2">
                  <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-2">{label}</span>
                  {index < array.length - 1 && <ArrowRight className="hidden h-3 w-3 text-slate-400 md:block" />}
                </div>
              ),
            )}
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Because routing is configuration rather than business logic, BID can later support provider selection, fallback,
            cost optimization, SLA-based routing, geographic coverage and quality scoring without changing the verification
            engine.
          </p>
        </Card>
      </Section>

      {/* Network effect */}
      <Section eyebrow="Network effect" title="Every verified organization is a future requester">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <Repeat className="h-5 w-5 text-brand-600" />
            <p className="mt-2 text-sm font-semibold text-navy-900">The flywheel</p>
            <ol className="mt-2 space-y-1.5 text-sm text-slate-700">
              {[
                'ABC verifies XYZ',
                'XYZ becomes a BID Member — free',
                'XYZ is verified and gets a reusable credential',
                'XYZ discovers it can verify its own network',
                'XYZ becomes a requester, then a paying customer',
                'XYZ invites LMN, and the loop repeats',
              ].map((step, index) => (
                <li key={step} className="flex gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-2xs font-bold text-white">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <Link to="/story" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
              Play the network story <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
          <Card>
            <p className="text-sm font-semibold text-navy-900">Member ≠ customer</p>
            <p className="mt-1 text-sm text-slate-600">
              The distinction is enforced in the data model, the permission layer, billing and analytics — not just in
              marketing copy. An invited organization gets a real identity, a real credential and a real profile before it is
              ever asked to pay.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded border border-slate-200 p-3">
                <p className="text-xs font-semibold text-navy-900">BID Member — free</p>
                <ul className="mt-1 space-y-1 text-2xs text-slate-600">
                  <li>Claim and maintain the organization profile</li>
                  <li>Respond to verification requests</li>
                  <li>Hold credentials, BID ID and digital card</li>
                </ul>
              </div>
              <div className="rounded border border-brand-200 bg-brand-50/50 p-3">
                <p className="text-xs font-semibold text-navy-900">BID Requester — paid</p>
                <ul className="mt-1 space-y-1 text-2xs text-slate-600">
                  <li>Initiate verification and campaigns</li>
                  <li>Author and version policies</li>
                  <li>Continuous monitoring, API and BGV</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </Section>

      {/* Security */}
      <Section
        id="security"
        eyebrow="Security & privacy"
        title="Membership of a network is never a reason to see someone's data"
        tone="muted"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: 'Tenant isolation', body: 'Organization identity is global; workspaces are private tenants. Every operation carries and checks a workspace boundary.' },
            { title: 'Field-level visibility', body: 'Every field is classified public, organization-only, relationship-only, authorized-only, sensitive or restricted.' },
            { title: 'Consent and authorization', body: 'Separate objects with separate lifecycles, both revocable, both recorded.' },
            { title: 'Evidence integrity', body: 'Each evidence record carries a payload hash and links to a hash-chained audit entry.' },
            { title: 'Least data', body: 'Only the attributes a policy actually needs are collected, stored and shared.' },
            { title: 'Auditability', body: 'Every state change is attributable: who, what, when, from which source, under which policy version.' },
          ].map((item) => (
            <Card key={item.title}>
              <p className="text-sm font-semibold text-navy-900">{item.title}</p>
              <p className="mt-1 text-sm text-slate-600">{item.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Pricing */}
      <Section id="pricing" eyebrow="Pricing" title="Membership is free. Verifying others is the product.">
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {DEFAULT_PLANS.map((plan) => (
            <Card key={plan.id} className={cx(plan.tier === 'GROWTH' && 'border-brand-400 ring-1 ring-brand-200')}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-navy-900">{plan.name}</p>
                {plan.tier === 'GROWTH' && <Badge tone="brand">Popular</Badge>}
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-navy-900">
                {plan.monthlyPricePaise === 0 ? 'Free' : formatInr(plan.monthlyPricePaise)}
                {plan.monthlyPricePaise > 0 && <span className="text-sm font-normal text-slate-500">/mo</span>}
              </p>
              {plan.quoteOnly && <p className="text-2xs text-slate-500">Starting price — quoted per deployment</p>}
              <p className="mt-2 text-xs text-slate-600">{plan.description}</p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-700">
                {plan.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-1.5">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Business verification', value: 'from ₹499 / check' },
            { label: 'Background verification (BGV)', value: 'from ₹499 / check or package' },
            { label: 'Enhanced due diligence', value: 'from ₹999' },
          ].map((item) => (
            <div key={item.label} className="rounded border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-navy-900">{item.label}</p>
              <p className="text-sm text-slate-700">{item.value}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">{PRICING_DISCLAIMER}</p>
      </Section>

      {/* FAQ */}
      <Section id="faq" eyebrow="FAQ" title="Straight answers" tone="muted">
        <div className="grid gap-4 md:grid-cols-2">
          {FAQ.map((item) => (
            <Card key={item.q}>
              <p className="text-sm font-semibold text-navy-900">{item.q}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.a}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <section className="border-t border-slate-200 bg-navy-950">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-4 py-12 sm:px-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">Don’t trust the badge. Verify the verification.</h2>
            <p className="mt-1 max-w-xl text-sm text-navy-200">
              Open the demo environment: ABC Technologies has already verified XYZ HR Consultants. Switch into XYZ and watch a
              verified member turn into a requester.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/app">
              <Button variant="primary">Open the product</Button>
            </Link>
            <Link to="/app/journey">
              <Button variant="onDark">Run the guided journey</Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  tone = 'default',
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  tone?: 'default' | 'muted';
}) {
  return (
    <section id={id} className={cx('border-b border-slate-200', tone === 'muted' ? 'bg-slate-50' : 'bg-white')}>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <p className="text-2xs font-semibold uppercase tracking-widest text-brand-700">{eyebrow}</p>
        <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-navy-900 sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 max-w-3xl text-base text-slate-600">{description}</p>}
        <div className="mt-7">{children}</div>
      </div>
    </section>
  );
}
