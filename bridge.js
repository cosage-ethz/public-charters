// Scoring for Public Charters: support in every group, with weights, as described in
// "Opinion aggregation for the Charter Kit, version 2".
//
//  - Groups are the roles an organiser sets for the space (for example doctors, nurses,
//    patients, administration). Larger spaces may switch to opinion groups found from the
//    votes, Polis style; the rule below stays the same.
//  - A suggestion is ENDORSED when it is rated helpful in every group, CONTESTED when some
//    groups find it helpful and others do not, WEAK otherwise, and NEEDS RATINGS until every
//    group has the minimum number of ratings.
//  - Weights (simplified DemPO): each group counts at its target share of the community,
//    not at its share of the people who happened to rate. weight = target share / share of
//    active raters, capped between 0.3 and 3. The full kit can use LEXIMIN selection
//    probabilities instead. Weights set the overall support figure and the pair results; they
//    never let one group outvote another, because endorsement needs every group.
//
// The file runs in the browser (window.Bridge) and in Node (require('./bridge.js')), so the
// same code can score a real space from a database export.
(function (root) {
'use strict';

const RULES = {
  minPerGroup: 3,       // ratings needed in every group before a status is given
  endorse: 0.6,         // helpful share every group must reach
  oppose: 0.4,          // a group at or below this counts as against
  weightCap: [0.3, 3],  // weights are clipped to this range
  ratingValue: { helpful: 1, somewhat: 0.5, not: 0 }
};

// ---------- weights ----------
// groups: [{ id, target }] with targets summing to 1; active: { groupId: number of active raters }
function weights(groups, active) {
  const total = groups.reduce((n, g) => n + (active[g.id] || 0), 0) || 1;
  const out = {};
  for (const g of groups) {
    const share = (active[g.id] || 0) / total;
    const w = share ? g.target / share : RULES.weightCap[1];
    out[g.id] = { target: g.target, share, weight: Math.min(RULES.weightCap[1], Math.max(RULES.weightCap[0], w)) };
  }
  return out;
}

// ---------- one suggestion ----------
// ratings: [{ group, value (0..1), reasons: [] }]
function score(groups, ratings, W) {
  const per = {};
  for (const g of groups) per[g.id] = { n: 0, sum: 0, against: {}, for: {} };
  for (const r of ratings) {
    const p = per[r.group]; if (!p) continue;
    p.n++; p.sum += r.value;
    const bag = r.value >= 0.5 ? p.for : p.against;
    (r.reasons || []).forEach(x => { bag[x] = (bag[x] || 0) + 1; });
  }
  // Smoothed helpful share: one imaginary helpful and one unhelpful rating, so 2 of 2 is not 100%.
  for (const g of groups) { const p = per[g.id]; p.h = (p.sum + 1) / (p.n + 2); }
  const ids = groups.map(g => g.id);
  const missing = ids.filter(id => per[id].n < RULES.minPerGroup);
  const hs = ids.map(id => per[id].h);
  const lo = Math.min(...hs), hi = Math.max(...hs);
  const loG = groups[hs.indexOf(lo)], hiG = groups[hs.indexOf(hi)];
  let status;
  if (missing.length) status = 'needs';
  else if (lo >= RULES.endorse) status = 'endorsed';
  else if (hi >= RULES.endorse && lo <= RULES.oppose) status = 'contested';
  else status = 'weak';
  const overall = W ? ids.reduce((s, id) => s + W[id].target * per[id].h, 0) : hs.reduce((a, b) => a + b, 0) / hs.length;
  const n = ids.reduce((s, id) => s + per[id].n, 0);
  return { status, per, lo, hi, loG, hiG, missing, overall, n };
}

// A plain sentence on why a suggestion has its status.
function explain(groups, s) {
  const pct = x => Math.round(x * 100) + '%';
  const name = id => (groups.find(g => g.id === id) || {}).name || id;
  if (s.status === 'needs') {
    const need = s.missing.map(id => `${name(id)} (${s.per[id].n} of ${RULES.minPerGroup})`);
    return `Needs more ratings from ${list(need)}.`;
  }
  if (s.status === 'endorsed') return `Helpful in all ${groups.length} groups. Lowest: ${s.loG.name}, ${pct(s.lo)}.`;
  if (s.status === 'contested') return `${s.hiG.name} find it helpful (${pct(s.hi)}), ${s.loG.name} do not (${pct(s.lo)}).`;
  if (s.hi >= RULES.endorse) return `Helpful for some groups, but not yet for all. Lowest: ${s.loG.name}, ${pct(s.lo)}.`;
  return `No group finds it clearly helpful. Highest: ${s.hiG.name}, ${pct(s.hi)}.`;
}
function list(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }

// Dissent record: who was against an endorsed change, and why, in their own reason words.
function dissent(groups, s) {
  return groups.map(g => {
    const p = s.per[g.id], against = Math.round((1 - p.h) * 100);
    const why = Object.entries(p.against).sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0]);
    return { group: g, against, why };
  }).filter(d => d.against >= 25).sort((a, b) => b.against - a.against);
}

// ---------- pairs (Compare answers) ----------
// choices: [{ group, choice: 'cur' | 'alt' | 'both' | 'neither' }]
// Returns, per group, the share preferring the alternative among those who chose a side.
function pairResult(groups, choices, W) {
  const per = {};
  for (const g of groups) per[g.id] = { cur: 0, alt: 0, both: 0, neither: 0 };
  for (const c of choices) if (per[c.group]) per[c.group][c.choice]++;
  for (const g of groups) { const p = per[g.id], n = p.cur + p.alt; p.n = n; p.alt_share = (p.alt + 1) / (n + 2); }
  const ids = groups.map(g => g.id);
  const enough = ids.every(id => per[id].n >= RULES.minPerGroup);
  const lo = Math.min(...ids.map(id => per[id].alt_share)), hi = Math.max(...ids.map(id => per[id].alt_share));
  const overall = W ? ids.reduce((s, id) => s + W[id].target * per[id].alt_share, 0) : 0.5;
  // The charter check: the current clause loses in every group, so the charter may be lacking here.
  const verdict = !enough ? 'needs' : lo >= RULES.endorse ? 'charter-lacking' : hi <= RULES.oppose ? 'charter-holds' : 'split';
  return { per, overall, verdict, lo, hi };
}

// ---------- serving: fewest ratings first ----------
// items: [{ id, s: score result }], group: the rater's group. Items still missing ratings from the
// rater's group come first, then by fewest ratings overall.
function serveOrder(items, group) {
  return items.slice().sort((a, b) => {
    const na = a.s.per[group] ? a.s.per[group].n : 0, nb = b.s.per[group] ? b.s.per[group].n : 0;
    const ma = na < RULES.minPerGroup ? 0 : 1, mb = nb < RULES.minPerGroup ? 0 : 1;
    return ma - mb || na - nb || a.s.n - b.s.n;
  });
}

// ---------- deterministic randomness for the demo community ----------
function seeded(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
  return function () {
    h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

root.Bridge = { RULES, weights, score, explain, dissent, pairResult, serveOrder, seeded, list };
if (typeof module !== 'undefined' && module.exports) module.exports = root.Bridge;
})(typeof window !== 'undefined' ? window : globalThis);
