# Expense Statement Generator

A lightweight, standalone web app for preparing **IT Services & Expense Statements** — professional PDFs that show expenses a company has incurred on behalf of a customer. It is not an accounting, ERP or invoicing system, and the PDF is never labelled as a tax invoice.

## Run it

No build, backend or login. Either:

- open `index.html` directly in a browser, or
- serve the folder, e.g. `python3 -m http.server` inside `expense-statement/` and visit `http://localhost:8000`.

All libraries (jsPDF 2.5.1, jsPDF-AutoTable 3.8.2, PDF.js 3.11.174) are vendored in `vendor/`, so it works offline. The Inter web font loads from Google Fonts when online and falls back to system fonts otherwise.

## Features

- Simple form: prepared by, customer, contact person, statement date, currency, statement reference (auto-generated, editable).
- Unlimited expense rows: description, quantity, unit cost, billing frequency (One-time / Monthly / Quarterly / Annually), notes. Reorder or remove rows.
- Leave **unit cost blank** to mark an item as **Pending** — it is listed separately and excluded from totals.
- Live calculation of monthly, quarterly, annual, one-time, first-month and pending figures. Billing cycles are never merged into one monthly figure.
  - First-month total = monthly + quarterly + annual + one-time.
  - Year-one estimate = monthly × 12 + quarterly × 4 + annual + one-time.
- Live PDF preview (the exact PDF that is downloaded/printed), Download PDF, Print.
- Save / open statements in the browser (localStorage), automatic draft recovery, JSON export/import to move statements between devices.
- Optional logo upload, company details line and editable notes & disclaimers.
- Responsive: side-by-side on desktop, Edit/Preview tabs on mobile.

## Sample

Click **Load sample (SABVEX)** at the bottom of the editor. Expected totals: Monthly $171.15 · Annual $161.13 · First month $332.28 · 1 pending item (laptop rental).

## Notes

Standard PDF fonts cannot render the ₹ glyph, so INR amounts appear as `INR 1,234.00` in the PDF (the editor still shows ₹).

## Files

- `index.html` – markup
- `css/styles.css` – UI styles
- `js/core.js` – parsing, formatting and calculations (amounts held in integer cents)
- `js/statement-pdf.js` – PDF layout
- `js/app.js` – editor, storage, preview, download and print
