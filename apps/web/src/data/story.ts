export interface StoryActor {
  id: string;
  label: string;
  bidId: string;
  x: number;
  y: number;
  color: string;
}

export interface StoryStep {
  id: string;
  title: string;
  narration: string;
  /** Actors visible at this step. */
  actors: string[];
  /** Edges visible at this step: [source, target, label]. */
  edges: [string, string, string][];
  /** Commercial state to display per actor at this step. */
  states: Record<string, string>;
  highlight?: string;
  note?: string;
}

export const STORY_ACTORS: StoryActor[] = [
  { id: 'abc', label: 'ABC Technologies', bidId: 'BID-BUS-00104', x: 0, y: 0, color: '#1e3a8a' },
  { id: 'xyz', label: 'XYZ HR Consultants', bidId: 'BID-BUS-00231', x: 0, y: 170, color: '#0f766e' },
  { id: 'lmn', label: 'LMN Components', bidId: 'BID-BUS-00312', x: -170, y: 340, color: '#7c2d12' },
  { id: 'opq', label: 'OPQ Logistics', bidId: 'BID-BUS-00340', x: 170, y: 340, color: '#155e75' },
];

export const STORY_STEPS: StoryStep[] = [
  {
    id: 'abc-customer',
    title: 'ABC is already a BID customer',
    narration:
      'ABC Technologies verifies the organizations it does business with. It has policies, campaigns and a paid plan. Everything that follows starts from one existing customer.',
    actors: ['abc'],
    edges: [],
    states: { abc: 'CUSTOMER' },
    highlight: 'abc',
  },
  {
    id: 'invite',
    title: 'ABC invites XYZ',
    narration:
      'ABC needs to onboard XYZ HR Consultants as a staffing partner. It selects the relationship type and the HR Consultancy Due Diligence policy, and sends an invitation.',
    actors: ['abc', 'xyz'],
    edges: [['abc', 'xyz', 'invites']],
    states: { abc: 'CUSTOMER', xyz: 'INVITED' },
    highlight: 'xyz',
  },
  {
    id: 'member',
    title: 'XYZ becomes a BID Member',
    narration:
      'XYZ registers and claims its BID identity: BID-BUS-00231. Membership is free. XYZ is not a customer, is not billed, and has not been asked to buy anything.',
    actors: ['abc', 'xyz'],
    edges: [['abc', 'xyz', 'verification requested']],
    states: { abc: 'CUSTOMER', xyz: 'MEMBER' },
    highlight: 'xyz',
    note: 'Member ≠ customer. This is the single most important distinction in the model.',
  },
  {
    id: 'verify',
    title: 'The verification runs',
    narration:
      'The policy compiles into a plan. Each check is routed to a provider, normalized, and written as evidence with source, method, timestamp and freshness. An explainable assessment follows.',
    actors: ['abc', 'xyz'],
    edges: [['abc', 'xyz', 'verifying']],
    states: { abc: 'CUSTOMER', xyz: 'VERIFICATION' },
    highlight: 'xyz',
  },
  {
    id: 'approve',
    title: 'ABC approves XYZ',
    narration:
      'ABC — not BID — decides the evidence is acceptable. A credential is issued to XYZ, and the relationship becomes active and monitored.',
    actors: ['abc', 'xyz'],
    edges: [['abc', 'xyz', 'verified · monitored']],
    states: { abc: 'CUSTOMER', xyz: 'VERIFIED_MEMBER' },
    highlight: 'xyz',
  },
  {
    id: 'discovery',
    title: 'XYZ discovers the other half of BID',
    narration:
      'XYZ now has a BID ID, a digital card and a public profile it can reuse with its next client. It also has a question: “could we verify our own suppliers this way?”',
    actors: ['abc', 'xyz'],
    edges: [['abc', 'xyz', 'verified · monitored']],
    states: { abc: 'CUSTOMER', xyz: 'DISCOVERY' },
    highlight: 'xyz',
  },
  {
    id: 'requester',
    title: 'XYZ becomes a requester, then a customer',
    narration:
      'XYZ selects what it wants to verify, picks a plan, and activates requester capabilities. Only at this point does it become a paying BID customer.',
    actors: ['abc', 'xyz'],
    edges: [['abc', 'xyz', 'verified · monitored']],
    states: { abc: 'CUSTOMER', xyz: 'CUSTOMER' },
    highlight: 'xyz',
    note: 'The invitee became a customer by discovering value — not by being sold to at the door.',
  },
  {
    id: 'invite-lmn',
    title: 'XYZ invites LMN Components',
    narration: 'The same flow repeats one hop out. LMN is invited, registers, and becomes a BID Member — free, again.',
    actors: ['abc', 'xyz', 'lmn'],
    edges: [
      ['abc', 'xyz', 'verified · monitored'],
      ['xyz', 'lmn', 'invites'],
    ],
    states: { abc: 'CUSTOMER', xyz: 'CUSTOMER', lmn: 'INVITED' },
    highlight: 'lmn',
  },
  {
    id: 'verify-lmn',
    title: 'XYZ verifies LMN',
    narration:
      'LMN is verified under a supplier policy chosen by XYZ. The evidence belongs to XYZ’s workspace — ABC cannot see it, and neither can anyone else.',
    actors: ['abc', 'xyz', 'lmn'],
    edges: [
      ['abc', 'xyz', 'verified · monitored'],
      ['xyz', 'lmn', 'verified'],
    ],
    states: { abc: 'CUSTOMER', xyz: 'CUSTOMER', lmn: 'VERIFIED_MEMBER' },
    highlight: 'lmn',
  },
  {
    id: 'expand',
    title: 'The network expands',
    narration:
      'LMN may become a requester in turn, and invite its own suppliers. Every verified organization is a candidate customer, and every customer introduces the next cohort.',
    actors: ['abc', 'xyz', 'lmn', 'opq'],
    edges: [
      ['abc', 'xyz', 'verified · monitored'],
      ['xyz', 'lmn', 'verified'],
      ['lmn', 'opq', 'invites'],
    ],
    states: { abc: 'CUSTOMER', xyz: 'CUSTOMER', lmn: 'REQUESTER', opq: 'INVITED' },
    highlight: 'opq',
    note: 'This is the acquisition model: verification is the product, and the network is the channel.',
  },
];
