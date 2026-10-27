import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Header,
  AlignmentType,
  HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
  TextWrappingType,
} from 'docx';

const A4_W_MM = 210;
const A4_H_MM = 297;
const PX_PER_MM = 96 / 25.4;
const TWIP_PER_PX = 15; // 1440 twips per inch / 96 px per inch

export async function waitForAssets(el) {
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const imgs = Array.from(el.querySelectorAll('img'));
  await Promise.all(
    imgs.map((img) =>
      img.complete && img.naturalWidth
        ? Promise.resolve()
        : new Promise((res) => {
            img.onload = res;
            img.onerror = res;
          })
    )
  );
}

export async function capturePage(el, scale) {
  await waitForAssets(el);
  const canvas = await html2canvas(el, {
    scale,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    width: el.offsetWidth,
    height: el.offsetHeight,
    windowWidth: el.offsetWidth + 40,
    scrollX: 0,
    scrollY: 0,
  });
  return canvas;
}

function canvasToBytes(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) return reject(new Error('Could not render the page image.'));
      resolve(new Uint8Array(await blob.arrayBuffer()));
    }, 'image/png');
  });
}

export async function buildPdf(el, { scale = 3, title = 'Letterhead' } = {}) {
  const canvas = await capturePage(el, scale);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  pdf.setProperties({ title, subject: 'Official letterhead', creator: 'Letterhead Generator' });
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, A4_W_MM, A4_H_MM, undefined, 'FAST');
  return pdf.output('blob');
}

// Measure where the writing area sits on the page so Word's margins line up with it.
export function measureWritingArea(el) {
  const page = el.getBoundingClientRect();
  const body = el.querySelector('[data-part="body"]').getBoundingClientRect();
  const k = el.offsetWidth / page.width; // undo any CSS transform
  const style = getComputedStyle(el.querySelector('[data-part="body"]'));
  return {
    top: (body.top - page.top) * k + parseFloat(style.paddingTop),
    bottom: (page.bottom - body.bottom) * k + parseFloat(style.paddingBottom),
    left: parseFloat(style.paddingLeft),
    right: parseFloat(style.paddingRight),
    pageW: el.offsetWidth,
    pageH: el.offsetHeight,
  };
}

const para = (text, opts = {}) =>
  new Paragraph({
    spacing: { after: opts.after ?? 0, line: 300 },
    alignment: opts.alignment,
    children: [new TextRun({ text, bold: opts.bold, font: 'Calibri', size: 22, color: opts.color || '1F2937' })],
  });

function letterParagraphs(data) {
  const l = data.letter;
  const t = (v) => (v || '').trim();
  const out = [];
  if (t(l.refNo) || t(l.date)) {
    out.push(
      new Paragraph({
        spacing: { after: 360 },
        tabStops: [{ type: 'right', position: 8500 }],
        children: [
          new TextRun({ text: t(l.refNo) ? `Ref: ${t(l.refNo)}` : '', font: 'Calibri', size: 21, color: '374151' }),
          new TextRun({ text: t(l.date) ? `\tDate: ${t(l.date)}` : '', font: 'Calibri', size: 21, color: '374151' }),
        ],
      })
    );
  }
  if (t(l.subject)) out.push(para(`Subject: ${t(l.subject)}`, { bold: true, after: 240 }));
  if (t(l.body)) {
    l.body
      .replace(/\s+$/, '')
      .split('\n')
      .forEach((line) => out.push(para(line, { after: 0 })));
  }
  if (t(l.signName)) {
    out.push(para('', { after: 0 }), para('', { after: 0 }), para('', { after: 0 }));
    out.push(para(t(l.signName), { bold: true }));
    if (t(l.signTitle)) out.push(para(t(l.signTitle)));
    out.push(para(t(data.academy.name)));
  }
  return out;
}

/**
 * Word export: the letterhead artwork (header, footer, colours, logo) is placed as a
 * full-page picture behind the text inside the Word header, so it repeats on every page
 * and looks exactly like the preview. The margins are set to the writing area, so the
 * body stays a normal, fully editable Word document.
 */
export async function buildDocx(el, data, { scale = 2.5, includeLetter = true } = {}) {
  const area = measureWritingArea(el);
  const canvas = await capturePage(el, scale);
  const png = await canvasToBytes(canvas);

  const pageWTw = 11906;
  const pageHTw = 16838;
  const top = Math.round(area.top * TWIP_PER_PX);
  const bottom = Math.round(area.bottom * TWIP_PER_PX);
  const left = Math.round(area.left * TWIP_PER_PX);
  const right = Math.round(area.right * TWIP_PER_PX);

  const background = new ImageRun({
    type: 'png',
    data: png,
    transformation: { width: A4_W_MM * PX_PER_MM, height: A4_H_MM * PX_PER_MM },
    floating: {
      horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 0 },
      verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 0 },
      behindDocument: true,
      allowOverlap: true,
      lockAnchor: true,
      wrap: { type: TextWrappingType.NONE },
    },
    altText: { name: 'Letterhead', description: `${data.academy.name} letterhead`, title: 'Letterhead' },
  });

  const body = includeLetter ? letterParagraphs(data) : [];
  if (body.length === 0) body.push(para(''));

  const doc = new Document({
    creator: data.academy.name,
    title: `${data.academy.name} Letterhead`,
    description: 'Official letterhead',
    styles: {
      default: { document: { run: { font: 'Calibri', size: 22 } } },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: pageWTw, height: pageHTw },
            margin: { top, bottom, left, right, header: 0, footer: 0, gutter: 0 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                spacing: { before: 0, after: 0, line: 240 },
                alignment: AlignmentType.LEFT,
                children: [background, new TextRun({ text: '', size: 2 })],
              }),
            ],
          }),
        },
        children: body,
      },
    ],
  });
  return Packer.toBlob(doc);
}

// ---- saving files: browser download, or the claude.ai viewer's download capability ----
let downloadsPromise = null;
function getDownloads() {
  if (!downloadsPromise) {
    downloadsPromise =
      typeof window !== 'undefined' && window.claude && typeof window.claude.use === 'function'
        ? window.claude.use('downloads').catch(() => null)
        : Promise.resolve(null);
  }
  return downloadsPromise;
}

export function isHostedViewer() {
  return typeof window !== 'undefined' && !!(window.claude && typeof window.claude.use === 'function');
}

export async function saveFile(blob, filename) {
  const downloads = await getDownloads();
  if (downloads) {
    try {
      await downloads.save({ filename, data: blob });
      return 'saved';
    } catch (e) {
      if (e && e.code === 'declined') return 'declined';
      throw new Error(e?.message || 'The file could not be saved.');
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'saved';
}

export function safeFileName(name, fallback = 'Letterhead') {
  const s = (name || '').trim().replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '-');
  return s || fallback;
}
