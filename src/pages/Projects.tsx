import { useState } from 'react';
import { dateKey, daysBetween, uid } from '../state/dates';
import { WAIT_DAYS, activate, canActivate, daysParked, slots } from '../state/projects';
import type { Idea, Project } from '../state/types';
import { useStore } from '../state/useStore';
import { DateField, showDate } from '../ui/fields';
import { Btn, Check, Editable, Empty, Label, PageHead, Remove } from '../ui/primitives';

const ROLE = { main: '主线', side: '副线' } as const;
const RULE = { main: '唯一。每天固定时段推进。', side: '唯一。只在周末固定时段。' } as const;

function ProjectCard({ role, project }: { role: 'main' | 'side'; project: Project | null }) {
  const { update } = useStore();
  const today = dateKey(new Date());
  const patch = (p: Partial<Project>) => update((s) => { Object.assign(s.projects.find((x) => x.id === project!.id)!, p); });

  return (
    <section aria-label={ROLE[role]} className="border-t border-accent pt-4">
      <p className="mb-2 text-sm text-muted">
        {ROLE[role]} <span className="text-faint">· {RULE[role]}</span>
      </p>
      {!project ? (
        <Empty>{ROLE[role]}的位置空着。停车场里满 {WAIT_DAYS} 天的想法可以启用到这里。</Empty>
      ) : (
        <>
          <Editable value={project.name} placeholder="项目名" multiline onSave={(v) => patch({ name: v })} className="balance font-serif text-lg font-semibold" />
          <dl className="mt-6 space-y-4">
            <div>
              <dt className="text-xs text-faint">下一步动作</dt>
              <dd className="mt-1">
                <Editable value={project.next} placeholder="写下下一个能在一个时段内做完的动作" multiline onSave={(v) => patch({ next: v })} />
              </dd>
            </div>
            <div className="space-y-3">
              <div className="flex items-baseline gap-3">
                <dt className="text-xs text-faint">截止</dt>
                <dd className={`${project.due && !project.delivered && daysBetween(today, project.due) <= 7 ? 'text-accent' : ''}`}>
                  <DateField label="截止日" value={project.due} onChange={(v) => patch({ due: v })} />
                </dd>
              </div>
              <label className="flex items-center gap-2 text-sm text-muted">
                <Check checked={project.delivered} label={`已交付：${project.name}`} onChange={(v) => patch({ delivered: v })} />
                这一次的交付已完成
              </label>
            </div>
          </dl>
        </>
      )}
    </section>
  );
}

function IdeaRow({ idea }: { idea: Idea }) {
  const { state, update } = useStore();
  const today = dateKey(new Date());
  const [choosing, setChoosing] = useState(false);
  const waited = daysParked(idea.addedAt, today);
  const ready = canActivate(idea.addedAt, today);
  const current = slots(state);

  return (
    <li className="group py-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <Editable value={idea.text} placeholder="一个想法" multiline onSave={(v) => update((s) => { s.parking.find((i) => i.id === idea.id)!.text = v; })} />
          <p className="mt-1 text-xs tabular-nums text-faint">
            {showDate(idea.addedAt)}放入 · {ready ? `已等 ${waited} 天，可以启用` : `第 ${waited} 天，还要等 ${WAIT_DAYS - waited} 天`}
          </p>
        </div>
        {ready && !choosing && <Btn onClick={() => setChoosing(true)}>启用</Btn>}
        <Remove what={idea.text || '这个想法'} onConfirm={() => update((s) => { s.parking = s.parking.filter((i) => i.id !== idea.id); })} />
      </div>

      {choosing && (
        <div className="enter card mt-3">
          <p className="font-medium">启用它，要停掉哪一个？</p>
          <p className="mt-1 text-sm text-muted">项目只能替换，不能叠加。被替换的项目会停掉，记录保留在下面的“已停掉”里。</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {(['main', 'side'] as const).map((role) => (
              <Btn
                key={role}
                onClick={() => {
                  update((s) => { activate(s, idea.id, role, today); });
                  setChoosing(false);
                }}
              >
                {current[role] ? `替换${ROLE[role]}「${current[role]!.name}」` : `放进空着的${ROLE[role]}`}
              </Btn>
            ))}
            <Btn variant="quiet" onClick={() => setChoosing(false)}>先不启用</Btn>
          </div>
        </div>
      )}
    </li>
  );
}

export function Projects() {
  const { state, update } = useStore();
  const today = dateKey(new Date());
  const { main, side } = slots(state);
  const extra = state.projects.filter((p) => p.active && p !== main && p !== side);
  const stopped = state.projects.filter((p) => !p.active);
  const [draft, setDraft] = useState('');
  const park = () => {
    if (!draft.trim()) return;
    update((s) => { s.parking.push({ id: uid(), text: draft.trim(), addedAt: today }); });
    setDraft('');
  };

  return (
    <>
      <PageHead kicker="项目" title="一条主线，一条副线。" sub={`新想法先停车 ${WAIT_DAYS} 天。启用时必须替换掉一个现有项目。`} />

      <div className="grid gap-x-8 gap-y-16 md:grid-cols-2">
        <ProjectCard role="main" project={main} />
        <ProjectCard role="side" project={side} />
      </div>

      {extra.length > 0 && (
        <section className="card mt-8 border-accent">
          <p className="font-medium">多出来的项目：{extra.length} 个</p>
          <p className="mt-1 text-sm text-muted">它们在主线和副线之外同时进行。规则是一主一副，把它们停掉。</p>
          <ul className="mt-3 divide-y divide-line">
            {extra.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                <span>{p.name}</span>
                <Btn onClick={() => update((s) => { Object.assign(s.projects.find((x) => x.id === p.id)!, { active: false, stoppedAt: today }); })}>停掉</Btn>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="想法停车场" className="section max-w-prose">
        <Label aside={<span className="text-xs tabular-nums text-faint">{state.parking.length} 个在等</span>}>想法停车场</Label>
        <form
          className="flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            park();
          }}
        >
          <input value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="新想法" placeholder="有新想法？先写在这里，今天不动它。" className="field min-w-0 flex-1 py-2 text-base" />
          <Btn type="submit" disabled={!draft.trim()}>停进去</Btn>
        </form>
        {state.parking.length === 0 ? (
          <p className="mt-4 text-sm text-faint">停车场是空的。任何新项目的念头都先放这里，{WAIT_DAYS} 天后还想做，再决定替换谁。</p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {[...state.parking].sort((a, b) => a.addedAt.localeCompare(b.addedAt)).map((idea) => (
              <IdeaRow key={idea.id} idea={idea} />
            ))}
          </ul>
        )}
      </section>

      {stopped.length > 0 && (
        <section aria-label="已停掉的项目" className="section max-w-prose">
          <Label>已停掉</Label>
          <ul className="divide-y divide-line border-y border-line">
            {stopped.map((p) => (
              <li key={p.id} className="group flex items-center justify-between gap-3 py-2 text-muted">
                <span className="min-w-0">
                  {p.name}
                  <span className="ml-2 text-xs tabular-nums text-faint">{p.stoppedAt ? `${showDate(p.stoppedAt)}停掉` : ''}</span>
                </span>
                <Remove what={p.name} onConfirm={() => update((s) => { s.projects = s.projects.filter((x) => x.id !== p.id); })} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
