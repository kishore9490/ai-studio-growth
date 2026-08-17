import type { Entitlements, Plan } from '../domain/types.js';

/**
 * Pricing is configuration, not architecture (Section 30).
 * These values seed the plan catalog and are editable from the admin console at
 * runtime; nothing in the domain logic reads a hard-coded price.
 */
export const PRICING_DISCLAIMER =
  'Illustrative starting prices; final pricing depends on verification scope, provider costs, volume, SLA and requirements.';

const MEMBER_ENTITLEMENTS: Entitlements = {
  canInitiateVerification: false,
  canCreateCampaigns: false,
  canCreatePolicies: false,
  canRunBgv: false,
  canUseMonitoring: false,
  canUseApi: false,
  canUseWebhooks: false,
  canUseEnterpriseIntegrations: false,
  maxSeats: 3,
  maxMonitoredEntities: 0,
  includedChecksPerMonth: 0,
};

export const DEFAULT_PLANS: Plan[] = [
  {
    id: 'plan_member_free',
    tier: 'MEMBER_FREE',
    name: 'BID Member',
    monthlyPricePaise: 0,
    includedChecks: 0,
    overagePerCheckPaise: 0,
    entitlements: MEMBER_ENTITLEMENTS,
    description:
      'Free membership. Maintain your organization profile, respond to verification requests, hold credentials and your BID digital card.',
    highlights: [
      'Claim and maintain your BID organization profile',
      'Receive and respond to verification requests',
      'Provide documents and consent where required',
      'BID ID, digital card and public profile',
      'Verification history',
    ],
    quoteOnly: false,
    active: true,
  },
  {
    id: 'plan_starter',
    tier: 'STARTER',
    name: 'Starter',
    monthlyPricePaise: 999900,
    includedChecks: 100,
    overagePerCheckPaise: 59900,
    entitlements: {
      ...MEMBER_ENTITLEMENTS,
      canInitiateVerification: true,
      canCreateCampaigns: true,
      canUseMonitoring: true,
      maxSeats: 5,
      maxMonitoredEntities: 25,
      includedChecksPerMonth: 100,
    },
    description: 'For teams starting to verify their vendor or supplier base.',
    highlights: ['100 included checks / month', 'Campaigns and invitations', 'Basic monitoring (25 entities)', '5 seats'],
    quoteOnly: false,
    active: true,
  },
  {
    id: 'plan_growth',
    tier: 'GROWTH',
    name: 'Growth',
    monthlyPricePaise: 2499900,
    includedChecks: 500,
    overagePerCheckPaise: 49900,
    entitlements: {
      canInitiateVerification: true,
      canCreateCampaigns: true,
      canCreatePolicies: true,
      canRunBgv: true,
      canUseMonitoring: true,
      canUseApi: true,
      canUseWebhooks: true,
      canUseEnterpriseIntegrations: false,
      maxSeats: 15,
      maxMonitoredEntities: 100,
      includedChecksPerMonth: 500,
    },
    description: 'For growing compliance and procurement teams that need their own policies and API access.',
    highlights: [
      '500 included checks / month',
      'Custom policy engine access',
      'People verification / BGV packages',
      'Monitoring for 100 entities',
      'REST API and webhooks',
      '15 seats',
    ],
    quoteOnly: false,
    active: true,
  },
  {
    id: 'plan_business',
    tier: 'BUSINESS',
    name: 'Business',
    monthlyPricePaise: 4999900,
    includedChecks: 1200,
    overagePerCheckPaise: 44900,
    entitlements: {
      canInitiateVerification: true,
      canCreateCampaigns: true,
      canCreatePolicies: true,
      canRunBgv: true,
      canUseMonitoring: true,
      canUseApi: true,
      canUseWebhooks: true,
      canUseEnterpriseIntegrations: true,
      maxSeats: 40,
      maxMonitoredEntities: 400,
      includedChecksPerMonth: 1200,
    },
    description: 'For multi-team organizations running continuous due diligence across a large counterparty network.',
    highlights: [
      '1,200 included checks / month',
      'Dual-control approval workflows',
      'Continuous monitoring for 400 entities',
      'HRMS / ERP / ATS integration hooks',
      '40 seats',
    ],
    quoteOnly: false,
    active: true,
  },
  {
    id: 'plan_enterprise',
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    monthlyPricePaise: 10000000,
    includedChecks: 5000,
    overagePerCheckPaise: 39900,
    entitlements: {
      canInitiateVerification: true,
      canCreateCampaigns: true,
      canCreatePolicies: true,
      canRunBgv: true,
      canUseMonitoring: true,
      canUseApi: true,
      canUseWebhooks: true,
      canUseEnterpriseIntegrations: true,
      maxSeats: 500,
      maxMonitoredEntities: 5000,
      includedChecksPerMonth: 5000,
    },
    description:
      'Starting price for enterprise deployments: SSO, custom SLAs, provider routing preferences, dedicated support and procurement integrations.',
    highlights: [
      'Custom included volume',
      'SSO / OIDC and SCIM-ready',
      'Provider routing preferences and fallbacks',
      'Dedicated success and support SLAs',
      'Audit exports and retention controls',
    ],
    quoteOnly: true,
    active: true,
  },
];

/** Usage-based price book. Also configurable from the admin console. */
export interface UsagePriceBook {
  businessVerificationFromPaise: number;
  bgvFromPaise: number;
  enhancedDueDiligenceFromPaise: number;
  monitoringPerEntityMonthPaise: number;
  reverificationFromPaise: number;
  apiCallPaise: number;
}

export const DEFAULT_USAGE_PRICES: UsagePriceBook = {
  businessVerificationFromPaise: 49900,
  bgvFromPaise: 49900,
  enhancedDueDiligenceFromPaise: 99900,
  monitoringPerEntityMonthPaise: 9900,
  reverificationFromPaise: 29900,
  apiCallPaise: 20,
};

export function formatInr(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString('en-IN', { maximumFractionDigits: rupees % 1 === 0 ? 0 : 2 })}`;
}
