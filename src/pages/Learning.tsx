import { useState } from 'react';
import { dateKey, uid } from '../state/dates';
import type { ProtocolCard, SystemCard, Track } from '../state/types';
import { useStore } from '../state/useStore';
import { Pick, showDate } from '../ui/fields';
import { Btn, Check, Editable, Empty, Fold, Label, Remove } from '../ui/primitives';

function SubNav({ sub }: { sub: string }) {
  const tabs = [
    { href: '#/learning', label: '路径和阅读', on: sub !== 'protocols' },
    { href: '#/learning/protocols', label: 'Protocols 卡片', on: sub === 'protocols' },
  ];
  return (
    <nav aria-label="学习的子页" className="mt-6 flex gap-2">
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

export function Learning({ sub }: { sub: string }) {
  return sub === 'protocols' ? <Protocols /> : <Paths />;
}

function TrackCard({ track }: { track: Track }) {
  const { update } = useStore();
  const edit = (fn: (t: Track) => void) => update((s) => { fn(s.learning.tracks.find((t) => t.id === track.id)!); });
  const done = track.steps.filter((s) => s.done).length;
  const next = track.steps.find((s) => !s.done);
  const [noting, setNoting] = useState(false);

  return (
    <section aria-label={track.name} className="border-t border-accent pt-4">
      <div className="group flex items-baseline justify-between gap-3">
        <h2 className="min-w-0 flex-1">
          <Editable value={track.name} placeholder="这条路径叫什么" onSave={(v) => edit((t) => { t.name = v; })} className="font-serif text-lg font-semibold" />
        </h2>
        <Remove what={track.name || '这条路径'} onConfirm={() => update((s) => { s.learning.tracks = s.learning.tracks.filter((t) => t.id !== track.id); })} />
        <span className="shrink-0 text-xs tabular-nums text-faint">{done} / {track.steps.length}</span>
      </div>
      {(track.note || noting) && (
        <div className="mt-1 text-sm text-muted">
          <Editable value={track.note} placeholder="这条路径的规矩或说明" multiline onSave={(v) => edit((t) => { t.note = v; })} />
        </div>
      )}
      {track.steps.length === 0 ? (
        <p className="mt-3 text-sm text-faint">还没有写步骤。写下接下来要学会的第一件具体的事。</p>
      ) : (
        <ul className="mt-3">
          {track.steps.map((step) => (
            <li key={step.id} className="group flex items-start gap-2 py-1">
              <Check checked={step.done} label={`学会了：${step.text}`} onChange={(v) => edit((t) => { t.steps.find((x) => x.id === step.id)!.done = v; })} />
              <div className={`min-w-0 flex-1 pt-px transition-opacity duration-base ease-out ${step.done ? 'opacity-40' : ''}`}>
                <Editable value={step.text} placeholder="要学会的一件事" multiline onSave={(v) => edit((t) => { t.steps.find((x) => x.id === step.id)!.text = v; })} className={step.id === next?.id ? 'font-medium' : ''} />
              </div>
              <Remove what={step.text || '这一步'} onConfirm={() => edit((t) => { t.steps = t.steps.filter((x) => x.id !== step.id); })} />
            </li>
          ))}
        </ul>
      )}
      <div className="flex">
        <Btn variant="quiet" className="-ml-4" onClick={() => edit((t) => { t.steps.push({ id: uid(), text: '', done: false }); })}>+ 一步</Btn>
        {!track.note && !noting && <Btn variant="quiet" onClick={() => setNoting(true)}>+ 说明</Btn>}
      </div>
    </section>
  );
}

function Paths() {
  const { state, update } = useStore();
  const today = dateKey(new Date());
  const r = state.reading;
  const [line, setLine] = useState('');
  const todays = r.lines.find((l) => l.date === today);
  const lines = [...r.lines].sort((a, b) => b.date.localeCompare(a.date));

  const saveLine = () => {
    if (!line.trim()) return;
    update((s) => {
      const existing = s.reading.lines.find((l) => l.date === today);
      if (existing) existing.text = line.trim();
      else s.reading.lines.push({ date: today, text: line.trim() });
    });
    setLine('');
  };

  return (
    <>
      <header className="mb-16">
        <p className="text-sm text-muted">学习</p>
        <h1 className="mt-2 font-serif text-xl font-semibold tracking-tight md:text-2xl">每条路径，只看下一步。</h1>
        <SubNav sub="" />
      </header>

      {state.learning.tracks.length === 0 && <Empty>还没有学习路径。一条路径是一样要学会的本事，比如“编程”。</Empty>}
      <div className="grid gap-x-8 gap-y-12 md:grid-cols-2">
        {state.learning.tracks.map((t) => (
          <TrackCard key={t.id} track={t} />
        ))}
      </div>
      <div className="mt-8">
        <Btn variant="quiet" className="-ml-4" onClick={() => update((s) => { s.learning.tracks.push({ id: uid(), name: '', note: '', steps: [] }); })}>+ 一条路径</Btn>
      </div>

      <section aria-label="阅读" className="section max-w-prose">
        <Label aside={<span className="text-xs tabular-nums text-faint">已读完 {r.finished.length} 本</span>}>阅读 · 在读</Label>
        {r.current.title ? (
          <>
            <Editable value={r.current.title} placeholder="书名" onSave={(v) => update((s) => { s.reading.current.title = v; })} className="font-serif text-lg font-semibold" />
            <div className="text-sm text-muted">
              <Editable value={r.current.author} placeholder="作者" onSave={(v) => update((s) => { s.reading.current.author = v; })} />
            </div>
            <div className="mt-3 flex items-baseline gap-3 text-sm">
              <span className="shrink-0 text-faint">每天最少</span>
              <span className="min-w-0 flex-1">
                <Editable value={r.current.daily} placeholder="每天最少读多少" onSave={(v) => update((s) => { s.reading.current.daily = v; })} />
              </span>
            </div>

            <form
              className="mt-6 flex gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                saveLine();
              }}
            >
              <input value={line} onChange={(e) => setLine(e.target.value)} aria-label="今天的一句话精华" placeholder={todays ? `今天已写：${todays.text}` : '今天读的这几页，一句话是什么？'} className="field min-w-0 flex-1 py-2 text-base" />
              <Btn type="submit" disabled={!line.trim()}>{todays ? '改写' : '记下'}</Btn>
            </form>

            {lines.length === 0 ? (
              <p className="mt-4 text-sm text-faint">还没有一句话精华。它们攒起来就是读书视频的大纲。</p>
            ) : (
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {lines.slice(0, 7).map((l) => (
                  <li key={l.date} className="group flex items-baseline gap-3 py-2">
                    <span className="w-24 shrink-0 text-sm tabular-nums text-faint">{showDate(l.date)}</span>
                    <div className="min-w-0 flex-1">
                      <Editable value={l.text} placeholder="一句话" multiline onSave={(v) => update((s) => { s.reading.lines.find((x) => x.date === l.date)!.text = v; })} />
                    </div>
                    <Remove what={`${showDate(l.date)}的一句话`} onConfirm={() => update((s) => { s.reading.lines = s.reading.lines.filter((x) => x.date !== l.date); })} />
                  </li>
                ))}
              </ul>
            )}
            {lines.length > 7 && (
              <div className="mt-3">
                <Fold summary={`更早的 ${lines.length - 7} 句`}>
                  <ul className="divide-y divide-line border-y border-line">
                    {lines.slice(7).map((l) => (
                      <li key={l.date} className="flex items-baseline gap-3 py-2">
                        <span className="w-24 shrink-0 text-sm tabular-nums text-faint">{showDate(l.date)}</span>
                        <span className="min-w-0 flex-1 text-muted">{l.text}</span>
                      </li>
                    ))}
                  </ul>
                </Fold>
              </div>
            )}

            <div className="mt-6">
              <Btn
                onClick={() => update((s) => {
                  s.reading.finished.unshift({ id: uid(), title: s.reading.current.title, author: s.reading.current.author, finishedAt: today });
                  s.reading.current = { title: '', author: '', daily: s.reading.current.daily };
                })}
              >
                这本读完了
              </Btn>
            </div>
          </>
        ) : (
          <Empty action={<Btn onClick={() => update((s) => { s.reading.current.title = '下一本书'; })}>填上下一本</Btn>}>现在没有在读的书。</Empty>
        )}

        {r.finished.length > 0 && (
          <div className="mt-12">
            <Label>已读</Label>
            <ul className="divide-y divide-line border-y border-line">
              {r.finished.map((b) => (
                <li key={b.id} className="group flex items-baseline gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <Editable value={b.title} placeholder="书名" onSave={(v) => update((s) => { s.reading.finished.find((x) => x.id === b.id)!.title = v; })} />
                    <span className="text-sm text-faint">{b.author}</span>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-faint">{b.finishedAt ? `${showDate(b.finishedAt)}读完` : ''}</span>
                  <Remove what={b.title} onConfirm={() => update((s) => { s.reading.finished = s.reading.finished.filter((x) => x.id !== b.id); })} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </>
  );
}

const CHAIN: { key: keyof ProtocolCard['chain']; label: string; hint: string }[] = [
  { key: 'act', label: '行为', hint: '我做了什么' },
  { key: 'trigger', label: '触发', hint: '哪个感受器或信号收到了' },
  { key: 'change', label: '改变', hint: '哪个激素或系统变了' },
  { key: 'result', label: '结果', hint: '最后身体得到什么' },
];
const EVIDENCE = [
  { value: '', label: '还没判断' },
  { value: 'strong', label: '强' },
  { value: 'medium', label: '中' },
  { value: 'weak', label: '弱' },
  { value: 'unsure', label: '不确定' },
];

const chainFilled = (c: ProtocolCard) => CHAIN.every((x) => c.chain[x.key].trim());

function Card({ card, systems }: { card: ProtocolCard; systems: SystemCard[] }) {
  const { update } = useStore();
  const [open, setOpen] = useState(false);
  const edit = (fn: (c: ProtocolCard) => void) => update((s) => { fn(s.learning.protocols.find((c) => c.id === card.id)!); });
  const ready = chainFilled(card) && card.page.trim() !== '' && card.systems.length > 0;

  return (
    <li className="border-t border-line">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-baseline gap-3 rounded-sm py-3 text-left transition-colors duration-fast ease-out hover:text-accent active:opacity-60">
        <span className="min-w-0 flex-1">
          <span className="font-medium">{card.zh}</span>
          <span className="ml-2 text-sm text-faint">{card.en}</span>
        </span>
        <span className={`shrink-0 text-xs ${card.checked ? 'text-accent' : 'text-faint'}`}>{card.checked ? '已核对' : chainFilled(card) ? '待核对' : '机制未写'}</span>
        <span aria-hidden="true" className="w-3 shrink-0 text-center text-muted">{open ? '−' : '+'}</span>
      </button>
      <div className="reveal" data-open={open}>
        <div>
          <div className="pb-6">
            <p className="pretty text-muted">{card.how}</p>

            <ol className="mt-4 grid gap-px overflow-hidden rounded-md border border-line bg-line md:grid-cols-4">
              {CHAIN.map((c) => (
                <li key={c.key} className="bg-bg p-3">
                  <p className="text-xs text-faint">{c.label}</p>
                  <div className="mt-1 text-sm">
                    <Editable value={card.chain[c.key]} placeholder={c.hint} multiline onSave={(v) => edit((x) => { x.chain[c.key] = v; if (!chainFilled(x)) x.checked = false; })} />
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-xs text-faint">作用在哪些系统上</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {systems.map((s) => {
                    const on = card.systems.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => edit((x) => { x.systems = on ? x.systems.filter((id) => id !== s.id) : [...x.systems, s.id]; })}
                        className={`rounded-full border px-3 py-1 text-xs transition-colors duration-fast ease-out active:opacity-60 ${on ? 'border-accent text-text' : 'border-line text-muted hover:border-faint'}`}
                      >
                        {s.zh}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
                <span className="flex items-baseline gap-2">
                  <span className="text-xs text-faint">证据</span>
                  <Pick quiet label="证据强度" value={card.evidence} options={EVIDENCE} onChange={(v) => edit((x) => { x.evidence = v; })} />
                </span>
                <span className="flex items-baseline gap-2">
                  <span className="text-xs text-faint">书中页码</span>
                  <Editable value={card.page} placeholder="页码" onSave={(v) => edit((x) => { x.page = v; if (!v) x.checked = false; })} className="tabular-nums" />
                </span>
              </div>
              <div>
                <p className="text-xs text-faint">我的看法，包括适不适合现在的我</p>
                <div className="mt-1">
                  <Editable value={card.view} placeholder="同意还是不同意，为什么" multiline onSave={(v) => edit((x) => { x.view = v; })} />
                </div>
              </div>
              <label className={`flex items-center gap-2 ${ready ? '' : 'text-faint'}`}>
                <Check checked={card.checked} label={`已对照书核对：${card.zh}`} onChange={(v) => ready && edit((x) => { x.checked = v; })} />
                {ready ? '我已经翻开书核对过这四格' : '四格都写完、选了系统、填了页码，才能标成已核对'}
              </label>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

function Protocols() {
  const { state, update } = useStore();
  const { parts, protocols, systems } = state.learning;
  const checked = protocols.filter((c) => c.checked).length;

  return (
    <>
      <header className="mb-16">
        <p className="text-sm text-muted">学习 · Protocols</p>
        <h1 className="mt-2 font-serif text-xl font-semibold tracking-tight md:text-2xl">每条做法，都要讲得出为什么。</h1>
        <p className="mt-3 max-w-prose text-muted">
          机制由你自己写，这里不预填。写完四格、翻书核对过，才算数。现在 {protocols.length} 张里核对了 {checked} 张。
        </p>
        <SubNav sub="protocols" />
      </header>

      <section aria-label="底层系统" className="max-w-prose">
        <Label aside={<span className="text-sm text-faint">先写这七张</span>}>底层系统</Label>
        <ul className="border-b border-line">
          {systems.map((s) => {
            const edit = (fn: (x: SystemCard) => void) => update((st) => { fn(st.learning.systems.find((x) => x.id === s.id)!); });
            const filled = [s.senses, s.outputs, s.timescale].filter((v) => v.trim()).length;
            return (
              <li key={s.id} className="border-t border-line py-3">
                <Fold summary={`${s.zh} · ${filled} / 3`}>
                  <p className="text-sm text-faint">{s.en}</p>
                  <dl className="mt-3 space-y-3 text-sm">
                    {(
                      [
                        ['senses', '它感受什么'],
                        ['outputs', '它输出什么'],
                        ['timescale', '多久起效'],
                      ] as const
                    ).map(([key, label]) => (
                      <div key={key}>
                        <dt className="text-xs text-faint">{label}</dt>
                        <dd className="mt-1">
                          <Editable value={s[key]} placeholder="用自己的话写" multiline onSave={(v) => edit((x) => { x[key] = v; })} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Fold>
              </li>
            );
          })}
        </ul>
      </section>

      {parts.map((part) => {
        const cards = protocols.filter((c) => c.part === part.id);
        return (
          <section key={part.id} aria-label={part.zh} className="section max-w-prose">
            <Label
              aside={
                <label className="flex items-center gap-2 text-sm text-muted">
                  这部分读完了
                  <Check checked={part.read} label={`读完了：${part.zh}`} onChange={(v) => update((s) => { s.learning.parts.find((p) => p.id === part.id)!.read = v; })} />
                </label>
              }
            >
              第 {part.id} 部分 · {part.zh} · {cards.filter((c) => c.checked).length} / {cards.length}
            </Label>
            {!part.read && <p className="mb-3 text-sm text-faint">还没读到这部分，先照做。读完后勾上右边，再回来写机制。</p>}
            <ul className="border-b border-line">
              {cards.map((c) => (
                <Card key={c.id} card={c} systems={systems} />
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
