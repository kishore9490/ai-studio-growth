// Builds the editable Word letterhead for JCH Business Solutions LLP.
// Decorative artwork sits behind the page; every contact detail is real, editable text.
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Header, Footer, Table, TableRow, TableCell,
  WidthType, AlignmentType, VerticalAlign, HeightRule, BorderStyle, TableLayoutType,
  HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom, TextWrappingType,
} = require('docx');

const DETAILS = {
  company: 'JCH Business Solutions LLP',
  email: 'support@jchbusiness.com',
  phone: '+91 99862 87548',
  llpin: 'AAE-4453',
  gstin: '29AALFJ2957J1ZR',
  // [text, superscript?] pieces so "1st" and "4th" keep their superscripts
  address: [['# 477, 1'], ['st', true], [' Phase, 4'], ['th', true], [' Stage, Vijayanagar, Mysore - 570017']],
};

const C = { navy: '0B2E6F', blue: '0050AA', ink: '1F2937', grey: '4B5563', light: '9CA3AF' };
const FONT = 'Calibri';
const mm = (v) => Math.round((v / 25.4) * 1440); // twips
const px = (v) => (v / 25.4) * 96; // docx image size unit (96 dpi pixels)
const img = (f) => fs.readFileSync(path.join(__dirname, f));
const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none };

const PAGE_W = 210, MARGIN_X = 18, CONTENT_W = PAGE_W - MARGIN_X * 2;
const LOGO_W = 58, LOGO_H = LOGO_W * (472 / 1024);

const run = (text, o = {}) => new TextRun({ text, font: FONT, size: o.size ?? 20, bold: o.bold, color: o.color ?? C.ink, superScript: o.sup, characterSpacing: o.spacing });
const icon = (name, sizeMm = 4) => new ImageRun({ type: 'png', data: img(`icon-${name}.png`), transformation: { width: px(sizeMm), height: px(sizeMm) } });

const contactLine = (iconName, text, after = 60) =>
  new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { before: 0, after },
    children: [run(text, { size: 21, color: C.ink }), run('  '), icon(iconName)],
  });

const header = new Header({
  children: [
    new Table({
      width: { size: mm(CONTENT_W), type: WidthType.DXA },
      columnWidths: [mm(78), mm(CONTENT_W - 78)],
      layout: TableLayoutType.FIXED,
      borders: noBorders,
      rows: [
        new TableRow({
          height: { value: mm(27), rule: HeightRule.EXACT },
          children: [
            new TableCell({
              width: { size: mm(78), type: WidthType.DXA },
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 0, bottom: 0, left: 0, right: 0 },
              borders: noBorders,
              children: [
                new Paragraph({
                  spacing: { before: 0, after: 0 },
                  children: [new ImageRun({ type: 'png', data: img('logo.png'), transformation: { width: px(LOGO_W), height: px(LOGO_H) }, altText: { title: 'JCH logo', description: 'JCH Business Solutions LLP logo', name: 'logo' } })],
                }),
              ],
            }),
            new TableCell({
              width: { size: mm(CONTENT_W - 78), type: WidthType.DXA },
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 0, bottom: 0, left: 0, right: 0 },
              borders: noBorders,
              children: [
                contactLine('mail', DETAILS.email),
                contactLine('phone', DETAILS.phone, 110),
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  spacing: { before: 0, after: 0 },
                  children: [
                    run('LLPIN  ', { size: 16, bold: true, color: C.blue, spacing: 10 }),
                    run(DETAILS.llpin, { size: 17, color: C.grey }),
                    run('     |     ', { size: 16, color: C.light }),
                    run('GSTIN  ', { size: 16, bold: true, color: C.blue, spacing: 10 }),
                    run(DETAILS.gstin, { size: 17, color: C.grey }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    // Full-page artwork (ribbons, divider, footer rule) anchored behind the text on every page.
    new Paragraph({
      spacing: { before: 0, after: 0, line: 240 },
      children: [
        new ImageRun({
          type: 'png',
          data: img('background.png'),
          transformation: { width: px(210), height: px(297) },
          floating: {
            horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 0 },
            verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 0 },
            behindDocument: true,
            allowOverlap: true,
            lockAnchor: true,
            wrap: { type: TextWrappingType.NONE },
          },
          altText: { title: 'Letterhead artwork', description: 'Blue ribbon bands and divider lines', name: 'artwork' },
        }),
        new TextRun({ text: '', size: 2 }),
      ],
    }),
  ],
});

const footer = new Footer({
  children: [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0 },
      children: [
        icon('pin', 3.6),
        run('  '),
        run(DETAILS.company, { size: 18, bold: true, color: C.navy }),
        run('     |     ', { size: 16, color: C.light }),
        ...DETAILS.address.map(([t, sup]) => run(t, { size: 18, color: C.grey, sup })),
      ],
    }),
  ],
});

const doc = new Document({
  creator: DETAILS.company,
  title: `${DETAILS.company} Letterhead`,
  description: 'Official letterhead',
  styles: { default: { document: { run: { font: FONT, size: 22, color: C.ink } } } },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: mm(52), bottom: mm(32), left: mm(MARGIN_X), right: mm(MARGIN_X), header: mm(11), footer: mm(12), gutter: 0 },
        },
      },
      headers: { default: header },
      footers: { default: footer },
      children: [new Paragraph({ children: [run('', { size: 22 })] })],
    },
  ],
});

// docx@9.0.2 writes word/fontTable.xml without a relationship to it; Word can flag that as damage.
async function linkFontTable(buf) {
  const JSZip = require('jszip');
  const zip = await JSZip.loadAsync(buf);
  const relPath = 'word/_rels/document.xml.rels';
  let rels = await zip.file(relPath).async('string');
  if (zip.file('word/fontTable.xml') && !rels.includes('fontTable.xml')) {
    rels = rels.replace('</Relationships>', '<Relationship Id="rIdFontTable" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/></Relationships>');
    zip.file(relPath, rels);
  }
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

const out = path.join(__dirname, '..', 'JCH_Letterhead.docx');
Packer.toBuffer(doc)
  .then(linkFontTable)
  .then((buf) => {
    fs.writeFileSync(out, buf);
    console.log('wrote', out);
  });
