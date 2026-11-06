// Participate page (participate.html), version 2.
// Members join once, then contribute in any order: compare answers, rate suggestions, share
// concerns, propose changes. Background reading and the surveys are optional.
// Scores come from bridge.js; the demo community and this browser's input from community.js.
(() => {
'use strict';
const C = window.Community, B = window.Bridge;
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const toast = msg => window.PC ? PC.toast(msg) : null;
const pct = x => Math.round(x * 100) + '%';
const ME = () => C.me;
const save = () => C.save();

const STEPS = [
  { id: 'join', t: 'Join', s: () => ME().consent && ME().group ? `You are in: ${C.group(ME().group).name}` : 'Choose your group' },
  { id: 'learn', t: 'Background', s: () => 'Optional · about 5 minutes' },
  { id: 'pairs', t: 'Compare answers', s: () => `${C.myCounts().pairs} of ${C.TARGET.pairs} done` },
  { id: 'rate', t: 'Rate suggestions', s: () => `${C.myCounts().ratings} of ${C.TARGET.ratings} done` },
  { id: 'concerns', t: 'Concerns', s: () => { const n = C.myCounts(); return n.concerns || n.metoo ? `${n.concerns} posted · ${n.metoo} me too` : 'Say what worries you'; } },
  { id: 'propose', t: 'Propose a change', s: () => { const n = C.myCounts().proposals; return n ? `${n} proposed` : 'Optional · with test cases'; } },
  { id: 'wrap', t: 'Wrap up', s: () => ME().feedback.sent ? 'Feedback sent, thank you' : 'Optional feedback' }
];
const verbOf = { replace: 'Reword', insert: 'Add', delete: 'Remove' };
const STATUS = {
  endorsed: { l: 'Endorsed', c: 'good' }, contested: { l: 'Contested', c: 'warn' },
  weak: { l: 'Not enough support', c: 'mid' }, needs: { l: 'Needs ratings', c: 'need' }
};

// ---------- live saving (when a database is connected) ----------
const P = () => window.PC && PC.state;
const live = () => !!(window.PC && PC.live && P().user && P().space && P().roles.has('member'));
async function saveJudgement(target_type, target_id, kind, value) {
  if (!live()) return;
  const s = P();
  const { error } = await s.db.from('judgement').upsert(
    { space_id: s.space.id, user_id: s.user.id, target_type, target_id, kind, value },
    { onConflict: 'user_id,target_type,target_id,kind' });
  if (error) toast('Could not save to the server: ' + error.message);
}
const saveSpace = (kind, value) => live() && saveJudgement('space', P().space.id, kind, value);

// ---------- small pieces ----------
function diffHTML(s) {
  return (s.op !== 'insert' && s.base ? `<del>${esc(s.base)}</del> ` : '') + (s.op !== 'delete' ? `<ins>${esc(s.text)}</ins>` : '');
}
function pill(status) { const x = STATUS[status]; return `<span class="pill ${x.c}">${x.l}</span>`; }
// One bar per group: helpful share (suggestions) or share preferring the change (pairs).
function bars(rows, mark) {
  return `<div class="bars">${rows.map(r => `<div class="bar ${r.me ? 'me' : ''}"><span class="bn">${esc(r.name)}${r.me ? ' <i>(you)</i>' : ''}</span>
    <span class="bt" role="img" aria-label="${esc(r.name)}: ${pct(r.v)}"><span class="bf" style="width:${Math.round(r.v * 100)}%"></span>${mark ? '<span class="bm" style="left:60%" title="60%: needed in every group"></span>' : ''}</span>
    <span class="bv">${pct(r.v)} <small>${r.n} ${r.n === 1 ? 'answer' : 'answers'}</small></span></div>`).join('')}</div>`;
}
function groupBars(sc) {
  return bars(C.GROUPS.map(g => ({ name: g.name, v: sc.per[g.id].h, n: sc.per[g.id].n, me: g.id === ME().group })), true);
}
function navHTML(prev, next, nextLabel, hint) {
  return `<div class="nav">${prev ? `<button class="btn" data-go="${prev}">← Back</button>` : '<span></span>'}
    <span class="navr">${hint ? `<span class="small muted">${esc(hint)}</span>` : ''}${next ? `<button class="btn primary" data-go="${next}">${esc(nextLabel)} →</button>` : ''}</span></div>`;
}
function scaleQ(set, q, name, ends) {
  const v = set[q.id];
  return `<div class="q" role="group" aria-labelledby="q-${name}-${q.id}"><p id="q-${name}-${q.id}">${esc(q.q)}</p>
    <div class="scale" style="grid-template-columns:repeat(${ends.n},minmax(0,1fr));max-width:${ends.n * 80}px">${Array.from({ length: ends.n }, (_, k) => k + 1).map(n => `<label><input type="radio" name="${name}-${q.id}" data-q="${q.id}" value="${n}" data-n="${n}" ${v === n ? 'checked' : ''} aria-label="${n} of ${ends.n}"></label>`).join('')}</div>
    <div class="ends" style="max-width:${ends.n * 80}px"><span>${esc(ends.lo)}</span><span>${esc(ends.hi)}</span></div></div>`;
}
const AGREE7 = { n: 7, lo: 'Strongly disagree', hi: 'Strongly agree' };
const AGREE5 = { n: 5, lo: 'Disagree', hi: 'Agree' };

// ---------- views ----------
const VIEWS = {};

VIEWS.join = () => {
  const me = ME(), p = me.profile, ok = me.consent && me.group;
  let acct = '';
  if (window.PC && PC.live) {
    const s = P();
    if (!s.user) acct = `<p class="note">Sign in with the email address your invitation was sent to. <button class="btn" data-act="signin" style="margin-left:6px">Sign in</button></p>`;
    else if (!s.roles.has('member')) acct = `<p class="note">You are signed in as ${esc(s.user.email)}, but not yet a member of this space. Open your invitation link, or ask an organiser for one.</p>`;
    else acct = `<p class="note">Signed in as ${esc(s.user.email)}.</p>`;
  } else acct = `<p class="note"><b>Demo.</b> This is a made-up hospital where 40 members have already taken part. Your answers stay in this browser and are added to theirs, so you can watch the results change. <button class="link" data-reset>Start over</button></p>`;
  const opt = (name, list) => `<select data-pf="${name}"><option value="">Prefer not to say</option>${list.map(x => `<option ${p[name] === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>`;
  return `<p class="eyebrow">Before you start</p><h3>Join this round</h3>
    <p class="intro">You are helping decide how the hospital’s AI assistant should behave. Here is how your input is used, so you can decide whether to take part.</p>
    ${acct}
    <ul class="facts">
      <li><b>Changes need every group.</b> A change is adopted only when doctors, nurses and carers, patients and relatives, and admin staff all find it helpful. No single group can push one through.</li>
      <li><b>People decide, not an AI.</b> No AI reads your concerns, counts your ratings or writes compromises. Where a tool helps, it is labelled.</li>
      <li><b>Your answers are private.</b> Only combined results by group are shown. Proposals and concerns appear without your name.</li>
      <li><b>The model learns from the result.</b> The agreed charter and its test cases are used to train the model, which is then checked on cases it never saw.</li>
    </ul>
    <fieldset class="groups"><legend>Which group are you in?</legend>
      ${C.GROUPS.map(g => `<label class="gopt"><input type="radio" name="group" value="${g.id}" ${me.group === g.id ? 'checked' : ''}><span><b>${esc(g.name)}</b><small>${pct(g.target)} of the community</small></span></label>`).join('')}
    </fieldset>
    <p class="small muted" style="max-width:42em">The organisers set these groups for this hospital. Each group counts at its share of the community, however many of its members take part. <a href="results.html#weights">How this works</a></p>
    <details class="more"><summary>Optional: language and age</summary>
      <div class="form-grid"><label>Main language${opt('lang', ['German', 'French', 'Italian', 'Romansh', 'English', 'Other'])}</label>
      <label>Age${opt('age', ['Under 25', '25 to 44', '45 to 64', '65 or older'])}</label></div>
      <p class="small muted">Only used to check that the round reaches everyone. Never shown on its own.</p></details>
    <label class="consent"><input type="checkbox" id="consent" ${me.consent ? 'checked' : ''}> I understand how my input is used and want to take part.</label>
    <div class="nav"><span></span><span class="navr">
      ${ok ? '' : `<span class="small muted">${me.group ? 'Tick the box to continue' : 'Choose your group to continue'}</span>`}
      <button class="btn" data-go="learn" ${ok ? '' : 'disabled'}>Read the background first</button>
      <button class="btn primary" data-go="pairs" ${ok ? '' : 'disabled'}>Start contributing →</button></span></div>`;
};

VIEWS.learn = () => {
  const me = ME();
  const topics = ['h4', 'h10', 'h12'].map(k => {
    const h = HOTS[k], f = C.clauseOfHot(k); if (!f) return '';
    const full = C.clauseText(f.c), at = full.indexOf(h.base);
    const marked = at >= 0 ? esc(full.slice(0, at)) + `<mark>${esc(h.base)}</mark>` + esc(full.slice(at + h.base.length)) : esc(full);
    const opts = [`<div class="opt keep"><span class="lbl">Keep as is</span><span class="w">${esc(h.base)}</span><span class="r">The current wording, from the Apertus Charter.</span></div>`]
      .concat(h.edits.slice(0, 3).map(e => `<div class="opt"><span class="lbl">${verbOf[e.op]}</span><span class="w">${e.op === 'delete' ? '<del>' + esc(h.base) + '</del>' : `<ins>${esc(e.text)}</ins>`}</span><span class="r">${esc(e.why)}</span></div>`));
    return `<div class="topic"><p class="lbl">Clause ${f.c[0]} · ${esc(f.a.t)}</p><p class="clause">${marked}</p><div class="opts">${opts.join('')}</div></div>`;
  }).join('');
  const answered = C.QUESTIONS.filter(q => me.before[q.id]).length;
  return `<p class="eyebrow">Optional</p><h3>Background, if you want it</h3>
    <p class="intro">You can contribute without reading this. It shows the three clauses where members disagree most, with the strongest reason for each option in their own words. <button class="link" data-go="pairs">Skip to contributing →</button></p>
    ${topics}
    <div class="topic"><p class="lbl">Optional · 4 questions</p><h4>What do you think now?</h4>
      <p class="small muted" style="max-width:42em">If you answer these now and again at the end, you can see whether your views moved. The combined change shows whether taking part helps people form a view. There are no right answers.</p>
      <div data-survey="before">${C.QUESTIONS.map(q => scaleQ(me.before, q, 'before', AGREE7)).join('')}</div>
      <p class="small muted" data-answered>${answered} of ${C.QUESTIONS.length} answered</p></div>
    ${navHTML('join', 'pairs', 'Start contributing')}`;
};

// Compare answers: one situation at a time, Smartvote style.
VIEWS.pairs = () => {
  const me = ME(), list = C.pairs();
  if (me.pairView === 'match') return matchView(list);
  const i = Math.min(me.pairAt || 0, list.length - 1), p = list[i];
  const done = C.myCounts().pairs, choice = me.pairs[p.id];
  const A = p.flip ? { k: 'alt', t: p.alt } : { k: 'cur', t: p.cur }, Bx = p.flip ? { k: 'cur', t: p.cur } : { k: 'alt', t: p.alt };
  const dots = list.map((x, j) => `<button class="pd ${j === i ? 'on' : ''} ${me.pairs[x.id] && me.pairs[x.id] !== 'skip' ? 'done' : ''}" data-pair="${j}" aria-label="Situation ${j + 1}${me.pairs[x.id] ? ', answered' : ''}"></button>`).join('');
  const picked = choice && choice !== 'skip';
  const card = (lab, side) => `<div class="ans ${choice === side.k ? 'chosen' : ''}">
      <span class="lbl">Answer ${lab}${choice === side.k ? ' · your choice' : ''}</span><p>${esc(side.t)}</p>
      ${picked ? `<span class="src ${side.k}">${side.k === 'cur' ? `Follows the current clause ${esc(p.clause)}` : 'Follows a proposed change'}</span>` : ''}
      ${!choice ? `<button class="btn" data-choose="${side.k}">${lab} is better</button>` : ''}</div>`;
  let reveal = '';
  if (picked) {
    const r = p.r, verdict = {
      'charter-lacking': `Every group prefers the change. <b>Clause ${esc(p.clause)} may be lacking here</b>, so it is flagged for an amendment.`,
      'charter-holds': `Every group prefers the current wording. The charter holds up in this situation.`,
      'split': `The groups disagree here, so this situation is shown in the background for clause ${esc(p.clause)}.`,
      'needs': `Not enough answers yet in every group to tell.`
    }[r.verdict];
    reveal = `<div class="reveal fade">
      <p class="small"><b>The change behind it:</b> clause ${esc(p.clause)}, ${diffHTML({ op: p.op, base: p.base, text: p.altText })}</p>
      <p class="lbl" style="margin-top:12px">Share preferring the change, by group</p>
      ${bars(C.GROUPS.map(g => ({ name: g.name, v: r.per[g.id].alt_share, n: r.per[g.id].n, me: g.id === me.group })))}
      <p class="verdict ${r.verdict}">${verdict}</p>
      <div class="row"><button class="link" data-choose="undo">Change my answer</button>
        ${r.verdict === 'charter-lacking' || r.verdict === 'split' ? `<button class="btn" data-proposehot="${esc(p.hot)}">Propose a wording</button>` : ''}</div></div>`;
  }
  return `<p class="eyebrow">Main activity · about 1 minute each</p><h3>Which answer is better?</h3>
    <p class="intro">One situation, two ways the AI could respond. One follows the current charter and one follows a change members proposed. You find out which is which after you choose, so neither gets an advantage.</p>
    <div class="pairbar"><div class="dots" role="group" aria-label="Situations">${dots}</div>
      ${done >= 5 ? `<button class="btn" data-pairview="match">See your match</button>` : `<span class="small muted">${done} of ${C.TARGET.pairs} · your match appears after 5</span>`}</div>
    <div class="pair">
      <p class="lbl">Situation ${i + 1} of ${list.length} · ${esc(p.title)}</p>
      <p class="sit">“${esc(p.situation)}”</p>
      <div class="ab">${card('A', A)}${card('B', Bx)}</div>
      ${!choice ? `<div class="row alt"><button class="btn" data-choose="both">Both are fine</button><button class="btn" data-choose="neither">Neither</button><button class="link" data-choose="skip">Skip this one</button></div>` : ''}
      ${choice === 'skip' ? `<p class="small muted">Skipped. <button class="link" data-choose="undo">Answer it after all</button></p>` : ''}
      ${choice === 'both' || choice === 'neither' ? `<p class="small">You said: <b>${choice === 'both' ? 'both are fine' : 'neither'}</b>. <button class="link" data-choose="undo">Change my answer</button></p>` : ''}
      ${reveal}
    </div>
    <div class="nav"><button class="btn" data-pairstep="-1" ${i === 0 ? 'disabled' : ''}>← Previous</button>
      <span class="navr">${i < list.length - 1 ? `<button class="btn ${choice ? 'primary' : ''}" data-pairstep="1">Next situation →</button>` : `<button class="btn primary" data-go="rate">Rate suggestions →</button>`}</span></div>`;
};

function matchView(list) {
  const me = ME(), g = C.group(me.group);
  const mine = list.filter(p => me.pairs[p.id] === 'cur' || me.pairs[p.id] === 'alt');
  const withCur = mine.filter(p => me.pairs[p.id] === 'cur').length;
  const word = k => k === 'cur' ? 'Current' : 'Change';
  const rows = mine.map(p => {
    const you = me.pairs[p.id], most = p.r.overall >= 0.5 ? 'alt' : 'cur', grp = p.r.per[g.id].alt_share >= 0.5 ? 'alt' : 'cur';
    return `<tr><td><b>${esc(p.clause)}</b> ${esc(p.title)}<br><span class="small muted">“${esc(p.situation)}”</span></td>
      <td>${word(you)}</td><td>${word(grp)}</td><td>${word(most)}</td>
      <td>${you === most ? '<span class="pill good">Same</span>' : '<span class="pill mid">Differs</span>'}</td></tr>`;
  }).join('');
  const lacking = list.filter(p => p.r.verdict === 'charter-lacking');
  return `<p class="eyebrow">Compare answers</p><h3>Your match with the charter</h3>
    <p class="intro">You sided with the current charter in <b>${withCur} of ${mine.length}</b> situations, and with a proposed change in ${mine.length - withCur}. Here is how that compares with your group and with everyone, each group counted at its share.</p>
    <div class="tbl"><table class="cmp"><thead><tr><th>Clause and situation</th><th>You</th><th>${esc(g.name)}</th><th>Everyone</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
    ${lacking.length ? `<div class="flag"><p class="lbl">Where the charter may be lacking</p><p class="small">In ${lacking.length === 1 ? 'one situation' : lacking.length + ' situations'}, every group preferred the change over the current wording: ${lacking.map(p => `clause ${esc(p.clause)}`).join(', ')}. These clauses are flagged, and anyone can propose an amendment. <a href="results.html#check">See the charter check</a></p></div>` : ''}
    <div class="nav"><button class="btn" data-pairview="pairs">← Back to the situations</button><span class="navr"><button class="btn primary" data-go="rate">Rate suggestions →</button></span></div>`;
}

// Rate suggestions: fewest ratings from your group first; status shown after you rate.
let RATE_ORDER = null, RATE_SHOW = 5;
VIEWS.rate = () => {
  const me = ME(), all = C.suggestions().filter(s => !s.own);
  if (!RATE_ORDER) {
    const unrated = B.serveOrder(all.filter(s => !me.ratings[s.id]), me.group);
    RATE_ORDER = unrated.map(s => s.id).concat(all.filter(s => me.ratings[s.id]).map(s => s.id));
  }
  const byId = Object.fromEntries(all.map(s => [s.id, s]));
  const shown = RATE_ORDER.slice(0, RATE_SHOW).map(id => byId[id]).filter(Boolean);
  return `<p class="eyebrow">About 1 minute each</p><h3>Rate suggestions</h3>
    <p class="intro">Would each change make the charter better? Judge the change itself, not who might have proposed it. Suggestions that still need ratings from your group come first. You see where each one stands after you rate it.</p>
    <p class="count">${countText()}</p>
    <div class="rates">${shown.map(rateCard).join('')}</div>
    ${RATE_SHOW < RATE_ORDER.length ? `<div class="row"><button class="btn" data-more>Show 5 more</button><span class="small muted">${RATE_ORDER.length - RATE_SHOW} more waiting</span></div>` : ''}
    ${navHTML('pairs', 'concerns', 'Concerns')}`;
};
function countText() {
  const n = C.myCounts().ratings;
  return `<b>${n}</b> of ${C.TARGET.ratings} rated${n >= C.TARGET.ratings ? ' · that is your share for this round. More is always welcome.' : ''}`;
}
function rateCard(s) {
  const r = ME().ratings[s.id];
  const b = (v, l) => `<button data-rate="${esc(s.id)}" data-v="${v}" aria-pressed="${!!r && r.v === v}">${l}</button>`;
  let after = '';
  if (r) {
    const pool = r.v >= 0.5 ? C.HELP_REASONS : C.NOT_REASONS;
    after = `<div class="why"><span class="small muted">Why? Optional, and shown to the author only as a count.</span><div class="chips">${pool.map(x => `<button data-reason="${esc(s.id)}" data-r="${esc(x)}" aria-pressed="${(r.reasons || []).includes(x)}">${esc(x)}</button>`).join('')}</div></div>
      <div class="status">${pill(s.s.status)} <span class="small">${esc(s.why_status)}</span></div>
      <details class="more"><summary>By group</summary>${groupBars(s.s)}<p class="small muted">The line marks 60%, the share needed in every group.</p></details>`;
  }
  return `<article class="rate ${r ? 'done' : ''}" id="r-${esc(s.id)}">
    <span class="meta">Clause ${esc(s.clause)} · ${esc(s.title)} · ${verbOf[s.op]}</span>
    <p class="diff">${diffHTML(s)}</p>
    ${s.why ? `<p class="small">${esc(s.why)}</p>` : ''}
    ${s.test ? `<p class="tcase"><span class="lbl">Test case</span> “${esc(s.test.prompt)}” <span class="muted">Today:</span> ${esc(s.test.today)} <span class="muted">With the change:</span> ${esc(s.test.with_edit)}</p>` : ''}
    ${s.note ? `<div class="enote"><span class="lbl">Context note · ${esc(s.note.by)}</span><p class="small">${esc(s.note.text)}</p></div>` : ''}
    <div class="choices" role="group" aria-label="Your rating">${b(1, 'Helpful')}${b(0.5, 'Somewhat')}${b(0, 'Not helpful')}</div>
    ${after}</article>`;
}

VIEWS.concerns = () => {
  const list = C.concerns();
  return `<p class="eyebrow">A few minutes</p><h3>What worries you?</h3>
    <p class="intro">Describe, in your own words, something about how the AI behaves that worries you. Concerns are posted exactly as written. No AI reads or summarises them. Tap <i>me too</i> on the ones you share: the most shared become situations to compare and starting points for proposals.</p>
    <form class="cform" data-concern>
      <label for="cText" class="lbl">Your concern</label>
      <textarea id="cText" class="ta" maxlength="400" placeholder="For example: it gives medical advice to patients without saying when to ask a nurse."></textarea>
      <div class="row"><button class="btn primary" type="submit">Post concern</button><span class="small muted">Shown without your name.</span></div>
    </form>
    <p class="small muted" style="margin-top:22px">Ranked by <i>me too</i>, with each group counted at its share of the community, so a large group cannot fill the top alone.</p>
    <ul class="clist">${list.map(c => `<li>
      <p>${esc(c.text)}${c.own ? ' <span class="pill mid">Yours</span>' : ''}</p>
      <div class="row"><button class="metoo" data-metoo="${esc(c.id)}" aria-pressed="${c.mine || !!c.own}" ${c.own ? 'disabled' : ''}>Me too · ${c.n}</button>
        <span class="small muted">${c.groupsWith} of ${C.GROUPS.length} groups</span>
        <span class="cacts"><button class="link" data-c2p="${esc(c.id)}">Turn into a proposal</button>
        <button class="link" data-c2s="${esc(c.id)}">${ME().suggested[c.id] ? 'Suggested as a situation ✓' : 'Suggest as a situation'}</button></span></div></li>`).join('')}</ul>
    ${navHTML('rate', 'propose', 'Propose a change')}`;
};

VIEWS.propose = () => {
  const me = ME(), all = C.suggestions();
  const contested = all.filter(s => s.s.status === 'contested' && !s.own).slice(0, 3);
  const own = all.filter(s => s.own);
  const bridge = contested.length ? `<div class="bridgebox"><p class="lbl">Bridge challenge</p>
    <h4>These changes split the groups. Can you find a wording both sides accept?</h4>
    <p class="small muted">A bridge is a new proposal. It is rated like any other, and adopted only if every group finds it helpful.</p>
    ${contested.map(s => {
      const against = B.dissent(C.GROUPS, s.s)[0];
      return `<div class="bitem"><span class="meta">Clause ${esc(s.clause)} · ${esc(s.title)}</span><p class="diff">${diffHTML(s)}</p>
        <p class="small">${esc(s.why_status)}${against && against.why.length ? ` Main objection: ${esc(against.why.join(', ').toLowerCase())}.` : ''}</p>
        <div><button class="btn" data-bridge="${esc(s.id)}">Write a bridge</button></div></div>`;
    }).join('')}</div>` : '';
  const pre = me.prefill ? `<p class="note">From the concern: “${esc(me.prefill)}” <b>Select the words in a clause below that it is about.</b> <button class="link" data-clearprefill>Clear</button></p>` : '';
  const clauses = ARTS.map(a => `<div class="art"><p class="lbl">Article ${a.n} · ${esc(a.t)}</p>${a.cl.map(c =>
    `<div class="clrow"><p class="cl" data-cl="${c[0]}"><span class="num">${c[0]}</span> <span>${esc(C.clauseText(c))}</span></p>
     <button class="link" data-whole="${c[0]}">Reword this clause</button></div>`).join('')}</div>`).join('');
  return `<p class="eyebrow">Optional · 5 to 10 minutes</p><h3>Propose a change</h3>
    <p class="intro"><b>Select the words you want to change</b> in any clause below, then click <i>Propose a change</i>. You write the new wording, why, and at least one test case: a situation where your wording should change what the AI does.</p>
    ${pre}
    <div class="charter">${clauses}</div>
    ${own.length ? `<div class="mine"><p class="lbl">Your proposals</p>${own.map(s => `<div class="bitem"><span class="meta">Clause ${esc(s.clause)} · ${verbOf[s.op]}</span><p class="diff">${diffHTML(s)}</p>
      <div class="status">${pill(s.s.status)} <span class="small">Waiting for ratings from other members. ${s.tests.length} test case${s.tests.length === 1 ? '' : 's'}.</span></div></div>`).join('')}</div>` : ''}
    ${bridge}
    ${navHTML('concerns', 'wrap', 'Wrap up')}`;
};

VIEWS.wrap = () => {
  const me = ME(), n = C.myCounts();
  const hadBefore = C.QUESTIONS.some(q => me.before[q.id]);
  let survey = '';
  if (hadBefore) {
    const done = C.QUESTIONS.every(q => me.after[q.id]);
    survey = `<div class="topic"><p class="lbl">Optional · the same 4 questions again</p><h4>What do you think now?</h4>
      <div data-survey="after">${C.QUESTIONS.map(q => scaleQ(me.after, q, 'after', AGREE7)).join('')}</div>
      ${done ? `<div class="tbl"><table class="cmp"><thead><tr><th>Question</th><th>Before</th><th>Now</th></tr></thead><tbody>${C.QUESTIONS.map(q => {
        const a = me.before[q.id], b = me.after[q.id];
        return `<tr><td>${esc(q.q)}</td><td class="n">${a || '–'}</td><td class="n ${a && b && a !== b ? 'chg' : ''}">${b}${a && b && a !== b ? (b > a ? ' ↑' : ' ↓') : ''}</td></tr>`; }).join('')}</tbody></table></div>
        <p class="small muted">1 means strongly disagree, 7 strongly agree. Changing your view is normal.</p>` : ''}</div>`;
  }
  const fb = me.feedback;
  return `<p class="eyebrow">Optional</p><h3>Thank you</h3>
    <p class="intro">You compared <b>${n.pairs}</b> situations and rated <b>${n.ratings}</b> suggestions${n.concerns ? `, posted ${n.concerns} concern${n.concerns === 1 ? '' : 's'}` : ''}${n.proposals ? ` and proposed ${n.proposals} change${n.proposals === 1 ? '' : 's'}` : ''}. Your input is already in the <a href="results.html">results</a>.</p>
    ${survey}
    <div class="topic"><p class="lbl">Optional · 1 minute</p><h4>How was the process?</h4>
      <p class="small muted" style="max-width:42em">Organisers read this after every round and adjust the process. The combined answers are published with the results.</p>
      <div data-survey="feedback">${C.FEEDBACK.map(q => scaleQ(fb, q, 'feedback', AGREE5)).join('')}</div>
      <label class="lbl" for="fbText" style="display:block;margin-top:14px">Anything we should change?</label>
      <textarea id="fbText" class="ta" maxlength="600">${esc(fb.text || '')}</textarea>
      <div class="row"><button class="btn primary" data-sendfb>${fb.sent ? 'Update feedback' : 'Send feedback'}</button>${fb.sent ? '<span class="small muted">Sent. Thank you.</span>' : ''}</div></div>
    <div class="topic"><p class="lbl">What happens next</p>
      <ol class="timeline">
        <li><span class="d">22 November</span><p><b>Contributions close.</b> Every suggestion gets its status: endorsed when every group finds it helpful, contested when groups split.</p></li>
        <li><span class="d">One week</span><p><b>Bridges.</b> Members can write bridge wordings for contested changes, which are rated the same way.</p></li>
        <li><span class="d">New version</span><p><b>The endorsed changes become the new charter</b>, published with a dissent record: which groups were against each change, and why.</p></li>
        <li><span class="d">Checks</span><p><b>Test cases are confirmed</b> by two members each, and every change is checked against the safety floor that no amendment can lower.</p></li>
        <li><span class="d">Scorecard</span><p><b>The model is retrained</b> and tested on cases it never saw. The before and after scorecard is published.</p></li>
      </ol></div>
    <div class="nav"><button class="btn" data-go="propose">← Back</button><span class="navr"><a class="btn primary" href="results.html">See the results →</a></span></div>`;
};

// ---------- render ----------
function renderRail() {
  const me = ME(), joined = me.consent && me.group, n = C.myCounts();
  $('rail').innerHTML = STEPS.map((s, k) => {
    const cur = s.id === me.step, lock = !joined && s.id !== 'join';
    const done = s.id === 'join' ? joined : s.id === 'pairs' ? n.pairs >= C.TARGET.pairs : s.id === 'rate' ? n.ratings >= C.TARGET.ratings : s.id === 'wrap' ? me.feedback.sent : false;
    return `<li class="${cur ? 'cur' : done ? 'done' : ''}"><button data-go="${s.id}" ${cur ? 'aria-current="step"' : ''} ${lock ? 'disabled' : ''}>
      <span class="dot" aria-hidden="true">${done && !cur ? '✓' : k + 1}</span><span class="t">${esc(s.t)}</span><span class="s">${esc(s.s())}</span></button></li>`;
  }).join('');
  const share = (Math.min(n.pairs, C.TARGET.pairs) + Math.min(n.ratings, C.TARGET.ratings)) / (C.TARGET.pairs + C.TARGET.ratings);
  $('railFoot').innerHTML = joined ? `<span class="prog"><span style="width:${Math.round(share * 100)}%"></span></span>${Math.round(share * 100)}% of your share for this round` : 'Join to start';
}
function renderPhase() {
  const s = P() && P().space;
  $('phase').innerHTML = `<span class="pill good">Open for contributions</span><span><b>${s ? esc(s.name) : 'Lakeside Hospital (demo)'}</b> · until 22 November</span><a href="results.html">Results so far →</a>`;
}
let LAST = '';
function render(scroll) {
  const me = ME();
  if (!(me.consent && me.group)) me.step = 'join';
  renderRail(); renderPhase();
  const pane = $('pane');
  pane.innerHTML = VIEWS[me.step]();
  // Animate only when the view changes, not on every click inside it.
  const key = me.step + (me.step === 'pairs' ? ':' + (me.pairView || '') + (me.pairAt || 0) : '');
  if (key !== LAST) { pane.classList.remove('fade'); void pane.offsetWidth; pane.classList.add('fade'); LAST = key; }
  if (scroll) {
    const top = $('main').getBoundingClientRect().top + scrollY - 12;
    if (scrollY > top) scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
}
function go(id) {
  const me = ME();
  if (id !== 'join' && !(me.consent && me.group)) return;
  if (id === 'rate' && me.step !== 'rate') { RATE_ORDER = null; RATE_SHOW = 5; }
  if (id === 'pairs') me.pairView = 'pairs';
  me.step = id; save(); render(true);
  try { if (location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id); } catch {}
}
function rerenderCard(id) {
  const s = C.suggestions().find(x => x.id === id), el = $('r-' + id);
  if (s && el) el.outerHTML = rateCard(s);
  const c = document.querySelector('.count'); if (c) c.innerHTML = countText();
  renderRail();
}
function proposeHot(k, bridge) {
  if (!window.PC) return;
  const f = PC.clauseOfHot(k); if (!f) return;
  const base = HOTS[k].base, start = PC.hotOffset(f.cl, k);
  PC.propose({ number: f.cl[0], quote: base, start, end: start + base.length, insert: !base, bridge, prefill: bridge ? '' : ME().prefill || '' });
}

// ---------- events ----------
document.addEventListener('click', ev => {
  const me = ME(), t = ev.target;
  const g = t.closest('[data-go]'); if (g && !g.disabled) return go(g.dataset.go);
  if (t.closest('[data-reset]')) { C.reset(); try { localStorage.removeItem('pc-demo-proposals'); } catch {} RATE_ORDER = null; toast('Started over.'); return render(); }
  const ch = t.closest('[data-choose]');
  if (ch) {
    const list = C.pairs(), at = Math.min(me.pairAt || 0, list.length - 1), p = list[at], v = ch.dataset.choose;
    if (v === 'undo') delete me.pairs[p.id]; else me.pairs[p.id] = v;
    if (v !== 'undo' && v !== 'skip') saveSpace('pair:' + p.id, { choice: v });
    if (v === 'skip' && at < list.length - 1) me.pairAt = at + 1;
    save(); return render();
  }
  const ps = t.closest('[data-pairstep]');
  if (ps) { const n = C.pairs().length; me.pairAt = Math.max(0, Math.min(n - 1, (me.pairAt || 0) + +ps.dataset.pairstep)); save(); return render(true); }
  const pd = t.closest('[data-pair]'); if (pd) { me.pairAt = +pd.dataset.pair; save(); return render(); }
  const pv = t.closest('[data-pairview]'); if (pv) { me.pairView = pv.dataset.pairview; save(); return render(true); }
  const ph = t.closest('[data-proposehot]'); if (ph) return proposeHot(ph.dataset.proposehot);
  const r = t.closest('[data-rate]');
  if (r) {
    const id = r.dataset.rate, v = +r.dataset.v, old = me.ratings[id];
    me.ratings[id] = { v, reasons: old && (old.v >= 0.5) === (v >= 0.5) ? old.reasons : [] }; save();
    saveSpace('rating:' + id, me.ratings[id]);
    return rerenderCard(id);
  }
  const rr = t.closest('[data-reason]');
  if (rr) {
    const x = me.ratings[rr.dataset.reason], w = rr.dataset.r; if (!x) return;
    x.reasons = (x.reasons || []).includes(w) ? x.reasons.filter(y => y !== w) : (x.reasons || []).concat([w]); save();
    return rerenderCard(rr.dataset.reason);
  }
  if (t.closest('[data-more]')) { RATE_SHOW += 5; return render(); }
  const mt = t.closest('[data-metoo]');
  if (mt) { const id = mt.dataset.metoo; if (me.metoo[id]) delete me.metoo[id]; else me.metoo[id] = true; save(); return render(); }
  const c2p = t.closest('[data-c2p]');
  if (c2p) { const c = C.concerns().find(x => x.id === c2p.dataset.c2p); me.prefill = c ? c.text : ''; save(); return go('propose'); }
  const c2s = t.closest('[data-c2s]');
  if (c2s) { me.suggested[c2s.dataset.c2s] = true; save(); toast('Suggested. Organisers turn the most shared concerns into new situations to compare.'); return render(); }
  if (t.closest('[data-clearprefill]')) { me.prefill = ''; save(); return render(); }
  const br = t.closest('[data-bridge]');
  if (br) {
    const s = C.suggestions().find(x => x.id === br.dataset.bridge); if (!s) return;
    const d = B.dissent(C.GROUPS, s.s)[0];
    return proposeHot(s.hot, [{ who: 'The change', text: s.op === 'delete' ? 'Remove “' + s.base + '”' : s.text },
      { who: 'Why supporters want it', text: s.why }].concat(d && d.why.length ? [{ who: `${d.group.name}, mostly against`, text: d.why.join(', ') }] : []));
  }
  const wh = t.closest('[data-whole]');
  if (wh && window.PC) {
    const f = C.clauseByNumber(wh.dataset.whole), full = C.clauseText(f.c);
    return PC.propose({ number: f.c[0], quote: full, start: 0, end: full.length, insert: false, prefill: me.prefill || '' });
  }
  if (t.closest('[data-sendfb]')) {
    me.feedback.text = ($('fbText') || {}).value || ''; me.feedback.sent = true; save();
    saveSpace('feedback', me.feedback); toast('Thank you. Your feedback is in.'); return render();
  }
});
document.addEventListener('submit', ev => {
  if (!ev.target.matches('[data-concern]')) return;
  ev.preventDefault();
  const v = $('cText').value.trim();
  if (v.length < 10) return toast('Write a little more, so others understand the concern.');
  ME().concerns.push({ id: 'own-' + Date.now().toString(36), text: v, at: new Date().toISOString() }); save();
  toast('Posted. Others can now add me too.'); render();
});
document.addEventListener('change', ev => {
  const me = ME(), t = ev.target;
  if (t.name === 'group') { me.group = t.value; save(); return render(); }
  if (t.id === 'consent') { me.consent = t.checked; save(); if (t.checked) saveSpace('consent', { group: me.group, profile: me.profile }); return render(); }
  if (t.dataset.pf) { me.profile[t.dataset.pf] = t.value || undefined; save(); return; }
  const sv = t.closest('[data-survey]');
  if (sv && t.type === 'radio') {
    const kind = sv.dataset.survey, set = kind === 'feedback' ? me.feedback : me[kind];
    set[t.dataset.q] = +t.value; save();
    if (kind !== 'feedback') saveSpace(kind === 'before' ? 'survey_pre' : 'survey_post', me[kind]);
    if (kind === 'after' && C.QUESTIONS.every(q => me.after[q.id])) return render();
    const a = document.querySelector('[data-answered]');
    if (kind === 'before' && a) a.textContent = `${C.QUESTIONS.filter(q => me.before[q.id]).length} of ${C.QUESTIONS.length} answered`;
  }
});
document.addEventListener('pc:proposed', () => { ME().prefill = ''; save(); render(); });
document.addEventListener('pc:ready', () => render());
const fromHash = location.hash.slice(1);
if (STEPS.some(s => s.id === fromHash)) ME().step = fromHash;
render();
})();
