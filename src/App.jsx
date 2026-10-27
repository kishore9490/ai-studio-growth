import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Building2, Palette, LayoutTemplate, Contact, Share2, FileText, Download, Printer, FileDown, FileType2,
  Upload, Trash2, RefreshCw, ImageOff, Sparkles, ZoomIn, ZoomOut, Maximize2, AlignLeft, AlignCenter,
  RotateCcw, CheckCircle2, AlertTriangle, Loader2, X, Eye, PencilLine, Settings2, CalendarDays, ImagePlus,
} from 'lucide-react';
import Letterhead from './components/Letterhead.jsx';
import { Section, Field, Toggle, Segmented } from './components/ui.jsx';
import {
  DEFAULT_STATE, STORAGE_KEY, COLOR_PRESETS, DESIGNS, LOGO_STYLES, SAMPLE_DETAILS, initialsFrom, mergeState,
} from './lib/defaults.js';
import { makeLogoSvg, svgToDataUrl, toPngDataUrl, readFileAsDataUrl } from './lib/logo.js';
import { buildPdf, buildDocx, saveFile, safeFileName, isHostedViewer } from './lib/exporters.js';

const PAGE_W = 793.7; // 210mm at 96 dpi
const PAGE_H = 1122.5; // 297mm at 96 dpi

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+()\-.\s\d/]{6,}$/;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return mergeState(raw ? JSON.parse(raw) : null);
  } catch {
    return mergeState(null);
  }
}

function todayString() {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function App() {
  const [data, setData] = useState(loadState);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState('');
  const [zoom, setZoom] = useState('fit');
  const [fitScale, setFitScale] = useState(0.6);
  const [mobileView, setMobileView] = useState('edit');
  const [confirmReset, setConfirmReset] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const hosted = useMemo(() => isHostedViewer(), []);

  const fullRef = useRef(null);
  const blankRef = useRef(null);
  const previewBoxRef = useRef(null);
  const fileInputRef = useRef(null);
  const toastTimer = useRef(null);
  const storageWarned = useRef(false);

  const { academy: a, extra: x, letter: l, branding: b, layout: lay, show, exportOpts } = data;

  const set = useCallback((group, key, value) => {
    setData((d) => ({ ...d, [group]: { ...d[group], [key]: value } }));
  }, []);

  const notify = useCallback((type, msg) => {
    clearTimeout(toastTimer.current);
    setToast({ type, msg });
    toastTimer.current = setTimeout(() => setToast(null), type === 'error' ? 7000 : 4500);
  }, []);

  // Save locally (debounced) so everything survives a refresh.
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        if (!storageWarned.current) {
          storageWarned.current = true;
          notify('error', 'Your browser could not save these settings for next time. Everything still works for this session.');
        }
      }
    }, 300);
    return () => clearTimeout(t);
  }, [data, notify]);

  // Logo source used everywhere (preview, PDF, Word, print).
  const initials = (b.logoInitials || initialsFrom(a.name)).slice(0, 4);
  const generatedLogo = useMemo(
    () => svgToDataUrl(makeLogoSvg({ style: b.logoStyle, initials, primary: b.primary, secondary: b.secondary })),
    [b.logoStyle, initials, b.primary, b.secondary]
  );
  const logoSrc = b.logoMode === 'generated' ? generatedLogo : b.logoMode === 'upload' ? b.uploadedLogo || '' : '';

  // Fit-to-width preview scaling.
  useLayoutEffect(() => {
    const el = previewBoxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth - 48;
      const h = el.clientHeight - 48;
      const byW = w / PAGE_W;
      const byH = h > 300 ? h / PAGE_H : byW;
      setFitScale(Math.max(0.3, Math.min(1.1, byW, Math.max(byH, 0.45))));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [mobileView]);
  const scale = zoom === 'fit' ? fitScale : zoom;

  // Warn if typed letter content runs past the writing area.
  useEffect(() => {
    const body = fullRef.current?.querySelector('[data-part="body"]');
    if (body) setOverflow(body.scrollHeight > body.clientHeight + 2);
  });

  // ---------- validation ----------
  const errors = {
    email: a.email.trim() && !EMAIL_RE.test(a.email.trim()) ? 'Please enter a valid email address, e.g. info@academy.in' : '',
    phone: a.phone.trim() && !PHONE_RE.test(a.phone.trim()) ? 'Use digits, spaces and + only, e.g. +91 98765 43210' : '',
    whatsapp: a.whatsapp.trim() && !PHONE_RE.test(a.whatsapp.trim()) ? 'Use digits, spaces and + only, e.g. +91 98765 43210' : '',
    pin: a.pin.trim() && !/^\d{6}$/.test(a.pin.trim().replace(/\s/g, '')) ? 'Indian PIN codes have 6 digits. You can keep this if it is correct.' : '',
    website: a.website.trim() && /\s/.test(a.website.trim()) ? 'Website addresses cannot contain spaces.' : '',
    name: a.name.trim() ? '' : 'Please enter the academy name. It is the only required field.',
  };

  // ---------- logo upload ----------
  async function handleLogoFile(file) {
    if (!file) return;
    if (!/^image\/(png|jpe?g|svg\+xml|webp|gif)$/.test(file.type)) {
      notify('error', 'Please choose a PNG, JPG, SVG or WEBP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify('error', 'That image is larger than 5 MB. Please use a smaller logo file.');
      return;
    }
    try {
      const raw = await readFileAsDataUrl(file);
      const png = await toPngDataUrl(raw, 1200);
      setData((d) => ({ ...d, branding: { ...d.branding, uploadedLogo: png, logoMode: 'upload' } }));
      notify('success', 'Logo uploaded. Empty space around it was trimmed automatically, and it now appears in the preview and all downloads.');
    } catch (e) {
      notify('error', e.message);
    }
  }

  // ---------- exports ----------
  const baseName = safeFileName(exportOpts.fileName, 'Letterhead');
  const pdfScale = exportOpts.quality === 'high' ? 3.125 : 2;

  async function runExport(kind) {
    if (busy) return;
    if (errors.name) {
      notify('error', errors.name);
      return;
    }
    setBusy(kind);
    try {
      let blob;
      let filename;
      if (kind === 'pdf') {
        blob = await buildPdf(fullRef.current, { scale: pdfScale, title: `${a.name} Letterhead` });
        filename = `${baseName}.pdf`;
      } else if (kind === 'blank-pdf') {
        blob = await buildPdf(blankRef.current, { scale: pdfScale, title: `${a.name} Letterhead` });
        filename = `${baseName}-Blank.pdf`;
      } else if (kind === 'docx') {
        blob = await buildDocx(blankRef.current, data, { scale: pdfScale * 0.8, includeLetter: true });
        filename = `${baseName}.docx`;
      } else if (kind === 'blank-docx') {
        blob = await buildDocx(blankRef.current, data, { scale: pdfScale * 0.8, includeLetter: false });
        filename = `${baseName}-Blank.docx`;
      }
      const result = await saveFile(blob, filename);
      if (result === 'declined') notify('info', 'Download cancelled.');
      else
        notify(
          'success',
          kind.includes('docx')
            ? `${filename} downloaded. Open it in Word and type your letter in the writing area.`
            : `${filename} downloaded. It is a single A4 page, ready to print.`
        );
    } catch (e) {
      console.error(e);
      notify('error', `Download failed: ${e.message || 'unknown error'}. Please try again.`);
    } finally {
      setBusy('');
    }
  }

  function handlePrint() {
    window.print();
  }

  function fillSample() {
    setData((d) => ({
      ...d,
      academy: { ...d.academy, ...SAMPLE_DETAILS.academy },
      extra: { ...d.extra, ...SAMPLE_DETAILS.extra },
    }));
    notify('success', 'Sample details added. Replace them with your own information.');
  }

  function doReset() {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    setConfirmReset(false);
    setData(structuredClone(DEFAULT_STATE));
    setZoom('fit');
    notify('success', 'Everything has been reset to the default design.');
  }

  const designLabel = DESIGNS.find((d) => d.id === lay.design)?.name;

  const exportButtons = (
    <div className="actions">
      <button type="button" className="btn btn-primary" onClick={() => runExport('pdf')} disabled={!!busy}>
        {busy === 'pdf' ? <Loader2 size={16} className="spin" /> : <Download size={16} />} Download PDF
      </button>
      <button type="button" className="btn" onClick={() => runExport('docx')} disabled={!!busy}>
        {busy === 'docx' ? <Loader2 size={16} className="spin" /> : <FileType2 size={16} />} Word (.docx)
      </button>
      <button type="button" className="btn" onClick={() => runExport('blank-pdf')} disabled={!!busy}>
        {busy === 'blank-pdf' ? <Loader2 size={16} className="spin" /> : <FileDown size={16} />} Blank Letterhead
      </button>
      {!hosted && (
        <button type="button" className="btn" onClick={handlePrint} disabled={!!busy}>
          <Printer size={16} /> Print
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="app" data-mobile-view={mobileView}>
        <header className="topbar">
          <div className="topbar-brand">
            <div className="app-mark" aria-hidden="true">
              <FileText size={18} />
            </div>
            <div>
              <div className="app-title">Letterhead Studio</div>
              <div className="app-sub">{a.name.trim() || 'Your academy'}</div>
            </div>
          </div>
          <div className="topbar-actions">{exportButtons}</div>
          <div className="mobile-switch">
            <Segmented
              label="View"
              value={mobileView}
              onChange={setMobileView}
              options={[
                { value: 'edit', label: 'Edit', icon: PencilLine },
                { value: 'preview', label: 'Preview', icon: Eye },
              ]}
            />
          </div>
        </header>

        <div className="workspace">
          {/* ---------------- LEFT PANEL ---------------- */}
          <aside className="panel" aria-label="Letterhead settings">
            <div className="panel-intro">
              <h1>Design your letterhead</h1>
              <p>Fill in what you have. Only the academy name is required. Every change shows instantly in the preview.</p>
              <button type="button" className="link-btn" onClick={fillSample}>
                <Sparkles size={14} /> Try with sample details
              </button>
            </div>

            <Section icon={Building2} title="Academy details" hint="Name, address and contact" defaultOpen>
              <Field id="f-name" label="Academy name" optional={false} value={a.name} onChange={(v) => set('academy', 'name', v)} error={errors.name} maxLength={90} />
              <Field id="f-tagline" label="Tagline" value={a.tagline} onChange={(v) => set('academy', 'tagline', v)} placeholder="e.g. Excellence in Medical Coding Training" maxLength={110} />
              <Field id="f-address" label="Full address" multiline rows={2} value={a.address} onChange={(v) => set('academy', 'address', v)} placeholder="Building, street, area" maxLength={220} />
              <div className="grid-2">
                <Field id="f-city" label="City" value={a.city} onChange={(v) => set('academy', 'city', v)} placeholder="Chennai" maxLength={50} />
                <Field id="f-state" label="State" value={a.state} onChange={(v) => set('academy', 'state', v)} placeholder="Tamil Nadu" maxLength={50} />
              </div>
              <div className="grid-2">
                <Field id="f-pin" label="PIN code" value={a.pin} onChange={(v) => set('academy', 'pin', v)} placeholder="600001" error={errors.pin} maxLength={12} />
                <Field id="f-reg" label="Registration no." value={a.regNo} onChange={(v) => set('academy', 'regNo', v)} placeholder="If registered" maxLength={60} />
              </div>
              <div className="grid-2">
                <Field id="f-phone" label="Phone" type="tel" value={a.phone} onChange={(v) => set('academy', 'phone', v)} placeholder="+91 98765 43210" error={errors.phone} maxLength={30} />
                <Field id="f-wa" label="WhatsApp" type="tel" value={a.whatsapp} onChange={(v) => set('academy', 'whatsapp', v)} placeholder="+91 98765 43210" error={errors.whatsapp} maxLength={30} />
              </div>
              <Field id="f-email" label="Official email" type="email" value={a.email} onChange={(v) => set('academy', 'email', v)} placeholder="info@youracademy.in" error={errors.email} maxLength={80} />
              <Field id="f-web" label="Website" value={a.website} onChange={(v) => set('academy', 'website', v)} placeholder="www.youracademy.in" error={errors.website} maxLength={80} />
            </Section>

            <Section icon={ImagePlus} title="Logo" hint={b.logoMode === 'upload' ? 'Your uploaded logo' : b.logoMode === 'generated' ? 'Created logo' : 'No logo'}>
              <Segmented
                label="Logo source"
                value={b.logoMode}
                onChange={(v) => set('branding', 'logoMode', v)}
                options={[
                  { value: 'upload', label: 'Upload', icon: Upload },
                  { value: 'generated', label: 'Create', icon: Sparkles },
                  { value: 'none', label: 'None', icon: ImageOff },
                ]}
              />
              {b.logoMode === 'upload' && (
                <>
                  <input
                    ref={fileInputRef}
                    id="f-logo-file"
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                    className="sr-only"
                    onChange={(e) => {
                      handleLogoFile(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                  {b.uploadedLogo ? (
                    <div className="logo-current">
                      <div className="logo-thumb checker">
                        <img src={b.uploadedLogo} alt="Uploaded logo" />
                      </div>
                      <div className="logo-current-actions">
                        <button type="button" className="btn btn-sm" onClick={() => fileInputRef.current?.click()}>
                          <RefreshCw size={14} /> Replace
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => {
                            setData((d) => ({ ...d, branding: { ...d.branding, uploadedLogo: '' } }));
                            notify('success', 'Logo removed.');
                          }}
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={`dropzone ${dragOver ? 'is-over' : ''}`}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        handleLogoFile(e.dataTransfer.files?.[0]);
                      }}
                    >
                      <span className="dz-icon">
                        <Upload size={20} />
                      </span>
                      <span className="dz-title">Upload your academy logo</span>
                      <span className="dz-sub">Drag a file here or click to browse. PNG with a transparent background works best (PNG, JPG, SVG, WEBP, up to 5 MB).</span>
                      <span className="dz-alt">
                        No logo yet?{' '}
                        <span
                          role="link"
                          tabIndex={0}
                          className="inline-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            set('branding', 'logoMode', 'generated');
                          }}
                        >
                          Create one instead
                        </span>
                      </span>
                    </button>
                  )}
                </>
              )}
              {b.logoMode === 'generated' && (
                <>
                  <div className="logo-styles" role="radiogroup" aria-label="Logo style">
                    {LOGO_STYLES.map((ls) => (
                      <button
                        key={ls.id}
                        type="button"
                        role="radio"
                        aria-checked={b.logoStyle === ls.id}
                        className={`logo-style ${b.logoStyle === ls.id ? 'is-active' : ''}`}
                        onClick={() => set('branding', 'logoStyle', ls.id)}
                      >
                        <img src={svgToDataUrl(makeLogoSvg({ style: ls.id, initials, primary: b.primary, secondary: b.secondary }))} alt="" />
                        <span>{ls.name}</span>
                      </button>
                    ))}
                  </div>
                  <Field
                    id="f-initials"
                    label="Initials in logo"
                    value={b.logoInitials}
                    onChange={(v) => set('branding', 'logoInitials', v.toUpperCase().slice(0, 4))}
                    placeholder={initialsFrom(a.name)}
                    help="Used by the Shield and Monogram styles. Leave empty to use the academy name's initials."
                    maxLength={4}
                  />
                </>
              )}
              {b.logoMode !== 'none' && (
                <div className="field">
                  <label htmlFor="f-logosize">
                    Logo size <span className="val">{lay.logoSize}px</span>
                  </label>
                  <input
                    id="f-logosize"
                    type="range"
                    min="40"
                    max="130"
                    step="2"
                    value={lay.logoSize}
                    onChange={(e) => set('layout', 'logoSize', Number(e.target.value))}
                  />
                </div>
              )}
            </Section>

            <Section icon={Palette} title="Colours" hint={COLOR_PRESETS.find((p) => p.id === b.presetId)?.name || 'Custom colours'}>
              <div className="presets" role="radiogroup" aria-label="Colour presets">
                {COLOR_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={b.presetId === p.id}
                    className={`preset ${b.presetId === p.id ? 'is-active' : ''}`}
                    onClick={() => setData((d) => ({ ...d, branding: { ...d.branding, primary: p.primary, secondary: p.secondary, presetId: p.id } }))}
                  >
                    <span className="preset-chip">
                      <span style={{ background: p.primary }} />
                      <span style={{ background: p.secondary }} />
                    </span>
                    <span className="preset-name">{p.name}</span>
                  </button>
                ))}
              </div>
              <div className="grid-2">
                {[
                  ['primary', 'Primary colour'],
                  ['secondary', 'Secondary colour'],
                ].map(([key, label]) => (
                  <div className="field" key={key}>
                    <label htmlFor={`f-${key}`}>{label}</label>
                    <div className="color-input">
                      <input
                        id={`f-${key}`}
                        type="color"
                        value={b[key]}
                        onChange={(e) => setData((d) => ({ ...d, branding: { ...d.branding, [key]: e.target.value, presetId: '' } }))}
                      />
                      <input
                        aria-label={`${label} hex code`}
                        type="text"
                        value={b[key]}
                        maxLength={7}
                        onChange={(e) => {
                          const v = e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value;
                          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setData((d) => ({ ...d, branding: { ...d.branding, [key]: v, presetId: '' } }));
                        }}
                        onBlur={() => {
                          if (!/^#[0-9a-fA-F]{6}$/.test(b[key])) set('branding', key, DEFAULT_STATE.branding[key]);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section icon={LayoutTemplate} title="Design & layout" hint={`${designLabel} · ${lay.align === 'center' ? 'Centered' : 'Left-aligned'}`} defaultOpen>
              <div className="designs" role="radiogroup" aria-label="Letterhead design">
                {DESIGNS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    role="radio"
                    aria-checked={lay.design === d.id}
                    className={`design-card ${lay.design === d.id ? 'is-active' : ''}`}
                    onClick={() => set('layout', 'design', d.id)}
                    style={{ '--p': b.primary, '--s': b.secondary }}
                  >
                    <span className={`mini mini--${d.id}`} aria-hidden="true">
                      <span className="mini-head" />
                      <span className="mini-rule" />
                      <span className="mini-lines" />
                      <span className="mini-foot" />
                    </span>
                    <span className="design-name">{d.name}</span>
                    <span className="design-note">{d.note}</span>
                  </button>
                ))}
              </div>
              <div className="field">
                <span className="label-plain">Header layout</span>
                <Segmented
                  label="Header layout"
                  value={lay.align}
                  onChange={(v) => set('layout', 'align', v)}
                  options={[
                    { value: 'left', label: 'Left-aligned', icon: AlignLeft },
                    { value: 'center', label: 'Centered', icon: AlignCenter },
                  ]}
                />
              </div>
              <div className="field">
                <span className="label-plain">Phone, email & website appear in</span>
                <Segmented
                  label="Contact details position"
                  value={lay.contactPlacement}
                  onChange={(v) => set('layout', 'contactPlacement', v)}
                  options={[
                    { value: 'header', label: 'Header' },
                    { value: 'footer', label: 'Footer' },
                  ]}
                />
              </div>
              <div className="toggles">
                <Toggle id="t-name" label="Show academy name beside logo" checked={lay.showName} onChange={(v) => set('layout', 'showName', v)} disabled={!logoSrc} />
                <Toggle id="t-tagline" label="Show tagline" checked={lay.showTagline} onChange={(v) => set('layout', 'showTagline', v)} />
                <Toggle id="t-footer" label="Show footer" checked={lay.showFooter} onChange={(v) => set('layout', 'showFooter', v)} />
                <Toggle id="t-watermark" label="Faint logo watermark" checked={lay.showWatermark} onChange={(v) => set('layout', 'showWatermark', v)} disabled={!logoSrc} />
              </div>
            </Section>

            <Section icon={Contact} title="Show or hide details" hint="Choose what prints on the letterhead">
              <div className="toggles">
                {[
                  ['phone', 'Phone number', a.phone],
                  ['whatsapp', 'WhatsApp number', a.whatsapp],
                  ['email', 'Email address', a.email],
                  ['website', 'Website', a.website],
                  ['address', 'Address', a.address || a.city || a.state || a.pin],
                  ['regNo', 'Registration number', a.regNo],
                  ['accreditation', 'Accreditation / affiliation', x.accreditation],
                  ['social', 'Social media links', x.facebook || x.instagram || x.linkedin || x.youtube || x.twitter],
                  ['footerText', 'Footer text', x.footerText],
                  ['additionalInfo', 'Additional information', x.additionalInfo],
                ].map(([key, label, val]) => (
                  <Toggle
                    key={key}
                    id={`t-${key}`}
                    label={
                      <>
                        {label}
                        {!String(val || '').trim() && <span className="empty-tag">not filled</span>}
                      </>
                    }
                    checked={show[key]}
                    onChange={(v) => set('show', key, v)}
                  />
                ))}
              </div>
            </Section>

            <Section icon={Share2} title="Additional information" hint="Social links, accreditation, footer">
              <Field id="f-acc" label="Accreditation or affiliation" value={x.accreditation} onChange={(v) => set('extra', 'accreditation', v)} placeholder="e.g. Affiliated with … / ISO 9001:2015 Certified" maxLength={160} />
              <Field id="f-foot" label="Footer text" value={x.footerText} onChange={(v) => set('extra', 'footerText', v)} placeholder="e.g. Shaping certified medical coders since 2015" maxLength={140} />
              <Field id="f-addinfo" label="Any other information" value={x.additionalInfo} onChange={(v) => set('extra', 'additionalInfo', v)} placeholder="e.g. GSTIN, branch offices, office hours" maxLength={180} />
              <div className="grid-2">
                <Field id="f-li" label="LinkedIn" value={x.linkedin} onChange={(v) => set('extra', 'linkedin', v)} placeholder="linkedin.com/company/…" maxLength={100} />
                <Field id="f-ig" label="Instagram" value={x.instagram} onChange={(v) => set('extra', 'instagram', v)} placeholder="instagram.com/…" maxLength={100} />
                <Field id="f-fb" label="Facebook" value={x.facebook} onChange={(v) => set('extra', 'facebook', v)} placeholder="facebook.com/…" maxLength={100} />
                <Field id="f-yt" label="YouTube" value={x.youtube} onChange={(v) => set('extra', 'youtube', v)} placeholder="youtube.com/@…" maxLength={100} />
              </div>
              <Field id="f-x" label="X (Twitter)" value={x.twitter} onChange={(v) => set('extra', 'twitter', v)} placeholder="x.com/…" maxLength={100} />
            </Section>

            <Section icon={PencilLine} title="Letter content" hint="Optional text for the PDF and Word downloads">
              <p className="sec-note">
                Type a letter here to include it in <strong>Download PDF</strong> and <strong>Word</strong>. The <strong>Blank Letterhead</strong> download always leaves the writing area empty.
              </p>
              <div className="grid-2">
                <Field id="f-ref" label="Reference no." value={l.refNo} onChange={(v) => set('letter', 'refNo', v)} placeholder="EMCA/2026/014" maxLength={50} />
                <div className="field">
                  <label htmlFor="f-date">
                    Date <span className="opt">Optional</span>
                  </label>
                  <div className="input-with-btn">
                    <input id="f-date" value={l.date} maxLength={40} placeholder="27 October 2026" onChange={(e) => set('letter', 'date', e.target.value)} />
                    <button type="button" className="btn btn-sm" onClick={() => set('letter', 'date', todayString())} title="Use today's date">
                      <CalendarDays size={14} /> Today
                    </button>
                  </div>
                </div>
              </div>
              <Field id="f-subject" label="Subject" value={l.subject} onChange={(v) => set('letter', 'subject', v)} placeholder="e.g. Internship Completion Certificate" maxLength={140} />
              <Field id="f-body" label="Letter body" multiline rows={7} value={l.body} onChange={(v) => set('letter', 'body', v)} placeholder={'Dear Student,\n\n…'} maxLength={6000} />
              {overflow && (
                <div className="warn">
                  <AlertTriangle size={15} /> The letter is longer than one page, so the end is cut off. Shorten it, or use the Word download, which continues onto more pages.
                </div>
              )}
              <div className="grid-2">
                <Field id="f-sign" label="Signatory name" value={l.signName} onChange={(v) => set('letter', 'signName', v)} placeholder="Dr. A. Kumar" maxLength={60} />
                <Field id="f-signt" label="Designation" value={l.signTitle} onChange={(v) => set('letter', 'signTitle', v)} placeholder="Director" maxLength={60} />
              </div>
            </Section>

            <Section icon={Settings2} title="Export settings" hint={`${exportOpts.quality === 'high' ? 'High quality' : 'Standard quality'} · ${baseName}`}>
              <Field id="f-filename" label="File name" value={exportOpts.fileName} onChange={(v) => set('exportOpts', 'fileName', v)} placeholder="EMCA-Letterhead" maxLength={60} />
              <div className="field">
                <span className="label-plain">Image quality</span>
                <Segmented
                  label="Image quality"
                  value={exportOpts.quality}
                  onChange={(v) => set('exportOpts', 'quality', v)}
                  options={[
                    { value: 'high', label: 'High (300 dpi)' },
                    { value: 'standard', label: 'Standard (smaller file)' },
                  ]}
                />
              </div>
              <div className="export-list">
                <button type="button" className="btn" onClick={() => runExport('pdf')} disabled={!!busy}>
                  <Download size={15} /> PDF
                </button>
                <button type="button" className="btn" onClick={() => runExport('docx')} disabled={!!busy}>
                  <FileType2 size={15} /> Word
                </button>
                <button type="button" className="btn" onClick={() => runExport('blank-pdf')} disabled={!!busy}>
                  <FileDown size={15} /> Blank PDF
                </button>
                <button type="button" className="btn" onClick={() => runExport('blank-docx')} disabled={!!busy}>
                  <FileDown size={15} /> Blank Word
                </button>
              </div>
              {hosted && <p className="sec-note">To print, download the PDF and print it at 100% scale on A4 paper.</p>}
            </Section>

            <div className="panel-foot">
              <button type="button" className={`btn ${confirmReset ? 'btn-danger' : ''}`} onClick={doReset}>
                <RotateCcw size={15} /> {confirmReset ? 'Click again to confirm reset' : 'Reset to default design'}
              </button>
              <p>Your details are saved in this browser only. Nothing is uploaded anywhere.</p>
            </div>
          </aside>

          {/* ---------------- RIGHT PANEL: PREVIEW ---------------- */}
          <section className="preview" aria-label="Live A4 preview">
            <div className="preview-bar">
              <div className="preview-meta">
                <span className="badge">A4 · 210 × 297 mm</span>
                <span className="preview-design">{designLabel}</span>
              </div>
              <div className="zoom" role="group" aria-label="Zoom">
                <button type="button" className="icon-btn" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.3, Math.round(((z === 'fit' ? fitScale : z) - 0.1) * 10) / 10))}>
                  <ZoomOut size={16} />
                </button>
                <span className="zoom-val">{Math.round(scale * 100)}%</span>
                <button type="button" className="icon-btn" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(2, Math.round(((z === 'fit' ? fitScale : z) + 0.1) * 10) / 10))}>
                  <ZoomIn size={16} />
                </button>
                <button type="button" className={`icon-btn ${zoom === 'fit' ? 'is-active' : ''}`} aria-label="Fit to screen" onClick={() => setZoom('fit')}>
                  <Maximize2 size={15} />
                </button>
              </div>
            </div>
            <div className="preview-scroll" ref={previewBoxRef}>
              <div className="page-frame" style={{ width: PAGE_W * scale, height: PAGE_H * scale }}>
                <div className="page-scale" style={{ transform: `scale(${scale})` }}>
                  <Letterhead data={data} logoSrc={logoSrc} idPrefix="lh-preview" />
                </div>
              </div>
            </div>
            <div className="preview-actions-mobile">{exportButtons}</div>
          </section>
        </div>

        {toast && (
          <div className={`toast toast--${toast.type}`} role="status" aria-live="polite">
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            <span>{toast.msg}</span>
            <button type="button" className="icon-btn" aria-label="Dismiss" onClick={() => setToast(null)}>
              <X size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Off-screen, full-size pages used for exports (same component as the preview). */}
      <div className="export-stage" aria-hidden="true">
        <Letterhead ref={fullRef} data={data} logoSrc={logoSrc} idPrefix="lh-full" />
        <Letterhead ref={blankRef} data={data} logoSrc={logoSrc} blank idPrefix="lh-blank" />
      </div>

      {/* Only visible when printing. */}
      <div className="print-root">
        <Letterhead data={data} logoSrc={logoSrc} idPrefix="lh-print" />
      </div>
    </>
  );
}
