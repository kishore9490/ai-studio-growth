# Source register

Every factual statement on the site must trace to an entry below. The machine-readable copy of
this register is `src/content/sources.ts`; each record in `src/content/records.ts` cites source
ids from it.

## Audit log

| Date | Editor | Action | Result |
| --- | --- | --- | --- |
| 2026-10-29 | Build (automated) | Attempted to fetch `rguhs.ac.in/vcprofile.html` and `/vcdesk.html` | **Blocked** by the build environment's network policy. Pages were not read. |
| 2026-10-29 | Build (automated) | Web search for corroboration | Search results only (not sufficient evidence). Corroborated: RGUHS VC title; credential list; KIMS roles including Vice Principal 2017–2023 and HoD Surgery 2022–2023; KIMS = Kempegowda Institute of Medical Sciences. Not corroborated: the Mysore MBBS institution. |
| 2026-10-29 | Build (automated) | Attempted to open `medicaldialogues.in` and `nmc.org.in` | **Blocked** by network policy. Not read. |
| _pending_ | _Editor_ | Re-read the live official profile and confirm every fact below | Required before publication |

Because the official pages could not be opened during the build, **all facts were transcribed
from the commissioning brief**, which quotes the official profile. Every record is therefore
`verificationStatus: 'pending'` with `verifiedAt: null`, and every source has
`lastChecked: null`. `npm run content:gate` fails until an editor changes this.

## Sources

### S1 — `rguhs-vc-profile` (primary)

- **Title:** Vice Chancellor profile
- **Publisher:** Rajiv Gandhi University of Health Sciences, Karnataka
- **URL:** https://www.rguhs.ac.in/vcprofile.html
- **Last checked:** not yet (blocked 2026-10-29)
- **Supports:** name and title; all qualifications; all career entries; the six areas of focus;
  the seven leadership priorities.

### S2 — `rguhs-vc-desk` (official)

- **Title:** From the Vice Chancellor's desk
- **URL:** https://www.rguhs.ac.in/vcdesk.html
- **Last checked:** not yet
- **Use:** linked from the Vision, Contact and footer sections. **No text is quoted.** No
  first-person statement appears anywhere on the site.

### S3 — `rguhs-home` (official)

- **Title:** RGUHS official website
- **URL:** https://www.rguhs.ac.in/
- **Use:** institutional link only.

### S4 — `press-appointment-report` (secondary)

- **Title:** "KIMS principal Dr BC Bhagawan appointed as new RGUHS VC" (Medical Dialogues)
- **URL:** https://medicaldialogues.in/news/health/doctors/kims-principal-dr-bc-bhagawan-appointed-as-new-rguhs-vc-144248
- **Last checked:** seen as a search result only; article not opened
- **Use:** none on the site. Recorded because it uses the spelling "Bhagawan" and indicates an
  appointment around 2025 — both need confirmation (see CONTENT_REVIEW.md).

## Fact-by-fact register

| Record id | Fact as displayed | Source | Status |
| --- | --- | --- | --- |
| profile | Dr. Bhagavan B.C., Vice Chancellor, Rajiv Gandhi University of Health Sciences, Karnataka | S1 | pending |
| `mbbs` | MBBS — Government Medical College, Mysore — 1982–1987 | S1 | pending |
| `ms-general-surgery` | M.S. (General Surgery) — J.N. Medical College, Belgaum — 1991–1993 | S1 | pending |
| `fmas` | FMAS — Fellowship in Minimal Access Surgery — 2016 (awarding body not stated) | S1 | pending |
| `frcs-edinburgh` | FRCS (Edinburgh) — 2022 | S1 | pending |
| `frcs-glasgow` | FRCS (Glasgow) — 2024 | S1 | pending |
| `vice-chancellor-rguhs` | Vice Chancellor, RGUHS — current, start year not shown | S1 | pending |
| `principal-kims` | Principal and Professor of Surgery, KIMS, Bengaluru — source: 2023–present; shown "From 2023" | S1 | pending |
| `hod-surgery-kims` | Head of the Department of Surgery, KIMS — 2022–2023 | S1 | pending |
| `vice-principal-kims` | Vice Principal, KIMS — 2017–2023 | S1 | pending |
| `faculty-kims` | Professor and Associate Professor, KIMS — source: 2003–present; shown "From 2003" | S1 | pending |
| focus areas (6) | Medical education; academic governance; surgical practice; interdisciplinary research; technology-enabled healthcare education; community-oriented health initiatives | S1 | pending |
| vision priorities (7) | Smart campuses; interdisciplinary/translational research; international collaboration; rural outreach; AI/robotics/VR/AR/precision medicine; affordable access; student-centred learning | S1 | pending |

## Editorial copy (not facts)

The following are editorial drafts written for the site. They contain no facts beyond those
above but still need approval: the hero headline and supporting copy (supplied in the brief as
proposed copy), section introductions, focus-area descriptions, vision summaries and "context"
paragraphs, the closing statement, and the About-page narrative wording. See CONTENT_REVIEW.md §3.

## Updating this register

1. Open the source, compare it with each row above, and note any difference in
   CONTENT_REVIEW.md before changing anything.
2. In `src/content/records.ts`, set `verificationStatus: 'verified'` and
   `verifiedAt: 'YYYY-MM-DD'` on each confirmed record; set `'disputed'` on any that conflict
   (disputed records are automatically hidden).
3. In `src/content/sources.ts`, set `lastChecked`.
4. Add a row to the audit log above.
5. Run `npm test` and `npm run content:gate`.
