/** Editable homepage copy. Keep claims factual — no statistics or credentials unless verified (see src/config/site.ts). */

export const heroCopy = {
  eyebrow: 'Fire protection · Servicing · Maintenance',
  titleLines: ['Engineered', 'for safer', 'spaces.'],
  lede: 'Professional fire protection, equipment servicing and maintenance solutions for the places that matter.',
  primaryCta: 'Book a Service',
  secondaryCta: 'Explore Our Solutions',
  tertiaryCta: 'Request a Quote',
  detailTitle: 'Every fitting. Inspected.',
  detailBody:
    'Gauge, seal, valve, hose and shell — the components that decide whether an extinguisher works when it is needed.',
  revealTitle: 'Ready when it matters.',
  revealBody: 'Supply, servicing, systems, audits and training — one accountable team for your premises.',
}

export const introCopy = {
  kicker: 'Who we are',
  statement:
    'Fire protection is not a product you buy once. It is equipment that must work on the one day it is needed — and people who know what to do with it.',
  body: 'We supply, install, service and maintain fire safety equipment and systems for commercial, industrial and residential premises, and train the people who rely on them.',
  pillars: [
    { k: 'Supply', t: 'The right equipment', d: 'Extinguishers and system components chosen for the hazards actually present on site.' },
    { k: 'Service', t: 'Kept ready', d: 'Inspection, recharge, testing and records that show it — visit after visit.' },
    { k: 'Systems', t: 'Detection & suppression', d: 'Fire alarm and sprinkler systems installed, tested and maintained.' },
    { k: 'People', t: 'Prepared teams', d: 'Practical training and drills so the first minutes are handled well.' },
  ],
}

export const industries = [
  { name: 'Offices & IT parks', note: 'Electrical rooms, server spaces, open-plan floors' },
  { name: 'Retail & shopping centres', note: 'Public occupancy, stockrooms, food courts' },
  { name: 'Hospitals & clinics', note: 'Occupants who cannot self-evacuate easily' },
  { name: 'Schools & colleges', note: 'Laboratories, kitchens, large assemblies' },
  { name: 'Hotels & restaurants', note: 'Commercial kitchens and guest floors' },
  { name: 'Warehouses & logistics', note: 'High storage, packaging, forklifts and charging' },
  { name: 'Manufacturing', note: 'Process hazards, flammables, hot work' },
  { name: 'Residential societies', note: 'Common areas, basements, pump rooms' },
]

/** Illustrative AMC year — the real schedule is agreed per site. */
export const amcYear = [
  { m: 'Q1', t: 'Survey & register', d: 'Every unit and system component listed by location with due dates.' },
  { m: 'Q2', t: 'Scheduled inspection', d: 'Extinguishers checked; any due refills and tests carried out.' },
  { m: 'Q3', t: 'System checks', d: 'Alarm and sprinkler checks where they are part of the scope.' },
  { m: 'Q4', t: 'Review & renew', d: 'Year’s records compiled; scope reviewed before renewal.' },
]

export const providerChecklist = [
  'Ask to see current registrations or licences that apply to fire equipment servicing in your state.',
  'Ask how technicians are trained, and who supervises recharge and pressure-testing work.',
  'Expect a sealed tag and a dated record on every extinguisher that is serviced.',
  'Expect a written scope before an AMC starts — what is included, and what is charged separately.',
  'Ask which standards and manufacturer instructions the servicing follows.',
]

export const homeFaqs = [
  {
    q: 'How do I know if my fire extinguishers need servicing?',
    a: 'Check the service tag for the last service date, look at the gauge (if fitted), and make sure the pin and tamper seal are intact. If a unit has been used at all, the seal is broken, the tag is out of date or you are unsure, book an inspection.',
  },
  {
    q: 'What is the difference between refilling and an AMC?',
    a: 'Refilling is a one-off service for specific units. An Annual Maintenance Contract plans the whole year: an asset register, scheduled inspections, refills as they fall due and records kept together.',
  },
  {
    q: 'Do you work with residential societies and small businesses?',
    a: 'Yes. Whether it is a single shop or a multi-tower society, the process starts by understanding what is on site and what it needs.',
  },
  {
    q: 'Can you help us prepare for a fire inspection?',
    a: 'A fire safety audit identifies gaps in equipment, escape routes and procedures so you can address them beforehand. Approvals themselves are issued by the fire authority.',
  },
  {
    q: 'What should we do in a fire emergency?',
    a: 'Raise the alarm, evacuate and call the fire service on 101 (or 112). Only attempt to tackle a small fire if you are trained, it is safe and you have a clear exit behind you.',
  },
]
