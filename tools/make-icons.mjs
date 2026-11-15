// Draws the app icon and saves it at the sizes phones ask for. Usage: node tools/make-icons.mjs
import { chromium } from 'playwright-core';

const BG = '#100f0d';
const BRASS = '#c4a46c';
/** `inset` shrinks the mark for the "maskable" icon, whose edges the phone may crop. */
const svg = (inset) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="${BG}"/>
  <g transform="translate(256 256) scale(${inset}) translate(-256 -256)">
    <circle cx="256" cy="256" r="150" fill="none" stroke="${BRASS}" stroke-width="14"/>
    <path d="M256 150v106l70 44" fill="none" stroke="${BRASS}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

const out = (name) => decodeURIComponent(new URL(`../public/${name}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const browser = await chromium.launch({ channel: 'msedge' });
for (const [name, size, inset] of [['icon-512.png', 512, 1], ['icon-192.png', 192, 1], ['apple-touch-icon.png', 180, 0.86], ['icon-maskable.png', 512, 0.72]]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<body style="margin:0">${svg(inset).replace('width="512" height="512"', `width="${size}" height="${size}"`)}</body>`);
  await page.screenshot({ path: out(name) });
  await page.close();
  console.log(name);
}
await browser.close();
