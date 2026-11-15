import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';

const VARIANT = {
  primary: 'bg-accent text-accent-ink font-medium hover:opacity-80',
  ghost: 'border border-line text-text hover:border-faint',
  quiet: 'text-muted hover:text-text',
};

export function Btn({ variant = 'ghost', className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof VARIANT }) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-4 text-sm transition duration-fast ease-out active:opacity-60 disabled:opacity-40 ${VARIANT[variant]} ${className}`}
    />
  );
}

/** A round tick. The visible circle sits inside a larger hit area. */
export function Check({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="group/check grid h-8 w-8 shrink-0 place-items-center rounded-full active:opacity-60"
    >
      <span
        className={`grid h-6 w-6 place-items-center rounded-full border transition-colors duration-base ease-out ${
          checked ? 'border-accent bg-accent' : 'border-faint group-hover/check:border-accent'
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          className="h-4 w-4 text-accent-ink">
          <path pathLength="1" data-on={checked} className="tick" d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
    </button>
  );
}

interface EditableProps {
  value: string;
  onSave: (v: string) => void;
  /** Shown when empty, and read to screen readers as the field's name. */
  placeholder: string;
  multiline?: boolean;
  className?: string;
}

/** Text that turns into an input when clicked or activated. Enter saves, Esc cancels. */
export function Editable({ value, onSave, placeholder, multiline, className = '' }: EditableProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const cancelled = useRef(false);

  if (!editing)
    return (
      <button
        type="button"
        title="点击编辑"
        aria-label={`${placeholder}:${value || '空'}。点击编辑`}
        onClick={() => {
          setDraft(value);
          cancelled.current = false;
          setEditing(true);
        }}
        className={`-mx-1 block max-w-full whitespace-pre-wrap rounded-sm px-1 text-left transition-colors duration-fast ease-out hover:bg-raised ${value ? '' : 'text-faint'} ${className}`}
      >
        {value || placeholder}
      </button>
    );

  const commit = () => {
    setEditing(false);
    if (!cancelled.current && draft.trim() !== value) onSave(draft.trim());
  };
  const shared = {
    autoFocus: true,
    value: draft,
    'aria-label': placeholder,
    placeholder,
    onBlur: commit,
    className: `-mx-1 block w-full rounded-sm bg-raised px-1 outline-none placeholder:text-faint ${className}`,
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      cancelled.current = true;
      setEditing(false);
    } else if (e.key === 'Enter' && (!multiline || e.ctrlKey || e.metaKey)) commit();
  };
  return multiline ? (
    <textarea {...shared} rows={3} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKey} />
  ) : (
    <input {...shared} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKey} />
  );
}

/** Delete with a second click to confirm. Hidden until its row is hovered or focused on wide screens. */
export function Remove({ onConfirm, what, always }: { onConfirm: () => void; what: string; always?: boolean }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      aria-label={armed ? `确认删除：${what}` : `删除：${what}`}
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      className={`h-8 shrink-0 rounded-full px-2 text-sm transition duration-fast ease-out active:opacity-60 ${always ? '' : 'md:opacity-0 md:focus:opacity-100 md:group-focus-within:opacity-100 md:group-hover:opacity-100'} ${
        armed ? 'text-accent md:opacity-100' : 'text-faint hover:text-text'
      }`}
    >
      {armed ? '确认删除' : '删除'}
    </button>
  );
}

/** A section that folds away, opened with the same plus and minus as the timeline. */
export function Fold({ summary, children }: { summary: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex items-baseline gap-2 rounded-sm text-sm text-muted transition-colors duration-fast ease-out hover:text-text active:opacity-60"
      >
        <span aria-hidden="true" className="w-3 text-center">{open ? '−' : '+'}</span>
        {summary}
      </button>
      <div className="reveal" data-open={open}>
        <div>
          <div className="pt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Empty({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-md border border-line px-4 py-6">
      <p className="text-sm text-muted">{children}</p>
      {action}
    </div>
  );
}

export function PageHead({ kicker, title, sub, children }: { kicker: string; title?: string; sub?: string; children?: ReactNode }) {
  return (
    <header className="mb-12">
      <p className="text-sm text-muted">{kicker}</p>
      {title && <h1 className="mt-2 font-serif text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>}
      {sub && <p className="mt-3 max-w-prose text-muted">{sub}</p>}
      {children}
    </header>
  );
}

export function Label({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <h2 className="text-sm font-medium text-muted">{children}</h2>
      {aside}
    </div>
  );
}
