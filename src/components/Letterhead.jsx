import { forwardRef } from 'react';
import { Phone, MessageCircle, Mail, Globe, MapPin, Facebook, Instagram, Linkedin, Youtube, Twitter } from 'lucide-react';

const clean = (v) => (v || '').trim();
const stripUrl = (v) => clean(v).replace(/^https?:\/\//i, '').replace(/\/$/, '');

export function buildAddress(a) {
  const cityLine = [clean(a.city), clean(a.state)].filter(Boolean).join(', ');
  const tail = [cityLine, clean(a.pin)].filter(Boolean).join(' – ');
  return [clean(a.address), tail].filter(Boolean).join(', ');
}

// Scale the academy name down gently as it gets longer so it never crowds the header.
function nameSize(name, base) {
  const len = clean(name).length;
  if (len <= 26) return base;
  return Math.max(base * 0.62, base - (len - 26) * 0.42);
}

// Blend two hex colours (t = 0 gives a, t = 1 gives b).
function mix(a, b, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) || 0);
  const [x, y] = [p(a), p(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

function ContactItem({ icon: Icon, icon2: Icon2, children, color, nowrap, chip }) {
  const glyph = (I) =>
    chip ? (
      <span className="lh-chip">
        <I size={9} strokeWidth={2.4} color="#ffffff" />
      </span>
    ) : (
      <I size={11} strokeWidth={2.2} color={color} className="lh-ci-icon" />
    );
  return (
    <span className={`lh-ci ${nowrap ? 'lh-nowrap' : ''}`}>
      {glyph(Icon)}
      {Icon2 && glyph(Icon2)}
      <span className="lh-ci-text">{children}</span>
    </span>
  );
}

// Business IDs (GSTIN, LLPIN, ...). `perLine` keeps rows tidy so a wrap never starts with a separator.
function IdLine({ items, perLine = 3 }) {
  const rows = [];
  for (let i = 0; i < items.length; i += perLine) rows.push(items.slice(i, i + perLine));
  return (
    <span className="lh-ids">
      {rows.map((row, r) => (
        <span className="lh-ids-row" key={r}>
          {row.map((d, i) => (
            <span className="lh-id-item" key={i}>
              {i > 0 && <span className="lh-id-sep">|</span>}
              {clean(d.label) && <span className="lh-id-label">{clean(d.label)}</span>}
              <span className="lh-id-value">{clean(d.value)}</span>
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

// Slanted three-colour ribbon band used by the Corporate Ribbon design (drawn in mm units).
function RibbonStrip({ p, m, s, bottom, gid }) {
  const polys = bottom
    ? [
        ['-10,0 40,0 47,7 -10,7', `url(#${gid})`],
        ['42.2,0 82,0 89,7 49.2,7', m],
        ['84.2,0 225,0 225,7 91.2,7', p],
      ]
    : [
        ['-10,0 128,0 121,7 -10,7', p],
        ['130.2,0 170,0 163,7 123.2,7', m],
        ['172.2,0 225,0 218,7 165.2,7', `url(#${gid})`],
      ];
  return (
    <svg className="lh-ribbon" width="100%" height="100%" viewBox="0 0 210 7" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={bottom ? mix(s, '#ffffff', 0.18) : s} />
          <stop offset="1" stopColor={bottom ? s : mix(s, '#ffffff', 0.18)} />
        </linearGradient>
      </defs>
      {polys.map(([pts, fill], i) => (
        <polygon key={i} points={pts} fill={fill} />
      ))}
    </svg>
  );
}

// Medical Wave design pieces (inspired by the EMC flyer). Drawn in mm units and stretched to the box.
function WaveBand({ p, s, gid }) {
  return (
    <svg className="lh-wave-svg" width="100%" height="100%" viewBox="0 0 210 50" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={p} />
          <stop offset="1" stopColor={s} />
        </linearGradient>
      </defs>
      <path d="M0,0 H210 V38 C185,37 160,43 120,47 C90,50 60,49 30,44 C18,42 8,40 0,39.5 Z" fill={s} opacity="0.35" />
      <path d="M0,0 H210 V34 C185,33 160,39 120,43 C90,46 60,45 30,40 C18,38 8,36 0,35.5 Z" fill={`url(#${gid})`} />
    </svg>
  );
}

function WaveFooter({ p, s, gid }) {
  return (
    <svg className="lh-wave-svg" width="100%" height="100%" viewBox="0 0 210 30" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor={p} />
          <stop offset="1" stopColor={s} />
        </linearGradient>
      </defs>
      <path d="M0,10 C40,12 80,9 120,6 C160,3 185,0 210,0 V30 H0 Z" fill={s} opacity="0.35" />
      <path d="M0,13 C40,15 80,12 120,9 C160,6 185,3 210,3 V30 H0 Z" fill={`url(#${gid})`} />
    </svg>
  );
}

function Chevrons({ color }) {
  return (
    <svg width="26mm" height="6mm" viewBox="0 0 52 12" fill="none" aria-hidden="true">
      {[0, 11, 22, 33].map((x) => (
        <path key={x} d={`M${x + 2},1 L${x + 8},6 L${x + 2},11 M${x + 6},1 L${x + 12},6 L${x + 6},11`} stroke={color} strokeWidth="0.9" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

function DotGrid({ color }) {
  const dots = [];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 2; c++) dots.push(<circle key={`${r}-${c}`} cx={1 + c * 4} cy={1 + r * 4} r="0.55" fill={color} />);
  return (
    <svg width="6mm" height="22mm" viewBox="0 0 6 22" aria-hidden="true">
      {dots}
    </svg>
  );
}

function RibbonDivider({ m, s, centered, gid }) {
  const accent = centered ? '70,0 104,0 103.2,1.2 70.8,1.2' : '0,0 34,0 33.2,1.2 0,1.2';
  return (
    <svg width="100%" height="100%" viewBox="0 0 174 1.2" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={m} />
          <stop offset="1" stopColor={s} />
        </linearGradient>
      </defs>
      <rect x="0" y="0.43" width="174" height="0.34" fill="#C8D5EA" />
      <polygon points={accent} fill={`url(#${gid})`} />
    </svg>
  );
}

function Pulse({ color, width = 120 }) {
  return (
    <svg className="lh-pulse" width={width} height="18" viewBox="0 0 120 18" fill="none" aria-hidden="true">
      <polyline
        points="0,9 46,9 52,9 56,2 61,16 66,5 70,9 120,9"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const Letterhead = forwardRef(function Letterhead({ data, logoSrc, blank = false, idPrefix = 'lh' }, ref) {
  const { academy: a, extra: x, letter: l, branding: b, layout: lay, show } = data;
  const p = b.primary;
  const s = b.secondary;
  const design = lay.design;
  const centered = lay.align === 'center';
  const m = mix(p, s, 0.45);
  const ribbon = design === 'ribbon';
  const wave = design === 'wave';
  const iconColor = wave ? '#ffffff' : s;
  const ids = show.customDetails ? (x.customDetails || []).filter((d) => clean(d.value)) : [];

  const contacts = [];
  const phone = clean(a.phone);
  const wa = clean(a.whatsapp);
  const sameNumber = show.phone && phone && wa === phone;
  if (show.phone && phone)
    contacts.push({ key: 'phone', icon: Phone, icon2: show.whatsapp && sameNumber ? MessageCircle : null, text: phone });
  if (show.whatsapp && wa && !sameNumber) contacts.push({ key: 'wa', icon: MessageCircle, text: wa });
  if (show.email && clean(a.email)) contacts.push({ key: 'email', icon: Mail, text: clean(a.email) });
  if (show.website && clean(a.website)) contacts.push({ key: 'web', icon: Globe, text: stripUrl(a.website) });

  const address = show.address ? buildAddress(a) : '';
  const socials = show.social
    ? [
        { icon: Linkedin, v: x.linkedin },
        { icon: Instagram, v: x.instagram },
        { icon: Facebook, v: x.facebook },
        { icon: Youtube, v: x.youtube },
        { icon: Twitter, v: x.twitter },
      ].filter((i) => clean(i.v))
    : [];

  const contactsInHeader = lay.contactPlacement === 'header';
  const headerContacts = contactsInHeader ? contacts : [];
  const footerContacts = contactsInHeader ? [] : contacts;

  const regLine = show.regNo && clean(a.regNo) ? `Reg. No. ${clean(a.regNo)}` : '';
  const accLine = show.accreditation ? clean(x.accreditation) : '';
  const footerText = show.footerText ? clean(x.footerText) : '';
  const addInfo = show.additionalInfo ? clean(x.additionalInfo) : '';

  const baseName = design === 'elegant' ? 31 : design === 'wave' ? 23 : design === 'band' ? 24 : 25;
  const nSize = nameSize(a.name, baseName);
  const logoSize = lay.logoSize;

  const logo = logoSrc ? (
    <div className="lh-logo">
      <img src={logoSrc} alt="" style={{ height: logoSize, maxWidth: logoSize * 3.4 }} />
    </div>
  ) : null;

  const nameBlock = (
    <div className="lh-id">
      {(lay.showName || !logoSrc) && (
        <div className="lh-name" style={{ fontSize: nSize }}>
          {clean(a.name) || 'Your Name'}
        </div>
      )}
      {lay.showTagline && clean(a.tagline) && <div className="lh-tagline">{clean(a.tagline)}</div>}
      {design === 'elegant' && regLine && contactsInHeader && <div className="lh-reg-top">{regLine}</div>}
    </div>
  );

  const idsInHeader = lay.detailsPlacement !== 'footer';
  const headerIds = idsInHeader ? ids : [];
  const footerIds = idsInHeader ? [] : ids;

  const contactBlock =
    headerContacts.length > 0 || headerIds.length > 0 ? (
      <div className="lh-contacts">
        {headerContacts.map((c) => (
          <ContactItem key={c.key} icon={c.icon} icon2={c.icon2} color={iconColor} chip={ribbon} nowrap={c.key === 'phone' || c.key === 'wa'}>
            {c.text}
          </ContactItem>
        ))}
        {headerIds.length > 0 && <IdLine items={headerIds} perLine={centered ? 3 : 2} />}
      </div>
    ) : null;

  const footerLines = [];
  if (address)
    footerLines.push({
      key: 'addr',
      content: (
        <ContactItem icon={MapPin} color={iconColor} chip={ribbon}>
          {ribbon && clean(a.name) && (
            <>
              <span className="lh-fname">{clean(a.name)}</span>
              <span className="lh-id-sep">|</span>
            </>
          )}
          {address}
        </ContactItem>
      ),
    });
  if (footerContacts.length)
    footerLines.push({
      key: 'fc',
      content: footerContacts.map((c) => (
        <ContactItem key={c.key} icon={c.icon} icon2={c.icon2} color={iconColor} chip={ribbon} nowrap={c.key === 'phone' || c.key === 'wa'}>
          {c.text}
        </ContactItem>
      )),
    });
  if (footerIds.length) footerLines.push({ key: 'ids', content: <IdLine items={footerIds} /> });
  const metaBits = [regLine && !(design === 'elegant' && contactsInHeader) ? regLine : '', accLine].filter(Boolean);
  if (metaBits.length) footerLines.push({ key: 'meta', content: <span className="lh-meta">{metaBits.join('  ·  ')}</span> });
  if (socials.length)
    footerLines.push({
      key: 'soc',
      content: socials.map((so, i) => (
        <ContactItem key={i} icon={so.icon} color={iconColor}>
          {stripUrl(so.v)}
        </ContactItem>
      )),
    });
  if (addInfo) footerLines.push({ key: 'add', content: <span className="lh-meta">{addInfo}</span> });
  if (footerText) footerLines.push({ key: 'ft', content: <span className="lh-ftext">{footerText}</span> });

  const hasLetter = !blank && [l.refNo, l.date, l.subject, l.body, l.signName].some((v) => clean(v));

  return (
    <div
      ref={ref}
      id={idPrefix}
      className={`lh lh--${design} ${centered ? 'lh--center' : 'lh--left'}`}
      style={{ '--p': p, '--s': s, '--m': m }}
    >
      {lay.showWatermark && logoSrc && (
        <div className="lh-watermark" aria-hidden="true">
          <img src={logoSrc} alt="" />
        </div>
      )}

      <header className="lh-header" data-part="header">
        {wave && (
          <div className="lh-wave-bg">
            <WaveBand p={p} s={s} gid={`${idPrefix}-wt`} />
          </div>
        )}
        {ribbon && (
          <div className="lh-ribbon-top">
            <RibbonStrip p={p} m={m} s={s} gid={`${idPrefix}-rt`} />
          </div>
        )}
        {design === 'band' && (
          <div className="lh-band-texture" aria-hidden="true">
            <svg width="100%" height="100%" viewBox="0 0 800 170" preserveAspectRatio="xMaxYMid slice">
              <g fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.08">
                <polyline points="430,128 590,128 604,128 618,92 634,156 650,104 662,128 800,128" strokeLinejoin="round" />
                <circle cx="760" cy="10" r="72" />
                <circle cx="760" cy="10" r="112" />
              </g>
            </svg>
          </div>
        )}
        <div className="lh-header-inner">
          <div className="lh-brand">
            {logo}
            {nameBlock}
          </div>
          {contactBlock}
        </div>
        {design === 'band' && <div className="lh-band-stripe" />}
      </header>

      {design === 'classic' && (
        <div className="lh-divider" data-part="divider">
          <span className="lh-divider-accent" />
          <span className="lh-divider-line" />
          <Pulse color={s} width={96} />
          <span className="lh-divider-line lh-divider-line2" />
        </div>
      )}
      {wave && (
        <div className="lh-divider" data-part="divider">
          <span className="lh-wave-dots">
            <DotGrid color={p} />
          </span>
          <Chevrons color={s} />
        </div>
      )}
      {ribbon && (
        <div className="lh-divider" data-part="divider">
          <RibbonDivider m={m} s={s} centered={centered} gid={`${idPrefix}-rd`} />
        </div>
      )}
      {design === 'elegant' && (
        <div className="lh-divider" data-part="divider">
          <span className="lh-hair lh-hair-a" />
          <span className="lh-hair-dot" />
          <span className="lh-hair lh-hair-b" />
        </div>
      )}

      <main className="lh-body" data-part="body">
        {hasLetter && (
          <div className="lh-letter">
            {(clean(l.refNo) || clean(l.date)) && (
              <div className="lh-letter-meta">
                <span>{clean(l.refNo) ? `Ref: ${clean(l.refNo)}` : ''}</span>
                <span>{clean(l.date) ? `Date: ${clean(l.date)}` : ''}</span>
              </div>
            )}
            {clean(l.subject) && <div className="lh-letter-subject">Subject: {clean(l.subject)}</div>}
            {clean(l.body) && <div className="lh-letter-body">{l.body.replace(/\s+$/, '')}</div>}
            {clean(l.signName) && (
              <div className="lh-letter-sign">
                <div className="lh-sign-space" />
                <div className="lh-sign-name">{clean(l.signName)}</div>
                {clean(l.signTitle) && <div>{clean(l.signTitle)}</div>}
                <div>{clean(a.name)}</div>
              </div>
            )}
          </div>
        )}
      </main>

      {lay.showFooter && (
        <footer className="lh-footer" data-part="footer">
          {wave && (
            <div className="lh-wave-bg">
              <WaveFooter p={p} s={s} gid={`${idPrefix}-wf`} />
            </div>
          )}
          {design !== 'band' && !wave && <div className="lh-footer-rule" />}
          <div className="lh-footer-inner">
            {footerLines.length === 0 ? (
              <span className="lh-ftext">{clean(a.name)}</span>
            ) : (
              footerLines.map((f) => (
                <div className="lh-fline" key={f.key}>
                  {f.content}
                </div>
              ))
            )}
          </div>
          {ribbon && (
            <div className="lh-ribbon-bottom">
              <RibbonStrip p={p} m={m} s={s} bottom gid={`${idPrefix}-rb`} />
            </div>
          )}
          {design === 'classic' && (
            <div className="lh-footer-bar">
              <span style={{ background: s }} />
              <span style={{ background: p }} />
            </div>
          )}
        </footer>
      )}
    </div>
  );
});

export default Letterhead;
