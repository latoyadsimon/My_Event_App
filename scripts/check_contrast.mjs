// =====================================================================
// Contrast check for every app mode (tokens.css) and every event theme (themes.js).
//   npm run check:contrast
// Fails (exit 1) if any pair is below WCAG 2.1 AA, so CI blocks unreadable colors.
//   4.5:1 = normal text      3:1 = large text, form borders, focus rings, UI parts
// Plain Node: no packages needed.
// =====================================================================
import { readFileSync } from 'node:fs';
import { THEMES } from '../src/styles/themes.js';
import { contrast } from '../src/styles/contrast.js';

// --- App modes: read the "/* @mode name */ selector { --x: #hex; }" blocks in tokens.css ---
const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const blocks = {};
for (const m of css.matchAll(/\/\* @mode (\S+) \*\/\s*[^{]+\{([^}]*)\}/g)) {
  blocks[m[1]] = Object.fromEntries([...m[2].matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})/g)].map((v) => [v[1], v[2]]));
}
// Each mode inherits from the ones it sits on top of (same as the CSS cascade).
const modes = {
  calm: blocks.calm,
  bold: { ...blocks.calm, ...blocks.bold },
  'respectful (calm)': { ...blocks.calm, ...blocks.respectful },
  'respectful (bold)': { ...blocks.calm, ...blocks.bold, ...blocks['respectful-bold'] },
};

const checks = [];   // [where, what, fg, bg, minimum]
const add = (where, what, fg, bg, min) => checks.push({ where, what, fg, bg, min });

for (const [name, v] of Object.entries(modes)) {
  for (const surface of ['color-bg', 'color-surface', 'color-surface-2']) {
    add(name, `text on ${surface}`, v['color-text'], v[surface], 4.5);
    add(name, `muted on ${surface}`, v['color-muted'], v[surface], 4.5);
  }
  add(name, 'on-accent on accent', v['color-on-accent'], v['color-accent'], 4.5);
  add(name, 'secondary (links) on surface', v['color-secondary'], v['color-surface'], 4.5);
  add(name, 'gold-ink on surface', v['color-gold-ink'], v['color-surface'], 4.5);
  add(name, 'accent on bg (large text, UI)', v['color-accent'], v['color-bg'], 3);
  add(name, 'input border on surface', v['color-input-border'], v['color-surface'], 3);
  add(name, 'focus ring on bg', v['color-focus'], v['color-bg'], 3);
  add(name, 'focus ring on surface', v['color-focus'], v['color-surface'], 3);
  for (const s of ['success', 'warning', 'danger', 'info', 'neutral']) {
    if (v[`status-${s}-ink`]) add(name, `${s} chip`, v[`status-${s}-ink`], v[`status-${s}-bg`], 4.5);
  }
}

for (const theme of THEMES) {
  const k = theme.colors;
  add(theme.id, 'text on bg', k.text, k.bg, 4.5);
  add(theme.id, 'text on surface', k.text, k.surface, 4.5);
  add(theme.id, 'muted on bg', k.muted, k.bg, 4.5);
  add(theme.id, 'muted on surface', k.muted, k.surface, 4.5);
  add(theme.id, 'onAccent on accent', k.onAccent, k.accent, 4.5);
  add(theme.id, 'accent on surface (large text, UI)', k.accent, k.surface, 3);
  add(theme.id, 'accent on bg (large text, UI)', k.accent, k.bg, 3);
  add(theme.id, 'secondary on surface (UI)', k.secondary, k.surface, 3);
  add(theme.id, 'border on surface (form fields)', k.border, k.surface, 3);
}

// --- Report ---
let failures = 0;
const rows = checks.map((ch) => {
  const ratio = contrast(ch.fg, ch.bg);
  const ok = ratio >= ch.min;
  if (!ok) failures++;
  return { ok, line: `${ok ? 'PASS' : 'FAIL'}  ${ratio.toFixed(2).padStart(5)}:1 (min ${ch.min})  ${ch.where.padEnd(22)} ${ch.what}  ${ch.fg} on ${ch.bg}` };
});
const verbose = process.argv.includes('--all');
for (const r of rows) if (verbose || !r.ok) console.log(r.line);
const lowest = Math.min(...checks.map((ch) => contrast(ch.fg, ch.bg) / ch.min));
console.log(`\n${checks.length} color pairs checked across ${Object.keys(modes).length} app modes and ${THEMES.length} event themes: ` +
  `${checks.length - failures} pass, ${failures} fail. Tightest margin: ${lowest.toFixed(2)}× the minimum.` +
  (verbose ? '' : ' (Use --all to list every pair.)'));
process.exit(failures ? 1 : 0);
