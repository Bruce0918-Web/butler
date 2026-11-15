import { useState } from 'react';
import { dateKey, uid } from '../state/dates';
import type { Goal, Horizon } from '../state/types';
import { useStore } from '../state/useStore';
import { DateField, Pick, showDate } from '../ui/fields';
import { Btn, Check, Editable, Empty, Label, Remove } from '../ui/primitives';

const UP: Record<Horizon, Horizon | null> = { short: 'mid', mid: 'long', long: 'mission', mission: null };
const NAME: Record<Horizon, string> = { short: '短期目标', mid: '阶段', long: '长期目标', mission: '使命' };

function SubNav({ sub }: { sub: string }) {
  const { state } = useStore();
  const tabs = [
    { href: '#/goals', label: '从使命到今天', on: sub !== 'admissions' },
    { href: '#/goals/admissions', label: state.profile.target?.short || '申请', on: sub === 'admissions' },
  ];
  return (
    <nav aria-label="目标的子页" className="mt-6 flex gap-2">
      {tabs.map((t) => (
        <a
          key={t.href}
          href={t.href}
          aria-current={t.on ? 'page' : undefined}
          className={`rounded-full border px-4 py-1 text-sm transition-colors duration-fast ease-out active:opacity-60 ${
            t.on ? 'border-accent text-text' : 'border-line text-muted hover:border-faint hover:text-text'
          }`}
        >
          {t.label}
        </a>
      ))}
    </nav>
  );
}

export function Goals({ sub }: { sub: string }) {
  return sub === 'admissions' ? <Admissions /> : <Tree />;
}

function useGoalActions() {
  const { update } = useStore();
  return {
    add: (horizon: Horizon, parentId: string | null) =>
      update((s) => {
        s.goals.push({ id: uid(), title: '', horizon, parentId, note: '', due: null, done: false });
      }),
    edit: (id: string, p: Partial<Goal>) =>
      update((s) => {
        Object.assign(s.goals.find((g) => g.id === id)!, p);
      }),
    remove: (id: string) =>
      update((s) => {
        s.goals = s.goals.filter((x) => x.id !== id);
        s.goals.forEach((x) => {
          if (x.parentId === id) x.parentId = null;
        });
        s.admissions.forEach((a) => a.items.forEach((i) => { if (i.goalId === id) i.goalId = null; }));
      }),
  };
}

const TITLE: Record<Horizon, string> = {
  mission: 'balance font-serif text-xl font-semibold tracking-tight md:text-2xl',
  long: 'balance font-serif text-lg font-semibold',
  mid: 'balance font-medium',
  short: '',
};

/** One goal: tick, title, note, deadline. Where it belongs and its deadline are changed under "调整". */
function GoalLine({ g }: { g: Goal }) {
  const { state } = useStore();
  const { edit, remove } = useGoalActions();
  const [open, setOpen] = useState(!g.title);
  const parents = UP[g.horizon] ? state.goals.filter((x) => x.horizon === UP[g.horizon]) : [];

  return (
    <div className="group/goal">
      <div className="flex items-start gap-2">
        {g.horizon !== 'mission' && <Check checked={g.done} label={`达成：${g.title}`} onChange={(v) => edit(g.id, { done: v })} />}
        <div className={`min-w-0 flex-1 transition-opacity duration-base ease-out ${g.horizon === 'mission' ? '' : 'pt-px'} ${g.done ? 'opacity-40' : ''}`}>
          <Editable value={g.title} placeholder={NAME[g.horizon]} multiline onSave={(v) => edit(g.id, { title: v })} className={TITLE[g.horizon]} />
          {(g.note || open) && (
            <div className="mt-1 text-sm text-muted">
              <Editable value={g.note} placeholder="补充说明" multiline onSave={(v) => edit(g.id, { note: v })} />
            </div>
          )}
          {g.due && <p className="mt-1 text-xs tabular-nums text-faint">截止 {showDate(g.due)}</p>}
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-label={`${open ? '收起' : '调整'} ${g.title}`}
          onClick={() => setOpen(!open)}
          className={`h-8 shrink-0 rounded-sm px-1 text-sm transition duration-fast ease-out hover:text-text focus:opacity-100 active:opacity-60 md:group-hover/goal:opacity-100 ${
            open ? 'text-text' : 'text-faint md:opacity-0'
          }`}
        >
          {open ? '收起' : '调整'}
        </button>
      </div>

      {open && (
        <div className="enter mt-3 space-y-2 rounded-sm bg-raised p-3 text-sm text-muted">
          {parents.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0">服务于</span>
              <div className="min-w-0 flex-1">
                <Pick
                  label="服务于"
                  value={g.parentId ?? ''}
                  options={[{ value: '', label: '还没连上' }, ...parents.map((p) => ({ value: p.id, label: p.title }))]}
                  onChange={(v) => edit(g.id, { parentId: v || null })}
                />
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="w-12 shrink-0">截止</span>
            <DateField label="截止日" value={g.due} onChange={(v) => edit(g.id, { due: v })} />
          </div>
          <div className="group flex justify-end">
            <Remove what={g.title || `这条${NAME[g.horizon]}`} onConfirm={() => remove(g.id)} />
          </div>
        </div>
      )}
    </div>
  );
}

const Add = ({ children, onClick }: { children: string; onClick: () => void }) => (
  <Btn variant="quiet" className="-ml-4" onClick={onClick}>+ {children}</Btn>
);

/** Mission on top; under it each long-term goal with the stages that serve it; under each stage its short-term goals. */
function Tree() {
  const { state } = useStore();
  const { add } = useGoalActions();
  const of = (h: Horizon) => state.goals.filter((g) => g.horizon === h);
  const ids = new Set(state.goals.map((g) => g.id));
  const children = (id: string, h: Horizon) => state.goals.filter((g) => g.horizon === h && g.parentId === id);
  const missions = of('mission');
  const today = dateKey(new Date());
  /** The stage we are in: the earliest one that is neither done nor past its date. */
  const currentStage = of('mid')
    .filter((g) => !g.done && (!g.due || g.due >= today))
    .sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'))[0]?.id;
  const longs = of('long');
  const loose = state.goals.filter((g) => g.horizon !== 'mission' && g.horizon !== 'long' && (!g.parentId || !ids.has(g.parentId)));

  return (
    <>
      <header className="mb-16">
        <p className="text-sm text-muted">目标 · 使命</p>
        <h1 className="sr-only">目标</h1>
        <div className="mt-2 max-w-prose space-y-3">
          {missions.map((m) => (
            <GoalLine key={m.id} g={m} />
          ))}
          {missions.length === 0 && <Empty action={<Btn onClick={() => add('mission', null)}>写下使命</Btn>}>还没有使命。它是所有目标最终要连到的那一句话。</Empty>}
        </div>
        <SubNav sub="" />
      </header>

      {longs.length === 0 && <Empty>还没有长期目标。长期目标是几年后要成为的样子。</Empty>}
      <div className="grid gap-x-8 gap-y-16 md:grid-cols-2 xl:grid-cols-3">
        {longs.map((long) => {
          const stages = children(long.id, 'mid');
          return (
            <section key={long.id} aria-label={long.title} className="border-t border-accent pt-4">
              <p className="mb-2 text-sm text-muted">长期</p>
              <GoalLine g={long} />

              <div className="mt-8 space-y-4">
                {stages.length === 0 && <p className="text-sm text-faint">现在没有任何阶段在为这个目标出力。</p>}
                {stages.map((stage) => {
                  const shorts = children(stage.id, 'short');
                  return (
                    <div key={stage.id} className={`rounded-md border bg-surface p-4 md:p-6 ${stage.id === currentStage ? 'border-accent' : 'border-line'}`}>
                      {stage.id === currentStage && <p className="mb-2 text-xs text-accent">现在所在的阶段</p>}
                      <GoalLine g={stage} />
                      {shorts.length > 0 && (
                        <ul className="mt-4 space-y-2 border-t border-line pt-3">
                          {shorts.map((s) => (
                            <li key={s.id}>
                              <GoalLine g={s} />
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-2">
                        <Add onClick={() => add('short', stage.id)}>短期目标</Add>
                      </div>
                    </div>
                  );
                })}
                <Add onClick={() => add('mid', long.id)}>阶段</Add>
              </div>
            </section>
          );
        })}
      </div>
      <div className="mt-8">
        <Add onClick={() => add('long', missions[0]?.id ?? null)}>长期目标</Add>
      </div>

      {loose.length > 0 && (
        <section className="mt-16 max-w-prose">
          <Label>还没连上上级的目标</Label>
          <p className="mb-3 text-sm text-muted">这些目标不服务于任何上级。点“调整”把它连上，或者删掉。</p>
          <ul className="space-y-3">
            {loose.map((g) => (
              <li key={g.id} className="rounded-md border border-line bg-surface p-4">
                <p className="mb-1 text-xs text-faint">{NAME[g.horizon]}</p>
                <GoalLine g={g} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function Admissions() {
  const { state, update } = useStore();
  const today = dateKey(new Date());
  const stages = state.goals.filter((g) => g.horizon === 'mid').sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'));
  const all = state.admissions.flatMap((a) => a.items.map((i) => ({ ...i, area: a.name })));
  const done = all.filter((i) => i.done).length;
  const current = stages.find((g) => !g.done && (!g.due || g.due >= today))?.id;
  const target = state.profile.target ?? { short: '', title: '' };
  const setTarget = (p: Partial<typeof target>) => update((s) => { s.profile.target = { ...(s.profile.target ?? { short: '', title: '' }), ...p }; });

  return (
    <>
      <header className="mb-12">
        <p className="flex items-baseline gap-2 text-sm text-muted">
          目标 ·
          <Editable value={target.short} placeholder="这一页的短名" onSave={(v) => setTarget({ short: v })} />
        </p>
        <h1 className="mt-2 max-w-prose">
          <Editable value={target.title} placeholder="写下你要考进的学校，一句话" multiline onSave={(v) => setTarget({ title: v })} className="balance font-serif text-xl font-semibold tracking-tight md:text-2xl" />
        </h1>
        <SubNav sub="admissions" />
      </header>

      <section aria-label="按阶段的时间线">
        <Label aside={<span className="text-xs tabular-nums text-faint">{done} / {all.length}</span>}>路线</Label>
        {stages.length === 0 ? (
          <Empty>还没有阶段。在“从使命到今天”里给长期目标添加阶段，这里就会排出路线。</Empty>
        ) : (
          <ol className="lg:grid lg:grid-cols-5 lg:gap-x-6">
            {stages.map((g) => {
              const items = all.filter((i) => i.goalId === g.id);
              const now = g.id === current;
              const past = g.done || (!!g.due && g.due < today);
              return (
                <li key={g.id} className={`relative border-l pb-8 pl-6 lg:border-l-0 lg:border-t lg:pb-0 lg:pl-0 lg:pt-6 ${now ? 'border-accent' : 'border-line'}`}>
                  <span aria-hidden="true" className={`absolute -left-1 top-2 h-2 w-2 rounded-full lg:-top-1 lg:left-0 ${now ? 'bg-accent' : past ? 'bg-faint' : 'bg-line'}`} />
                  {now && <p className="text-xs text-accent">现在</p>}
                  <p className={`balance font-medium ${past ? 'text-muted' : ''}`}>{g.title}</p>
                  {g.due && <p className="text-xs tabular-nums text-faint">到 {showDate(g.due)}</p>}
                  {items.length === 0 ? (
                    <p className="mt-3 text-sm text-faint">没有排进清单项</p>
                  ) : (
                    <ul className="mt-3 space-y-2 text-sm">
                      {items.map((i) => (
                        <li key={i.id} className={i.done ? 'opacity-40' : ''}>
                          <span className="block text-xs text-faint">{i.area}</span>
                          <span className="text-muted">{i.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section aria-label="六个方面" className="mt-24">
        <Label>六个方面</Label>
        <div className="border-b border-line">
          {state.admissions.map((area) => {
            const editArea = (fn: (a: typeof area) => void) => update((s) => { fn(s.admissions.find((a) => a.id === area.id)!); });
            return (
              <div key={area.id} className="grid gap-x-8 gap-y-3 border-t border-line py-6 md:grid-cols-4">
                <div>
                  <h2 className="font-serif text-lg font-semibold">{area.name}</h2>
                  <p className="text-xs tabular-nums text-faint">{area.items.filter((i) => i.done).length} / {area.items.length}</p>
                </div>
                <div className="md:col-span-3">
                  <Editable value={area.status ?? ''} placeholder={`一句话写下「${area.name}」的现状`} multiline onSave={(v) => editArea((a) => { a.status = v; })} />
                  {area.items.length === 0 ? (
                    <p className="mt-3 text-sm text-faint">还没有清单项。写下下一步要做的事。</p>
                  ) : (
                    <ul className="mt-3">
                      {area.items.map((item) => {
                        const patch = (p: Partial<typeof item>) => editArea((a) => { Object.assign(a.items.find((i) => i.id === item.id)!, p); });
                        return (
                          <li key={item.id} className="group flex items-start gap-3 py-1">
                            <Check checked={item.done} label={`完成：${item.text}`} onChange={(v) => patch({ done: v })} />
                            <div className={`min-w-0 flex-1 pt-px transition-opacity duration-base ease-out ${item.done ? 'opacity-40' : ''}`}>
                              <Editable value={item.text} placeholder="清单项" multiline onSave={(v) => patch({ text: v })} />
                            </div>
                            <div className="mt-1 w-24 shrink-0">
                              <Pick
                                quiet
                                label="属于哪个阶段"
                                value={item.goalId ?? ''}
                                options={[{ value: '', label: '未排阶段' }, ...stages.map((g) => ({ value: g.id, label: g.title.split(' · ')[0] }))]}
                                onChange={(v) => patch({ goalId: v || null })}
                              />
                            </div>
                            <Remove what={item.text || '这一项'} onConfirm={() => editArea((a) => { a.items = a.items.filter((i) => i.id !== item.id); })} />
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <div className="mt-1">
                    <Add onClick={() => editArea((a) => { a.items.push({ id: uid(), text: '', goalId: null, done: false }); })}>清单项</Add>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
