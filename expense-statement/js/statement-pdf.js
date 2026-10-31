/*
 * Builds the IT Services & Expense Statement PDF with jsPDF + AutoTable.
 * The same document drives the live preview, download and print, so what
 * you see is exactly what is produced.
 */
(function (global) {
  'use strict';

  var PAGE_W = 210, PAGE_H = 297, M = 18, CW = PAGE_W - M * 2;
  var CONTENT_BOTTOM = PAGE_H - 24; // keep clear of the footer
  var CONT_TOP = 26;                 // content start on continuation pages

  var C = {
    navy: [11, 31, 58],
    ink: [33, 47, 71],
    blue: [47, 111, 222],
    blueSoft: [238, 244, 252],
    blueLine: [205, 220, 243],
    grey: [110, 124, 145],
    greyLight: [150, 162, 180],
    rule: [224, 230, 239],
    panel: [248, 250, 253],
    white: [255, 255, 255]
  };

  var WIN_ANSI_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';

  /** Standard PDF fonts only cover WinAnsi; map or drop anything else. */
  function safe(str) {
    var s = String(str === null || str === undefined ? '' : str)
      .replace(/₹\s?/g, 'INR ')
      .replace(/\r\n?/g, '\n')
      .replace(/\t/g, '  ');
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i), code = s.charCodeAt(i);
      if (code === 10 || (code >= 32 && code < 127) || (code >= 160 && code <= 255) || WIN_ANSI_EXTRA.indexOf(ch) >= 0) out += ch;
      else if (code >= 0xD800 && code <= 0xDBFF) { i++; out += '?'; }
      else out += '?';
    }
    return out;
  }

  function fill(doc, c) { doc.setFillColor(c[0], c[1], c[2]); }
  function stroke(doc, c) { doc.setDrawColor(c[0], c[1], c[2]); }
  function color(doc, c) { doc.setTextColor(c[0], c[1], c[2]); }
  function font(doc, style, size) { doc.setFont('helvetica', style); doc.setFontSize(size); }

  /** Shrinks the font until text fits the width. */
  function fitSize(doc, text, style, size, maxW, minSize) {
    font(doc, style, size);
    while (size > (minSize || 6) && doc.getTextWidth(text) > maxW) {
      size -= 0.25;
      doc.setFontSize(size);
    }
    return size;
  }

  function label(doc, text, x, y, c) {
    font(doc, 'bold', 6.3);
    color(doc, c || C.grey);
    doc.text(text.toUpperCase(), x, y, { charSpace: 0.45 });
  }

  function sectionTitle(doc, text, y) {
    fill(doc, C.blue);
    doc.rect(M, y - 3.1, 1.1, 4, 'F');
    font(doc, 'bold', 8.6);
    color(doc, C.navy);
    doc.text(text.toUpperCase(), M + 3.4, y, { charSpace: 0.55 });
  }

  function drawBrandMark(doc, state, x, y, size) {
    if (state.logo && state.logo.dataUrl && state.logo.w && state.logo.h) {
      var maxW = 42, maxH = size;
      var r = Math.min(maxW / state.logo.w, maxH / state.logo.h);
      var w = state.logo.w * r, h = state.logo.h * r;
      try {
        doc.addImage(state.logo.dataUrl, 'PNG', x, y + (size - h) / 2, w, h, undefined, 'FAST');
        return w;
      } catch (e) { /* fall through to the monogram */ }
    }
    fill(doc, C.navy);
    doc.roundedRect(x, y, size, size, 2, 2, 'F');
    fill(doc, C.blue);
    doc.rect(x + 2.6, y + size - 3.2, size - 5.2, 0.7, 'F');
    var ini = safe(global.Core.initials(state.preparedBy)).slice(0, 4);
    var fs = fitSize(doc, ini, 'bold', 11, size - 3.5, 6);
    font(doc, 'bold', fs);
    color(doc, C.white);
    doc.text(ini, x + size / 2, y + size / 2 + 0.6, { align: 'center', baseline: 'middle' });
    return size;
  }

  function build(state) {
    var Core = global.Core;
    var jsPDF = global.jspdf.jsPDF;
    var T = Core.computeTotals(state.items);
    var cur = Core.CURRENCIES[state.currency] ? state.currency : 'USD';
    var money = function (c) { return safe(Core.formatMoney(c, cur, true)); };

    var company = safe(String(state.preparedBy || '').trim() || 'Your Company');
    var customer = safe(String(state.customer || '').trim() || 'Customer');
    var contact = safe(String(state.contact || '').trim());
    var ref = safe(String(state.reference || '').trim() || '-');
    var dateText = safe(Core.formatDate(state.date) || '-');
    var details = safe(String(state.companyDetails || '').trim());

    var doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    doc.setProperties({
      title: 'IT Services & Expense Statement - ' + customer + ' - ' + ref,
      subject: 'Expense statement prepared by ' + company + ' for ' + customer,
      author: company,
      creator: 'Expense Statement Generator'
    });
    doc.setLineHeightFactor(1.3);

    /* ---------------- Header ---------------- */
    fill(doc, C.navy); doc.rect(0, 0, PAGE_W, 3.2, 'F');
    fill(doc, C.blue); doc.rect(0, 3.2, PAGE_W, 0.7, 'F');

    var markW = drawBrandMark(doc, state, M, 13, 14);
    var tx = M + markW + 4.5;
    var nameSize = fitSize(doc, company, 'bold', 12.5, 112 - markW, 8);
    font(doc, 'bold', nameSize); color(doc, C.navy);
    doc.text(company, tx, 18.6);
    font(doc, 'normal', 7.4); color(doc, C.grey);
    var detailLines = details ? doc.splitTextToSize(details.replace(/\n+/g, '  |  '), 112 - markW).slice(0, 2) : ['IT Services & Technology Solutions'];
    doc.text(detailLines, tx, 23.2);

    // Reference block (top right)
    var rx = PAGE_W - M;
    font(doc, 'bold', 6.3); color(doc, C.grey);
    doc.text('STATEMENT REFERENCE', rx, 16.4, { align: 'right' });
    var refSize = fitSize(doc, ref, 'bold', 9.6, 62, 6.5);
    font(doc, 'bold', refSize); color(doc, C.navy);
    doc.text(ref, rx, 21.2, { align: 'right' });
    font(doc, 'normal', 7.6); color(doc, C.grey);
    doc.text(dateText, rx, 25.6, { align: 'right' });

    stroke(doc, C.rule); doc.setLineWidth(0.25);
    doc.line(M, 33, PAGE_W - M, 33);

    /* ---------------- Title ---------------- */
    font(doc, 'bold', 18.5); color(doc, C.navy);
    doc.text('IT SERVICES & EXPENSE STATEMENT', M, 45, { charSpace: 0.35 });
    fill(doc, C.blue); doc.rect(M, 48.6, 24, 0.9, 'F');
    font(doc, 'normal', 8.6); color(doc, C.grey);
    doc.text(doc.splitTextToSize('Statement of IT service and software expenses incurred by ' + company +
      ' on behalf of ' + customer + '.', CW)[0], M, 55.2);

    /* ---------------- Party details ---------------- */
    var y = 61;
    var gap = 4, bw = (CW - gap * 2) / 3, pad = 4.5;
    var boxes = [
      { title: 'Prepared for', main: customer, lines: contact ? ['Attn: ' + contact] : [] },
      { title: 'Prepared by', main: company, lines: details ? details.split('\n') : [] },
      { title: 'Statement details', kv: [['Reference', ref], ['Date', dateText], ['Currency', cur + ' - ' + Core.CURRENCIES[cur].label]] }
    ];
    // Measure
    var bodies = boxes.map(function (b) {
      if (b.kv) return null;
      font(doc, 'bold', 9.8);
      var main = doc.splitTextToSize(b.main, bw - pad * 2).slice(0, 2);
      font(doc, 'normal', 7.8);
      var sub = [];
      b.lines.forEach(function (l) { sub = sub.concat(doc.splitTextToSize(l, bw - pad * 2)); });
      return { main: main, sub: sub.slice(0, 3) };
    });
    var boxH = 25;
    bodies.forEach(function (b) {
      if (b) boxH = Math.max(boxH, 12 + b.main.length * 4.4 + b.sub.length * 3.7 + 3);
    });
    boxes.forEach(function (b, i) {
      var bx = M + i * (bw + gap);
      fill(doc, C.panel); stroke(doc, C.rule); doc.setLineWidth(0.2);
      doc.roundedRect(bx, y, bw, boxH, 1.6, 1.6, 'FD');
      label(doc, b.title, bx + pad, y + 6.2, C.blue);
      if (b.kv) {
        var ky = y + 12;
        b.kv.forEach(function (kv) {
          font(doc, 'normal', 7.4); color(doc, C.grey);
          doc.text(kv[0], bx + pad, ky);
          var vs = fitSize(doc, kv[1], 'bold', 7.8, bw - pad * 2 - 17, 5.5);
          font(doc, 'bold', vs); color(doc, C.navy);
          doc.text(kv[1], bx + bw - pad, ky, { align: 'right' });
          ky += 4.6;
        });
      } else {
        var body = bodies[i];
        var by = y + 12.2;
        font(doc, 'bold', 9.8); color(doc, C.navy);
        doc.text(body.main, bx + pad, by);
        by += body.main.length * 4.4;
        font(doc, 'normal', 7.8); color(doc, C.ink);
        body.sub.forEach(function (l) { doc.text(l, bx + pad, by); by += 3.7; });
      }
    });
    y += boxH + 7;

    /* ---------------- Summary cards ---------------- */
    var cards = [
      { label: 'Monthly', value: money(T.monthly), cap: 'per month' },
      { label: 'Quarterly', value: money(T.quarterly), cap: 'per quarter' },
      { label: 'Annual', value: money(T.annually), cap: 'per year' },
      { label: 'One-time', value: money(T.onetime), cap: 'non-recurring' },
      { label: 'Pending', value: T.pending.length ? T.pending.length + (T.pending.length === 1 ? ' item' : ' items') : 'None', cap: 'amount to confirm', pending: true },
      { label: 'First month', value: money(T.firstMonth), cap: 'total incl. annual', hero: true }
    ];
    var cg = 2.6, cw = (CW - cg * (cards.length - 1)) / cards.length, ch = 19.5;
    cards.forEach(function (c, i) {
      var cx = M + i * (cw + cg);
      if (c.hero) { fill(doc, C.navy); doc.roundedRect(cx, y, cw, ch, 1.6, 1.6, 'F'); }
      else {
        fill(doc, c.pending && T.pending.length ? C.blueSoft : C.white);
        stroke(doc, c.pending && T.pending.length ? C.blueLine : C.rule); doc.setLineWidth(0.2);
        doc.roundedRect(cx, y, cw, ch, 1.6, 1.6, 'FD');
      }
      label(doc, c.label, cx + 3, y + 5.6, c.hero ? [170, 196, 240] : C.grey);
      var vs = fitSize(doc, c.value, 'bold', 10.6, cw - 6, 6);
      font(doc, 'bold', vs); color(doc, c.hero ? C.white : (c.pending && T.pending.length ? C.blue : C.navy));
      doc.text(c.value, cx + 3, y + 11.8);
      font(doc, 'normal', 6.2); color(doc, c.hero ? [190, 208, 236] : C.greyLight);
      doc.text(c.cap, cx + 3, y + 16.2);
    });
    y += ch + 10;

    /* ---------------- Expense breakdown ---------------- */
    sectionTitle(doc, 'Expense breakdown', y);
    y += 3.5;

    var body = [];
    var lineW = 0.2;
    T.rows.forEach(function (r, idx) {
      var it = r.item;
      var notes = safe(String(it.notes || '').trim());
      var bottom = notes ? 0 : lineW;
      var bs = { lineWidth: { bottom: bottom }, lineColor: C.rule };
      var pending = r.cents === null;
      body.push([
        { content: String(idx + 1).padStart(2, '0'), styles: Object.assign({ textColor: C.greyLight, fontStyle: 'bold' }, bs) },
        { content: safe(String(it.description || '').trim() || 'Untitled expense'), styles: Object.assign({ fontStyle: 'bold', textColor: C.navy }, bs) },
        { content: Core.freqLabel(r.frequency), styles: bs },
        { content: safe(Core.formatQty(it.quantity)), styles: Object.assign({ halign: 'right' }, bs) },
        { content: pending ? '-' : money(Math.round(Core.parseNum(it.unitCost) * 100)), styles: Object.assign({ halign: 'right' }, bs) },
        { content: pending ? 'Pending' : money(r.cents), styles: Object.assign({ halign: 'right', fontStyle: pending ? 'bolditalic' : 'bold', textColor: pending ? C.blue : C.navy }, bs) }
      ]);
      if (notes) {
        body.push([
          { content: '', styles: { lineWidth: { bottom: lineW }, lineColor: C.rule, cellPadding: { top: 0, bottom: 2.6, left: 2, right: 2 } } },
          { content: notes, colSpan: 5, styles: { fontSize: 7.3, textColor: C.grey, fontStyle: 'italic', lineWidth: { bottom: lineW }, lineColor: C.rule, cellPadding: { top: 0, bottom: 2.8, left: 2.4, right: 2.4 } } }
        ]);
      }
    });
    if (!body.length) {
      body.push([{ content: 'No expense items have been added yet.', colSpan: 6, styles: { halign: 'center', textColor: C.greyLight, fontStyle: 'italic', cellPadding: 6 } }]);
    }

    doc.autoTable({
      startY: y,
      margin: { left: M, right: M, top: CONT_TOP + 2, bottom: 26 },
      head: [['#', 'Description', 'Billing', 'Qty', 'Unit cost', 'Amount']],
      body: body,
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 8.4, textColor: C.ink, cellPadding: { top: 3, bottom: 3, left: 2.4, right: 2.4 }, valign: 'middle', overflow: 'linebreak' },
      headStyles: { fillColor: C.navy, textColor: C.white, fontStyle: 'bold', fontSize: 7, cellPadding: { top: 2.8, bottom: 2.8, left: 2.4, right: 2.4 } },
      columnStyles: {
        0: { cellWidth: 9 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 22 },
        3: { cellWidth: 12 },
        4: { cellWidth: 26 },
        5: { cellWidth: 28 }
      },
      didParseCell: function (d) {
        if (d.section === 'head' && d.column.index >= 3) d.cell.styles.halign = 'right';
      },
      showHead: 'everyPage'
    });
    y = doc.lastAutoTable.finalY + 10;

    function ensure(h) {
      if (y + h > CONTENT_BOTTOM) { doc.addPage(); y = CONT_TOP + 6; }
    }

    /* ---------------- Monthly & annual summaries ---------------- */
    function summaryPanel(x, w, top, title, rows, totalLabel, totalValue) {
      var py = top;
      label(doc, title, x, py, C.navy);
      py += 3;
      stroke(doc, C.navy); doc.setLineWidth(0.35);
      doc.line(x, py, x + w, py);
      py += 0.5;
      rows.forEach(function (r) {
        py += 6.4;
        font(doc, 'normal', 8); color(doc, C.ink);
        doc.text(r[0], x + 0.5, py - 2.2);
        if (r[2]) {
          var lw = doc.getTextWidth(r[0]);
          font(doc, 'normal', 6.6); color(doc, C.greyLight);
          doc.text(r[2], x + 0.5 + lw + 1.8, py - 2.2);
        }
        font(doc, 'bold', 8.2); color(doc, C.navy);
        doc.text(r[1], x + w - 0.5, py - 2.2, { align: 'right' });
        stroke(doc, C.rule); doc.setLineWidth(0.18);
        doc.line(x, py, x + w, py);
      });
      py += 2;
      fill(doc, C.navy);
      doc.roundedRect(x, py, w, 9.5, 1.2, 1.2, 'F');
      font(doc, 'bold', 7); color(doc, [190, 208, 236]);
      doc.text(totalLabel.toUpperCase(), x + 3.2, py + 6, { charSpace: 0.4 });
      var ts = fitSize(doc, totalValue, 'bold', 10.4, w * 0.45, 7);
      font(doc, 'bold', ts); color(doc, C.white);
      doc.text(totalValue, x + w - 3.2, py + 6.3, { align: 'right' });
      return py + 9.5;
    }

    var monthlyRows = [['Monthly recurring charges', money(T.monthly), T.count.monthly ? '(' + T.count.monthly + ' item' + (T.count.monthly > 1 ? 's' : '') + ')' : '']];
    if (T.quarterly) monthlyRows.push(['Quarterly charges (first quarter)', money(T.quarterly), '']);
    monthlyRows.push(['Annual charges billed upfront', money(T.annually), '']);
    if (T.onetime) monthlyRows.push(['One-time charges', money(T.onetime), '']);

    var annualRows = [['Monthly recurring x 12', money(T.monthlyYear), '']];
    if (T.quarterly) annualRows.push(['Quarterly charges x 4', money(T.quarterlyYear), '']);
    annualRows.push(['Annual licences & subscriptions', money(T.annually), '']);
    if (T.onetime) annualRows.push(['One-time charges', money(T.onetime), '']);

    var panelH = 4 + Math.max(monthlyRows.length, annualRows.length) * 6.4 + 13;
    ensure(panelH + 10);
    sectionTitle(doc, 'Expense summary', y);
    y += 8;
    var pw = (CW - 8) / 2;
    var endA = summaryPanel(M, pw, y, 'Monthly expense summary', monthlyRows, 'First-month total', money(T.firstMonth));
    var endB = summaryPanel(M + pw + 8, pw, y, 'Annual expense summary', annualRows, 'Estimated year-one total', money(T.yearOne));
    y = Math.max(endA, endB) + 4;
    font(doc, 'normal', 6.8); color(doc, C.greyLight);
    var basis = 'Recurring charges are shown by billing cycle and are not combined. First-month total = monthly + quarterly + annual + one-time charges.' +
      (T.pending.length ? ' Pending items are excluded.' : '');
    var basisLines = doc.splitTextToSize(basis, CW);
    doc.text(basisLines, M, y + 1);
    y += basisLines.length * 3 + 8;

    /* ---------------- Pending expenses ---------------- */
    if (T.pending.length) {
      var pendRows = T.pending.map(function (it) {
        font(doc, 'normal', 7.3);
        var n = String(it.notes || '').trim();
        return {
          title: safe(String(it.description || '').trim() || 'Untitled expense'),
          meta: Core.freqLabel(it.frequency) + '  |  Qty ' + safe(Core.formatQty(it.quantity)),
          notes: n ? doc.splitTextToSize(safe(n), CW - 60) : []
        };
      });
      var rowH = function (r) { return 8.6 + Math.max(0, r.notes.length - 1) * 3.3; };
      var ph = 4 + pendRows.reduce(function (a, r) { return a + rowH(r); }, 0);
      ensure(ph + 12);
      sectionTitle(doc, 'Pending expenses', y);
      y += 4.5;
      fill(doc, C.blueSoft); stroke(doc, C.blueLine); doc.setLineWidth(0.2);
      doc.roundedRect(M, y, CW, ph, 1.6, 1.6, 'FD');
      var py = y + 7;
      pendRows.forEach(function (r) {
        fill(doc, C.blue); doc.circle(M + 5, py - 1.1, 0.8, 'F');
        font(doc, 'bold', 8.4); color(doc, C.navy);
        doc.text(r.title, M + 8.5, py);
        font(doc, 'normal', 7); color(doc, C.grey);
        doc.text(safe(r.meta), M + 8.5, py + 3.6);
        font(doc, 'bolditalic', 7.6); color(doc, C.blue);
        doc.text('Amount to be confirmed', PAGE_W - M - 4.5, py, { align: 'right' });
        var ny = py + 3.6;
        if (r.notes.length) {
          font(doc, 'italic', 7.3); color(doc, C.ink);
          doc.text(r.notes, PAGE_W - M - 4.5, ny, { align: 'right' });
        }
        py += rowH(r);
      });
      y += ph + 3.5;
      font(doc, 'normal', 6.8); color(doc, C.greyLight);
      doc.text('Pending items are excluded from all totals and will be reported once final amounts are confirmed.', M, y + 1);
      y += 9;
    }

    /* ---------------- Notes & disclaimers ---------------- */
    var notesText = safe(String(state.disclaimer || '').trim());
    if (notesText) {
      ensure(18);
      sectionTitle(doc, 'Notes & disclaimers', y);
      y += 6.5;
      var paras = notesText.split(/\n+/).map(function (p) { return p.trim(); }).filter(Boolean);
      paras.forEach(function (p, i) {
        font(doc, 'normal', 7.5);
        var lines = doc.splitTextToSize(p.replace(/^(\d+[.)]|[-*•])\s*/, ''), CW - 7);
        lines.forEach(function (l, li) {
          ensure(4);
          if (li === 0) { font(doc, 'bold', 7.5); color(doc, C.blue); doc.text(String(i + 1) + '.', M + 0.5, y); }
          font(doc, 'normal', 7.5); color(doc, C.ink);
          doc.text(l, M + 6, y);
          y += 3.5;
        });
        y += 1.4;
      });
      y += 4;
    }

    /* ---------------- Sign-off ---------------- */
    ensure(16);
    stroke(doc, C.rule); doc.setLineWidth(0.2);
    doc.line(PAGE_W - M - 62, y + 9, PAGE_W - M, y + 9);
    font(doc, 'bold', 7.8); color(doc, C.navy);
    doc.text('For ' + company, PAGE_W - M, y + 13, { align: 'right' });
    font(doc, 'normal', 6.8); color(doc, C.greyLight);
    doc.text('Authorised signatory', PAGE_W - M, y + 16.4, { align: 'right' });

    /* ---------------- Running header & footer ---------------- */
    var pages = doc.getNumberOfPages();
    for (var p = 1; p <= pages; p++) {
      doc.setPage(p);
      if (p > 1) {
        fill(doc, C.navy); doc.rect(0, 0, PAGE_W, 1.6, 'F');
        fill(doc, C.blue); doc.rect(0, 1.6, PAGE_W, 0.5, 'F');
        font(doc, 'bold', 8.4); color(doc, C.navy);
        doc.text(company, M, 13);
        font(doc, 'normal', 7.4); color(doc, C.grey);
        doc.text('IT Services & Expense Statement  |  ' + ref, PAGE_W - M, 13, { align: 'right' });
        stroke(doc, C.rule); doc.setLineWidth(0.2);
        doc.line(M, 17, PAGE_W - M, 17);
      }
      stroke(doc, C.rule); doc.setLineWidth(0.2);
      doc.line(M, PAGE_H - 15, PAGE_W - M, PAGE_H - 15);
      font(doc, 'bold', 6.8); color(doc, C.navy);
      doc.text(company, M, PAGE_H - 10.4);
      var cw2 = doc.getTextWidth(company);
      font(doc, 'normal', 6.8); color(doc, C.grey);
      doc.text('  |  Prepared for ' + customer + '  |  Ref. ' + ref, M + cw2, PAGE_H - 10.4);
      font(doc, 'normal', 6.2); color(doc, C.greyLight);
      doc.text('This document is a statement of expenses incurred on the customer\'s behalf. It is not a tax invoice.', M, PAGE_H - 7);
      font(doc, 'bold', 6.8); color(doc, C.grey);
      doc.text('Page ' + p + ' of ' + pages, PAGE_W - M, PAGE_H - 10.4, { align: 'right' });
    }

    return { doc: doc, totals: T };
  }

  function fileName(state) {
    var part = function (s) { return String(s || '').trim().replace(/[^A-Za-z0-9-]+/g, '-').replace(/^-+|-+$/g, ''); };
    return ['Expense-Statement', part(state.customer), part(state.reference)].filter(Boolean).join('_') + '.pdf';
  }

  global.StatementPDF = { build: build, fileName: fileName, safe: safe };
})(window);
