// Fails the build when source code uses a value that is not in the design system (see DESIGN.md).
// Design values may only be written in tailwind.config.ts.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('../src/', import.meta.url);
const rules = [
  [/[a-z]-\[[^\]]+\]/, 'Tailwind 任意值(方括号)'],
  [/#[0-9a-fA-F]{3,8}\b/, '直接写的颜色值'],
  [/\bstyle=\{/, '内联样式'],
  [/\b\d+(\.\d+)?(px|rem|em|ms)\b/, '直接写的尺寸或时长'],
  [/\brgba?\(/, '直接写的颜色值'],
  [/[一-鿿][,;:?!]/, '汉字后面的半角标点(运行 node tools/punct.mjs 修正)'],
];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return /\.(tsx?|css)$/.test(name) ? [path] : [];
  });
}

const base = decodeURIComponent(root.pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const problems = [];
for (const file of walk(base)) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      for (const [re, what] of rules) if (re.test(line)) problems.push(`${relative(base, file)}:${i + 1}  ${what}:${line.trim().slice(0, 90)}`);
    });
}
if (problems.length) {
  console.error(`设计规范检查:${problems.length} 处使用了规范之外的值。\n` + problems.join('\n'));
  process.exit(1);
}
console.log('设计规范检查通过:代码里没有规范之外的值。');
