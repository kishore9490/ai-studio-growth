import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function Section({ icon: Icon, title, hint, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={`sec ${open ? 'is-open' : ''}`}>
      <button type="button" className="sec-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="sec-icon">
          <Icon size={16} />
        </span>
        <span className="sec-titles">
          <span className="sec-title">{title}</span>
          {hint && <span className="sec-hint">{hint}</span>}
        </span>
        <ChevronDown size={18} className="sec-chev" />
      </button>
      {open && <div className="sec-body">{children}</div>}
    </section>
  );
}

export function Field({ id, label, value, onChange, placeholder, type = 'text', error, help, optional = true, multiline, rows = 3, maxLength = 300 }) {
  const Input = multiline ? 'textarea' : 'input';
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>
        {label}
        {optional ? <span className="opt">Optional</span> : <span className="req">Required</span>}
      </label>
      <Input
        id={id}
        type={multiline ? undefined : type}
        rows={multiline ? rows : undefined}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error || help ? `${id}-msg` : undefined}
      />
      {(error || help) && (
        <div id={`${id}-msg`} className={error ? 'field-error' : 'field-help'}>
          {error || help}
        </div>
      )}
    </div>
  );
}

export function Toggle({ id, label, checked, onChange, disabled }) {
  return (
    <label className={`toggle ${disabled ? 'is-disabled' : ''}`} htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" aria-hidden="true">
        <span className="toggle-thumb" />
      </span>
      <span className="toggle-label">{label}</span>
    </label>
  );
}

export function Segmented({ value, onChange, options, label, id }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label} id={id}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? 'is-active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.icon && <o.icon size={15} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}
