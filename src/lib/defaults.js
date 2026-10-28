import brand from '@brand';

export { brand };
export const STORAGE_KEY = brand.storageKey;

export const COLOR_PRESETS = [
  ...brand.presets,
  { id: 'navy-teal', name: 'Navy & Teal', primary: '#0B2545', secondary: '#0E9F9A' },
  { id: 'emc-logo', name: 'EMC Logo Blue', primary: '#0B4A9E', secondary: '#13B5D6' },
  { id: 'royal-sky', name: 'Royal & Sky', primary: '#1C3F8C', secondary: '#1BA3D9' },
  { id: 'forest-mint', name: 'Forest & Mint', primary: '#0F3B3A', secondary: '#27B08B' },
  { id: 'burgundy-gold', name: 'Burgundy & Gold', primary: '#5A1F33', secondary: '#B8903F' },
  { id: 'indigo-aqua', name: 'Indigo & Aqua', primary: '#2B2B6B', secondary: '#33B6C4' },
];

export const DESIGNS = [
  { id: 'classic', name: 'Clinical Classic', note: 'White header, accent rule, ECG detail' },
  { id: 'band', name: 'Executive Band', note: 'Solid colour header and footer bands' },
  { id: 'elegant', name: 'Elegant Minimal', note: 'Serif name, fine hairlines' },
  { id: 'ribbon', name: 'Corporate Ribbon', note: 'Slanted colour ribbons, icon chips' },
  { id: 'wave', name: 'Medical Wave', note: 'Cyan wave header and footer, like the EMC flyer' },
];

export const LOGO_STYLES = [
  { id: 'code', name: 'Code + Cross' },
  { id: 'cross', name: 'Pulse Cross' },
  { id: 'shield', name: 'Shield' },
  { id: 'monogram', name: 'Monogram' },
];

const BASE_STATE = {
  academy: {
    name: 'Expert Medical Coding Academy',
    tagline: 'Excellence in Medical Coding Training & Certification',
    address: '',
    city: '',
    state: '',
    pin: '',
    phone: '',
    whatsapp: '',
    email: '',
    website: '',
    regNo: '',
  },
  extra: {
    facebook: '',
    instagram: '',
    linkedin: '',
    youtube: '',
    twitter: '',
    accreditation: '',
    footerText: '',
    additionalInfo: '',
    customDetails: [],
  },
  letter: {
    refNo: '',
    date: '',
    subject: '',
    body: '',
    signName: '',
    signTitle: '',
  },
  branding: {
    logoMode: 'generated', // 'generated' | 'upload' | 'none'
    uploadedLogo: '',
    logoStyle: 'code',
    logoInitials: '',
    primary: '#0B2545',
    secondary: '#0E9F9A',
    presetId: 'navy-teal',
  },
  layout: {
    design: 'classic',
    align: 'left', // 'left' | 'center'
    logoSize: 76,
    showName: true,
    showTagline: true,
    showFooter: true,
    showWatermark: false,
    contactPlacement: 'header', // 'header' | 'footer'
  },
  show: {
    phone: true,
    whatsapp: true,
    email: true,
    website: true,
    address: true,
    regNo: true,
    accreditation: true,
    social: true,
    footerText: true,
    additionalInfo: true,
    customDetails: true,
  },
  exportOpts: {
    fileName: 'EMCA-Letterhead',
    quality: 'high', // 'standard' | 'high'
  },
};

function applyOverrides(base, overrides) {
  const out = structuredClone(base);
  for (const [group, values] of Object.entries(overrides || {})) out[group] = { ...out[group], ...values };
  return out;
}

export const DEFAULT_STATE = applyOverrides(BASE_STATE, brand.overrides);

export const SAMPLE_DETAILS = brand.sample;

export const DETAIL_SUGGESTIONS = ['GSTIN', 'LLPIN', 'CIN', 'PAN', 'Udyam No.', 'ISO Cert. No.'];

export function cleanCustomDetails(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((d) => d && typeof d === 'object')
    .map((d) => ({ label: String(d.label ?? '').slice(0, 30), value: String(d.value ?? '').slice(0, 60) }))
    .slice(0, 8);
}

export function initialsFrom(name) {
  const skip = new Set(['of', 'and', 'the', '&', 'for', 'in']);
  const words = (name || '').split(/\s+/).filter((w) => w && !skip.has(w.toLowerCase()));
  const s = words.map((w) => w[0]).join('').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return s.slice(0, 4) || 'A';
}

// Merge saved data over defaults so fields added later still get defaults.
export function mergeState(saved) {
  const out = structuredClone(DEFAULT_STATE);
  if (!saved || typeof saved !== 'object') return out;
  for (const key of Object.keys(out)) {
    const group = saved[key];
    if (!group || typeof group !== 'object') continue;
    for (const k of Object.keys(out[key])) {
      const v = group[k];
      if (v === undefined) continue;
      if (Array.isArray(out[key][k])) {
        if (Array.isArray(v)) out[key][k] = cleanCustomDetails(v);
      } else if (typeof v === typeof out[key][k]) {
        out[key][k] = v;
      }
    }
  }
  return out;
}
