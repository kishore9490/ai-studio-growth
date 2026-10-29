import type { LocaleCopy } from './types';

/**
 * English copy. Status: editorial draft built only from facts in the source
 * register. Requires approval before publication (docs/CONTENT_REVIEW.md).
 */
export const en: LocaleCopy = {
  profile: {
    name: 'Dr. Bhagavan B.C.',
    role: 'Vice Chancellor',
    institution: 'Rajiv Gandhi University of Health Sciences',
    institutionShort: 'RGUHS',
    region: 'Karnataka',
    qualificationsLine: 'MBBS · M.S. (General Surgery) · FMAS · FRCS (Edinburgh) · FRCS (Glasgow)',
  },

  qualifications: {
    mbbs: {
      title: 'MBBS',
      detail: 'Undergraduate medical degree.',
      institution: 'Government Medical College, Mysore',
    },
    'ms-general-surgery': {
      title: 'M.S. (General Surgery)',
      detail: 'Postgraduate degree in general surgery.',
      institution: 'J.N. Medical College, Belgaum',
    },
    fmas: {
      title: 'FMAS',
      detail: 'Fellowship in Minimal Access Surgery.',
      institution: null,
    },
    'frcs-edinburgh': {
      title: 'FRCS (Edinburgh)',
      detail: 'Surgical fellowship, Edinburgh.',
      institution: null,
    },
    'frcs-glasgow': {
      title: 'FRCS (Glasgow)',
      detail: 'Surgical fellowship, Glasgow.',
      institution: null,
    },
  },

  career: {
    'vice-chancellor-rguhs': {
      role: 'Vice Chancellor',
      institution: 'Rajiv Gandhi University of Health Sciences, Karnataka',
      description: 'Leads the state health sciences university of Karnataka.',
    },
    'principal-kims': {
      role: 'Principal and Professor of Surgery',
      institution: 'Kempegowda Institute of Medical Sciences (KIMS), Bengaluru',
      description: 'Head of the institution, while continuing as Professor of Surgery.',
    },
    'hod-surgery-kims': {
      role: 'Head of the Department of Surgery',
      institution: 'Kempegowda Institute of Medical Sciences (KIMS), Bengaluru',
      description: 'Led the Department of Surgery.',
    },
    'vice-principal-kims': {
      role: 'Vice Principal',
      institution: 'Kempegowda Institute of Medical Sciences (KIMS), Bengaluru',
      description: 'Senior administrative role in the leadership of the institution.',
    },
    'faculty-kims': {
      role: 'Professor and Associate Professor',
      institution: 'Kempegowda Institute of Medical Sciences (KIMS), Bengaluru',
      description: 'Surgical teaching faculty. The source lists both ranks in a single entry.',
    },
  },

  focusAreas: {
    'medical-education': {
      title: 'Medical education',
      body: 'Teaching and curriculum in the health sciences, from undergraduate training to specialist education.',
    },
    'academic-governance': {
      title: 'Academic governance',
      body: 'Leadership of academic institutions — the structures, standards and decisions that shape them.',
    },
    'surgical-practice': {
      title: 'Surgical practice',
      body: 'A clinical foundation in general surgery and minimal access surgery.',
    },
    'interdisciplinary-research': {
      title: 'Interdisciplinary research',
      body: 'Research that connects disciplines and links scientific enquiry with patient care.',
    },
    'technology-enabled-education': {
      title: 'Technology-enabled healthcare education',
      body: 'The role of digital tools, simulation and emerging technologies in how health professionals learn.',
    },
    'community-health': {
      title: 'Community-oriented health initiatives',
      body: 'Health education and care that reach beyond the campus to the communities it serves.',
    },
  },

  vision: {
    'smart-campuses': {
      title: 'Technology-integrated smart campuses',
      summary: 'Integrating digital technology into the learning environment and academic administration.',
      context:
        'Connected classrooms, digital resources and well-designed systems can make teaching, learning and administration more effective and more transparent.',
    },
    'translational-research': {
      title: 'Interdisciplinary and translational research',
      summary: 'Encouraging research that crosses disciplines and moves knowledge towards patient care.',
      context:
        'Translational research seeks to carry discoveries from the laboratory to the bedside and into community health, and depends on collaboration across fields.',
    },
    'international-collaboration': {
      title: 'International academic collaboration',
      summary: 'Building academic links abroad, including faculty and student exchange.',
      context:
        'Exchange of people and ideas exposes students and teachers to different systems of care, research cultures and ways of teaching.',
    },
    'rural-outreach': {
      title: 'Rural health outreach',
      summary: 'Strengthening community-based interventions that bring care closer to rural populations.',
      context:
        'Health sciences education is closely tied to the health of the communities around it, including those far from large urban hospitals.',
    },
    'emerging-technologies': {
      title: 'AI, robotics, VR/AR and precision medicine in curricula',
      summary: 'Preparing graduates for emerging technologies by bringing them into the curriculum.',
      context:
        'Artificial intelligence, robotic surgery, immersive simulation and precision medicine are changing clinical practice; education is where future professionals first meet them.',
    },
    'affordable-access': {
      title: 'Affordable, accessible medical education',
      summary: 'Keeping quality health sciences education within reach of capable students.',
      context:
        'The future health workforce depends on talented students being able to enter and complete their education regardless of background.',
    },
    'student-centred-learning': {
      title: 'Student-centred learning',
      summary: 'Placing students and their learning at the centre of educational design.',
      context:
        'Student-centred approaches emphasise active participation, feedback and the development of independent clinical judgement.',
    },
  },

  about: {
    introduction: {
      heading: 'Introduction',
      paragraphs: [
        'Dr. Bhagavan B.C. is the Vice Chancellor of Rajiv Gandhi University of Health Sciences (RGUHS), Karnataka. A surgeon by training, his professional path brings together clinical surgery, teaching and the leadership of academic institutions.',
      ],
    },
    identity: {
      heading: 'Professional identity',
      paragraphs: [
        'Three strands run through the professional record published by the university: surgical practice, medical education and academic governance.',
        'His qualifications are MBBS, M.S. (General Surgery), FMAS, FRCS (Edinburgh) and FRCS (Glasgow).',
      ],
    },
    journey: {
      heading: 'Medical and academic journey',
      paragraphs: [
        'He completed the MBBS at Government Medical College, Mysore (1982–1987), and the M.S. in General Surgery at J.N. Medical College, Belgaum (1991–1993).',
        'Later fellowships followed over a senior career: FMAS, a Fellowship in Minimal Access Surgery, in 2016; FRCS (Edinburgh) in 2022; and FRCS (Glasgow) in 2024.',
      ],
    },
    'surgical-teaching': {
      heading: 'Surgical and teaching background',
      paragraphs: [
        'From 2003 he served on the surgical faculty of Kempegowda Institute of Medical Sciences (KIMS), Bengaluru, as Associate Professor and Professor. The official profile lists both ranks in a single entry.',
        'He was Head of the Department of Surgery at KIMS from 2022 to 2023.',
      ],
    },
    leadership: {
      heading: 'Institutional leadership',
      paragraphs: [
        'At KIMS he served as Vice Principal from 2017 to 2023 and became Principal and Professor of Surgery in 2023.',
        'He now serves as Vice Chancellor of Rajiv Gandhi University of Health Sciences, Karnataka.',
      ],
    },
    philosophy: {
      heading: 'Priorities for health sciences education',
      paragraphs: [
        'The official profile sets out priorities for the university: technology-integrated campuses, interdisciplinary and translational research, international collaboration, rural health outreach, emerging technologies in the curriculum, affordable access and student-centred learning.',
        'These are stated priorities. They are presented on the Leadership Vision page and are not described here as completed initiatives.',
      ],
    },
    community: {
      heading: 'Public service and community engagement',
      paragraphs: [
        'Community-oriented health initiatives and rural health outreach are identified in the official profile as areas of focus.',
        'Specific engagements will be documented here only when verified records are available.',
      ],
    },
    milestones: {
      heading: 'Selected professional milestones',
      paragraphs: [],
    },
    'official-profile': {
      heading: 'Official profile',
      paragraphs: [
        'The authoritative record is the Vice Chancellor profile published by Rajiv Gandhi University of Health Sciences.',
      ],
    },
  },
};
