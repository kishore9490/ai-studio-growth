# Content review and pre-publication checklist

Nothing on this site may go live until every box in §4 is ticked by a named reviewer. The
automated part of this checklist is `npm run content:gate`, which currently **fails by design**.

## 1. Discrepancies and open questions (need a decision)

| # | Item | Why it is flagged | Current handling |
| --- | --- | --- | --- |
| D1 | **Principal, KIMS — "2023–present"** | The source says "present", but the subject is now Vice Chancellor of RGUHS. The KIMS principalship may have ended. | Shown as "From 2023" (`presentConfirmed: false`). Confirm the end year, or confirm it is concurrent. |
| D2 | **Professor and Associate Professor, KIMS — "2003–present"** | Two ranks are combined in one entry; individual periods are not published. "Present" is unconfirmed. | Reproduced as one entry, shown "From 2003". Do not split without evidence. |
| D3 | **Overlapping KIMS appointments** | Vice Principal (2017–2023), HoD Surgery (2022–2023), Principal (2023–) and Professor (2003–) overlap. They may be concurrent roles. | Reproduced as published; the Experience page states that some appointments overlap. Detected automatically by `findCareerOverlaps()` and covered by tests. |
| D4 | **Vice Chancellor start date** | Not given in the brief. A secondary news report (search result only) suggests 2025. | Shown as "Current" with no year. Add a year only from an official notification. |
| D5 | **Spelling of the name** | Official profile (per brief): "Bhagavan B.C."; some press uses "Bhagawan". | "Bhagavan B.C." used throughout. Confirm the preferred spelling and punctuation. |
| D6 | **MBBS institution** | "Government Medical College, Mysore" comes from the brief; no independent corroboration was found. | Shown as given. Verify against the live profile. |
| D7 | **FMAS awarding body** | Not named in the source. | No body is named on the site. |
| D8 | **Place names** | English keeps "Mysore" and "Belgaum" as in the source. Kannada uses ಮೈಸೂರು and ಬೆಳಗಾವಿ (current official name Belagavi). | Kannada reviewer to confirm. |
| D9 | **KIMS full name** | "Kempegowda Institute of Medical Sciences (KIMS), Bengaluru" — the brief says "KIMS, Bengaluru"; the expansion was corroborated by a search snippet of the official profile. | Verify on the live profile. |
| D10 | **VC role description** | "Leads the state health sciences university of Karnataka" is an editorial description. | Approve or reword. |
| D11 | **First-person CTA** | "Explore My Journey" (from the brief) is first-person and could imply the subject wrote the site. | Kept as specified. Confirm that the subject has approved this voice, or change it to "Explore the Journey". |
| D12 | **Intro copy "two decades on the surgical faculty"** | Derived from 2003–2023. Depends on D1/D2. | Confirm. |

## 2. Content and assets awaiting approval or supply

| Item | Status | Where it goes |
| --- | --- | --- |
| Official portrait + written usage permission | **Not supplied.** A typographic "BC" composition is shown instead. | `portraitRecord` in `src/content/records.ts` |
| Approval of the "BC" monogram as a personal design element | Proposed only | `src/components/layout/Monogram.tsx`, `src/app/icon.svg` |
| Approved photographs/videos with source, date, credit and permission | **None supplied.** Media page shows an honest empty state. | `mediaRecords` in `records.ts`, files in `public/media/` |
| Verified publications (DOI/ISBN/official URL) | **None supplied.** Publications page shows "being compiled". | `publicationRecords` in `records.ts` |
| Approved personal contact details | **None.** Contact page links to official RGUHS channels; no form, email or phone. | `src/app/[locale]/contact/page.tsx` |
| Approved statement of educational philosophy | None. The About page summarises the stated priorities only. | `about.philosophy` in `copy/*.ts` |
| Verified records of public service / community engagement | None. The About page says they will be added when verified. | `about.community` in `copy/*.ts` |
| Production domain | **Not purchased / not provided** | `NEXT_PUBLIC_SITE_URL` |
| Kannada translation review | **Required for all Kannada text** | `messages/kn.json`, `src/content/copy/kn.ts`, alt text in `placeholders.ts`/media records |

## 3. Editorial draft copy requiring approval

All of this is original draft copy, not taken from any source, and must be approved before
publication. None of it is attributed to Dr. Bhagavan B.C. and there are no quotations.

- Hero headline and supporting line (proposed in the brief)
- Home: introduction, journey heading ("From the operating theatre to the university."),
  focus-area descriptions, vision preview text, closing statement and paragraph
- About: all section narratives (built from the facts in SOURCE_REGISTER.md)
- Vision: the one-line summary and "Context" paragraph for each priority. These explain the
  priority in general terms and are written not to imply implementation. Tests reject words
  such as *launched, implemented, achieved, completed, established, signed, deployed*.
- Contact and footer disclaimer wording; page meta descriptions

## 4. Pre-publication verification checklist

### Facts
- [ ] Live official profile re-read; every row in SOURCE_REGISTER.md confirmed or corrected
- [ ] Records set to `verified` with `verifiedAt`; sources given `lastChecked`; audit log updated
- [ ] D1–D12 above resolved and recorded
- [ ] No award, ranking, statistic, publication, testimonial, partnership or quotation appears that is not in the register
- [ ] Vision priorities are presented as stated priorities, not achievements

### Language
- [ ] Qualified Kannada reviewer has reviewed **every** Kannada string (name, titles, institutions, places, UI, metadata, alt text)
- [ ] Reviewer name and date recorded here: ____________________
- [ ] English copy approved by: ____________________

### Assets and permissions
- [ ] Portrait supplied with written permission, or decision recorded to launch without one
- [ ] Every image has an identified source, credit and permission reference
- [ ] Monogram approved (or replaced with an approved wordmark)
- [ ] No RGUHS logo, seal or institutional branding is used

### Consent
- [ ] Dr. Bhagavan B.C. (or an authorised representative) has approved the site's existence, content and tone
- [ ] Any contact channel shown has been explicitly approved for this website

### Configuration
- [ ] `NEXT_PUBLIC_SITE_URL` set to the production `https://` origin
- [ ] `SITE_NOINDEX=false` on the production environment only (keep `true` on previews)
- [ ] `SHOW_DEV_PLACEHOLDERS` unset or `false`
- [ ] `npm run content:gate` passes with the production environment variables

### Quality
- [ ] `npm run check` and `npm run test:e2e` pass
- [ ] Production smoke test in DEPLOYMENT.md completed
