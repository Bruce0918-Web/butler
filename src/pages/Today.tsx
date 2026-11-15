import { useEffect, useState } from 'react';
import { briefing } from '../state/butler';
import { DAY_ZH, dateKey, dayOf, hmOf, longDate, uid } from '../state/dates';
import { applyReview, dayParts, emptyDay, isSchoolDay, needsReview, nextSlot, schoolLabel, slotsFor, type ReviewAnswer } from '../state/today';
import type { DayLog, Slot } from '../state/types';
import { useStore } from '../state/useStore';
import { Note } from '../ui/Note';
import { ScheduleEditor } from '../ui/ScheduleEditor';
import { Btn, Check, Editable, Empty, Label, Remove } from '../ui/primitives';

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  return now;
}

const HERO = 'balance font-serif text-xl font-semibold tracking-tight md:text-3xl';

export function Today() {
  const { state, update } = useStore();
  const now = useNow();
  const today = dateKey(now);
  const hm = hmOf(now);
  const log = state.days[today] ?? emptyDay();
  const slots = slotsFor(state, today);
  const lines = briefing(state, today, hm);
  const reviewDay = needsReview(state, today);
  const label = schoolLabel(today, state.school);
  const next = nextSlot(slots, hm, log.checks);
  const pawnFirst = !!log.pawn.text && !log.pawn.done;

  const editDay = (fn: (d: DayLog) => void) =>
    update((s) => {
      fn((s.days[today] ??= emptyDay()));
    });

  return (
    <div className="mx-auto max-w-prose">
      <p className="text-sm text-muted">
        {longDate(today)} · {DAY_ZH[dayOf(today)]}
        {label && ` · ${label}`}
      </p>

      {/* The one thing to look at first: always real content at full strength, never a placeholder. */}
      <section aria-label="第一件事" className="mt-6">
        {/* The key makes the content fade in again whenever the first thing changes. */}
        <div key={pawnFirst ? 'pawn' : (next?.id ?? 'done')} className="enter">
        {pawnFirst ? (
          <>
            <p className="text-sm text-accent">第一件事 · 兵卒任务</p>
            <div className="mt-2 flex items-start gap-3">
              <div className="pt-1 md:pt-3">
                <Check checked={false} label={`兵卒任务做完了：${log.pawn.text}`} onChange={() => editDay((d) => (d.pawn.done = true))} />
              </div>
              <Editable value={log.pawn.text} placeholder="兵卒任务" onSave={(v) => editDay((d) => (d.pawn.text = v))} className={HERO} />
            </div>
          </>
        ) : next ? (
          <>
            <p className="text-sm text-accent">{next.end && next.time <= hm ? `进行中 · ${next.time}–${next.end}` : `接下来 · ${next.label ?? next.time}`}</p>
            <div className="mt-2 flex items-start gap-3">
              <div className="pt-1 md:pt-3">
                <Check checked={false} label={`完成：${next.title}`} onChange={() => editDay((d) => (d.checks[next.id] = true))} />
              </div>
              <div className="min-w-0">
                <h1 className={HERO}>{next.title}</h1>
                {next.detail && <p className="mt-3 text-muted">{next.detail}</p>}
                {next.done && <p className="mt-2 text-sm text-faint">完成标准：{next.done}</p>}
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-accent">今天</p>
            <h1 className={`mt-2 ${HERO}`}>今天的安排走完了。</h1>
          </>
        )}
        </div>

        {!log.pawn.text && (
          <div className="mt-8 flex items-baseline gap-3 border-t border-line pt-4">
            <span className="shrink-0 text-sm text-accent">兵卒任务</span>
            <AddLine placeholder="今天最不想做的那件事" onAdd={(text) => editDay((d) => (d.pawn = { text, done: false }))} />
          </div>
        )}
        {log.pawn.done && (
          <p className="mt-6 text-sm text-faint">
            兵卒任务已完成：{log.pawn.text}{' '}
            <button type="button" className="rounded-sm underline transition-colors duration-fast ease-out hover:text-text" onClick={() => editDay((d) => (d.pawn.done = false))}>
              撤销
            </button>
          </p>
        )}
      </section>

      <Note lines={lines} date={longDate(today)} />

      {reviewDay && <Review day={reviewDay} today={today} />}

      <section className="section">
        <Label>今日三件要事</Label>
        <ul className="divide-y divide-line border-y border-line">
          {log.three.map((t) => (
            <li key={t.id} className="group flex items-center gap-3 py-2">
              <Check checked={t.done} label={`完成：${t.text || '未填写'}`} onChange={(v) => editDay((d) => (d.three.find((x) => x.id === t.id)!.done = v))} />
              <div className={`min-w-0 flex-1 transition-opacity duration-base ease-out ${t.done ? 'opacity-40' : ''}`}>
                <Editable value={t.text} placeholder="一件要事" onSave={(v) => editDay((d) => (d.three.find((x) => x.id === t.id)!.text = v))} />
              </div>
              <Remove what={t.text || '这一条'} onConfirm={() => editDay((d) => (d.three = d.three.filter((x) => x.id !== t.id)))} />
            </li>
          ))}
          {Array.from({ length: 3 - Math.min(3, log.three.length) }, (_, i) => (
            <li key={`slot-${i}`} className="flex items-center gap-3 py-2">
              <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center text-sm tabular-nums text-faint">{log.three.length + i + 1}</span>
              {i === 0 && (
                <AddLine placeholder={log.three.length ? '再加一件' : '今天最重要的一件事是什么？'} onAdd={(text) => editDay((d) => d.three.push({ id: uid(), text, done: false }))} />
              )}
            </li>
          ))}
        </ul>
      </section>

      <Timeline slots={slots} log={log} hm={hm} today={today} onCheck={(id, v) => editDay((d) => (d.checks[id] = v))} />
    </div>
  );
}

/** An always-visible input that adds a line on Enter or when focus leaves. */
function AddLine({ placeholder, onAdd }: { placeholder: string; onAdd: (text: string) => void }) {
  const [text, setText] = useState('');
  const commit = () => {
    if (!text.trim()) return;
    onAdd(text.trim());
    setText('');
  };
  return (
    <input
      value={text}
      placeholder={placeholder}
      aria-label={placeholder}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && commit()}
      onBlur={commit}
      className="w-full min-w-0 rounded-sm bg-transparent py-1 outline-none transition-colors duration-fast ease-out placeholder:text-faint hover:placeholder:text-muted"
    />
  );
}

/** One minute in the morning: which of yesterday's three got done, and what happens to the rest. */
function Review({ day, today }: { day: string; today: string }) {
  const { state, update } = useStore();
  const items = state.days[day].three.filter((t) => t.text.trim());
  const [answers, setAnswers] = useState<ReviewAnswer[]>(() => items.map((t) => ({ id: t.id, done: t.done, carry: true })));
  const set = (id: string, patch: Partial<ReviewAnswer>) => setAnswers((a) => a.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const doneCount = answers.filter((a) => a.done).length;

  return (
    <section aria-label="回顾昨天" className="enter card mt-8">
      <Label aside={<span className="text-sm tabular-nums text-muted">{doneCount} / {items.length}</span>}>回顾昨天 · {longDate(day)}</Label>
      <p className="text-sm text-muted">昨天的三件要事做到了几件？没做到的默认带到今天。</p>
      <ul className="mt-4 divide-y divide-line">
        {items.map((t) => {
          const a = answers.find((x) => x.id === t.id)!;
          return (
            <li key={t.id} className="flex flex-wrap items-center gap-3 py-2">
              <Check checked={a.done} label={`昨天做到了：${t.text}`} onChange={(v) => set(t.id, { done: v })} />
              <span className={`min-w-0 flex-1 transition-opacity duration-base ease-out ${a.done ? 'opacity-40' : ''}`}>{t.text}</span>
              {!a.done && (
                <span role="group" aria-label={`没做到的「${t.text}」怎么处理`} className="flex rounded-full border border-line p-px text-sm">
                  {([true, false] as const).map((carry) => (
                    <button
                      key={String(carry)}
                      type="button"
                      aria-pressed={a.carry === carry}
                      onClick={() => set(t.id, { carry })}
                      className={`rounded-full px-3 py-1 transition-colors duration-fast ease-out ${a.carry === carry ? 'bg-raised text-text' : 'text-muted hover:text-text'}`}
                    >
                      {carry ? '今天继续' : '放下'}
                    </button>
                  ))}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-4">
        <Btn variant="primary" onClick={() => update((s) => applyReview(s, today, day, answers, new Date().toISOString()))}>
          完成回顾
        </Btn>
      </div>
    </section>
  );
}

interface TimelineProps {
  slots: Slot[];
  log: DayLog;
  hm: string;
  today: string;
  onCheck: (id: string, v: boolean) => void;
}

/** The day in four stretches. What is over folds away; the current stretch carries a "now" line. */
function Timeline({ slots, log, hm, today, onCheck }: TimelineProps) {
  const { state } = useStore();
  const [editing, setEditing] = useState(false);
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const day = dayOf(today);
  const schoolDay = isSchoolDay(today, state.school);
  const parts = dayParts(slots, hm, schoolDay);
  const schoolHidden = !schoolDay && state.schedule[day].some((s) => s.school);

  const row = (s: Slot) => {
    const checked = !!log.checks[s.id];
    const open = openId === s.id;
    return (
      <li key={s.id} className={`flex items-start gap-3 transition-opacity duration-base ease-out ${checked ? 'text-sm opacity-60' : 'py-1'}`}>
        <span className="w-12 shrink-0 pt-1 text-sm tabular-nums text-muted">{s.label ? '' : s.time}</span>
        <Check checked={checked} label={`完成：${s.title}`} onChange={(v) => onCheck(s.id, v)} />
        <div className="min-w-0 flex-1 pt-1">
          <button type="button" aria-expanded={open} onClick={() => setOpenId(open ? null : s.id)} className="rounded-sm text-left transition-colors duration-fast ease-out hover:text-accent">
            {s.title}
            {s.label && <span className="ml-2 text-sm text-muted">{s.label}</span>}
            {s.tag && !checked && <span className="ml-2 text-xs text-faint">{s.tag}</span>}
          </button>
          {open && (
            <div className="enter mt-1 space-y-1 pb-2 text-sm text-muted">
              {s.detail && <p>{s.detail}</p>}
              {s.done && <p className="text-faint">完成标准：{s.done}</p>}
              {!s.detail && !s.done && <p className="text-faint">这一条没有写细节。点“编辑日程”可以补上。</p>}
            </div>
          )}
        </div>
      </li>
    );
  };

  const nowLine = (
    <li key="now" aria-label={`现在 ${hm}`} className="flex items-center gap-3 py-2">
      <span className="w-12 shrink-0 text-sm font-medium tabular-nums text-accent">{hm}</span>
      <span className="h-px flex-1 bg-accent" />
    </li>
  );

  return (
    <section className="section">
      <Label aside={<Btn variant="quiet" className="-mr-4" aria-pressed={editing} onClick={() => setEditing(!editing)}>{editing ? '完成编辑' : '编辑日程'}</Btn>}>
        时间线 · {DAY_ZH[day]}
      </Label>

      {editing ? (
        <ScheduleEditor day={day} />
      ) : slots.length === 0 ? (
        <Empty action={<Btn onClick={() => setEditing(true)}>添加第一条</Btn>}>{DAY_ZH[day]}的日程还是空的。这里放这一天按时间要做的事。</Empty>
      ) : (
        <div className="border-b border-line">
          {schoolHidden && <p className="mb-3 text-sm text-muted">今天不上学，上学时段的条目已隐藏。</p>}
          {parts.map((part) => {
            const open = toggled[part.name] ?? (part.status !== 'past' && !part.school);
            // Only must-do items count. Optional items stay folded, except in the school stretch,
            // which is itself closed by default and lists its fragments when opened.
            const must = part.slots.filter((s) => s.must);
            const optional = part.slots.filter((s) => !s.must);
            const direct = part.school && must.length === 0;
            const shown = direct ? optional : must;
            const folded = direct ? [] : optional;
            const done = must.filter((s) => log.checks[s.id]).length;
            const nowAt = part.status === 'now' ? shown.findIndex((s) => s.time > hm) : -2;
            const optKey = `${part.name}-optional`;
            const optOpen = !!toggled[optKey];
            return (
              <div key={part.name} className="border-t border-line">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setToggled({ ...toggled, [part.name]: !open })}
                  className="flex w-full items-baseline gap-3 rounded-sm py-3 text-left transition-colors duration-fast ease-out hover:text-accent active:opacity-60"
                >
                  <span className="w-12 shrink-0 font-medium">{part.school ? '上学' : part.name}</span>
                  <span className={`text-sm ${part.status === 'now' ? 'text-accent' : 'text-faint'}`}>
                    {part.school ? '只做碎片任务' : part.status === 'now' ? '现在' : part.status === 'past' ? '已过' : ''}
                  </span>
                  <span className="ml-auto text-sm tabular-nums text-muted">{must.length ? `${done} / ${must.length}` : `可选 ${optional.length}`}</span>
                  <span aria-hidden="true" className="w-4 text-center text-muted">{open ? '−' : '+'}</span>
                </button>
                {open && (
                  <div className="enter pb-4">
                    <ul>
                      {shown.flatMap((s, i) => (i === nowAt ? [nowLine, row(s)] : [row(s)]))}
                      {nowAt === -1 && nowLine}
                    </ul>
                    {folded.length > 0 && (
                      <>
                        <button
                          type="button"
                          aria-expanded={optOpen}
                          onClick={() => setToggled({ ...toggled, [optKey]: !optOpen })}
                          className="mt-1 flex w-full items-baseline gap-3 rounded-sm py-1 text-left text-sm text-faint transition-colors duration-fast ease-out hover:text-text active:opacity-60"
                        >
                          <span aria-hidden="true" className="w-12 shrink-0 text-center">{optOpen ? '−' : '+'}</span>
                          <span>可选 {folded.length} 项</span>
                        </button>
                        <div className="reveal" data-open={optOpen}>
                          <div>
                            <ul className="pt-1">{folded.map(row)}</ul>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
