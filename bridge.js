// Scoring for the public Apertus Charter site.
//
//  - Everyone who rates is in one pool. There are no group vetoes.
//  - Each rating counts +1 (helpful), 0 (somewhat) or -1 (not helpful). The net score is the
//    average, from -1 to +1.
//  - A suggestion is ENDORSED when its net score reaches RULES.endorse, CONTESTED when it is
//    not endorsed but sizeable shares find it helpful and not helpful, WEAK otherwise, and
//    NEEDS RATINGS until it has RULES.minRatings ratings.
//  - Optional demographic answers (age, language, ...) only produce BREAKDOWNS: how each
//    group rated a suggestion. They never change its status. A group is shown only once it
//    has RULES.minGroup ratings, so small groups are neither noisy nor identifiable.
//
// The thresholds are placeholders, to be tuned once real ratings come in.
// The file runs in the browser (window.Bridge) and in Node (require('./bridge.js')), so the
// same code can score the real space from a database export.
(function (root) {
'use strict';

const RULES = {
  minRatings: 10,       // ratings needed before a suggestion gets a status
  endorse: 0.3,         // net score needed to be endorsed
  contested: 0.3,       // share helpful AND share not helpful both at least this: contested
  minGroup: 5,          // ratings needed before a demographic group is shown in a breakdown
  pairDecide: 0.6,      // share preferring one side in Compare answers for a verdict
  closeCall: 0.1,       // rival wordings closer than this (net score) are flagged as a close call
  ratingValue: { helpful: 1, somewhat: 0.5, not: 0 }
};

// ---------- one suggestion ----------
// ratings: [{ value (1 | 0.5 | 0), reasons: [], profile: { age, lang, ... } }]
function tally(ratings) {
  const t = { n: 0, help: 0, some: 0, not: 0, for: {}, against: {} };
  for (const r of ratings) {
    t.n++;
    if (r.value >= 1) t.help++; else if (r.value > 0) t.some++; else t.not++;
    const bag = r.value >= 0.5 ? t.for : t.against;
    (r.reasons || []).forEach(x => { bag[x] = (bag[x] || 0) + 1; });
  }
  const n = t.n || 1;
  t.helpShare = t.help / n; t.someShare = t.some / n; t.notShare = t.not / n;
  t.net = t.n ? (t.help - t.not) / t.n : 0;
  return t;
}

function score(ratings) {
  const t = tally(ratings);
  let status;
  if (t.n < RULES.minRatings) status = 'needs';
  else if (t.net >= RULES.endorse) status = 'endorsed';
  else if (t.helpShare >= RULES.contested && t.notShare >= RULES.contested) status = 'contested';
  else status = 'weak';
  return Object.assign(t, { status });
}

// Breakdown by optional profile answers.
// questions: [{ id, q, options: [] }]. Returns [{ q, rows: [{ option, n, ...tally }], hidden }].
function breakdown(questions, ratings, fn) {
  const f = fn || tally;
  return questions.map(q => {
    const rows = [];
    let hidden = 0;
    for (const o of q.options) {
      const sub = ratings.filter(r => r.profile && r.profile[q.id] === o);
      if (sub.length >= RULES.minGroup) rows.push(Object.assign({ option: o }, f(sub)));
      else hidden += sub.length;
    }
    return { q, rows, hidden };
  });
}

// ---------- bridging: support across groups that often disagree ----------
// A change "bridges" when, in every profile question that has at least two groups with enough
// answers, every such group has more yes than no. At least one question must qualify. This is a
// badge shown next to the result, never a rule that decides (no group can block a change).
function bridges(questions, ratings) {
  const perQ = breakdown(questions, ratings).map(({ q, rows }) => ({ q, rows, ok: rows.length >= 2 && rows.every(r => r.net > 0), counted: rows.length >= 2 }));
  const counted = perQ.filter(x => x.counted);
  return { ok: counted.length > 0 && counted.every(x => x.ok), perQ };
}

// ---------- choosing among rival wordings ----------
// items: [{ id, key, s: score }], where key identifies the words being changed. Among endorsed
// rivals with the same key, the one with the highest net score is chosen and the others become
// runners-up. A gap smaller than RULES.closeCall is flagged for a head-to-head vote later.
function pickWinners(items) {
  const out = {}, groups = {};
  items.forEach(x => { (groups[x.key] = groups[x.key] || []).push(x); });
  Object.values(groups).forEach(list => {
    const passed = list.filter(x => x.s.status === 'endorsed').sort((a, b) => b.s.net - a.s.net);
    if (!passed.length || list.length < 2) return;
    const close = passed.length > 1 && passed[0].s.net - passed[1].s.net < RULES.closeCall;
    passed.forEach((x, i) => { out[x.id] = { pick: i === 0 ? 'chosen' : 'runner', close: close && i < 2 }; });
  });
  return out;
}

// A plain sentence on why a suggestion has its status.
function explain(s) {
  const pct = x => Math.round(x * 100) + '%';
  if (s.status === 'needs') return `Needs more ratings (${s.n} of ${RULES.minRatings}).`;
  const split = `${pct(s.helpShare)} helpful, ${pct(s.notShare)} not helpful`;
  if (s.status === 'endorsed') return `Broad support: ${split}.`;
  if (s.status === 'contested') return `People are split: ${split}.`;
  return `Not enough support yet: ${split}.`;
}

// Dissent record: how many found an endorsed change unhelpful, and their most common reasons.
function dissent(s) {
  const why = Object.entries(s.against).sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0]);
  return { share: s.notShare, why };
}

// ---------- pairs (Compare answers) ----------
// choices: [{ choice: 'cur' | 'alt' | 'both' | 'neither', profile }]
function pairTally(choices) {
  const p = { cur: 0, alt: 0, both: 0, neither: 0 };
  for (const c of choices) if (p[c.choice] != null) p[c.choice]++;
  p.n = p.cur + p.alt;
  p.alt_share = p.n ? p.alt / p.n : 0.5;
  return p;
}
function pairResult(choices) {
  const p = pairTally(choices);
  // The charter check: most people prefer the change, so the charter may be lacking here.
  p.verdict = p.n < RULES.minRatings ? 'needs'
    : p.alt_share >= RULES.pairDecide ? 'charter-lacking'
    : p.alt_share <= 1 - RULES.pairDecide ? 'charter-holds' : 'split';
  return p;
}

// ---------- serving: fewest ratings first ----------
function serveOrder(items) {
  return items.slice().sort((a, b) => a.s.n - b.s.n);
}

// ---------- deterministic randomness for the sample round ----------
function seeded(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
  return function () {
    h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

root.Bridge = { RULES, tally, score, breakdown, bridges, pickWinners, explain, dissent, pairTally, pairResult, serveOrder, seeded };
if (typeof module !== 'undefined' && module.exports) module.exports = root.Bridge;
})(typeof window !== 'undefined' ? window : globalThis);
