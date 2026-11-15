import { useRef, useState } from 'react';
import { seed } from '../seed';
import { dateKey } from '../state/dates';
import { download, parseState, serialize } from '../state/store';
import type { State } from '../state/types';
import { useStore } from '../state/useStore';
import { Btn, Label, PageHead } from '../ui/primitives';

export function Backup() {
  const { state, replace } = useStore();
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<State | null>(null);
  const [resetArmed, setResetArmed] = useState(false);
  const [msg, setMsg] = useState('');
  const days = Object.keys(state.days).length;

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setBusy(true);
    setMsg('');
    try {
      setPending(parseState(await f.text()));
    } catch (err) {
      setPending(null);
      setMsg(`没有导入：${(err as Error).message}现有数据没有变。`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-prose">
      <PageHead kicker="备份" title="数据只在这台电脑的浏览器里。" sub="清空浏览器数据或换电脑之前，先导出一份。" />

      <section>
        <Label>导出</Label>
        <p className="text-muted">现在有 {days} 天的记录、{state.goals.length} 条目标。导出的是一个 JSON 文件，包含全部内容。</p>
        <div className="mt-4">
          <Btn variant="primary" onClick={() => { download(`管家备份-${dateKey(new Date())}.json`, serialize(state)); setMsg('已导出。把文件放到你找得到的地方。'); }}>
            导出备份
          </Btn>
        </div>
      </section>

      <section className="mt-8">
        <Label>导入</Label>
        <p className="text-muted">导入会用备份文件替换现在的全部内容。</p>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={pick} />
        <div className="mt-4">
          <Btn disabled={busy} onClick={() => file.current?.click()}>{busy ? '正在读取文件…' : '选择备份文件'}</Btn>
        </div>
        {pending && (
          <div className="enter mt-4 rounded-md border border-accent p-4">
            <p>备份里有 {Object.keys(pending.days).length} 天的记录、{pending.goals.length} 条目标。替换后，现在的内容无法找回。</p>
            <div className="mt-4 flex gap-3">
              <Btn variant="primary" onClick={() => { replace(pending); setPending(null); setMsg('已导入。'); }}>确认替换</Btn>
              <Btn onClick={() => setPending(null)}>取消</Btn>
            </div>
          </div>
        )}
      </section>

      <section className="section border-t border-line pt-8">
        <Label>会丢数据的操作 · 恢复成种子数据</Label>
        <p className="text-muted">把所有内容恢复成最初预填的样子。你的记录和改动都会消失，先导出再做。</p>
        <div className="mt-4 flex gap-3">
          {resetArmed ? (
            <>
              <Btn variant="primary" onClick={() => { replace(seed()); setResetArmed(false); setMsg('已恢复成种子数据。'); }}>确认恢复</Btn>
              <Btn onClick={() => setResetArmed(false)}>取消</Btn>
            </>
          ) : (
            <Btn onClick={() => setResetArmed(true)}>恢复成种子数据</Btn>
          )}
        </div>
      </section>

      <p role="status" className="mt-8 text-sm text-accent">{msg}</p>
    </div>
  );
}
