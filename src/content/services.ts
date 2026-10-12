/**
 * Service content. Written to be genuinely useful and accurate without making claims the client
 * has not verified. Standards are referenced as general guidance, never as the company's credentials.
 * Edit freely — each page is generated from this file.
 */

export type ServiceSlug =
  | 'fire-extinguisher-sales'
  | 'refilling-and-maintenance'
  | 'annual-maintenance-contracts'
  | 'fire-alarm-and-sprinkler-systems'
  | 'fire-safety-audits'
  | 'fire-safety-training'

export type Visual = 'product' | 'gauge' | 'calendar' | 'systems' | 'audit' | 'training'

export interface Service {
  slug: ServiceSlug
  index: string
  name: string
  short: string
  /** Card summary on the home page. */
  summary: string
  visual: Visual
  hero: { kicker: string; title: string; intro: string }
  problem: { title: string; body: string; points: string[] }
  offer: { title: string; items: { title: string; body: string }[] }
  process: { title: string; body: string }[]
  note?: string
  faqs: { q: string; a: string }[]
  cta: { title: string; body: string; label: string }
  meta: { title: string; description: string }
}

export const services: Service[] = [
  {
    slug: 'fire-extinguisher-sales',
    index: '01',
    name: 'Fire Extinguisher Sales',
    short: 'Extinguisher Sales',
    summary: 'The right extinguisher for each hazard — selected for your premises, supplied, mounted and signed.',
    visual: 'product',
    hero: {
      kicker: 'Supply & installation',
      title: 'The right extinguisher for every risk.',
      intro:
        'Different fires need different extinguishing agents. We help you choose units that match the hazards actually present on your premises, then supply, mount and sign them so they are where people expect to find them.',
    },
    problem: {
      title: 'The wrong extinguisher can make a fire worse.',
      body:
        'Water on an electrical fire risks electric shock. Dry powder in a server room can damage equipment. A kitchen fryer fire needs a wet chemical agent. Buying “one type for everything” leaves gaps that are only discovered in an emergency.',
      points: [
        'Hazards differ room by room — kitchens, electrical panels, stores and offices need different agents',
        'Units hidden behind doors or stock are as good as missing',
        'Without labels, signage and records, inspections become guesswork',
      ],
    },
    offer: {
      title: 'Extinguisher types we help you choose between',
      items: [
        { title: 'ABC dry powder', body: 'Multi-purpose cover for ordinary combustibles, flammable liquids and gases. Common in offices, shops and vehicles.' },
        { title: 'Carbon dioxide (CO₂)', body: 'Leaves no residue. Typically chosen for electrical rooms, panels and equipment areas.' },
        { title: 'Water & mechanical foam', body: 'Suited to ordinary combustibles; foam also covers many flammable-liquid risks.' },
        { title: 'Wet chemical (Class K)', body: 'Designed for cooking oil and fat fires in commercial kitchens.' },
        { title: 'Clean agent', body: 'For sensitive electronics, archives and spaces where residue must be avoided.' },
        { title: 'Mounting, signage & tagging', body: 'Brackets or stands at the correct height, photoluminescent signage and a record for every unit.' },
      ],
    },
    process: [
      { title: 'Understand the site', body: 'We discuss the layout, occupancy and activities, or walk the site with you.' },
      { title: 'Recommend', body: 'A clear list of types, capacities and locations — and why each is needed.' },
      { title: 'Supply & mount', body: 'Units delivered, mounted or placed on stands, with signage installed.' },
      { title: 'Hand over', body: 'A simple register of what is installed where, ready for future servicing.' },
    ],
    faqs: [
      {
        q: 'Which extinguisher is right for an office?',
        a: 'Most offices use ABC dry powder or water-based units for general areas and CO₂ near electrical panels and server equipment. The right mix depends on the layout and what is actually in each area, which is why we recommend a quick assessment first.',
      },
      {
        q: 'How many extinguishers do I need?',
        a: 'It depends on floor area, the type of hazard, travel distance to the nearest unit and the requirements that apply to your building. Guidance such as IS 2190 and your local fire authority’s requirements are the reference points. We work out quantities from your actual layout rather than a rule of thumb.',
      },
      {
        q: 'What should I check on the label before buying?',
        a: 'Look for the standard the extinguisher is manufactured to, the fire classes it is rated for, the manufacturing date and the manufacturer’s servicing instructions. We are happy to explain the markings on any unit we quote for.',
      },
      {
        q: 'Do you install and mount the extinguishers?',
        a: 'Yes. Supply can include mounting brackets or floor stands, installation at a sensible height and location, and signage so the units can be found quickly.',
      },
    ],
    cta: { title: 'Equip your premises correctly.', body: 'Tell us about your site and we will recommend the types and quantities it needs.', label: 'Request a Quote' },
    meta: {
      title: 'Fire Extinguisher Sales & Installation',
      description:
        'Choose the right fire extinguishers for your premises — ABC powder, CO₂, foam, wet chemical and clean agent units, supplied, mounted and signed.',
    },
  },
  {
    slug: 'refilling-and-maintenance',
    index: '02',
    name: 'Refilling & Maintenance',
    short: 'Refilling & Maintenance',
    summary: 'Inspection, recharge and pressure testing so every unit on your wall will actually discharge when it is needed.',
    visual: 'gauge',
    hero: {
      kicker: 'Service & recharge',
      title: 'An extinguisher is only as good as its last service.',
      intro:
        'Extinguishers lose pressure, agents cake, hoses perish and seals get broken. Regular inspection, maintenance and recharging keep each unit ready to work — and give you a record that proves it.',
    },
    problem: {
      title: 'Most failures are invisible from a distance.',
      body:
        'A unit can look perfect on the wall and still fail: a gauge reading out of range, a blocked nozzle, a partially discharged cylinder, a corroded valve or a cylinder that is overdue for a pressure test.',
      points: [
        'Any use — even a short test squeeze — means the unit must be recharged',
        'Dry powder can compact over time and needs periodic attention',
        'Cylinders require pressure (hydrostatic) testing at intervals set by the applicable standard',
      ],
    },
    offer: {
      title: 'What a service visit covers',
      items: [
        { title: 'Visual inspection', body: 'Location, access, signage, label legibility, physical damage and corrosion.' },
        { title: 'Pressure & weight check', body: 'Gauge reading or weight checked against the manufacturer’s specification.' },
        { title: 'Valve, hose & nozzle', body: 'Checked for blockage, cracking, perishing and secure fittings.' },
        { title: 'Recharge', body: 'Discharged or under-pressure units emptied, refilled with the correct agent and re-pressurised.' },
        { title: 'Pressure testing', body: 'Hydrostatic testing of cylinders when it falls due.' },
        { title: 'Tag & record', body: 'Each unit sealed, tagged with the service date and logged in your register.' },
      ],
    },
    process: [
      { title: 'Book', body: 'Tell us how many units, their types and where they are.' },
      { title: 'Inspect', body: 'Each unit inspected on site and the findings recorded.' },
      { title: 'Recharge & test', body: 'Units that need work are refilled or pressure tested, on site or at the workshop as appropriate.' },
      { title: 'Return & report', body: 'Units back on their brackets, sealed and tagged, with a service report for your records.' },
    ],
    note: 'Servicing intervals depend on extinguisher type, the manufacturer’s instructions and the standards that apply to your premises (for example IS 2190). We will tell you what is due and why.',
    faqs: [
      {
        q: 'How often should extinguishers be refilled?',
        a: 'Immediately after any use, however brief. Otherwise refilling and maintenance follow the intervals for that extinguisher type in the manufacturer’s instructions and the applicable standard. A routine inspection will flag any unit that is due.',
      },
      {
        q: 'The gauge needle is in range — does it still need servicing?',
        a: 'Yes. A gauge only shows pressure. It does not show a blocked nozzle, compacted powder, a damaged hose or an overdue pressure test. Routine maintenance checks all of these.',
      },
      {
        q: 'What is a hydrostatic pressure test?',
        a: 'The cylinder is filled with water and pressurised beyond its working pressure to confirm it can safely contain that pressure. It is required at set intervals for most extinguisher types.',
      },
      {
        q: 'Will my premises be without extinguishers while units are serviced?',
        a: 'Where possible, work is done on site. If units need to go to a workshop, tell us when booking and we will explain what cover can be arranged.',
      },
    ],
    cta: { title: 'Due for a refill or service?', body: 'Share the number and types of units and we will schedule a visit.', label: 'Book a Service' },
    meta: {
      title: 'Fire Extinguisher Refilling & Maintenance',
      description:
        'Fire extinguisher inspection, refilling, recharging and hydrostatic pressure testing — with sealed tags and service records for every unit.',
    },
  },
  {
    slug: 'annual-maintenance-contracts',
    index: '03',
    name: 'Annual Maintenance Contracts',
    short: 'AMC Services',
    summary: 'One agreed scope, scheduled visits and a clean paper trail — so nothing on site quietly falls out of date.',
    visual: 'calendar',
    hero: {
      kicker: 'Annual Maintenance Contract',
      title: 'Fire safety that stays current all year.',
      intro:
        'An AMC replaces one-off call-outs with a planned year: an agreed list of equipment and systems, scheduled visits, refills when they fall due, and service records you can hand to an inspector, auditor or insurer.',
    },
    problem: {
      title: 'Ad-hoc maintenance leaves gaps.',
      body:
        'When servicing depends on someone remembering, units go overdue, records scatter across invoices and nobody is sure what was checked last. Gaps tend to surface at the worst moment — during an inspection, a renewal or an incident.',
      points: ['No single register of what is installed where', 'Refill and test dates tracked in people’s heads', 'Reports that are hard to find when they are asked for'],
    },
    offer: {
      title: 'What an AMC can include',
      items: [
        { title: 'Asset register', body: 'Every extinguisher and system component listed by location, type and due dates.' },
        { title: 'Scheduled inspections', body: 'Visit frequency agreed up front, based on your equipment and risk.' },
        { title: 'Refills & recharges', body: 'Units that fall due are serviced as part of the plan, as agreed in the scope.' },
        { title: 'System checks', body: 'Fire alarm and sprinkler system checks can be included where they are in scope.' },
        { title: 'Service reports', body: 'A record after each visit, kept together so you can produce it when asked.' },
        { title: 'Single point of contact', body: 'One team that knows your site and its history.' },
      ],
    },
    process: [
      { title: 'Survey', body: 'We list your equipment and systems and note anything that needs attention now.' },
      { title: 'Agree scope', body: 'Equipment covered, visit frequency, what is included and what is charged separately.' },
      { title: 'Scheduled visits', body: 'Inspections and servicing carried out to the agreed calendar.' },
      { title: 'Report & review', body: 'Reports after each visit and a review before renewal.' },
    ],
    faqs: [
      {
        q: 'What does an AMC usually cover?',
        a: 'That is agreed with you before the contract starts. Typically it covers scheduled inspections and maintenance of listed extinguishers, and can extend to fire alarm and sprinkler systems. The scope document states exactly what is included and what would be charged separately.',
      },
      {
        q: 'How is the AMC price worked out?',
        a: 'It depends on the number and types of extinguishers, which systems are included, visit frequency and site location. After a survey we provide a written quotation.',
      },
      {
        q: 'Can one AMC cover multiple sites?',
        a: 'Yes. Multiple locations can be covered under one agreement with a separate register for each site, subject to them being within our service area.',
      },
      {
        q: 'Will the AMC records help with inspections or renewals?',
        a: 'Up-to-date service records make it far easier to show that equipment has been maintained. Approvals themselves, such as a Fire NOC, are issued by the relevant fire authority based on their own requirements.',
      },
    ],
    cta: { title: 'Plan the year once.', body: 'Book a survey and we will propose an AMC scope that fits your site.', label: 'Schedule a Survey' },
    meta: {
      title: 'Fire Safety Annual Maintenance Contracts (AMC)',
      description:
        'Annual Maintenance Contracts for fire extinguishers and fire protection systems — asset register, scheduled visits, refills and service records.',
    },
  },
  {
    slug: 'fire-alarm-and-sprinkler-systems',
    index: '04',
    name: 'Fire Alarm & Sprinkler Systems',
    short: 'Alarms & Sprinklers',
    summary: 'Detection that raises the alarm early and sprinklers that act automatically — installed, tested and maintained.',
    visual: 'systems',
    hero: {
      kicker: 'Detection & suppression systems',
      title: 'Early warning. Automatic response.',
      intro:
        'Portable extinguishers depend on someone being there. Fire detection and alarm systems warn occupants early; sprinkler systems control a fire automatically. We install, test and maintain both, working alongside your architect or fire consultant where the project needs one.',
    },
    problem: {
      title: 'A system that is not tested is a system you are hoping works.',
      body:
        'Detectors get painted over or blocked, batteries age, panels show faults that everyone learns to ignore, and sprinkler valves are left in the wrong position after building work. Regular testing finds these before a fire does.',
      points: ['Fault and disablement lights left unresolved', 'Detectors obstructed after fit-out changes', 'Sprinkler control valves not verified after maintenance'],
    },
    offer: {
      title: 'Systems we work on',
      items: [
        { title: 'Conventional & addressable alarm', body: 'Control panels, smoke and heat detectors, manual call points, sounders and strobes.' },
        { title: 'Sprinkler systems', body: 'Pipework, sprinkler heads, control valve sets and associated fittings.' },
        { title: 'Testing & commissioning', body: 'Functional testing of devices and panels, with results recorded.' },
        { title: 'Periodic maintenance', body: 'Scheduled testing and servicing, standalone or as part of an AMC.' },
        { title: 'Fault finding', body: 'Investigating recurring faults and false alarms and correcting the cause.' },
        { title: 'Modifications', body: 'Extending or relocating devices after layout changes or fit-outs.' },
      ],
    },
    process: [
      { title: 'Site survey', body: 'Review the building, occupancy and any existing system or drawings.' },
      { title: 'Proposal', body: 'Scope and quotation, coordinated with your consultant where one is involved.' },
      { title: 'Install & test', body: 'Installation followed by functional testing of every device.' },
      { title: 'Handover & upkeep', body: 'Test records, user orientation and an optional maintenance plan.' },
    ],
    note: 'Requirements for detection and sprinkler systems are set by the National Building Code of India (Part 4) and related standards such as IS 2189 and IS 15105, together with your local fire authority. System design for approval purposes may need a qualified fire consultant.',
    faqs: [
      {
        q: 'What is the difference between conventional and addressable fire alarms?',
        a: 'A conventional system reports which zone an alarm came from. An addressable system identifies the individual device, which makes it faster to locate a fire or a fault. Larger or more complex buildings usually benefit from addressable systems.',
      },
      {
        q: 'How often should a fire alarm system be tested?',
        a: 'Routine user checks are typically weekly, with periodic servicing by a competent technician at intervals set by the applicable standard and the manufacturer. We can set up a schedule for your building.',
      },
      {
        q: 'Do sprinklers all go off at once?',
        a: 'No. In a standard wet-pipe system each sprinkler head operates individually when the heat at that head reaches its rated temperature. Usually only the heads closest to the fire operate.',
      },
      {
        q: 'Can you work on a system someone else installed?',
        a: 'Usually, yes. We start with a survey to understand the existing equipment and its condition, then recommend what is needed.',
      },
    ],
    cta: { title: 'Planning a system or servicing one?', body: 'Send us the building details and any drawings you have.', label: 'Talk to Our Team' },
    meta: {
      title: 'Fire Alarm & Sprinkler Systems — Installation & Maintenance',
      description:
        'Installation, testing and maintenance of conventional and addressable fire alarm systems and sprinkler systems for commercial and industrial buildings.',
    },
  },
  {
    slug: 'fire-safety-audits',
    index: '05',
    name: 'Fire Safety Audits',
    short: 'Safety Audits',
    summary: 'A structured walk-through of your premises with clear, prioritised findings — not a pile of jargon.',
    visual: 'audit',
    hero: {
      kicker: 'Assessment & advisory',
      title: 'See your site the way a fire would.',
      intro:
        'A fire safety audit is a structured inspection of your premises — equipment, escape routes, housekeeping, electrical risks and procedures — followed by a report that tells you what to fix first.',
    },
    problem: {
      title: 'Familiar spaces hide risks.',
      body:
        'People stop noticing the stacked cartons in a stairwell, the extension board feeding four heaters or the exit sign that stopped working months ago. An outside view finds what everyday familiarity overlooks.',
      points: ['Blocked or locked escape routes', 'Overloaded electrical points and poor housekeeping', 'Equipment that is missing, inaccessible or overdue for service'],
    },
    offer: {
      title: 'What we look at',
      items: [
        { title: 'Means of escape', body: 'Exit routes, doors, stairways, signage and emergency lighting.' },
        { title: 'Fire equipment', body: 'Extinguishers, hose reels, alarm and sprinkler components — presence, access and service status.' },
        { title: 'Ignition & fuel sources', body: 'Electrical practices, hot work, kitchens, storage of flammables and housekeeping.' },
        { title: 'Procedures & people', body: 'Emergency plan, assembly points, drills, wardens and training records.' },
        { title: 'Prioritised report', body: 'Findings with photographs, ranked by urgency, with practical recommendations.' },
        { title: 'Follow-up', body: 'Optional re-visit to confirm that actions have been closed out.' },
      ],
    },
    process: [
      { title: 'Scope', body: 'Agree the areas, occupancy and any specific concerns.' },
      { title: 'Walk-through', body: 'On-site inspection with your facilities or safety contact.' },
      { title: 'Report', body: 'Clear findings, photographs and prioritised recommendations.' },
      { title: 'Act', body: 'Support with the fixes — equipment, servicing, training — if you want it.' },
    ],
    note: 'An audit report is advisory. Statutory approvals such as a Fire NOC are granted by the relevant fire authority; an audit helps you identify and address gaps beforehand.',
    faqs: [
      {
        q: 'Is a fire safety audit the same as a Fire NOC?',
        a: 'No. A Fire NOC is issued by the fire authority. An audit is an independent review that helps you find and fix issues — useful before an inspection, a renewal or a change of use.',
      },
      {
        q: 'How long does an audit take?',
        a: 'It depends on the size and complexity of the premises. A small office may take a few hours on site; a large facility can take longer. We confirm the timeline when we agree the scope.',
      },
      {
        q: 'Will the audit disrupt our operations?',
        a: 'Audits are largely observational. We plan the walk-through with you to avoid sensitive areas at busy times.',
      },
      {
        q: 'What will we receive?',
        a: 'A written report with findings, photographs and recommendations ranked by priority, so you can plan actions and budgets.',
      },
    ],
    cta: { title: 'Know where you stand.', body: 'Tell us about your premises and we will propose an audit scope.', label: 'Schedule an Inspection' },
    meta: {
      title: 'Fire Safety Audits for Commercial Premises',
      description:
        'Structured fire safety audits covering escape routes, fire equipment, electrical risks and procedures — with a prioritised, practical report.',
    },
  },
  {
    slug: 'fire-safety-training',
    index: '06',
    name: 'Fire Safety Training',
    short: 'Safety Training',
    summary: 'Practical sessions that teach people what to do in the first minutes — when it matters most.',
    visual: 'training',
    hero: {
      kicker: 'People & preparedness',
      title: 'Equipment works when people know how to use it.',
      intro:
        'Practical fire safety training for staff, wardens and residents: how fires start and spread, how to choose and operate an extinguisher, when not to fight a fire, and how to evacuate calmly.',
    },
    problem: {
      title: 'In a real fire, people do what they have practised.',
      body:
        'Most people have never pulled the pin on an extinguisher. Under stress they hesitate, pick the wrong unit or stay too long. A short, practical session changes that.',
      points: ['Uncertainty about which extinguisher to use', 'No clear roles when the alarm sounds', 'Evacuation routes and assembly points not known'],
    },
    offer: {
      title: 'Session formats',
      items: [
        { title: 'Extinguisher handling', body: 'Fire classes, choosing the right unit and the PASS technique: Pull, Aim, Squeeze, Sweep.' },
        { title: 'Fire warden training', body: 'Roles, sweeps, communication and coordination during an evacuation.' },
        { title: 'Evacuation drills', body: 'Planned drills with observation and a debrief afterwards.' },
        { title: 'Awareness talks', body: 'Short sessions for offices, schools and residential societies.' },
        { title: 'Practical demonstration', body: 'Hands-on extinguisher demonstration where the site and conditions allow it safely.' },
        { title: 'Attendance records', body: 'Session details and attendance shared for your records.' },
      ],
    },
    process: [
      { title: 'Understand your team', body: 'Group size, roles, site layout and any previous training.' },
      { title: 'Tailor', body: 'Content and examples adapted to your premises and hazards.' },
      { title: 'Deliver', body: 'Interactive session on site, with demonstration where it is safe to do so.' },
      { title: 'Follow up', body: 'Debrief, attendance record and suggestions for refreshers or drills.' },
    ],
    note: 'Training builds awareness and confidence. It does not replace manufacturer instructions, your building’s emergency plan or professional firefighting response — always call the fire service (101) in an emergency.',
    faqs: [
      {
        q: 'Who should attend?',
        a: 'Everyone benefits from basic awareness. Nominated fire wardens, security staff, facility teams and kitchen staff benefit most from practical extinguisher training.',
      },
      {
        q: 'How long is a session?',
        a: 'An awareness session can be under an hour. Practical extinguisher and warden training usually takes longer. We will suggest a format based on your group.',
      },
      {
        q: 'Do you conduct live fire demonstrations?',
        a: 'Only where the location, conditions and permissions make it safe. Otherwise we use practical handling demonstrations without live fire.',
      },
      {
        q: 'How often should training be repeated?',
        a: 'Refreshers are worthwhile at least annually and whenever there is significant staff turnover, a layout change or a new hazard.',
      },
    ],
    cta: { title: 'Prepare your people.', body: 'Tell us about your team and we will suggest a session format.', label: 'Book a Session' },
    meta: {
      title: 'Fire Safety Training & Evacuation Drills',
      description:
        'Practical fire safety training — extinguisher handling, fire warden training and evacuation drills for offices, schools, factories and residential societies.',
    },
  },
]

export const serviceBySlug = (slug: string) => services.find((s) => s.slug === slug)
