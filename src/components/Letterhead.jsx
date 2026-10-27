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

function ContactItem({ icon: Icon, icon2: Icon2, children, color, nowrap }) {
  return (
    <span className={`lh-ci ${nowrap ? 'lh-nowrap' : ''}`}>
      <Icon size={11} strokeWidth={2.2} color={color} className="lh-ci-icon" />
      {Icon2 && <Icon2 size={11} strokeWidth={2.2} color={color} className="lh-ci-icon" />}
      <span className="lh-ci-text">{children}</span>
    </span>
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
  const iconColor = s;

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

  const baseName = design === 'elegant' ? 31 : design === 'band' ? 24 : 25;
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
          {clean(a.name) || 'Academy Name'}
        </div>
      )}
      {lay.showTagline && clean(a.tagline) && <div className="lh-tagline">{clean(a.tagline)}</div>}
      {design === 'elegant' && regLine && contactsInHeader && <div className="lh-reg-top">{regLine}</div>}
    </div>
  );

  const contactBlock =
    headerContacts.length > 0 ? (
      <div className="lh-contacts">
        {headerContacts.map((c) => (
          <ContactItem key={c.key} icon={c.icon} icon2={c.icon2} color={iconColor} nowrap={c.key === 'phone' || c.key === 'wa'}>
            {c.text}
          </ContactItem>
        ))}
      </div>
    ) : null;

  const footerLines = [];
  if (address) footerLines.push({ key: 'addr', content: <ContactItem icon={MapPin} color={iconColor}>{address}</ContactItem> });
  if (footerContacts.length)
    footerLines.push({
      key: 'fc',
      content: footerContacts.map((c) => (
        <ContactItem key={c.key} icon={c.icon} icon2={c.icon2} color={iconColor} nowrap={c.key === 'phone' || c.key === 'wa'}>
          {c.text}
        </ContactItem>
      )),
    });
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
      style={{ '--p': p, '--s': s }}
    >
      {lay.showWatermark && logoSrc && (
        <div className="lh-watermark" aria-hidden="true">
          <img src={logoSrc} alt="" />
        </div>
      )}

      <header className="lh-header" data-part="header">
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
          {design !== 'band' && <div className="lh-footer-rule" />}
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
