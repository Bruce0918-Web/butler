import { Component, useEffect, useState, type ReactNode } from 'react';
import { seed } from './seed';
import { dateKey } from './state/dates';
import { download } from './state/store';
import { DAYS } from './state/types';
import { useStore } from './state/useStore';
import { Btn } from './ui/primitives';
import { Backup } from './pages/Backup';
import { Goals } from './pages/Goals';
import { Learning } from './pages/Learning';
import { Outline } from './pages/Outline';
import { Review } from './pages/Review';
import { Projects } from './pages/Projects';
import { School } from './pages/School';
import { Today } from './pages/Today';
import { Training } from './pages/Training';

/** To add a section: write a page component and give its entry here a `page`. Entries without one are listed as "later". */
const SECTIONS: { path: string; label: string; wide?: boolean; page?: (sub: string) => ReactNode }[] = [
  { path: 'today', label: '今日', page: () => <Today /> },
  { path: 'school', label: '课程与作业', page: () => <School /> },
  { path: 'training', label: '训练', page: () => <Training /> },
  { path: 'learning', label: '学习', page: (sub) => <Learning sub={sub} /> },
  { path: 'projects', label: '项目', page: () => <Projects /> },
  { path: 'goals', label: '目标', wide: true, page: (sub) => <Goals sub={sub} /> },
  { path: 'outline', label: '人生大纲', page: () => <Outline /> },
  { path: 'review', label: '复盘', page: () => <Review /> },
  { path: 'backup', label: '备份', page: () => <Backup /> },
];

function useRoute(): [string, string] {
  const read = () => location.hash.replace(/^#\/?/, '').split('/');
  const [parts, setParts] = useState(read);
  useEffect(() => {
    const on = () => {
      setParts(read());
      scrollTo(0, 0);
    };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  const section = SECTIONS.find((s) => s.path === parts[0] && s.page) ? parts[0] : 'today';
  return [section, parts[1] ?? ''];
}

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="enter max-w-prose">
        <h1 className="font-serif text-xl font-semibold">这一页出错了</h1>
        <p className="mt-3 text-muted">你的数据没有丢。先到“备份”页导出一份，再刷新页面；如果还是这样，把这一页的名字告诉 Claude。</p>
        <div className="mt-8 flex gap-3">
          <Btn variant="primary" onClick={() => location.reload()}>刷新页面</Btn>
          <Btn onClick={() => { location.hash = '#/backup'; this.setState({ failed: false }); }}>去备份页</Btn>
        </div>
      </div>
    );
  }
}

function Unreadable() {
  const { bootError, clearBootError, replace } = useStore();
  if (!bootError) return null;
  return (
    <div className="enter mx-auto max-w-prose px-4 py-24">
      <h1 className="font-serif text-xl font-semibold md:text-2xl">存下来的数据读不出来</h1>
      <p className="mt-3 text-muted">{bootError.message}原来的数据还在浏览器里，没有被覆盖。先把它导出来，再决定怎么办。</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Btn variant="primary" onClick={() => download(`管家-读不出的数据-${dateKey(new Date())}.json`, bootError.raw)}>导出原始数据</Btn>
        <Btn onClick={() => { replace(seed()); clearBootError(); }}>用种子数据重新开始</Btn>
      </div>
    </div>
  );
}

export function App() {
  const [section, sub] = useRoute();
  const { state, saveFailed, bootError } = useStore();
  /** A fresh install of the published app has nothing in it until a backup is imported. */
  const isEmpty = !state.profile.mission && state.goals.length === 0 && DAYS.every((d) => state.schedule[d].length === 0);
  if (bootError) return <Unreadable />;
  const current = SECTIONS.find((s) => s.path === section)!;
  const built = SECTIONS.filter((s) => s.page);
  const later = SECTIONS.filter((s) => !s.page);

  return (
    <div className="min-h-screen lg:pl-nav">
      <nav aria-label="板块" className="flex items-center gap-4 overflow-x-auto border-b border-line px-4 lg:fixed lg:inset-y-0 lg:left-0 lg:w-nav lg:flex-col lg:items-stretch lg:gap-0 lg:overflow-visible lg:border-b-0 lg:border-r lg:px-0 lg:py-8">
        <p className="hidden px-6 pb-8 font-serif text-lg font-semibold tracking-tight lg:block">管家</p>
        {built.map((s) => (
          <a
            key={s.path}
            href={`#/${s.path}`}
            aria-current={s.path === section ? 'page' : undefined}
            className={`shrink-0 border-b py-3 text-sm transition-colors duration-fast ease-out active:opacity-60 lg:border-b-0 lg:border-l lg:px-6 lg:py-2 ${
              s.path === section ? 'border-accent text-text' : 'border-transparent text-muted hover:text-text'
            } ${s.path === 'backup' ? `lg:order-last ${later.length ? '' : 'lg:mt-auto'}` : ''}`}
          >
            {s.label}
          </a>
        ))}
        {later.length > 0 && (
          <p className="mt-auto hidden px-6 pb-4 text-xs text-faint lg:block">
            之后：{later.map((s, i) => (
              <span key={s.path} className="whitespace-nowrap">
                {s.label}
                {i < later.length - 1 && '、'}
              </span>
            ))}
          </p>
        )}
      </nav>

      <main className={`mx-auto px-4 py-8 md:px-8 md:py-16 ${current.wide ? 'max-w-wide' : 'max-w-page'}`}>
        {saveFailed && (
          <p role="alert" className="mb-8 rounded-md border border-accent px-4 py-3 text-sm">
            浏览器没能保存刚才的改动。先到“备份”页导出一份，再检查是不是开了无痕模式或磁盘已满。
          </p>
        )}
        {isEmpty && section !== 'backup' && (
          <div className="card mb-8 max-w-prose">
            <p className="font-medium">这里现在是空的。</p>
            <p className="mt-1 text-sm text-muted">你的内容不在这个程序里。到“备份”页导入你的备份文件，日程、目标和记录就都回来了；也可以从空白开始自己填。</p>
            <div className="mt-4">
              <a href="#/backup" className="inline-flex h-8 items-center rounded-full bg-accent px-4 text-sm font-medium text-accent-ink transition duration-fast ease-out hover:opacity-80 active:opacity-60">
                去导入备份
              </a>
            </div>
          </div>
        )}
        <Boundary key={section}>
          <div key={section + sub} className="enter">
            {current.page!(sub)}
          </div>
        </Boundary>
      </main>
    </div>
  );
}
