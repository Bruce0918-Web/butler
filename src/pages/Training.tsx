import { useState } from 'react';
import { DAY_ZH, addDays, dateKey, dayOf, daysBetween, uid } from '../state/dates';
import { slotsFor } from '../state/today';
import { DAYS, type Block, type BodyLog, type Move } from '../state/types';
import { useStore } from '../state/useStore';
import { mainSlot, trainingSlots } from '../state/workouts';
import { DateField, showDate } from '../ui/fields';
import { Trend } from '../ui/Trend';
import { Btn, Editable, Empty, Fold, Label, Remove } from '../ui/primitives';

/** The workout a day's plan refers to: the first workout name that appears in the plan text. */
function workoutFor(plan: string, names: string[]): string | null {
  return names.find((n) => plan.includes(n)) ?? null;
}

const toNumber = (text: string): number | null => {
  const n = Number(text.replace(',', '.'));
  return text.trim() === '' || !Number.isFinite(n) ? null : n;
};

function NumberCell({ value, label, onSave }: { value: number | null; label: string; onSave: (v: number | null) => void }) {
  return <Editable value={value === null ? '' : String(value)} placeholder={label} onSave={(text) => onSave(toNumber(text))} className="tabular-nums" />;
}

/** One workout as numbered blocks. Exercises done together share a line down their left side. */
function Workout({ name }: { name: string }) {
  const { state, update } = useStore();
  const blocks = state.training.workouts[name];
  /** Off: a clean sheet to read in the gym. On: empty fields, add and delete controls appear. */
  const [editing, setEditing] = useState(false);
  const edit = (fn: (blocks: Block[]) => void) => update((s) => { fn(s.training.workouts[name]); });
  const patchMove = (blockId: string, moveId: string, p: Partial<Move>) =>
    edit((bs) => { Object.assign(bs.find((b) => b.id === blockId)!.moves.find((m) => m.id === moveId)!, p); });

  return (
    <section aria-label={`${name}的动作`} className="section">
      <Label aside={<Btn variant="quiet" className="-mr-4" aria-pressed={editing} onClick={() => setEditing(!editing)}>{editing ? '完成' : '增删动作'}</Btn>}>
        {name} · {blocks.length} 组动作
      </Label>
      {blocks.length === 0 && <Empty>这套动作还是空的。点“增删动作”加第一组。</Empty>}
      <ol className="border-b border-line">
        {blocks.map((block, i) => (
          <li key={block.id} className="grid grid-cols-12 gap-x-3 border-t border-line py-4">
            <div className="col-span-12 mb-2 flex items-baseline gap-3 md:col-span-1 md:mb-0 md:block">
              <span className="font-serif text-lg font-semibold tabular-nums text-muted">{i + 1}</span>
              <span className="text-xs text-faint md:mt-1 md:block">
                <Editable value={block.kind} placeholder="单独做" className="!whitespace-nowrap" onSave={(v) => edit((bs) => { bs.find((b) => b.id === block.id)!.kind = v; })} />
              </span>
            </div>

            <div className={`col-span-12 md:col-span-11 ${block.moves.length > 1 ? 'border-l border-accent pl-4' : 'md:pl-4'}`}>
              <ul className="space-y-3">
                {block.moves.map((m) => (
                  <li key={m.id} className="grid grid-cols-12 items-baseline gap-x-3 gap-y-1">
                    <div className="col-span-8 md:col-span-5">
                      <Editable value={m.zh} placeholder="动作名" onSave={(v) => patchMove(block.id, m.id, { zh: v })} className="font-medium" />
                      <div className="text-sm text-faint">
                        <Editable value={m.en} placeholder="英文名（Hevy 里的名字）" onSave={(v) => patchMove(block.id, m.id, { en: v })} />
                      </div>
                    </div>
                    <div className="col-span-4 flex justify-end tabular-nums md:col-span-2 md:justify-start">
                      <Editable value={m.sets} placeholder="组×次" className="!whitespace-nowrap" onSave={(v) => patchMove(block.id, m.id, { sets: v })} />
                    </div>
                    <div className="col-span-10 text-sm text-muted md:col-span-4">
                      <Editable value={m.target} placeholder="目标重量或要点" multiline onSave={(v) => patchMove(block.id, m.id, { target: v })} />
                    </div>
                    <div className="col-span-2 justify-self-end md:col-span-1">
                      {editing && (
                        <Remove
                          always
                          what={m.zh || '这个动作'}
                          onConfirm={() => edit((bs) => {
                            const b = bs.find((x) => x.id === block.id)!;
                            b.moves = b.moves.filter((x) => x.id !== m.id);
                            if (b.moves.length === 0) bs.splice(bs.indexOf(b), 1);
                          })}
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              {(block.note || editing) && (
                <div className="mt-3 text-sm text-faint">
                  <Editable value={block.note} placeholder="这一组的说明，例如组间休息" multiline onSave={(v) => edit((bs) => { bs.find((b) => b.id === block.id)!.note = v; })} />
                </div>
              )}
              {editing && (
                <div className="mt-1">
                  <Btn variant="quiet" className="-ml-4" onClick={() => edit((bs) => { bs.find((b) => b.id === block.id)!.moves.push({ id: uid(), zh: '', en: '', sets: '', target: '' }); })}>
                    + 这一组里再加一个动作
                  </Btn>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
      {editing ? (
        <div className="mt-2">
          <Btn variant="quiet" className="-ml-4" onClick={() => edit((bs) => { bs.push({ id: uid(), kind: '单独做', note: '', moves: [{ id: uid(), zh: '', en: '', sets: '', target: '' }] }); })}>
            + 加一组
          </Btn>
        </div>
      ) : (
        <p className="mt-3 text-sm text-faint">每组实际做了多少记在 Hevy。点任何一处文字都可以直接改。</p>
      )}
    </section>
  );
}

/** The training phase: how far along it is, and the dates inside it that matter. */
function Phase() {
  const { state, update } = useStore();
  const today = dateKey(new Date());
  const { name, start, end, marks } = state.training.phase;
  const total = start && end ? daysBetween(start, end) : 0;
  const gone = start ? Math.min(Math.max(daysBetween(start, today), 0), total) : 0;
  const at = (date: string) => (total > 0 && start ? Math.min(100, Math.max(0, (daysBetween(start, date) / total) * 100)) : null);
  const edit = (fn: (p: typeof state.training.phase) => void) => update((s) => { fn(s.training.phase); });
  const sorted = [...marks].sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'));

  return (
    <div className="mt-8 max-w-prose">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 flex-1 font-medium">
          <Editable value={name} placeholder="训练阶段的名字" onSave={(v) => edit((p) => { p.name = v; })} />
        </span>
        {total > 0 && (
          <span className="shrink-0 tabular-nums text-muted">
            第 {gone} 天 / {total} 天
          </span>
        )}
      </div>

      {total > 0 && (
        // Drawn as an SVG so lengths and positions are plain numbers rather than inline styles.
        <svg viewBox="0 0 100 4" preserveAspectRatio="none" role="progressbar" aria-label="训练阶段进度" aria-valuemin={0} aria-valuemax={total} aria-valuenow={gone} className="mt-3 block h-3 w-full text-accent">
          <rect y="1.5" width="100" height="1" className="fill-line" />
          <rect y="1.5" width={(gone / total) * 100} height="1" fill="currentColor" />
          {sorted.map((m) => {
            const x = m.date ? at(m.date) : null;
            return x === null ? null : <rect key={m.id} x={Math.min(x, 99.6)} width="0.4" height="4" className={m.date! < today ? 'fill-faint' : 'fill-text'} />;
          })}
        </svg>
      )}

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
        <span className="flex items-baseline gap-2">
          开始 <DateField label="阶段开始日" value={start} onChange={(v) => edit((p) => { p.start = v; })} />
        </span>
        <span className="flex items-baseline gap-2">
          结束 <DateField label="阶段结束日" value={end} onChange={(v) => edit((p) => { p.end = v; })} />
        </span>
      </div>
      {!start && <p className="mt-1 text-sm text-faint">点“未定”填上开始日，这里会画出进度和下面这些节点。</p>}

      <ul className="mt-3 space-y-1 text-sm">
        {sorted.map((m) => {
          const left = m.date ? daysBetween(today, m.date) : null;
          return (
            <li key={m.id} className="group flex items-baseline gap-3">
              <span className={`w-24 shrink-0 tabular-nums ${left !== null && left < 0 ? 'text-faint' : ''}`}>
                <DateField label="节点日期" value={m.date} onChange={(v) => edit((p) => { p.marks.find((x) => x.id === m.id)!.date = v; })} />
              </span>
              <span className={`min-w-0 flex-1 ${left !== null && left < 0 ? 'text-faint' : 'text-muted'}`}>
                <Editable value={m.label} placeholder="这一天是什么" onSave={(v) => edit((p) => { p.marks.find((x) => x.id === m.id)!.label = v; })} />
              </span>
              {left !== null && <span className="shrink-0 text-xs tabular-nums text-faint">{left < 0 ? '已过' : left === 0 ? '今天' : `还有 ${left} 天`}</span>}
              <Remove what={m.label || '这个节点'} onConfirm={() => edit((p) => { p.marks = p.marks.filter((x) => x.id !== m.id); })} />
            </li>
          );
        })}
      </ul>
      <Btn variant="quiet" className="-ml-4" onClick={() => edit((p) => { p.marks.push({ id: uid(), date: null, label: '' }); })}>+ 节点</Btn>
    </div>
  );
}

/** This morning's weight and HRV: the one thing on this page that is entered every day. */
function Morning() {
  const { state, update } = useStore();
  const today = dateKey(new Date());
  const logged = state.training.log.find((l) => l.date === today);
  const [weight, setWeight] = useState('');
  const [hrv, setHrv] = useState('');
  const ready = toNumber(weight) !== null || toNumber(hrv) !== null;

  const record = () => {
    const entry = { weight: toNumber(weight), hrv: toNumber(hrv) };
    if (entry.weight === null && entry.hrv === null) return;
    update((s) => {
      const existing = s.training.log.find((l) => l.date === today);
      if (existing) Object.assign(existing, { weight: entry.weight ?? existing.weight, hrv: entry.hrv ?? existing.hrv });
      else s.training.log.push({ date: today, ...entry });
    });
    setWeight('');
    setHrv('');
  };

  return (
    <form
      aria-label="今天早上的体重和 HRV"
      className="card self-start"
      onSubmit={(e) => {
        e.preventDefault();
        record();
      }}
    >
      <p className="text-sm font-medium text-muted">今天早上</p>
      <div className="mt-3 flex items-end gap-3">
        <label className="min-w-0 flex-1 text-xs text-faint">
          体重 kg
          <input value={weight} onChange={(e) => setWeight(e.target.value)} inputMode="decimal" placeholder={logged?.weight != null ? String(logged.weight) : '—'} className="field mt-1 block w-full py-2 text-lg tabular-nums" />
        </label>
        <label className="min-w-0 flex-1 text-xs text-faint">
          HRV ms
          <input value={hrv} onChange={(e) => setHrv(e.target.value)} inputMode="decimal" placeholder={logged?.hrv != null ? String(logged.hrv) : '—'} className="field mt-1 block w-full py-2 text-lg tabular-nums" />
        </label>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-faint">{logged ? '今天已经记过，再填会覆盖。' : '空腹称重；HRV 看 WHOOP。'}</span>
        <Btn variant={ready ? 'primary' : 'ghost'} type="submit" disabled={!ready}>记下</Btn>
      </div>
    </form>
  );
}

export function Training() {
  const { state, update } = useStore();
  const t = state.training;
  const today = dateKey(new Date());
  const day = dayOf(today);
  const monday = addDays(today, -DAYS.indexOf(day));
  const workout = workoutFor(t.plan[day], Object.keys(t.workouts));
  const sessions = trainingSlots(slotsFor(state, today));
  const main = (workout && sessions.find((s) => s.title.includes(workout))) || mainSlot(sessions);
  const checks = state.days[today]?.checks ?? {};

  const blocks = workout ? t.workouts[workout] : [];
  const first = blocks[0]?.moves[0];
  /** What matters about today's session, in one line. */
  const facts: string[] = [];
  if (main) {
    facts.push(main.label ?? `${main.time} 开始`);
    if (main.end) facts.push(`${main.end} 前做完`);
  }
  if (workout && blocks.length) facts.push(`${blocks.length} 组动作`);
  if (first?.zh) facts.push(`先做${first.zh}${first.sets ? ' ' + first.sets : ''}`);
  if (!workout && main?.done) facts.push(`做到：${main.done}`);

  const log = [...t.log].sort((a, b) => a.date.localeCompare(b.date));
  const series = (key: 'weight' | 'hrv') => log.filter((l) => l[key] !== null).map((l) => ({ date: l.date, value: l[key] as number }));
  const patchLog = (date: string, p: Partial<BodyLog>) => update((s) => { Object.assign(s.training.log.find((l) => l.date === date)!, p); });

  /** For the week strip: whether each day's main session was ticked on the Today page. */
  const status = (date: string): string => {
    const m = mainSlot(slotsFor(state, date));
    if (!m) return '';
    if (state.days[date]?.checks[m.id]) return '已完成';
    return date < today ? '没打勾' : '';
  };

  return (
    <>
      <header className="grid gap-x-12 gap-y-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <p className="text-sm text-muted">训练 · {DAY_ZH[day]}</p>
          <h1 className="mt-2">
            <Editable value={t.plan[day]} placeholder="今天练什么" onSave={(v) => update((s) => { s.training.plan[day] = v; })} className="balance font-serif text-xl font-semibold tracking-tight md:text-2xl" />
          </h1>
          <p className="mt-3 tabular-nums text-muted">{facts.length ? facts.join(' · ') : sessions.length ? '今天不练，只做恢复。' : '今天没有排训练。'}</p>
          <Phase />
        </div>
        <Morning />
      </header>

      <section aria-label="今天的训练安排" className="section">
        <Label aside={<a href="#/today" className="rounded-sm text-sm text-faint transition-colors duration-fast ease-out hover:text-text">在今日页打勾和修改</a>}>今天的安排</Label>
        {sessions.length === 0 ? (
          <Empty>今天的日程里没有训练。要加的话，到今日页点“编辑日程”。</Empty>
        ) : (
          <ol className="divide-y divide-line border-y border-line">
            {sessions.map((s) => (
              <li key={s.id} className={`grid grid-cols-12 gap-x-3 gap-y-1 py-3 ${checks[s.id] ? 'opacity-40' : ''}`}>
                <span className="col-span-12 text-sm tabular-nums text-muted md:col-span-2">
                  {s.label ?? s.time}
                  {s.end ? `–${s.end}` : ''}
                </span>
                <div className="col-span-12 md:col-span-10">
                  <p className={s.id === main?.id ? 'font-medium' : ''}>
                    {s.title}
                    {checks[s.id] && <span className="ml-2 text-xs text-faint">已完成</span>}
                  </p>
                  {s.detail && <p className="pretty mt-1 text-sm text-muted">{s.detail}</p>}
                  {s.done && <p className="mt-1 text-sm text-faint">做到：{s.done}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {workout && <Workout name={workout} />}

      <section aria-label="本周安排" className="section">
        <Label>本周安排</Label>
        <ol className="grid gap-px overflow-hidden rounded-md border border-line bg-line md:grid-cols-7">
          {DAYS.map((d, i) => {
            const date = addDays(monday, i);
            const done = status(date);
            return (
              <li key={d} className={`relative flex items-baseline gap-3 px-3 py-2 md:block ${d === day ? 'bg-surface' : 'bg-bg'}`}>
                {d === day && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-accent" />}
                <p className={`w-12 shrink-0 text-xs md:w-auto ${d === day ? 'text-accent' : 'text-faint'}`}>{DAY_ZH[d]}</p>
                <div className={`min-w-0 flex-1 text-sm md:mt-1 ${date < today && done !== '已完成' ? 'text-muted' : ''}`}>
                  <Editable value={t.plan[d]} placeholder="休息" multiline onSave={(v) => update((s) => { s.training.plan[d] = v; })} />
                </div>
                {done && <p className={`shrink-0 text-xs md:mt-1 ${done === '已完成' ? 'text-accent' : 'text-faint'}`}>{done}</p>}
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-label="体重和 HRV 的趋势" className="section">
        <Label aside={<span className="text-sm text-faint">线是 7 天平均，点是每天的读数</span>}>体重和 HRV</Label>
        {log.length === 0 ? (
          <Empty>还没有记录。在页面顶部记下今天早上的体重或 HRV；记到第二次就能看到趋势。</Empty>
        ) : (
          <>
            <div className="grid gap-12 md:grid-cols-2">
              {(
                [
                  ['weight', '体重', 'kg', 2],
                  ['hrv', 'HRV', 'ms', 30],
                ] as const
              ).map(([key, name, unit, minSpan]) => {
                const points = series(key);
                return (
                  <div key={key}>
                    <p className="mb-3 text-sm font-medium text-muted">{name}</p>
                    {points.length >= 2 ? (
                      <Trend points={points} unit={unit} label={name} minSpan={minSpan} />
                    ) : (
                      <p className="text-sm text-faint">{points.length === 1 ? `只有一次记录：${points[0].value} ${unit}。再记一次就能看到趋势。` : '还没有记录。'}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-12">
              <Fold summary={`全部 ${log.length} 次记录，可以改`}>
                <table className="w-full max-w-prose text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-muted">
                      <th scope="col" className="py-2 font-normal">日期</th>
                      <th scope="col" className="py-2 font-normal">体重 kg</th>
                      <th scope="col" className="py-2 font-normal">HRV ms</th>
                      <th scope="col" className="py-2"><span className="sr-only">删除</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...log].reverse().map((l) => (
                      <tr key={l.date} className="group border-b border-line">
                        <td className="py-1 tabular-nums">{showDate(l.date)}</td>
                        <td className="py-1"><NumberCell value={l.weight} label="体重" onSave={(v) => patchLog(l.date, { weight: v })} /></td>
                        <td className="py-1"><NumberCell value={l.hrv} label="HRV" onSave={(v) => patchLog(l.date, { hrv: v })} /></td>
                        <td className="py-1 text-right"><Remove what={`${showDate(l.date)}的记录`} onConfirm={() => update((s) => { s.training.log = s.training.log.filter((x) => x.date !== l.date); })} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Fold>
            </div>
          </>
        )}
      </section>
    </>
  );
}
