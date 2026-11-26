#!/usr/bin/env node
// Counts the real ratings with the rule in bridge.js and saves the result in the database.
//
//   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... node tools/score.js
//   ... node tools/score.js --dry      count and print, but save nothing
//   node tools/score.js --sample       count the made-up sample round (no database needed)
//
// Ratings are private to each person, so this needs the service-role key. Run it on your own
// computer only, and never put that key in the website.
//
// What it saves, per run (see DATA_MODEL.md):
//   aggregation_run  method 'approval_floor', the rules used and the ids of every rating counted
//   cohort           one group per answer to the grouping question (language), plus 'none'
//   cohort_member    who was in which group
//   score            per change: one row overall (cohort_id empty) with the status, and one row
//                    per group with its cautious score. "Needs ratings" is saved as status null
//                    with detail.status = 'needs', since the table only allows the three others.
// The changes are still the sample ones (ids such as h4-1), so their score rows use
// target_type 'suggestion' with a fixed id made from the change id; detail.key holds the change id.
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const B = require(path.join(ROOT, 'bridge.js'));
const args = process.argv.slice(2);
const DRY = args.includes('--dry'), SAMPLE = args.includes('--sample');
const SLUG = (args.find(a => a.startsWith('--space=')) || '--space=apertus').slice(8);
const METHOD = 'approval_floor', VERSION = '1';

// A fixed uuid for a change id, so the same change gets the same score row id in every run.
const uuidFor = (space, key) => {
  const h = crypto.createHash('sha1').update(`${space}:${key}`).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${(8 | parseInt(h[16], 16) & 3).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
};

// ---------- reading ----------
function sampleRound() {
  const ctx = { console, localStorage: { getItem: () => null, setItem() {} }, T: k => k };
  ctx.window = ctx; vm.createContext(ctx);
  for (const f of ['sample-data.js', 'bridge.js', 'community.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  const byKey = {};
  ctx.Community.suggestions().forEach(s => { byKey[s.id] = s.ratings.map(r => ({ value: r.value, profile: r.profile || {} })); });
  return { byKey, ids: [], users: {} };
}

async function api(pathAndQuery, opts = {}) {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or use --sample.');
  const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/${pathAndQuery}`, Object.assign({}, opts, {
    headers: Object.assign({ apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, opts.headers || {})
  }));
  if (!res.ok) throw new Error(`${opts.method || 'GET'} ${pathAndQuery.split('?')[0]}: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}
async function all(table, query) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const page = await api(`${table}?${query}`, { headers: { Range: `${from}-${from + 999}` } });
    out.push(...page);
    if (page.length < 1000) return out;
  }
}

async function liveRound(space) {
  const judgements = await all('judgement', `select=id,user_id,kind,value&space_id=eq.${space.id}&kind=like.rating:*`);
  const profiles = await all('profile', 'select=user_id,demographics,consent');
  const prof = {};
  profiles.forEach(p => { prof[p.user_id] = p; });
  const byKey = {}, ids = [], users = {};
  for (const j of judgements) {
    const p = prof[j.user_id];
    // Same as the site: ratings count only from people who agreed to take part.
    if (!p || !p.consent) continue;
    const v = Number(j.value && j.value.v);
    if (![0, 0.5, 1].includes(v)) continue;
    const key = j.kind.slice('rating:'.length);
    (byKey[key] = byKey[key] || []).push({ value: v, profile: p.demographics || {}, user: j.user_id });
    ids.push(j.id);
    users[j.user_id] = (p.demographics || {})[B.RULES.grouping] || 'none';
  }
  return { byKey, ids, users };
}

// ---------- counting ----------
function count(byKey) {
  return Object.entries(byKey).map(([key, ratings]) => ({ key, s: B.score(ratings) }))
    .sort((a, b) => (a.s.status === 'needs') - (b.s.status === 'needs') || b.s.support - a.s.support);
}

function print(rows) {
  const pct = x => (x * 100).toFixed(0).padStart(3) + '%';
  console.log(`Rule: ${METHOD} v${VERSION}, groups by '${B.RULES.grouping}', pass ${pct(B.RULES.pass)}, floor ${pct(B.RULES.floor)}, prior ${B.RULES.prior}+${B.RULES.prior}\n`);
  console.log('change      votes  score  status      lowest group');
  for (const { key, s } of rows) {
    const low = s.groups.filter(g => g.counted).sort((a, b) => a.score - b.score)[0];
    console.log(`${key.padEnd(10)} ${String(s.n).padStart(6)} ${pct(s.support)}  ${(s.heldBack ? 'held back' : s.status).padEnd(10)}  ${s.floorChecked && low ? `${low.option} ${pct(low.score).trim()} of ${low.n}` : 'floor not checked yet'}`);
  }
  const c = {};
  rows.forEach(r => { c[r.s.status] = (c[r.s.status] || 0) + 1; });
  console.log(`\n${rows.length} changes: ${Object.entries(c).map(([k, n]) => `${n} ${k}`).join(', ')}`);
}

// ---------- saving ----------
async function save(space, round, rows) {
  const [run] = await api('aggregation_run', { method: 'POST', body: JSON.stringify({
    space_id: space.id, method: METHOD, method_version: VERSION,
    params: Object.assign({}, B.RULES), scope: { level: 'space' }, input_ids: round.ids }) });
  const options = [...new Set(rows.flatMap(r => r.s.groups.map(g => g.option)))];
  const cohorts = options.length ? await api('cohort', { method: 'POST', body: JSON.stringify(options.map(o => ({
    space_id: space.id, run_id: run.id, kind: 'declared', label: `${B.RULES.grouping}:${o}`,
    size: Object.values(round.users).filter(x => x === o).length }))) }) : [];
  const cid = {};
  cohorts.forEach(c => { cid[c.label.split(':')[1]] = c.id; });
  const members = Object.entries(round.users).map(([user_id, o]) => ({ cohort_id: cid[o], user_id }));
  if (members.length) await api('cohort_member', { method: 'POST', body: JSON.stringify(members) });
  const scores = [];
  for (const { key, s } of rows) {
    const target_id = uuidFor(space.id, key);
    scores.push({ run_id: run.id, target_type: 'suggestion', target_id, cohort_id: null, value: s.support,
      status: s.status === 'needs' ? null : s.status,
      detail: { key, status: s.status, votes: s.n, approvals: s.help + 0.5 * s.some, helpShare: s.helpShare, notShare: s.notShare,
        floorChecked: s.floorChecked, heldBack: s.heldBack, below: s.below.map(g => g.option) } });
    for (const g of s.groups) scores.push({ run_id: run.id, target_type: 'suggestion', target_id, cohort_id: cid[g.option], value: g.score,
      status: null, detail: { key, votes: g.n, approvals: g.approvals, counted: g.counted } });
  }
  for (let i = 0; i < scores.length; i += 500) await api('score', { method: 'POST', body: JSON.stringify(scores.slice(i, i + 500)), headers: { Prefer: 'return=minimal' } });
  return run;
}

(async () => {
  let space = null, round;
  if (SAMPLE) round = sampleRound();
  else {
    [space] = await api(`space?select=id,slug&slug=eq.${encodeURIComponent(SLUG)}`);
    if (!space) throw new Error(`No space with slug '${SLUG}'.`);
    round = await liveRound(space);
  }
  const rows = count(round.byKey);
  print(rows);
  if (SAMPLE || DRY) return console.log('\nNothing saved.');
  const run = await save(space, round, rows);
  console.log(`\nSaved run ${run.id}.`);
})().catch(e => { console.error(e.message); process.exit(1); });
