// Converts half-width punctuation that sits next to Chinese characters into full-width, in the given files.
// Full-width characters are written as escapes on purpose.
import { readFileSync, writeFileSync } from 'node:fs';
const C = '\\u4e00-\\u9fff';
const AFTER = `(?<=[${C}\\u300d\\u300f\\u300b\\u201d])`;
const FW = { ',': '，', ';': '；', ':': '：', '?': '？', '!': '！' };
let total = 0;
for (const file of process.argv.slice(2)) {
  const before = readFileSync(file, 'utf8');
  let s = before;
  s = s.replace(new RegExp(`(?<=[${C}])\\(([^()\\n]*?)\\)`, 'g'), '（$1）');
  s = s.replace(new RegExp(`${AFTER}[,;:?!](?!//)`, 'g'), (m) => FW[m]);
  s = s.replace(new RegExp(`(?<=[0-9A-Za-z%\\uff09])[,;](?=[${C}\\u300c\\u300e\\u300a\\u201c])`, 'g'), (m) => FW[m]);
  if (s !== before) {
    writeFileSync(file, s, 'utf8');
    let n = 0;
    for (let i = 0; i < s.length; i++) if (s[i] !== before[i]) n++;
    total += n;
    console.log(file.split(/[\\/]/).slice(-2).join('/'), n);
  }
}
console.log('changed chars:', total);
