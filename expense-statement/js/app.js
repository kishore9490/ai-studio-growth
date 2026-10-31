/* Expense Statement Generator – editor UI, local storage and preview. */
(function () {
  'use strict';

  var Core = window.Core;
  var STORE_KEY = 'esg:v1:statements';
  var DRAFT_KEY = 'esg:v1:draft';

  var DEFAULT_COMPANY = 'JCH Business Solutions LLP';
  var DEFAULT_DISCLAIMER = [
    'This statement summarises IT service, software and related expenses incurred on the customer\'s behalf. It is provided for reimbursement and record purposes and is not a tax invoice.',
    'Amounts originally paid in another currency have been converted at the prevailing exchange rate on the date of purchase and are indicative.',
    'Recurring charges are shown by billing cycle. Monthly, quarterly and annual charges are reported separately and are not combined into a single monthly figure.',
    'Subscription and licence prices are set by the respective vendors and may change at renewal.',
    'Pending items are excluded from totals and will be reported once the final amounts are confirmed. Supporting vendor invoices are available on request.'
  ].join('\n');

  /* ---------------- State ---------------- */

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  function blankItem() {
    return { id: uid(), description: '', quantity: '1', unitCost: '', frequency: 'monthly', notes: '' };
  }

  function blankState(preparedBy) {
    var s = {
      id: null,
      preparedBy: preparedBy || DEFAULT_COMPANY,
      companyDetails: '',
      customer: '',
      contact: '',
      date: Core.todayISO(),
      currency: 'USD',
      reference: '',
      refManual: false,
      logo: null,
      disclaimer: DEFAULT_DISCLAIMER,
      items: [blankItem()]
    };
    s.reference = Core.makeReference(s.preparedBy, s.customer, s.date);
    return s;
  }

  function sampleState() {
    var s = blankState(DEFAULT_COMPANY);
    s.customer = 'SABVEX';
    s.contact = 'Saba Tasneem';
    s.currency = 'USD';
    s.items = [
      { id: uid(), description: 'Microsoft 365 E3', quantity: '4', unitCost: '40.95', frequency: 'monthly', notes: '4 user licences at $40.95 per user per month.' },
      { id: uid(), description: 'Microsoft 365 Basic', quantity: '1', unitCost: '7.35', frequency: 'monthly', notes: '1 user licence at $7.35 per user per month.' },
      { id: uid(), description: 'AnyDesk Solo Core License', quantity: '1', unitCost: '161.13', frequency: 'annually',
        notes: 'Paid INR 15,292.80 including GST; converted to USD 161.13. Source invoice: AIN00000000399.' },
      { id: uid(), description: 'Laptop rental', quantity: '1', unitCost: '', frequency: 'monthly', notes: 'Rental amount awaiting confirmation from the vendor.' }
    ];
    s.reference = Core.makeReference(s.preparedBy, s.customer, s.date);
    return s;
  }

  function normalize(raw) {
    var base = blankState(raw && raw.preparedBy);
    var s = Object.assign(base, raw || {});
    s.items = Array.isArray(s.items) ? s.items.map(function (it) {
      return Object.assign(blankItem(), it, { id: (it && it.id) || uid() });
    }) : [];
    if (!Core.CURRENCIES[s.currency]) s.currency = 'USD';
    if (typeof s.disclaimer !== 'string') s.disclaimer = DEFAULT_DISCLAIMER;
    return s;
  }

  var state;

  /* ---------------- Storage (all access guarded) ---------------- */

  function readJSON(key, fallback) {
    try {
      var v = window.localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) { return fallback; }
  }
  function writeJSON(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }
  function savedList() {
    var l = readJSON(STORE_KEY, []);
    return Array.isArray(l) ? l : [];
  }

  /* ---------------- DOM ---------------- */

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var form = $('#form');
  var itemsEl = $('#items');
  var tpl = $('#itemTpl');
  var totalsEl = $('#totals');
  var pagesEl = $('#pages');
  var pageCountEl = $('#pageCount');
  var liveDot = $('.live-dot');
  var saveStatus = $('#saveStatus');

  // Currency options
  var curSel = $('#currency');
  Object.keys(Core.CURRENCIES).forEach(function (code) {
    var o = document.createElement('option');
    o.value = code;
    o.textContent = code + ' – ' + Core.CURRENCIES[code].label;
    curSel.appendChild(o);
  });

  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  var FIELDS = ['preparedBy', 'customer', 'contact', 'date', 'currency', 'reference', 'companyDetails', 'disclaimer'];

  function fillForm() {
    FIELDS.forEach(function (k) {
      var el = form.elements[k];
      if (el) el.value = state[k] || '';
    });
    renderLogo();
    renderItems();
    renderTotals();
  }

  function money(c) { return Core.formatMoney(c, state.currency, false); }

  function renderItems() {
    itemsEl.innerHTML = '';
    state.items.forEach(function (it, i) {
      var node = tpl.content.firstElementChild.cloneNode(true);
      node.dataset.id = it.id;
      $('.item-no', node).textContent = i + 1;
      var sel = $('select[data-k=frequency]', node);
      Core.FREQUENCIES.forEach(function (f) {
        var o = document.createElement('option');
        o.value = f.id; o.textContent = f.label;
        sel.appendChild(o);
      });
      node.querySelectorAll('[data-k]').forEach(function (el) { el.value = it[el.dataset.k] || ''; });
      if (!it.frequency) sel.value = 'onetime';
      $('[data-act=up]', node).disabled = i === 0;
      $('[data-act=down]', node).disabled = i === state.items.length - 1;
      itemsEl.appendChild(node);
      updateItemAmount(node, it);
    });
  }

  function updateItemAmount(node, it) {
    var out = $('.i-amount', node);
    var cents = Core.lineCents(it);
    var pending = cents === null && Core.isMeaningful(it);
    out.textContent = cents === null ? (pending ? 'Pending' : '–') : money(cents);
    out.classList.toggle('pending', pending);
    node.classList.toggle('pending', pending);
  }

  function renderTotals() {
    var T = Core.computeTotals(state.items);
    var cells = [
      ['Monthly', money(T.monthly)],
      ['Quarterly', money(T.quarterly)],
      ['Annual', money(T.annually)],
      ['One-time', money(T.onetime)],
      ['Pending', T.pending.length ? T.pending.length + (T.pending.length === 1 ? ' item' : ' items') : 'None', 'pend'],
      ['First month', money(T.firstMonth), 'hero']
    ];
    totalsEl.innerHTML = '';
    cells.forEach(function (c) {
      var d = document.createElement('div');
      d.className = 'tot' + (c[2] ? ' ' + c[2] : '');
      var sm = document.createElement('small'); sm.textContent = c[0];
      var b = document.createElement('b'); b.textContent = c[1]; b.title = c[1];
      d.appendChild(sm); d.appendChild(b);
      totalsEl.appendChild(d);
    });
  }

  function renderLogo() {
    var box = $('#logoPreview');
    box.innerHTML = '';
    if (state.logo && state.logo.dataUrl) {
      var img = new Image();
      img.alt = 'Company logo';
      img.src = state.logo.dataUrl;
      box.appendChild(img);
    } else {
      box.textContent = 'No logo – ' + Core.initials(state.preparedBy) + ' monogram used';
    }
  }

  /* ---------------- Change handling ---------------- */

  var dirty = false;
  function changed(opts) {
    dirty = true;
    saveStatus.textContent = state.id ? 'Unsaved changes' : 'Draft';
    saveStatus.classList.remove('saved');
    writeJSON(DRAFT_KEY, state);
    if (!opts || !opts.skipTotals) renderTotals();
    schedulePreview();
  }

  function maybeAutoRef() {
    if (!state.refManual) {
      state.reference = Core.makeReference(state.preparedBy, state.customer, state.date);
      form.elements.reference.value = state.reference;
    }
  }

  form.addEventListener('input', function (e) {
    var el = e.target;
    var itemNode = el.closest('.item');
    if (itemNode && el.dataset.k) {
      var it = findItem(itemNode.dataset.id);
      if (!it) return;
      it[el.dataset.k] = el.value;
      updateItemAmount(itemNode, it);
      changed();
      return;
    }
    var k = el.name;
    if (!k || FIELDS.indexOf(k) < 0) return;
    state[k] = el.value;
    if (k === 'reference') state.refManual = el.value.trim() !== '';
    if (k === 'preparedBy' || k === 'customer' || k === 'date') maybeAutoRef();
    if (k === 'preparedBy') renderLogo();
    if (k === 'currency') state.items.forEach(function (it) {
      var n = itemsEl.querySelector('.item[data-id="' + it.id + '"]');
      if (n) updateItemAmount(n, it);
    });
    changed();
  });

  function findItem(id) {
    for (var i = 0; i < state.items.length; i++) if (state.items[i].id === id) return state.items[i];
    return null;
  }

  itemsEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');
    if (!btn) return;
    var node = btn.closest('.item');
    var idx = state.items.findIndex(function (it) { return it.id === node.dataset.id; });
    if (idx < 0) return;
    var act = btn.dataset.act;
    if (act === 'remove') {
      var it = state.items[idx];
      if (Core.isMeaningful(it) && !window.confirm('Remove "' + (it.description || 'this item') + '"?')) return;
      state.items.splice(idx, 1);
      if (!state.items.length) state.items.push(blankItem());
    } else if (act === 'up' && idx > 0) {
      state.items.splice(idx - 1, 0, state.items.splice(idx, 1)[0]);
    } else if (act === 'down' && idx < state.items.length - 1) {
      state.items.splice(idx + 1, 0, state.items.splice(idx, 1)[0]);
    } else return;
    renderItems();
    changed();
  });

  $('#btnAdd').addEventListener('click', function () {
    state.items.push(blankItem());
    renderItems();
    changed();
    var last = itemsEl.lastElementChild;
    if (last) { last.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); $('.i-desc', last).focus({ preventScroll: true }); }
  });

  $('#btnRef').addEventListener('click', function () {
    state.refManual = false;
    maybeAutoRef();
    changed();
  });

  $('#btnResetNotes').addEventListener('click', function () {
    state.disclaimer = DEFAULT_DISCLAIMER;
    form.elements.disclaimer.value = DEFAULT_DISCLAIMER;
    changed();
  });

  /* ---------------- Logo ---------------- */

  $('#logoInput').addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast('Logo is too large (max 5 MB).'); return; }
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        // Normalise to a modest PNG so it embeds cleanly and keeps storage small.
        var w = img.naturalWidth || 400, h = img.naturalHeight || 120;
        var scale = Math.min(1, 600 / w, 240 / h);
        var cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
        var c = document.createElement('canvas');
        c.width = cw; c.height = ch;
        c.getContext('2d').drawImage(img, 0, 0, cw, ch);
        try {
          state.logo = { dataUrl: c.toDataURL('image/png'), w: cw, h: ch };
          renderLogo();
          changed();
          toast('Logo added.');
        } catch (err) { toast('Could not read that image.'); }
      };
      img.onerror = function () { toast('Could not read that image.'); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
  $('#logoRemove').addEventListener('click', function () {
    if (!state.logo) return;
    state.logo = null;
    renderLogo();
    changed();
  });

  /* ---------------- PDF generation & preview ---------------- */

  function buildDoc() {
    return window.StatementPDF.build(state).doc;
  }

  var previewTimer, previewGen = 0, lastWidth = 0;
  function schedulePreview(delay) {
    clearTimeout(previewTimer);
    liveDot.classList.add('busy');
    previewTimer = setTimeout(renderPreview, delay === undefined ? 300 : delay);
  }

  var pdfjsReady = (function () {
    if (!window.pdfjsLib) return Promise.resolve(false);
    if (location.protocol === 'file:') {
      // Workers cannot load from file://, so run pdf.js on the main thread.
      return new Promise(function (resolve) {
        var s = document.createElement('script');
        s.src = 'vendor/pdf.worker.min.js';
        s.onload = function () { resolve(true); };
        s.onerror = function () { resolve(false); };
        document.head.appendChild(s);
      });
    }
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
    return Promise.resolve(true);
  })();

  var fallbackUrl;
  function renderPreview() {
    var gen = ++previewGen;
    var doc;
    try { doc = buildDoc(); }
    catch (err) {
      console.error(err);
      pagesEl.innerHTML = '<div class="preview-empty">Could not generate the preview.</div>';
      liveDot.classList.remove('busy');
      return;
    }
    var pageCount = doc.getNumberOfPages();
    pageCountEl.textContent = pageCount + (pageCount === 1 ? ' page' : ' pages') + ' · A4';

    pdfjsReady.then(function (ok) {
      if (gen !== previewGen) return;
      if (!ok) return iframeFallback(doc, gen);
      var data = new Uint8Array(doc.output('arraybuffer'));
      var task = window.pdfjsLib.getDocument({ data: data, isEvalSupported: false });
      return task.promise.then(function (pdf) {
        var holder = document.createElement('div');
        holder.style.display = 'contents';
        var avail = Math.max(240, pagesEl.clientWidth - (window.innerWidth <= 860 ? 24 : 48));
        var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        var chain = Promise.resolve();
        for (var p = 1; p <= pdf.numPages; p++) {
          (function (n) {
            chain = chain.then(function () {
              if (gen !== previewGen) return;
              return pdf.getPage(n).then(function (page) {
                var base = page.getViewport({ scale: 1 });
                var scale = Math.min(avail, 860) / base.width;
                var vp = page.getViewport({ scale: scale * dpr });
                var canvas = document.createElement('canvas');
                canvas.width = Math.floor(vp.width);
                canvas.height = Math.floor(vp.height);
                canvas.style.width = Math.floor(vp.width / dpr) + 'px';
                canvas.style.height = Math.floor(vp.height / dpr) + 'px';
                canvas.setAttribute('aria-label', 'Statement page ' + n);
                holder.appendChild(canvas);
                return page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
              });
            });
          })(p);
        }
        return chain.then(function () {
          if (gen !== previewGen) return;
          lastWidth = pagesEl.clientWidth;
          var top = pagesEl.scrollTop;
          pagesEl.innerHTML = '';
          pagesEl.appendChild(holder);
          pagesEl.scrollTop = top;
        }).finally(function () { pdf.destroy(); });
      }).catch(function (err) {
        console.warn('pdf.js preview failed, using embedded viewer', err);
        if (gen === previewGen) iframeFallback(doc, gen);
      });
    }).finally(function () {
      if (gen === previewGen) liveDot.classList.remove('busy');
    });
  }

  function iframeFallback(doc, gen) {
    if (gen !== previewGen) return;
    if (fallbackUrl) URL.revokeObjectURL(fallbackUrl);
    fallbackUrl = URL.createObjectURL(doc.output('blob'));
    pagesEl.innerHTML = '';
    var f = document.createElement('iframe');
    f.title = 'Statement preview';
    f.src = fallbackUrl + '#toolbar=0&view=FitH';
    pagesEl.appendChild(f);
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (pagesEl.clientWidth && Math.abs(pagesEl.clientWidth - lastWidth) > 30) schedulePreview(0);
    }, 200);
  });

  /* ---------------- Download & print ---------------- */

  function validateForOutput() {
    var meaningful = state.items.filter(Core.isMeaningful);
    if (!meaningful.length) { toast('Add at least one expense item first.'); return false; }
    if (!String(state.customer).trim()) toast('Tip: add a customer company name.');
    return true;
  }

  $('#btnDownload').addEventListener('click', function () {
    if (!validateForOutput()) return;
    try {
      buildDoc().save(window.StatementPDF.fileName(state));
      toast('PDF downloaded.');
    } catch (err) { console.error(err); toast('Could not create the PDF.'); }
  });

  var printFrame, printUrl;
  $('#btnPrint').addEventListener('click', function () {
    if (!validateForOutput()) return;
    var doc;
    try { doc = buildDoc(); } catch (err) { console.error(err); toast('Could not create the PDF.'); return; }
    doc.autoPrint();
    if (printUrl) URL.revokeObjectURL(printUrl);
    printUrl = URL.createObjectURL(doc.output('blob'));
    var mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (mobile) {
      if (!window.open(printUrl, '_blank')) toast('Allow pop-ups to print, or use Download PDF.');
      return;
    }
    if (printFrame) printFrame.remove();
    printFrame = document.createElement('iframe');
    printFrame.setAttribute('aria-hidden', 'true');
    printFrame.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;';
    printFrame.onload = function () {
      setTimeout(function () {
        try {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();
        } catch (err) {
          if (!window.open(printUrl, '_blank')) toast('Allow pop-ups to print, or use Download PDF.');
        }
      }, 300);
    };
    printFrame.src = printUrl;
    document.body.appendChild(printFrame);
  });

  /* ---------------- Save / open ---------------- */

  function markSaved() {
    dirty = false;
    saveStatus.textContent = 'Saved';
    saveStatus.classList.add('saved');
  }

  function saveCurrent() {
    var list = savedList();
    if (!state.id) state.id = uid();
    var entry = { id: state.id, savedAt: new Date().toISOString(), data: JSON.parse(JSON.stringify(state)) };
    var i = list.findIndex(function (x) { return x.id === state.id; });
    if (i >= 0) list[i] = entry; else list.unshift(entry);
    if (!writeJSON(STORE_KEY, list)) { toast('Could not save – browser storage is unavailable or full.'); return; }
    writeJSON(DRAFT_KEY, state);
    markSaved();
    toast('Statement saved in this browser.');
  }

  $('#btnSave').addEventListener('click', saveCurrent);
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveCurrent(); }
  });

  function loadState(s, msg) {
    state = normalize(s);
    fillForm();
    writeJSON(DRAFT_KEY, state);
    dirty = false;
    saveStatus.textContent = state.id ? 'Saved' : '';
    saveStatus.classList.toggle('saved', !!state.id);
    schedulePreview(0);
    if (msg) toast(msg);
  }

  function confirmDiscard() {
    return !dirty || window.confirm('You have unsaved changes. Continue without saving?');
  }

  $('#btnNew').addEventListener('click', function () {
    if (!confirmDiscard()) return;
    var s = blankState(state.preparedBy);
    s.companyDetails = state.companyDetails;
    s.logo = state.logo;
    s.currency = state.currency;
    loadState(s, 'New statement started.');
  });

  $('#btnSample').addEventListener('click', function () {
    if (!confirmDiscard()) return;
    loadState(sampleState(), 'Sample statement loaded.');
  });

  var dialog = $('#openDialog');
  var listEl = $('#savedList');

  function fmtSaved(iso) {
    try { return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }
    catch (e) { return iso; }
  }

  function renderSaved() {
    var list = savedList();
    listEl.innerHTML = '';
    if (!list.length) {
      var li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'No saved statements yet.';
      listEl.appendChild(li);
      return;
    }
    list.forEach(function (entry) {
      var d = entry.data || {};
      var T = Core.computeTotals(d.items || []);
      var li = document.createElement('li');
      if (state.id === entry.id) li.className = 'current';
      var meta = document.createElement('div');
      meta.className = 'meta';
      var b = document.createElement('b');
      b.textContent = (d.customer || 'Untitled customer') + ' · ' + (d.reference || '');
      var sm = document.createElement('small');
      sm.textContent = 'First month ' + Core.formatMoney(T.firstMonth, d.currency, false) + ' · saved ' + fmtSaved(entry.savedAt);
      meta.appendChild(b); meta.appendChild(sm);
      var open = document.createElement('button');
      open.type = 'button'; open.className = 'btn outline small'; open.textContent = 'Open';
      open.addEventListener('click', function () {
        if (!confirmDiscard()) return;
        dialog.close();
        loadState(Object.assign({}, entry.data, { id: entry.id }), 'Statement opened.');
      });
      var del = document.createElement('button');
      del.type = 'button'; del.className = 'icon-btn danger'; del.innerHTML = '&times;';
      del.title = 'Delete'; del.setAttribute('aria-label', 'Delete saved statement');
      del.addEventListener('click', function () {
        if (!window.confirm('Delete this saved statement?')) return;
        writeJSON(STORE_KEY, savedList().filter(function (x) { return x.id !== entry.id; }));
        if (state.id === entry.id) { state.id = null; changed(); }
        renderSaved();
      });
      li.appendChild(meta); li.appendChild(open); li.appendChild(del);
      listEl.appendChild(li);
    });
  }

  $('#btnOpen').addEventListener('click', function () {
    renderSaved();
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  });

  $('#btnExport').addEventListener('click', function () {
    var blob = new Blob([JSON.stringify({ app: 'expense-statement', version: 1, statement: state }, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = window.StatementPDF.fileName(state).replace(/\.pdf$/, '.json');
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });

  $('#importInput').addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(reader.result);
        var s = parsed && parsed.statement ? parsed.statement : parsed;
        if (!s || !Array.isArray(s.items)) throw new Error('invalid');
        if (!confirmDiscard()) return;
        s.id = null; // imported copies are saved as new entries
        dialog.close();
        loadState(s, 'Statement imported. Click Save to keep it.');
        dirty = true;
      } catch (err) { toast('That file is not a valid statement export.'); }
    };
    reader.readAsText(file);
  });

  window.addEventListener('beforeunload', function () { writeJSON(DRAFT_KEY, state); });

  /* ---------------- Mobile tabs ---------------- */

  var layout = $('.layout');
  document.querySelectorAll('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.tab').forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      layout.dataset.view = tab.dataset.view;
      if (tab.dataset.view === 'preview') schedulePreview(0);
      window.scrollTo(0, 0);
    });
  });

  /* ---------------- Boot ---------------- */

  var draft = readJSON(DRAFT_KEY, null);
  state = draft && Array.isArray(draft.items) ? normalize(draft) : sampleState();
  fillForm();
  if (state.id) {
    var match = savedList().find(function (x) { return x.id === state.id; });
    if (match && JSON.stringify(match.data) === JSON.stringify(state)) markSaved();
    else { saveStatus.textContent = 'Unsaved changes'; dirty = true; }
  }
  schedulePreview(0);
})();
