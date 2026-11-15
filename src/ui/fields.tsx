import { useEffect, useRef, useState } from 'react';
import { dateKey, parseKey } from '../state/dates';
import { parseDate, parseTime } from '../state/parse';

/** "11 月 21 日", with the year added when it is not this year. */
export function showDate(key: string): string {
  const d = parseKey(key);
  const base = `${d.getMonth() + 1} 月 ${d.getDate()} 日`;
  return d.getFullYear() === new Date().getFullYear() ? base : `${d.getFullYear()} 年 ${base}`;
}

/** A date shown as words. Click to type a new one; Enter saves, Esc cancels, empty clears it. */
export function DateField({ value, onChange, label }: { value: string | null; onChange: (v: string | null) => void; label: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [bad, setBad] = useState(false);

  if (!editing)
    return (
      <button
        type="button"
        title="点击修改"
        aria-label={`${label}:${value ? showDate(value) : '未定'}。点击修改`}
        onClick={() => {
          setDraft(value ?? '');
          setBad(false);
          setEditing(true);
        }}
        className={`-mx-1 rounded-sm px-1 text-left tabular-nums transition-colors duration-fast ease-out hover:bg-raised ${value ? 'text-text' : 'text-faint'}`}
      >
        {value ? showDate(value) : '未定'}
      </button>
    );

  const commit = (strict: boolean) => {
    const parsed = parseDate(draft, dateKey(new Date()));
    if (parsed === undefined) {
      if (strict) setBad(true);
      else setEditing(false);
      return;
    }
    if (parsed !== value) onChange(parsed);
    setEditing(false);
  };
  return (
    <span className="min-w-0 flex-1">
      <input
        autoFocus
        value={draft}
        aria-label={label}
        aria-invalid={bad}
        placeholder="11-21 或 2027-2-28"
        onChange={(e) => {
          setDraft(e.target.value);
          setBad(false);
        }}
        onBlur={() => commit(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit(true);
          else if (e.key === 'Escape') setEditing(false);
        }}
        className="field w-full tabular-nums"
      />
      {bad && <span role="alert" className="mt-1 block text-xs text-accent">没看懂这个日期。写成 11-21 或 2027-2-28；留空表示没有截止日。</span>}
    </span>
  );
}

/** A clock time typed as text ("5:00", "1730"). An unreadable entry snaps back to the last good value. */
export function TimeField({ value, onChange, label, optional }: { value: string; onChange: (v: string | undefined) => void; label: string; optional?: boolean }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = () => {
    if (!draft.trim() && optional) return onChange(undefined);
    const t = parseTime(draft);
    if (t === undefined) return setDraft(value);
    setDraft(t);
    if (t !== value) onChange(t);
  };
  return (
    <input
      value={draft}
      aria-label={label}
      placeholder={optional ? '结束' : '05:00'}
      inputMode="numeric"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && commit()}
      className="field w-full tabular-nums"
    />
  );
}

interface PickProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  label: string;
  /** Reads as plain small text until opened. */
  quiet?: boolean;
}

/** A choice from a short list, drawn to match the rest of the page. Arrow keys move, Enter picks, Esc closes. */
export function Pick({ value, options, onChange, label, quiet }: PickProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const index = Math.max(0, options.findIndex((o) => o.value === value));

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);

  const choose = (i: number) => {
    if (options[i].value !== value) onChange(options[i].value);
    setOpen(false);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActive(index);
        setOpen(true);
      }
      return;
    }
    if (e.key === 'Escape' || e.key === 'Tab') setOpen(false);
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((active + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((active - 1 + options.length) % options.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(active);
    }
  };

  return (
    <div ref={box} className={`relative min-w-0 ${quiet ? 'inline-block max-w-full align-top' : ''}`}>
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}:${options[index]?.label ?? ''}`}
        onClick={() => {
          setActive(index);
          setOpen(!open);
        }}
        onKeyDown={onKey}
        className={`${quiet ? 'inline-flex max-w-full' : 'flex w-full justify-between'} items-center gap-2 rounded-sm text-left transition-colors duration-fast ease-out active:opacity-60 ${
          quiet ? `px-1 text-xs hover:text-text ${open ? 'text-text' : 'text-faint'}` : `border px-2 py-1 text-sm text-text hover:border-faint ${open ? 'border-accent' : 'border-line'}`
        }`}
      >
        <span className="truncate">{options[index]?.label}</span>
        <svg viewBox="0 0 12 12" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className={`h-3 w-3 shrink-0 transition-transform duration-fast ease-out ${open ? 'rotate-180' : ''}`}>
          <path d="M2.5 4.5L6 8l3.5-3.5" />
        </svg>
      </button>
      {open && (
        <ul role="listbox" aria-label={label} className="enter absolute left-0 z-10 mt-1 w-max min-w-full max-w-prose rounded-sm border border-line bg-raised py-1 text-sm">
          {options.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(i);
              }}
              className={`cursor-pointer px-3 py-1 transition-colors duration-fast ease-out ${i === active ? 'bg-surface' : ''} ${o.value === value ? 'text-accent' : i === active ? 'text-text' : 'text-muted'}`}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
