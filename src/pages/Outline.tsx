import { useState } from 'react';
import { uid } from '../state/dates';
import type { Item } from '../state/types';
import { useStore } from '../state/useStore';
import { Btn, Editable, Empty, Label } from '../ui/primitives';
import { Remove } from '../ui/primitives';

/** Narrow at the top, full width at the base. */
const WIDTH = ['w-2/3 md:w-1/2', 'w-3/4 md:w-3/5', 'w-5/6 md:w-2/3', 'w-11/12 md:w-3/4', 'w-full md:w-5/6', 'w-full'];

function ItemList({ items, placeholder, empty, onChange }: { items: Item[]; placeholder: string; empty: string; onChange: (next: Item[]) => void }) {
  return (
    <>
      {items.length === 0 ? (
        <p className="text-sm text-faint">{empty}</p>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((it) => (
            <li key={it.id} className="group flex items-start gap-2 py-2">
              <div className="min-w-0 flex-1">
                <Editable value={it.text} placeholder={placeholder} multiline onSave={(v) => onChange(items.map((x) => (x.id === it.id ? { ...x, text: v } : x)))} />
              </div>
              <Remove what={it.text || '这一条'} onConfirm={() => onChange(items.filter((x) => x.id !== it.id))} />
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2">
        <Btn variant="quiet" className="-ml-4" onClick={() => onChange([...items, { id: uid(), text: '' }])}>+ 添加一条</Btn>
      </div>
    </>
  );
}

export function Outline() {
  const { state, update } = useStore();
  const [open, setOpen] = useState<string | null>(state.layers.at(-1)?.id ?? null);

  return (
    <>
      <header className="mb-16">
        <p className="text-sm text-muted">人生大纲 · 使命</p>
        <h1 className="sr-only">人生大纲</h1>
        <div className="mt-2 max-w-prose">
          <Editable
            value={state.profile.mission}
            placeholder="写下你的使命"
            multiline
            onSave={(v) => update((s) => { s.profile.mission = v; })}
            className="balance font-serif text-xl font-semibold tracking-tight md:text-2xl"
          />
        </div>
      </header>

      <section aria-label="马斯洛金字塔">
        <Label aside={<span className="text-sm text-faint">点一层，看我现在为它做的事</span>}>从塔底到塔尖</Label>
        {state.layers.length === 0 && <Empty>金字塔的数据是空的。到“备份”页可以恢复成种子数据。</Empty>}
        <ol className="space-y-2">
          {state.layers.map((layer, i) => {
            const isOpen = open === layer.id;
            return (
              <li key={layer.id} className={`mx-auto transition-all duration-slow ease-out ${isOpen ? 'w-full' : WIDTH[Math.min(i, WIDTH.length - 1)]}`}>
                <div className={`rounded-md border bg-surface transition-colors duration-base ease-out ${isOpen ? 'border-accent' : 'border-line hover:border-faint'}`}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : layer.id)}
                    className="flex w-full items-baseline justify-between gap-3 rounded-md px-4 py-3 text-left active:opacity-60 md:px-6"
                  >
                    <span className="font-medium">{layer.name}</span>
                    <span className="truncate text-sm text-muted">{isOpen ? layer.gloss : `${layer.items.length} 件事`}</span>
                  </button>
                  <div className="reveal" data-open={isOpen}>
                    <div>
                      <div className="border-t border-line px-4 py-3 md:px-6">
                        <ItemList
                          items={layer.items}
                          placeholder="我现在为这一层做的事"
                          empty="这一层还没有对应的事。现在没有也没关系，但要知道它空着。"
                          onChange={(next) => update((s) => { s.layers.find((l) => l.id === layer.id)!.items = next; })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="section grid gap-12 md:grid-cols-2">
        <section aria-label="信念">
          <Label>信念</Label>
          <ItemList items={state.profile.beliefs} placeholder="一条信念" empty="还没有写下信念。" onChange={(next) => update((s) => { s.profile.beliefs = next; })} />
        </section>
        <section aria-label="原则">
          <Label>我的原则</Label>
          <ItemList items={state.profile.principles} placeholder="一条原则" empty="还没有写下原则。" onChange={(next) => update((s) => { s.profile.principles = next; })} />
        </section>
      </div>
    </>
  );
}
