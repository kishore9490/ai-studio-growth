/*
 * Core helpers shared by the editor UI and the PDF builder:
 * number parsing, currency formatting and expense calculations.
 * All money is handled in integer cents to avoid floating point drift.
 */
(function (global) {
  'use strict';

  var CURRENCIES = {
    USD: { label: 'US Dollar', symbol: '$', pdf: '$', locale: 'en-US' },
    INR: { label: 'Indian Rupee', symbol: '₹', pdf: 'INR ', locale: 'en-IN' },
    EUR: { label: 'Euro', symbol: '€', pdf: '€', locale: 'en-IE' },
    GBP: { label: 'British Pound', symbol: '£', pdf: '£', locale: 'en-GB' },
    AED: { label: 'UAE Dirham', symbol: 'AED ', pdf: 'AED ', locale: 'en-US' },
    SGD: { label: 'Singapore Dollar', symbol: 'S$', pdf: 'S$', locale: 'en-SG' },
    AUD: { label: 'Australian Dollar', symbol: 'A$', pdf: 'A$', locale: 'en-AU' },
    CAD: { label: 'Canadian Dollar', symbol: 'C$', pdf: 'C$', locale: 'en-CA' }
  };

  var FREQUENCIES = [
    { id: 'onetime', label: 'One-time' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'quarterly', label: 'Quarterly' },
    { id: 'annually', label: 'Annually' }
  ];

  function freqLabel(id) {
    for (var i = 0; i < FREQUENCIES.length; i++) {
      if (FREQUENCIES[i].id === id) return FREQUENCIES[i].label;
    }
    return 'One-time';
  }

  /** Parses user input like "1,234.50" or "$40.95". Returns null when blank/invalid. */
  function parseNum(v) {
    if (v === null || v === undefined) return null;
    var s = String(v).replace(/[,\s]/g, '').replace(/[^0-9.\-]/g, '');
    if (s === '' || s === '-' || s === '.' || s === '-.') return null;
    var n = Number(s);
    return isFinite(n) ? n : null;
  }

  /** Line amount in cents, or null when the unit cost is blank (pending). Blank quantity counts as 1. */
  function lineCents(item) {
    var unit = parseNum(item.unitCost);
    if (unit === null) return null;
    var q = parseNum(item.quantity);
    if (q === null) q = 1;
    return Math.round(q * unit * 100);
  }

  /** A row is ignored entirely when it has no description, cost or notes. */
  function isMeaningful(item) {
    return !!(String(item.description || '').trim() ||
      String(item.unitCost || '').trim() ||
      String(item.notes || '').trim());
  }

  function computeTotals(items) {
    var t = {
      monthly: 0, quarterly: 0, annually: 0, onetime: 0,
      count: { monthly: 0, quarterly: 0, annually: 0, onetime: 0 },
      pending: [], rows: []
    };
    (items || []).forEach(function (item) {
      if (!isMeaningful(item)) return;
      var freq = ['monthly', 'quarterly', 'annually', 'onetime'].indexOf(item.frequency) >= 0 ? item.frequency : 'onetime';
      var cents = lineCents(item);
      t.rows.push({ item: item, frequency: freq, cents: cents });
      if (cents === null) { t.pending.push(item); return; }
      t[freq] += cents;
      t.count[freq] += 1;
    });
    // Everything billed is charged in the first month: monthly + first quarter + annual upfront + one-time.
    t.firstMonth = t.monthly + t.quarterly + t.annually + t.onetime;
    // Year-one projection keeps each billing cycle separate.
    t.monthlyYear = t.monthly * 12;
    t.quarterlyYear = t.quarterly * 4;
    t.yearOne = t.monthlyYear + t.quarterlyYear + t.annually + t.onetime;
    return t;
  }

  function formatNumber(n, locale, minFrac, maxFrac) {
    try {
      return new Intl.NumberFormat(locale || 'en-US', {
        minimumFractionDigits: minFrac, maximumFractionDigits: maxFrac
      }).format(n);
    } catch (e) {
      return n.toFixed(maxFrac);
    }
  }

  /** Formats cents with the currency symbol. pdf=true uses glyphs supported by standard PDF fonts. */
  function formatMoney(cents, code, pdf) {
    var c = CURRENCIES[code] || CURRENCIES.USD;
    var neg = cents < 0;
    var body = formatNumber(Math.abs(cents) / 100, c.locale, 2, 2);
    return (neg ? '-' : '') + (pdf ? c.pdf : c.symbol) + body;
  }

  function formatQty(v) {
    var n = parseNum(v);
    if (n === null) return '1';
    return formatNumber(n, 'en-US', 0, 2);
  }

  /** Parses YYYY-MM-DD as a local date. */
  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  function formatDate(s) {
    var d = parseDate(s);
    if (!d) return '';
    return d.getDate() + ' ' + ['January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'][d.getMonth()] + ' ' + d.getFullYear();
  }

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  var SUFFIXES = /^(llp|llc|ltd|limited|pvt|private|inc|co|corp|plc|gmbh|the|and|&|of)\.?$/i;

  /** "JCH Business Solutions LLP" -> "JCH"; "Acme Cloud Services" -> "ACS". */
  function initials(name) {
    var words = String(name || '').trim().split(/\s+/).filter(function (w) { return w && !SUFFIXES.test(w); });
    if (!words.length) return 'CO';
    var first = words[0].replace(/[^A-Za-z0-9]/g, '');
    if (first.length >= 2 && first.length <= 5 && first === first.toUpperCase() && /[A-Z]/.test(first)) return first;
    return words.slice(0, 3).map(function (w) { return w.replace(/[^A-Za-z0-9]/g, '').charAt(0); }).join('').toUpperCase() || 'CO';
  }

  function makeReference(preparedBy, customer, dateISO) {
    var date = (dateISO || todayISO()).replace(/-/g, '');
    var cust = String(customer || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'CUST';
    return initials(preparedBy) + '-ES-' + date + '-' + cust;
  }

  global.Core = {
    CURRENCIES: CURRENCIES,
    FREQUENCIES: FREQUENCIES,
    freqLabel: freqLabel,
    parseNum: parseNum,
    lineCents: lineCents,
    isMeaningful: isMeaningful,
    computeTotals: computeTotals,
    formatMoney: formatMoney,
    formatQty: formatQty,
    formatDate: formatDate,
    todayISO: todayISO,
    initials: initials,
    makeReference: makeReference
  };
})(window);
