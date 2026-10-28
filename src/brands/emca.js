// Brand profile: Experts Medical Coding Academy (the default build).
// Details are taken from the academy's introductory-session flyer.
import emcLogo from './assets/emc-logo.png';

export default {
  id: 'emca',
  appTitle: 'EMCA Letterhead Studio',
  orgWord: 'Academy',
  // v2: new defaults from the flyer, so older saved settings don't hide them
  storageKey: 'emca-letterhead-v2',
  allowGeneratedLogo: true,
  presets: [{ id: 'emc-cyan', name: 'EMC Cyan', primary: '#0E4F7A', secondary: '#06BFDE' }],
  placeholders: {
    city: 'Chamarajanagara',
    state: 'Karnataka',
    pin: '6-digit PIN',
    tagline: 'e.g. Medical Coding Training & Career Programs',
    refNo: 'EMCA/2026/014',
    subject: 'e.g. Internship Completion Certificate',
    signName: 'Signatory name',
    signTitle: 'e.g. Director',
    fileName: 'EMCA-Letterhead',
  },
  overrides: {
    academy: {
      name: 'Experts Medical Coding Academy',
      tagline: 'Medical Coding Training & Career Programs',
      address: 'BR Hills Road, Opp. JSS College, Above Ola Showroom',
      city: 'Chamarajanagara',
      state: 'Karnataka',
      pin: '',
      phone: '+91 86600 77213',
      whatsapp: '',
      email: 'expertsmedicalcoding@gmail.com',
      website: '',
      regNo: '',
    },
    branding: {
      logoMode: 'upload',
      uploadedLogo: emcLogo,
      primary: '#0E4F7A',
      secondary: '#06BFDE',
      presetId: 'emc-cyan',
    },
    layout: { design: 'wave', logoSize: 62 },
    exportOpts: { fileName: 'EMCA-Letterhead' },
  },
  sample: null,
};
