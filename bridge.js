// Scoring for the public Apertus Charter site: approval voting with a floor across groups.
//
//  - Each rating is an approval: helpful = 1, somewhat = 0.5, not helpful = 0.
//  - Cautious score: every group starts with RULES.prior pretend approvals and RULES.prior
//    pretend rejections, so a handful of votes cannot push a change far either way:
//        score(group) = (approvals + prior) / (votes + 2 * prior)
//  - Groups come from one profile question (RULES.grouping, language by default). People who
//    skip it form their own "not stated" group, so skipping is no way around the floor.
//    A group counts once it has RULES.minGroup votes.
//  - Overall score: the plain average of the counted groups, so each group weighs the same however
//    many of its members turn up. With fewer than 2 counted groups, the pooled score of all votes
//    is used and the floor is "not checked yet".
//  - A change is ENDORSED (accepted) when it has RULES.minRatings votes, an overall score of at
//    least RULES.pass, and no counted group below RULES.floor. It is CONTESTED when it passes
//    overall but a group is below the floor, or when sizeable shares say yes and no. Otherwise it
//    is WEAK, or NEEDS RATINGS below RULES.minRatings votes.
//  - The other profile questions (age, AI use) only produce BREAKDOWNS and the "Bridges groups" badge.
//
// The file runs in the browser (window.Bridge) and in Node (require('./bridge.js')), so the
// same code can score the real space from a database export (tools/score.js).
(function (root) {
'use strict';

const RULES = {
  minRatings: 10,       // ratings needed before a suggestion gets a status
  prior: 3,             // pretend approvals and pretend rejections added to every group
  pass: 0.6,            // overall cautious score needed to be accepted
  floor: 0.4,           // no counted group may score below this
  grouping: 'lang',     // profile question that sets the groups for the floor
  contested: 0.3,       // share helpful AND share not helpful both at least this: contested
  minGroup: 5,          // ratings needed before a group counts for the floor or is shown in a breakdown
  pairDecide: 0.6,      // share preferring one side in Compare answers for a verdict
  closeCall: 0.05,      // rival wordings closer than this (cautious score) are flagged as a close call
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

// Cautious approval score: (approvals + prior) / (votes + 2 * prior).
function cautious(approvals, votes) {
  return (approvals + RULES.prior) / (votes + 2 * RULES.prior);
}

// Groups for the floor: one per answer to RULES.grouping, plus 'none' for people who skipped it.
function groupScores(ratings, grouping) {
  const g = {};
  for (const r of ratings) {
    const k = (r.profile && r.profile[grouping]) || 'none';
    const x = g[k] || (g[k] = { option: k, n: 0, approvals: 0 });
    x.n++; x.approvals += Math.max(0, Math.min(1, r.value));
  }
  return Object.values(g).map(x => Object.assign(x, { score: cautious(x.approvals, x.n), counted: x.n >= RULES.minGroup }))
    .sort((a, b) => b.n - a.n);
}

function score(ratings, grouping) {
  const t = tally(ratings);
  const approvals = t.help + 0.5 * t.some;
  const groups = groupScores(ratings, grouping || RULES.grouping);
  const counted = groups.filter(x => x.counted);
  const floorChecked = counted.length >= 2;
  const support = floorChecked ? counted.reduce((a, x) => a + x.score, 0) / counted.length : cautious(approvals, t.n);
  const below = floorChecked ? counted.filter(x => x.score < RULES.floor).sort((a, b) => a.score - b.score) : [];
  let status;
  if (t.n < RULES.minRatings) status = 'needs';
  else if (support >= RULES.pass && !below.length) status = 'endorsed';
  else if (support >= RULES.pass || (t.helpShare >= RULES.contested && t.notShare >= RULES.contested)) status = 'contested';
  else status = 'weak';
  return Object.assign(t, { status, support, groups, floorChecked, below, heldBack: status === 'contested' && support >= RULES.pass && below.length > 0 });
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
// rivals with the same key, the one with the highest cautious score is chosen and the others become
// runners-up. A gap in cautious score smaller than RULES.closeCall is flagged for a head-to-head vote later.
function pickWinners(items) {
  const out = {}, groups = {};
  items.forEach(x => { (groups[x.key] = groups[x.key] || []).push(x); });
  Object.values(groups).forEach(list => {
    const passed = list.filter(x => x.s.status === 'endorsed').sort((a, b) => b.s.support - a.s.support);
    if (!passed.length || list.length < 2) return;
    const close = passed.length > 1 && passed[0].s.support - passed[1].s.support < RULES.closeCall;
    passed.forEach((x, i) => { out[x.id] = { pick: i === 0 ? 'chosen' : 'runner', close: close && i < 2 }; });
  });
  return out;
}

// A plain sentence on why a suggestion has its status.
function explain(s) {
  const pct = x => Math.round(x * 100) + '%';
  if (s.status === 'needs') return `Needs more ratings (${s.n} of ${RULES.minRatings}).`;
  const split = `${pct(s.helpShare)} helpful, ${pct(s.notShare)} not helpful`;
  if (s.status === 'endorsed') return `Accepted: ${pct(s.support)} overall and no group below ${pct(RULES.floor)} (${split}).`;
  if (s.heldBack) return `Held back: ${pct(s.support)} overall, but group "${s.below[0].option}" is at ${pct(s.below[0].score)}, below ${pct(RULES.floor)}.`;
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

root.Bridge = { RULES, tally, cautious, groupScores, score, breakdown, bridges, pickWinners, explain, dissent, pairTally, pairResult, serveOrder, seeded };
if (typeof module !== 'undefined' && module.exports) module.exports = root.Bridge;
})(typeof window !== 'undefined' ? window : globalThis);
