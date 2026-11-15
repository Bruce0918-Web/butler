import { dayOf, daysBetween, longDate } from './dates';
import { canActivate } from './projects';
import { mondayOf, run, tests } from './review';
import { needsReview } from './today';
import type { State } from './types';

interface Deadline {
  title: string;
  due: string;
}

function openDeadlines(state: State): Deadline[] {
  return [
    ...state.goals.filter((g) => g.due && !g.done).map((g) => ({ title: g.title, due: g.due! })),
    ...state.projects.filter((p) => p.active && p.due && !p.delivered).map((p) => ({ title: p.name, due: p.due! })),
    ...state.assignments
      .filter((a) => a.due && !a.done)
      .map((a) => ({ title: `${a.subject}${a.kind === 'exam' ? '考试' : '作业'}${a.title ? ' · ' + a.title : ''}`, due: a.due! })),
  ].sort((a, b) => a.due.localeCompare(b.due));
}

/**
 * The daily briefing: plain rules over the data, most urgent first. No AI.
 * Returns an empty list when there is nothing to say.
 */
export function briefing(state: State, today: string, hm = '00:00'): string[] {
  const lines: string[] = [];
  const deadlines = openDeadlines(state);

  if (needsReview(state, today)) lines.push('昨天的三件要事还没回顾。先做这个，一分钟。');

  for (const d of deadlines) {
    const late = daysBetween(d.due, today);
    if (late > 0) lines.push(`「${d.title}」已经过期 ${late} 天，还没交付。今天交，或者改日期并写下原因。`);
  }

  const active = state.projects.filter((p) => p.active);
  const mains = active.filter((p) => p.role === 'main').length;
  const sides = active.filter((p) => p.role === 'side').length;
  if (mains > 1 || sides > 1 || active.length > mains + sides)
    lines.push(`进行中的项目有 ${active.length} 个：${active.map((p) => p.name).join('、')}。规则是一主一副，停掉一个。`);

  for (const d of deadlines) {
    const left = daysBetween(today, d.due);
    if (left === 0) lines.push(`「${d.title}」今天截止。`);
    else if (left === 1) lines.push(`「${d.title}」明天截止。`);
    else if (left > 1 && left <= 7) lines.push(`「${d.title}」还有 ${left} 天截止（${longDate(d.due)}）。`);
  }

  const lateNights = run(state, today, tests.slept, false);
  if (lateNights >= 2) lines.push(`已经连续 ${lateNights} 天没在 20:30 前睡着。今晚 19:30 关电子产品这一条不能再让。`);

  const noPawn = run(state, today, tests.pawn, false);
  if (noPawn >= 2) lines.push(`兵卒任务写了没做，已经连续 ${noPawn} 天。今天先做它，再做别的。`);

  const noReading = run(state, today, tests.reading(state), false);
  if (noReading >= 2) lines.push(`阅读断了 ${noReading} 天。今天读 15 页，写一句话。`);

  const ready = state.parking.filter((i) => canActivate(i.addedAt, today));
  if (ready.length) lines.push(`停车场里「${ready[0].text}」${ready.length > 1 ? `等 ${ready.length} 个想法` : ''}已经等满 14 天。决定替换谁，或者删掉它。`);

  if (dayOf(today) === 'sun' && !state.weeks[mondayOf(today)]) lines.push('今天是周日，本周复盘还没写。');

  const log = state.days[today];
  const noThree = !log || !log.three.some((t) => t.text.trim());
  // After nine in the morning an empty top three is the first thing to say, ahead of everything else.
  if (noThree && hm >= '09:00') return ['已经过了 9 点，今天的三件要事还没填。先填这个。', ...lines];
  if (noThree) lines.push('今天的三件要事还没定。');

  return lines;
}
