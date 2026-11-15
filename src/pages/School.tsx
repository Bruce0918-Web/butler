import { addDays, DAY_ZH, dateKey, dayOf, daysBetween, uid } from '../state/dates';
import { isSchoolDay } from '../state/today';
import type { Assignment } from '../state/types';
import { useStore } from '../state/useStore';
import { DateField, Pick, showDate } from '../ui/fields';
import { Btn, Check, Editable, Empty, Fold, Label, PageHead, Remove } from '../ui/primitives';

const KIND = [
  { value: 'homework', label: '作业' },
  { value: 'exam', label: '考试' },
];

function dueText(due: string | null, today: string): { text: string; urgent: boolean } {
  if (!due) return { text: '没定日期', urgent: false };
  const left = daysBetween(today, due);
  if (left < 0) return { text: `过期 ${-left} 天`, urgent: true };
  if (left === 0) return { text: '今天', urgent: true };
  if (left === 1) return { text: '明天', urgent: true };
  return { text: left <= 7 ? `${left} 天后` : showDate(due), urgent: false };
}

export function School() {
  const { state, update } = useStore();
  const today = dateKey(new Date());
  const open = state.assignments.filter((a) => !a.done).sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'));
  const done = state.assignments.filter((a) => a.done);
  const patch = (id: string, p: Partial<Assignment>) => update((s) => { Object.assign(s.assignments.find((a) => a.id === id)!, p); });
  const codes = Object.keys(state.school.classes);
  const days = Array.from({ length: 10 }, (_, i) => addDays(today, i));

  const row = (a: Assignment) => {
    const due = dueText(a.due, today);
    return (
      <li key={a.id} className="group grid grid-cols-12 items-start gap-x-3 gap-y-1 py-2">
        <div className="col-span-12 flex items-start gap-3 md:col-span-7">
          <Check checked={a.done} label={`完成：${a.subject} ${a.title}`} onChange={(v) => patch(a.id, { done: v })} />
          <div className={`flex min-w-0 flex-1 gap-3 pt-px transition-opacity duration-base ease-out ${a.done ? 'opacity-40' : ''}`}>
            <div className="w-16 shrink-0 font-medium">
              <Editable value={a.subject} placeholder="科目" onSave={(v) => patch(a.id, { subject: v })} />
            </div>
            <div className="min-w-0 flex-1 text-muted">
              <Editable value={a.title} placeholder="要交或要考什么" multiline onSave={(v) => patch(a.id, { title: v })} />
            </div>
          </div>
        </div>
        <div className="col-span-4 pl-12 pt-1 md:col-span-2 md:pl-0">
          <Pick quiet label="类型" value={a.kind} options={KIND} onChange={(v) => patch(a.id, { kind: v as Assignment['kind'] })} />
        </div>
        <div className={`col-span-5 pt-1 text-sm md:col-span-2 ${due.urgent && !a.done ? 'text-accent' : 'text-muted'}`}>
          <span className="mr-2">{a.due ? due.text : ''}</span>
          <span className="text-xs">
            <DateField label="截止日" value={a.due} onChange={(v) => patch(a.id, { due: v })} />
          </span>
        </div>
        <div className="col-span-3 justify-self-end md:col-span-1">
          <Remove what={`${a.subject} ${a.title}`.trim() || '这一条'} onConfirm={() => update((s) => { s.assignments = s.assignments.filter((x) => x.id !== a.id); })} />
        </div>
      </li>
    );
  };

  return (
    <>
      <PageHead kicker="课程与作业" title="晚上没有写作业的时间。" sub="没完成、离截止 7 天以内的作业和考试，会出现在今日页的管家便条里。">
        <div className="mt-3 max-w-prose text-muted">
          <Editable value={state.school.rule ?? ''} placeholder="作业能放进哪些时段？写一句话" multiline onSave={(v) => update((st) => { st.school.rule = v; })} />
        </div>
      </PageHead>

      <section aria-label="作业和考试">
        <Label aside={<span className="text-xs tabular-nums text-faint">{open.length} 项没完成</span>}>作业和考试</Label>
        {open.length === 0 ? (
          <Empty action={<Btn onClick={() => update((s) => { s.assignments.push({ id: uid(), subject: '', title: '', kind: 'homework', due: null, done: false }); })}>记下第一项</Btn>}>
            现在没有没完成的作业和考试。打开 Assignment Center，把下周要交、要考的都记在这里。
          </Empty>
        ) : (
          <>
            <ul className="divide-y divide-line border-y border-line">{open.map(row)}</ul>
            <div className="mt-2">
              <Btn variant="quiet" className="-ml-4" onClick={() => update((s) => { s.assignments.push({ id: uid(), subject: '', title: '', kind: 'homework', due: null, done: false }); })}>+ 作业或考试</Btn>
            </div>
          </>
        )}
        {done.length > 0 && (
          <div className="mt-8">
            <Fold summary={`已完成 ${done.length} 项`}>
              <ul className="divide-y divide-line border-y border-line">{done.map(row)}</ul>
            </Fold>
          </div>
        )}
      </section>

      <section aria-label="接下来十天" className="section">
        <Label aside={<span className="text-sm text-faint">点轮换日可以改</span>}>接下来十天</Label>
        <ol className="divide-y divide-line border-y border-line">
          {days.map((d) => {
            const code = state.school.days[d];
            const school = isSchoolDay(d, state.school);
            return (
              <li key={d} className={`grid grid-cols-12 items-baseline gap-3 py-2 ${school ? '' : 'text-faint'}`}>
                <span className="col-span-4 tabular-nums md:col-span-2">
                  {d === today ? '今天' : showDate(d)} <span className="text-sm text-muted">{DAY_ZH[dayOf(d)]}</span>
                </span>
                <span className="col-span-3 md:col-span-2">
                  <Pick
                    quiet
                    label={`${showDate(d)}是哪个轮换日`}
                    value={code ?? ''}
                    options={[{ value: '', label: school ? '上学（未定轮换）' : '周末' }, ...codes.map((c) => ({ value: c, label: `${c} 日` })), { value: 'noschool', label: '放假' }]}
                    onChange={(v) => update((s) => { if (v) s.school.days[d] = v; else delete s.school.days[d]; })}
                  />
                </span>
                <span className="col-span-12 text-sm text-muted md:col-span-8">{code && code !== 'noschool' ? state.school.classes[code] : ''}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-label="轮换课表" className="section">
        <Label aside={<span className="text-sm text-faint">3 天一轮，下午两节对调，6 天一个完整周期</span>}>轮换课表</Label>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th scope="col" className="py-2 pr-4 font-normal">时间</th>
                {codes.map((c) => (
                  <th key={c} scope="col" className="py-2 pr-4 font-medium text-text">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.school.periods.map((time, i) => (
                <tr key={i} className="border-b border-line">
                  <th scope="row" className="whitespace-nowrap py-2 pr-4 font-normal tabular-nums text-muted">
                    <Editable value={time} placeholder="时间" onSave={(v) => update((s) => { s.school.periods[i] = v; })} />
                  </th>
                  {codes.map((c) => {
                    const cells = state.school.classes[c].split(' · ');
                    return (
                      <td key={c} className="py-2 pr-4">
                        <Editable
                          value={cells[i] ?? ''}
                          placeholder="空"
                          onSave={(v) => update((s) => { const next = s.school.classes[c].split(' · '); next[i] = v || '空'; s.school.classes[c] = next.join(' · '); })}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-sm text-faint">
          <Editable value={state.school.note ?? ''} placeholder="每天固定的其他时间，例如午饭和课间" multiline onSave={(v) => update((st) => { st.school.note = v; })} />
        </div>
      </section>
    </>
  );
}
