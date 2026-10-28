# Letterhead Studio (EMCA and JCH)

Two ready-to-use letterhead tools are built from the same code:

| File | For | Opens with |
|---|---|---|
| `EMCA-Letterhead-Studio.html` | Experts Medical Coding Academy | EMC logo, Chamarajanagara address, phone and email, EMC Cyan, Medical Wave design |
| `JCH-Letterhead-Studio.html` | JCH Business Solutions LLP | JCH logo, address, email, phone, LLPIN and GSTIN, JCH Blue, Corporate Ribbon design |

Both work the same way and have the same features. Each one keeps its own saved details in the browser.


A letterhead generator for **Expert Medical Coding Academy**. You fill in your academy details, pick a design and colours, and see the result on a live A4 preview. When it looks right, download it as a PDF or Word file, or print it.

Everything runs in the browser. There is no account, no server and no paid service. Your details and logo are saved in your own browser, so they are still there after a refresh.

## Quick start (no installation)

1. Download **`EMCA-Letterhead-Studio.html`** or **`JCH-Letterhead-Studio.html`** from this repository (open the file on GitHub, then click **Download raw file**).
2. Double-click it. It opens in your browser (Chrome, Edge, Firefox or Safari).
3. Fill in your details, upload your logo, and use **Download PDF**, **Word**, **Blank Letterhead** or **Print**.

It works offline. Nothing is installed and nothing is sent anywhere. Your details are saved in that browser, so keep opening the same file in the same browser to find them again.

> Downloads go to your browser's usual Downloads folder. When printing, choose **A4** and **100% / Actual size**.

## What it does

- **Academy details:** name (the only required field), tagline, address, city, state, PIN, phone, WhatsApp, email (validated), website, registration number.
- **Logo:** upload your own (PNG, JPG, SVG or WEBP). Empty white or transparent space around the artwork is trimmed automatically. If you have no logo, create one from four medical-coding styles (Code + Cross, Pulse Cross, Shield, Monogram). You can replace or remove the logo and adjust its size.
- **Colours:** six presets (Navy & Teal is the default, plus EMC Logo Blue to match the EMC logo), or any custom primary and secondary colour.
- **Five designs:** Clinical Classic, Executive Band, Elegant Minimal, Corporate Ribbon and Medical Wave. Each has a left-aligned or centered header.
- **Show or hide** each contact detail, the academy name beside the logo, the tagline, the footer and a faint logo watermark. You can also put the phone, email and website in the header or the footer.
- **More details:** add any label and value, such as GSTIN, LLPIN, CIN, PAN or Udyam No. (up to 8). They show under the contact details, or in the footer.
- **Additional info:** social links, accreditation, footer text and any extra line.
- **Letter content (optional):** reference number, date, subject, body and signatory. These are included in *Download PDF* and *Word*.
- **Exports**
  - **Download PDF:** one A4 page (210 × 297 mm) at 300 dpi.
  - **Word (.docx):** A4 with the letterhead artwork fixed behind the page, so it repeats on every page. The writing area is a normal, editable Word body with margins that match the design.
  - **Blank Letterhead:** PDF or Word with an empty writing area.
  - **Print:** opens the browser print dialog with only the letterhead (A4, no margins, no app controls). Choose "Actual size / 100%".
- **Reset** returns everything to the default design.

## Run it

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npm run dev        # open the address it prints, e.g. http://localhost:5173
```

### Build for hosting

To update the two HTML files after changing the code, run `npm run build:single` and `npm run build:jch-single`, then copy `dist-single/index.html` to `EMCA-Letterhead-Studio.html` and `dist-jch-single/index.html` to `JCH-Letterhead-Studio.html`.

```bash
npm run build          # static site in dist/ (upload to any web host)
npm run build:single   # one self-contained HTML file in dist-single/index.html

npm run dev:jch            # JCH version
npm run build:jch-single   # JCH single file in dist-jch-single/index.html
```

Brand defaults (name, contact details, colours, logo, design) live in `src/brands/emca.js` and `src/brands/jch.js`. To make a tool for another organisation, copy one of these files, then add a matching mode in `vite.config.js` and a script in `package.json`.

You can email `dist-single/index.html` or put it on a USB drive and open it by double-clicking. It needs no internet connection.

## Tips

- A logo with a transparent background looks best on every design. On *Executive Band*, the logo sits on a white tile so dark logos stay visible.
- If your logo already shows the academy name, turn off **Show academy name beside logo** under *Design & layout*.
- In Word, type straight into the page. Your text will stay inside the writing area on every page.
- When you print the PDF, select **A4** and **100% / Actual size** so the margins stay exact.

## Tech

React 18 and Vite, with html2canvas and jsPDF for the PDF, `docx` for Word, Lucide icons, and self-hosted fonts (Montserrat, Inter, Cormorant Garamond via Fontsource).

Source layout:

```
src/App.jsx                    editor UI, state, saving, exports wiring
src/components/Letterhead.jsx  the A4 letterhead (all three designs)
src/letterhead.css             letterhead styling (true A4 size in mm)
src/lib/exporters.js           PDF / Word generation and file saving
src/lib/logo.js                logo generator and image trimming
src/lib/defaults.js            defaults, colour presets, designs
```
