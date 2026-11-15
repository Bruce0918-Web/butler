import { addDays, DAY_ZH, dateKey, dayOf } from '../state/dates';
import { mondayOf, run, tests, weekStats } from '../state/review';
import type { Night, WeekReview } from '../state/types';
import { emptyDay } from '../state/today';
import { useStore } from '../state/useStore';
import { showDate } from '../ui/fields';
import { Editable, Empty, Fold, Label, PageHead } from '../ui/primitives';

const QUESTIONS: { key: 'hard' | 'asked' | 'wasted' | 'slept'; text: string; good: boolean }[] = [
  { key: 'hard', text: '先做难事了吗？', good: true },
  { key: 'asked', text: '向更强的人请教了吗？', good: true },
  { key: 'wasted', text: '在面子和社交上浪费时间了吗？', good: false },
  { key: 'slept', text: '20:30 前睡着了吗？', good: true },
];

const WEEK: { key: 'main' | 'added' | 'delivered' | 'note'; text: string; placeholder: string }[] = [
  { key: 'main', text: '主线推进了多少？', placeholder: '写具体做出来的东西，不写花了多少时间' },
  { key: 'added', text: '有没有偷偷加新项目？', placeholder: '有就写下来，然后放进停车场' },
  { key: 'delivered', text: '该交付的交了没有？', placeholder: '没交的写原因和新的日期' },
  { key: 'note', text: '下周只改一件事，改什么？', placeholder: '一件' },
];

const blankNight = (): Night => ({ hard: null, asked: null, wasted: null, slept: null, note: '', at: '' });

/** Two-way answer. Pressing the chosen one again clears it. */
function YesNo({ value, onChange, label }: { value: boolean | null; onChange: (v: boolean | null) => void; label: string }) {
  return (
    <span role="group" aria-label={label} className="flex shrink-0 rounded-full border border-line p-px text-sm">
      {([true, false] as const).map((v) => (
        <button
          key={String(v)}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(value === v ? null : v)}
          className={`rounded-full px-4 py-1 transition-colors duration-fast ease-out active:opacity-60 ${value === v ? 'bg-raised text-text' : 'text-muted hover:text-text'}`}
        >
          {v ? '是' : '否'}
        </button>
      ))}
    </span>
  );
}

const mark = (v: boolean | null | undefined, good: boolean) => (v == null ? '·' : v === good ? '✓' : '×');

export function Review() {
  const { state, update } = useStore();
  const today = dateKey(new Date());
  const yesterday = addDays(today, -1);
  const monday = mondayOf(today);
  const night = state.days[yesterday]?.night ?? blankNight();
  const answered = QUESTIONS.filter((q) => night[q.key] !== null).length;
  const stats = weekStats(state, monday);
  const week = state.weeks[monday];

  const editNight = (p: Partial<Night>) =>
    update((s) => {
      const d = (s.days[yesterday] ??= emptyDay());
      d.night = { ...(d.night ?? blankNight()), ...p, at: new Date().toISOString() };
    });
  const editWeek = (p: Partial<WeekReview>) =>
    update((s) => {
      s.weeks[monday] = { ...(s.weeks[monday] ?? { main: '', added: '', delivered: '', note: '', at: '' }), ...p, at: new Date().toISOString() };
    });

  const streaks = [
    { name: '兵卒任务', days: run(state, today, tests.pawn, true) },
    { name: '20:30 前睡着', days: run(state, today, tests.slept, true) },
    { name: '阅读', days: run(state, today, tests.reading(state), true) },
  ];
  const history = Object.keys(state.days).filter((k) => k < today).sort().reverse();
  const pastWeeks = Object.keys(state.weeks).filter((k) => k !== monday).sort().reverse();

  return (
    <div className="mx-auto max-w-prose">
      <PageHead kicker="复盘" title="昨天过得怎么样。" sub="19:30 之后不碰电子产品，所以睡前三问在第二天早上补。四个问题，点四下。" />

      <section aria-label="昨天的睡前三问">
        <Label aside={<span className="text-xs tabular-nums text-faint">{answered} / {QUESTIONS.length}</span>}>
          {showDate(yesterday)} · {DAY_ZH[dayOf(yesterday)]}
        </Label>
        <ul className="divide-y divide-line border-y border-line">
          {QUESTIONS.map((q) => (
            <li key={q.key} className="flex items-center justify-between gap-3 py-3">
              <span>{q.text}</span>
              <YesNo label={q.text} value={night[q.key]} onChange={(v) => editNight({ [q.key]: v })} />
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <Editable value={night.note} placeholder="昨天有什么想记下来的？一两句就够。" multiline onSave={(v) => editNight({ note: v })} />
        </div>
      </section>

      <section aria-label="连续天数" className="section">
        <Label aside={<span className="text-sm text-faint">算到昨天为止</span>}>连续天数</Label>
        <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-line bg-line">
          {streaks.map((s) => (
            <div key={s.name} className="bg-bg p-4">
              <dd className="font-serif text-xl font-semibold tabular-nums md:text-2xl">{s.days}</dd>
              <dt className="mt-1 text-sm text-muted">{s.name}</dt>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm text-faint">兵卒任务看有没有打勾；睡眠看上面第四个问题；阅读看今日页的阅读那一条。哪天没记，连续就从那天断开。</p>
      </section>

      <section aria-label="本周复盘" className="section">
        <Label aside={<span className="text-sm text-faint">{dayOf(today) === 'sun' ? '今天写' : '周日写，平时也可以先记'}</span>}>
          本周复盘 · {showDate(monday)}起
        </Label>
        {stats.logged === 0 ? (
          <p className="text-muted">这一周还没有记录。</p>
        ) : (
        <p className="tabular-nums text-muted">
          这一周有记录的 {stats.logged} 天里：睡眠达标 {stats.slept} 天，训练 {stats.training} 天，阅读 {stats.reading} 天，兵卒任务 {stats.pawn} 天，要事完成 {stats.threeDone} / {stats.threeTotal}。
        </p>
        )}
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {WEEK.map((q) => (
            <li key={q.key} className="py-3">
              <p className="text-sm text-muted">{q.text}</p>
              <div className="mt-1">
                <Editable value={week?.[q.key] ?? ''} placeholder={q.placeholder} multiline onSave={(v) => editWeek({ [q.key]: v })} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="历史记录" className="section">
        <Label>回看</Label>
        {history.length === 0 && pastWeeks.length === 0 ? (
          <Empty>还没有可以回看的记录。用上几天之后，每一天和每一周都会留在这里。</Empty>
        ) : (
          <div className="space-y-4">
            {history.length > 0 && (
              <Fold summary={`每一天，共 ${history.length} 天`}>
                <ul className="divide-y divide-line border-y border-line">
                  {history.map((k) => {
                    const log = state.days[k];
                    const three = log.three.filter((t) => t.text.trim());
                    return (
                      <li key={k} className="py-3">
                        <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
                          <span className="tabular-nums">{showDate(k)} {DAY_ZH[dayOf(k)]}</span>
                          <span className="tabular-nums text-muted">要事 {three.filter((t) => t.done).length} / {three.length}</span>
                          <span className="text-muted">兵卒 {log.pawn.text ? mark(log.pawn.done, true) : '·'}</span>
                          <span className="text-muted" aria-label="四个问题的回答">
                            四问 {QUESTIONS.map((q) => mark(log.night?.[q.key], q.good)).join(' ')}
                          </span>
                        </p>
                        {log.night?.note && <p className="pretty mt-1 text-muted">{log.night.note}</p>}
                      </li>
                    );
                  })}
                </ul>
              </Fold>
            )}
            {pastWeeks.length > 0 && (
              <Fold summary={`每一周，共 ${pastWeeks.length} 周`}>
                <ul className="divide-y divide-line border-y border-line">
                  {pastWeeks.map((k) => (
                    <li key={k} className="space-y-1 py-3">
                      <p className="text-sm tabular-nums">{showDate(k)}起的一周</p>
                      {WEEK.map((q) => state.weeks[k][q.key] && (
                        <p key={q.key} className="text-sm text-muted">
                          <span className="text-faint">{q.text}</span> {state.weeks[k][q.key]}
                        </p>
                      ))}
                    </li>
                  ))}
                </ul>
              </Fold>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
