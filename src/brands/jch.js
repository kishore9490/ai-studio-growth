// Brand profile: JCH Business Solutions LLP.
import jchLogo from '../../letterheads/jch-business-solutions/build/logo.png';

export default {
  id: 'jch',
  appTitle: 'JCH Letterhead Studio',
  orgWord: 'Company',
  storageKey: 'jch-letterhead-v1',
  allowGeneratedLogo: false,
  presets: [{ id: 'jch-blue', name: 'JCH Blue', primary: '#0B2E6F', secondary: '#1E96DA' }],
  placeholders: {
    city: 'Mysore',
    state: 'Karnataka',
    pin: '570017',
    name: 'JCH Business Solutions LLP',
    tagline: 'e.g. Business Solutions & Consulting',
    refNo: 'JCH/2026/014',
    subject: 'e.g. Quotation for Services',
    signName: 'Authorised Signatory',
    signTitle: 'Designated Partner',
    fileName: 'JCH-Letterhead',
  },
  overrides: {
    academy: {
      name: 'JCH Business Solutions LLP',
      tagline: '',
      address: '# 477, 1st Phase, 4th Stage, Vijayanagar',
      city: 'Mysore',
      state: '',
      pin: '570017',
      phone: '+91 99862 87548',
      whatsapp: '',
      email: 'support@jchbusiness.com',
      website: '',
      regNo: '',
    },
    extra: {
      customDetails: [
        { label: 'LLPIN', value: 'AAE-4453' },
        { label: 'GSTIN', value: '29AALFJ2957J1ZR' },
      ],
    },
    branding: {
      logoMode: 'upload',
      uploadedLogo: jchLogo,
      primary: '#0B2E6F',
      secondary: '#1E96DA',
      presetId: 'jch-blue',
    },
    layout: { design: 'ribbon', showName: false, logoSize: 84 },
    exportOpts: { fileName: 'JCH-Letterhead' },
  },
  sample: null,
};
