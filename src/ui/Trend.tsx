import { useState } from 'react';
import { change, rolling, yRange, type Point } from '../state/trend';
import { showDate } from './fields';

const W = 600;
const H = 160;
const PAD = 12;

/**
 * One measure over time. The line is the 7-day average; each day's reading is a small dot behind it.
 * Hover, or focus and use the arrow keys, to read any day. One measure per chart, one scale.
 */
export function Trend({ points, unit, label, minSpan }: { points: Point[]; unit: string; label: string; minSpan: number }) {
  const [at, setAt] = useState<number | null>(null);
  if (points.length < 2) return null;

  const average = rolling(points);
  const [lo, hi] = yRange(points.map((p) => p.value), minSpan);
  const x = (i: number) => PAD + (i * (W - PAD * 2)) / (points.length - 1);
  const y = (v: number) => H - PAD - ((v - lo) * (H - PAD * 2)) / (hi - lo);
  const path = average.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');
  const shown = at ?? points.length - 1;

  const move = (clientX: number, box: DOMRect) => {
    const ratio = Math.min(1, Math.max(0, (clientX - box.left) / box.width));
    setAt(Math.round(ratio * (points.length - 1)));
  };

  return (
    <figure>
      <figcaption className="flex items-end justify-between gap-3">
        <span className="text-sm text-muted">
          {at === null ? '7 天平均' : `${showDate(points[shown].date)} · 7 天平均`}
          <span className="block tabular-nums text-faint">
            当天 {points[shown].value} {unit}
          </span>
        </span>
        <span className="tabular-nums">
          <span className="font-serif text-xl font-semibold">{average[shown].value}</span>
          <span className="ml-1 text-sm text-muted">{unit}</span>
        </span>
      </figcaption>

      <div className="mt-3 flex gap-2">
        <div aria-hidden="true" className="flex flex-col justify-between py-2 text-right text-xs tabular-nums text-faint">
          <span>{hi}</span>
          <span>{lo}</span>
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          tabIndex={0}
          aria-label={`${label}趋势，${points.length} 次记录。7 天平均从 ${average[0].value} 到 ${average[average.length - 1].value} ${unit}。左右方向键逐次查看。`}
          className="block min-w-0 flex-1 rounded-sm text-accent"
          onMouseMove={(e) => move(e.clientX, e.currentTarget.getBoundingClientRect())}
          onMouseLeave={() => setAt(null)}
          onBlur={() => setAt(null)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') setAt(Math.max(0, shown - 1));
            else if (e.key === 'ArrowRight') setAt(Math.min(points.length - 1, shown + 1));
          }}
        >
          <line x1={PAD} x2={W - PAD} y1={PAD} y2={PAD} className="stroke-line" vectorEffect="non-scaling-stroke" />
          <line x1={PAD} x2={W - PAD} y1={H - PAD} y2={H - PAD} className="stroke-line" vectorEffect="non-scaling-stroke" />
          {at !== null && <line x1={x(shown)} x2={x(shown)} y1={PAD} y2={H - PAD} className="stroke-faint" vectorEffect="non-scaling-stroke" />}
          {points.map((p, i) => (
            <circle key={p.date} cx={x(i)} cy={y(p.value)} r={i === shown ? 4 : 2.5} className={i === shown ? 'fill-text' : 'fill-faint'} />
          ))}
          <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <circle cx={x(shown)} cy={y(average[shown].value)} r="5" fill="currentColor" className="stroke-bg" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>

      <div className="mt-2 flex justify-between gap-3 text-xs tabular-nums text-faint">
        <span>
          {showDate(points[0].date)} 起 · {points.length} 次
        </span>
        <span>
          平均比开始时 {change(average)} {unit}
        </span>
      </div>
    </figure>
  );
}
