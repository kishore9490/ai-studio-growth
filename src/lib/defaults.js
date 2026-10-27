export const STORAGE_KEY = 'emca-letterhead-v1';

export const COLOR_PRESETS = [
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
];

export const LOGO_STYLES = [
  { id: 'code', name: 'Code + Cross' },
  { id: 'cross', name: 'Pulse Cross' },
  { id: 'shield', name: 'Shield' },
  { id: 'monogram', name: 'Monogram' },
];

export const DEFAULT_STATE = {
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
  },
  exportOpts: {
    fileName: 'EMCA-Letterhead',
    quality: 'high', // 'standard' | 'high'
  },
};

export const SAMPLE_DETAILS = {
  academy: {
    address: '2nd Floor, Lakshmi Towers, 45/2 Anna Salai, Near Gemini Flyover, Teynampet',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pin: '600018',
    phone: '+91 98765 43210',
    whatsapp: '+91 98765 43210',
    email: 'info@expertmedicalcoding.in',
    website: 'www.expertmedicalcoding.in',
    regNo: 'TN/EDU/2024/01873',
  },
  extra: {
    linkedin: 'linkedin.com/company/expert-medical-coding-academy',
    instagram: 'instagram.com/expertmedicalcoding',
    accreditation: 'Training aligned with AAPC CPC® & AHIMA CCS® certification standards',
    footerText: 'Shaping certified medical coders since 2015',
  },
};

export function initialsFrom(name) {
  const skip = new Set(['of', 'and', 'the', '&', 'for', 'in']);
  const words = (name || '').split(/\s+/).filter((w) => w && !skip.has(w.toLowerCase()));
  const s = words.map((w) => w[0]).join('').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return s.slice(0, 4) || 'A';
}

// Deep-merge saved data over defaults so new fields added later still get defaults.
export function mergeState(saved) {
  const out = structuredClone(DEFAULT_STATE);
  if (!saved || typeof saved !== 'object') return out;
  for (const key of Object.keys(out)) {
    if (saved[key] && typeof saved[key] === 'object') {
      for (const k of Object.keys(out[key])) {
        if (saved[key][k] !== undefined && typeof saved[key][k] === typeof out[key][k]) {
          out[key][k] = saved[key][k];
        }
      }
    }
  }
  return out;
}
