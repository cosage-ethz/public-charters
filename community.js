// The sample round for the public site: 140 made-up participants, so the pages can show results
// before enough real answers have come in. Every number here is invented, generated
// deterministically from the sample charter data (sample-data.js). Your own input in this
// browser (key 'pc-public-v2') is added on top. With a database connected, the same shapes are
// later filled from the judgement and profile tables instead.
// Text comes from lang/*.js through T() (i18n.js).
var PC_READINGS = typeof GROUPS !== 'undefined' ? GROUPS : {};
(function () {
'use strict';
const B = window.Bridge;
const KEY = 'pc-public-v2';

// ---------- optional profile questions ----------
// Stored as language-independent keys; labels are in lang/*.js under demo.<id>.o.<key>.
// Used only for breakdowns, never to decide whether a change is endorsed.
const DEMOGRAPHICS = [
  { id: 'age', options: ['u25', 'a25', 'a45', 'a65'] },
  { id: 'lang', options: ['de', 'fr', 'it', 'rm', 'en', 'other'] },
  { id: 'ai', options: ['daily', 'weekly', 'rarely', 'never'] }
];
const qLabel = q => T(`demo.${q.id}.q`);
const oLabel = (q, o) => T(`demo.${q.id}.o.${o}`);

// ---------- this browser's own input ----------
const blank = () => ({ consent: false, profile: {}, ratings: {}, improved: {}, step: 'join', at: 0 });
let ME;
try { ME = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch { ME = blank(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(ME)); } catch {} };
const reset = () => { ME = blank(); save(); };

// ---------- charter helpers ----------
const clauseOfHot = k => { for (const a of ARTS) for (const c of a.cl) if (c[1].some(p => p.h === k)) return { a, c }; return null; };
const clauseByNumber = n => { for (const a of ARTS) for (const c of a.cl) if (c[0] === n) return { a, c }; return null; };
const clauseText = c => c[1].map(p => typeof p === 'string' ? p : HOTS[p.h].base).join('');

// ---------- the made-up participants ----------
// Each leans towards one of the viewer's four readings (index into an edit's support array),
// loosely linked to their profile so the breakdowns show some differences.
const SIZE = 140;
const PEOPLE = (() => {
  const rnd = B.seeded('people'), pick = (a, w) => { let u = rnd() * w.reduce((x, y) => x + y, 0); for (let i = 0; i < a.length; i++) { u -= w[i]; if (u <= 0) return a[i]; } return a[a.length - 1]; };
  const [AGE, LANG, AI] = DEMOGRAPHICS.map(q => q.options);
  const out = [];
  for (let i = 0; i < SIZE; i++) {
    const age = pick(AGE, [22, 38, 28, 12]);
    const lang = pick(LANG, [55, 24, 8, 2, 8, 3]);
    const ai = pick(AI, age === 'u25' ? [50, 30, 15, 5] : age === 'a65' ? [8, 17, 40, 35] : [28, 34, 26, 12]);
    const lean = pick([0, 1, 2, 3], [
      age === 'a65' || ai === 'never' ? 40 : 20,
      age === 'u25' ? 38 : 22,
      lang === 'fr' || lang === 'it' ? 30 : 22,
      ai === 'daily' ? 34 : 18]);
    const profile = {};
    if (rnd() > 0.12) profile.age = age;
    if (rnd() > 0.15) profile.lang = lang;
    if (rnd() > 0.18) profile.ai = ai;
    out.push({ lean, profile });
  }
  return out;
})();

// ---------- suggestions ----------
function sampleSuggestions() {
  const out = [];
  Object.entries(HOTS).forEach(([k, h]) => h.edits.forEach((e, i) => {
    const f = clauseOfHot(k);
    out.push({ id: `${k}-${i}`, hot: k, clause: f ? f.c[0] : '', art: f ? f.a : null, title: f ? f.a.t : '', op: e.op, base: h.base, text: e.text,
      why: e.why, sup: e.sup, note: (typeof NOTES !== 'undefined' && NOTES[`${k}-${i}`]) || null,
      test: e.q ? { prompt: e.q, today: e.now, with_edit: e.then } : null });
  }));
  return out;
}
function ownSuggestions() {
  let list = [];
  try { list = JSON.parse(localStorage.getItem('pc-demo-proposals')) || []; } catch {}
  return list.map(p => {
    const f = clauseByNumber(p.clause);
    return { id: 'own-' + p.id, own: true, clause: p.clause, art: f ? f.a : null, title: f ? f.a.t : '', anchor: p.anchor,
      op: p.op, base: p.anchor && p.anchor.quote || '', text: p.new_text, why: p.rationale, sup: null, note: null, test: null, created: p.created_at };
  });
}

const leanP = (s, lean) => {
  const avg = s.sup.reduce((a, b) => a + b, 0) / s.sup.length;
  return (s.sup[lean] != null ? s.sup[lean] : avg) / 100;
};
// A few suggestions were rated by only a handful of people, so they still need answers.
const THIN = ['h9-1', 'h11-0', 'h4-3'];
function simulatedRatings(s) {
  if (!s.sup) return [];
  const rnd = B.seeded('r:' + s.id), out = [];
  const take = THIN.includes(s.id) ? 0.05 : 0.25 + rnd() * 0.3;
  for (const p of PEOPLE) {
    if (rnd() > take) continue;
    const pr = Math.min(0.95, Math.max(0.05, leanP(s, p.lean)));
    const u = rnd();
    out.push({ value: u < pr ? 1 : u < pr + 0.15 ? 0.5 : 0, reasons: [], profile: p.profile });
  }
  return out;
}

let CACHE = null;
function suggestions() {
  if (!CACHE) CACHE = sampleSuggestions().map(s => Object.assign(s, { sim: simulatedRatings(s) }));
  const all = CACHE.concat(ownSuggestions().map(s => Object.assign(s, { sim: [] })));
  const out = all.map(s => {
    const mine = ME.ratings[s.id];
    const ratings = mine != null && ME.consent ? s.sim.concat([{ value: mine, reasons: [], profile: ME.profile, me: true }]) : s.sim;
    // key: the words being changed, so rival wordings of the same phrase can be compared
    const key = s.hot || `${s.clause}:${(s.anchor && s.anchor.quote) || s.base || ''}`;
    return Object.assign({}, s, { key, ratings, s: B.score(ratings), bridge: B.bridges(DEMOGRAPHICS, ratings) });
  });
  const picks = B.pickWinners(out);
  out.forEach(s => { const p = picks[s.id]; s.pick = p ? p.pick : null; s.close = !!(p && p.close); });
  return out;
}

function myCounts() { return { ratings: Object.keys(ME.ratings).length, proposals: ownSuggestions().length }; }
const TARGET = 10;

// ---------- shared display pieces ----------
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const pct = x => Math.round(x * 100) + '%';

// The clause as a sentence, with this suggestion shown as a tracked change (old struck through, new underlined).
function changedClause(s) {
  const f = clauseByNumber(s.clause); if (!f) return '';
  if (s.own) {
    const full = clauseText(f.c), a = s.anchor || {};
    if (a.lang && a.lang !== window.PC_LANG) return `<del>${esc(s.base)}</del> <ins>${esc(s.text)}</ins>`;
    const st = a.start != null ? a.start : full.indexOf(s.base), en = a.end != null ? a.end : st + s.base.length;
    if (st < 0) return `<del>${esc(s.base)}</del> <ins>${esc(s.text)}</ins>`;
    const mid = s.op === 'insert' ? esc(full.slice(st, en)) + `<ins>${esc(s.text)}</ins>`
      : `<del>${esc(full.slice(st, en))}</del>` + (s.op === 'delete' ? '' : ` <ins>${esc(s.text)}</ins>`);
    return esc(full.slice(0, st)) + mid + esc(full.slice(en));
  }
  return f.c[1].map(p => {
    if (typeof p === 'string') return esc(p);
    const base = HOTS[p.h].base;
    if (p.h !== s.hot) return esc(base);
    return (base ? `<del>${esc(base)}</del>` : '') + (s.op === 'delete' ? '' : `${base ? ' ' : ''}<ins>${esc(s.text)}</ins>`);
  }).join('');
}

// The clause as plain text, as it would read with this suggestion applied.
function appliedClause(s) {
  const f = clauseByNumber(s.clause); if (!f) return s.text || '';
  if (s.own) {
    const full = clauseText(f.c), a = s.anchor || {};
    const st = a.start != null ? a.start : full.indexOf(s.base), en = a.end != null ? a.end : st + s.base.length;
    if (st < 0 || (a.lang && a.lang !== window.PC_LANG)) return s.text || full;
    const mid = s.op === 'insert' ? full.slice(st, en) + s.text : s.op === 'delete' ? '' : s.text;
    return (full.slice(0, st) + mid + full.slice(en)).replace(/\s{2,}/g, ' ');
  }
  return f.c[1].map(p => typeof p === 'string' ? p : p.h === s.hot ? (s.op === 'delete' ? '' : s.text) : HOTS[p.h].base).join('');
}

// A short label for a change: the new words, or "Remove …" for a deletion.
function changeLabel(s) {
  if (s.op === 'delete') return T('results.removeW', { w: (s.base || '').replace(/^[,.;:]\s*/, '') });
  return (s.op === 'insert' ? '+ ' : '') + String(s.text || '').replace(/^[,.;:]\s*/, '');
}

// One stacked bar: yes, partly, no.
function supportBar(t, label) {
  const w = x => (x * 100).toFixed(1) + '%';
  return `<div class="sb-row">${label ? `<span class="sb-l">${esc(label)}</span>` : ''}
    <span class="sb" role="img" aria-label="${esc(T('results.line', { yes: pct(t.helpShare), partly: pct(t.someShare), no: pct(t.notShare), n: t.n }))}">
      <i class="h" style="width:${w(t.helpShare)}"></i><i class="s" style="width:${w(t.someShare)}"></i><i class="x" style="width:${w(t.notShare)}"></i></span>
    <span class="sb-v">${pct(t.helpShare)} <small>/ ${t.n}</small></span></div>`;
}
const legend = () => `<p class="sb-key"><span><i class="h"></i>${esc(T('answer.yes'))}</span><span><i class="s"></i>${esc(T('answer.partly'))}</span><span><i class="x"></i>${esc(T('answer.no'))}</span></p>`;
function breakdownHTML(items) {
  return B.breakdown(DEMOGRAPHICS, items, B.tally).map(({ q, rows, hidden }) => `<div class="bd"><p class="lbl">${esc(qLabel(q))}</p>
    ${rows.length ? rows.map(r => supportBar(r, oLabel(q, r.option))).join('') : `<p class="small muted">${esc(T('demo.notEnough'))}</p>`}
    ${hidden ? `<p class="small muted">${esc(T('demo.hidden', { n: hidden }))}</p>` : ''}</div>`).join('');
}
const othersLine = t => T('rate.others', { yes: pct(t.helpShare), partly: pct(t.someShare), no: pct(t.notShare), n: t.n });

window.Community = {
  KEY, SIZE, DEMOGRAPHICS, TARGET, qLabel, oLabel,
  get me() { return ME; }, save, reset, myCounts, suggestions,
  clauseOfHot, clauseByNumber, clauseText, changedClause, appliedClause, changeLabel, supportBar, legend, breakdownHTML, othersLine, esc, pct
};
})();
