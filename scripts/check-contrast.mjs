/**
 * Verifies every meaningful colour pairing in lib/theme.ts against WCAG 2.1.
 * Run with: node scripts/check-contrast.mjs
 */
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../lib/theme.ts', import.meta.url), 'utf8');
const C = {};
for (const [, k, v] of src.matchAll(/^\s{2}(\w+):\s*'(#[0-9A-Fa-f]{6})',/gm)) C[k] = v;

const lum = (h) => {
  const c = [0, 1, 2]
    .map((i) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

// [label, fg, bg, minimum]. 4.5 = AA body text, 3.0 = AA large text / UI component.
const CHECKS = [
  ['text on surface',            C.text,        C.surface,    4.5],
  ['text on background',         C.text,        C.background, 4.5],
  ['textMuted on surface',       C.textMuted,   C.surface,    4.5],
  ['textMuted on background',    C.textMuted,   C.background, 4.5],
  ['primaryText on primary',     C.primaryText, C.primary,    4.5],
  ['primaryText on primaryDark', C.primaryText, C.primaryDark,4.5],
  ['primary on surface',         C.primary,     C.surface,    4.5],
  ['primaryDark on primarySoft', C.primaryDark, C.primarySoft,4.5],
  ['primaryText on danger',      C.primaryText, C.danger,     4.5],
  ['danger on surface',          C.danger,      C.surface,    4.5],
  ['danger on dangerSoft',       C.danger,      C.dangerSoft, 4.5],
  ['low on lowBg',               C.low,         C.lowBg,      4.5],
  ['inRange on inRangeBg',       C.inRange,     C.inRangeBg,  4.5],
  ['high on highBg',             C.high,        C.highBg,     4.5],
  ['low on surface',             C.low,         C.surface,    4.5],
  ['inRange on surface',         C.inRange,     C.surface,    4.5],
  ['high on surface',            C.high,        C.surface,    4.5],
  ['inverseText on inverseSurface', C.inverseText, C.inverseSurface, 4.5],
  // Interactive borders are UI components, not text: 3:1 per WCAG 1.4.11.
  ['borderStrong on surface',    C.borderStrong, C.surface,   3.0],
  ['borderStrong on background', C.borderStrong, C.background,3.0],
];

let failed = 0;
for (const [label, fg, bg, min] of CHECKS) {
  if (!fg || !bg) {
    console.log(`?  ${label.padEnd(32)} missing token`);
    failed++;
    continue;
  }
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(`${ok ? '✓' : '✗'}  ${label.padEnd(32)} ${r.toFixed(2).padStart(6)}  (needs ${min})`);
}

console.log(`\n${CHECKS.length - failed}/${CHECKS.length} pairings pass.`);
process.exit(failed === 0 ? 0 : 1);
