import { DAY_ZH, uid } from '../state/dates';
import { MAX_MUST } from '../state/migrate';
import type { Day, Slot } from '../state/types';
import { useStore } from '../state/useStore';
import { TimeField } from './fields';
import { Btn, Remove } from './primitives';

/** Edits the template for one weekday: each row's start, optional end, title, detail, and whether it is a must. */
export function ScheduleEditor({ day }: { day: Day }) {
  const { state, update } = useStore();
  const rows = state.schedule[day];
  const musts = rows.filter((s) => s.must).length;
  const patch = (id: string, p: Partial<Slot>) =>
    update((s) => {
      const slot = s.schedule[day].find((x) => x.id === id)!;
      Object.assign(slot, p);
      if (!slot.end) delete slot.end;
      if (!slot.must) delete slot.must;
    });

  return (
    <>
      <p className="mb-3 text-sm text-muted">
        这里改的是每个{DAY_ZH[day]}的日程，不只是今天。必做最多 {MAX_MUST} 项，现在 {musts} 项；其余是可选，平时收起，不计入完成数。长时段可以填结束时间。
      </p>
      {rows.length === 0 && <p className="text-sm text-faint">还没有条目。</p>}
      <ul className="divide-y divide-line border-y border-line">
        {rows.map((s) => {
          const full = !s.must && musts >= MAX_MUST;
          return (
            <li key={s.id} className="group grid grid-cols-2 gap-2 py-3 md:grid-cols-12 md:items-center">
              <div className="md:col-span-2">
                <TimeField label="开始时间" value={s.time} onChange={(v) => v && patch(s.id, { time: v })} />
              </div>
              <div className="md:col-span-2">
                <TimeField label="结束时间" optional value={s.end ?? ''} onChange={(v) => patch(s.id, { end: v })} />
              </div>
              <input aria-label="标题" placeholder="做什么" value={s.title} onChange={(e) => patch(s.id, { title: e.target.value })} className="field col-span-2 md:col-span-3" />
              <input aria-label="细节" placeholder="细节（可不填）" value={s.detail ?? ''} onChange={(e) => patch(s.id, { detail: e.target.value })} className="field col-span-2 md:col-span-3" />
              <button
                type="button"
                aria-pressed={!!s.must}
                disabled={full}
                title={full ? `必做已经有 ${MAX_MUST} 项，先把另一项改成可选` : undefined}
                onClick={() => patch(s.id, { must: !s.must })}
                className={`h-8 whitespace-nowrap rounded-full border px-2 text-xs transition-colors duration-fast ease-out active:opacity-60 disabled:opacity-40 md:col-span-1 ${
                  s.must ? 'border-accent text-text' : 'border-line text-faint hover:border-faint'
                }`}
              >
                {s.must ? '必做' : '可选'}
              </button>
              <div className="justify-self-end md:col-span-1">
                <Remove what={s.title || '这一条'} onConfirm={() => update((st) => { st.schedule[day] = st.schedule[day].filter((x) => x.id !== s.id); })} />
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-4">
        <Btn onClick={() => update((s) => { s.schedule[day].push({ id: uid(), time: '12:00', title: '' }); })}>添加一条</Btn>
      </div>
    </>
  );
}
