// Take part page (participate.html): four simple steps.
//   1. Start: what you will do, optional profile questions, consent.
//   2. Rate changes: one suggested change at a time, with an example. Yes / partly / no.
//   3. Suggest a change (optional): pick a sentence or select words.
//   4. Done.
// Scores come from bridge.js; the sample round and this browser's input from community.js;
// all text from lang/*.js through T().
(() => {
'use strict';
const C = window.Community, B = window.Bridge;
const $ = id => document.getElementById(id);
const { esc } = C;
const ME = () => C.me;
const save = () => C.save();
const STEPS = ['join', 'rate', 'propose', 'done'];
const VALUES = [[1, 'yes'], [0.5, 'partly'], [0, 'no']];

// ---------- saving to the database (when connected and signed in) ----------
const P = () => window.PC && PC.state;
const live = () => !!(window.PC && PC.live && P().user && P().space && P().roles.has('member'));
async function saveJudgement(kind, value) {
  if (!live()) return;
  const s = P();
  const { error } = await s.db.from('judgement').upsert(
    { space_id: s.space.id, user_id: s.user.id, target_type: 'space', target_id: s.space.id, kind, value },
    { onConflict: 'user_id,target_type,target_id,kind' });
  if (error) PC.toast(T('acct.saveError', { msg: error.message }));
}
async function saveProfile() {
  if (!live()) return;
  const s = P(), me = ME();
  const { error } = await s.db.from('profile').upsert({ user_id: s.user.id, demographics: me.profile || {}, consent: !!me.consent, updated_at: new Date().toISOString() });
  if (error) PC.toast(T('acct.saveError', { msg: error.message }));
}

// ---------- the order of changes to rate (fewest answers first, fixed for this visit) ----------
let ORDER = null;
// Answers given during this visit. Only these show as a pressed button; answers from an
// earlier visit start unselected, with a short note, so no button ever looks pre-chosen.
const SESSION = new Set();
function order() {
  if (!ORDER) {
    const all = C.suggestions().filter(s => !s.own);
    const me = ME();
    ORDER = B.serveOrder(all.filter(s => me.ratings[s.id] == null)).concat(all.filter(s => me.ratings[s.id] != null)).map(s => s.id);
  }
  return ORDER;
}

// ---------- views ----------
const VIEWS = {};

VIEWS.join = () => {
  const me = ME(), p = me.profile;
  let acct = '';
  if (window.PC && PC.live) {
    const s = P();
    if (!s.user) acct = `<p class="note">${esc(T('join.signin'))} <button class="btn" data-act="signin">${esc(T('join.signinBtn'))}</button></p>`;
    else if (!s.roles.has('member')) acct = `<p class="note">${esc(T('join.notMember', { email: s.user.email }))} <button class="btn primary" data-act="join">${esc(T('join.joinBtn'))}</button></p>`;
    else acct = `<p class="note">${esc(T('join.signedIn', { email: s.user.email }))}</p>`;
  } else acct = `<p class="note">${T('join.sampleNote')} <button class="link" data-reset>${esc(T('join.startOver'))}</button></p>`;
  const sel = q => `<label>${esc(C.qLabel(q))}<select data-pf="${q.id}"><option value="">${esc(T('join.preferNot'))}</option>${q.options.map(o =>
    `<option value="${o}" ${p[q.id] === o ? 'selected' : ''}>${esc(C.oLabel(q, o))}</option>`).join('')}</select></label>`;
  return `<p class="eyebrow">${esc(T('join.eyebrow'))}</p><h3>${esc(T('join.h'))}</h3>
    <ul class="facts"><li>${T('join.p1')}</li><li>${T('join.p2')}</li><li>${T('join.p3')}</li><li>${T('join.p4')}</li></ul>
    ${acct}
    <div class="opt-q"><p class="lbl">${esc(T('join.optional'))}</p>
      <p class="small muted">${esc(T('join.optionalWhy'))}</p>
      <div class="form-grid">${C.DEMOGRAPHICS.map(sel).join('')}</div></div>
    <label class="consent"><input type="checkbox" id="consent" ${me.consent ? 'checked' : ''}> ${esc(T('join.consent'))}</label>
    <div class="nav"><span></span><span class="navr">${me.consent ? '' : `<span class="small muted">${esc(T('join.tick'))}</span>`}
      <button class="btn primary big" data-go="rate" ${me.consent ? '' : 'disabled'}>${esc(T('join.start'))} →</button></span></div>`;
};

VIEWS.rate = () => {
  const me = ME(), ids = order(), all = C.suggestions(), byId = Object.fromEntries(all.map(s => [s.id, s]));
  if (!ids.length) return `<p>${esc(T('results.none'))}</p>`;
  const i = Math.min(me.at || 0, ids.length - 1), s = byId[ids[i]], mine = me.ratings[s.id];
  const now = SESSION.has(s.id), label = v => T('answer.' + (VALUES.find(x => x[0] === v) || [0, 'no'])[1]);
  const ex = s.test ? `<div class="ex"><p class="lbl">${esc(T('rate.example'))}</p>
      <p><span class="muted">${esc(T('rate.asks'))}</span> <b>“${esc(s.test.prompt)}”</b></p>
      <dl><dt>${esc(T('rate.today'))}</dt><dd>${esc(s.test.today)}</dd><dt>${esc(T('rate.after'))}</dt><dd>${esc(s.test.with_edit)}</dd></dl></div>` : '';
  const note = s.note ? `<div class="enote"><p class="lbl">${esc(T('rate.note', { who: s.note.by }))}</p><p class="small">${esc(s.note.text)}</p></div>` : '';
  const after = mine != null ? `<div class="after fade"><p class="small">${esc(C.othersLine(s.s))}</p>${C.supportBar(s.s)}${C.legend()}
      <details class="more"><summary>${esc(T('demo.by'))}</summary>${C.breakdownHTML(s.ratings)}</details></div>` : '';
  const n = C.myCounts().ratings, last = i >= ids.length - 1;
  return `<p class="eyebrow">${esc(T('rate.eyebrow', { i: i + 1, n: ids.length }))} · ${esc(T('common.article', { n: s.art.n }))} · ${esc(s.title)}</p>
    <div class="sentence"><p class="lbl">${esc(T('rate.changed'))}</p><p class="cl-text">${C.changedClause(s)}</p><p class="key">${T('rate.legend')}</p></div>
    ${s.why ? `<p class="whyline"><span class="lbl">${esc(T('rate.why'))}</span>${esc(s.why)}</p>` : ''}
    ${ex}${note}
    <h4 class="ask">${esc(T('rate.q'))}</h4>
    <div class="choices" role="group" aria-label="${esc(T('rate.q'))}">${VALUES.map(([v, k]) =>
      `<button data-rate="${esc(s.id)}" data-v="${v}" aria-pressed="${now && mine === v}">${esc(T('answer.' + k))}</button>`).join('')}
      ${!now ? `<button class="link skip" ${last ? 'data-go="propose"' : 'data-step="1"'}>${esc(T('rate.skipLink'))}</button>` : ''}</div>
    ${mine != null && !now ? `<p class="small muted earlier">${esc(T('rate.earlier', { a: label(mine) }))}</p>` : ''}
    ${mine === 0.5 && now ? improveBox(s) : ''}
    ${after}
    <p class="small muted count">${esc(T('rate.count', { n }))}${last && mine != null ? ' ' + esc(T('rate.allDone')) : ''}</p>
    <div class="nav"><button class="btn" data-step="-1" ${i === 0 ? 'disabled' : ''}>${esc(T('rate.prev'))}</button>
      <span class="navr">${!last ? `<button class="btn ${mine != null ? 'primary' : ''}" data-step="1">${esc(mine != null ? T('rate.nextChange') : T('common.skip') + ' →')}</button>` : ''}</span></div>
    ${n >= 3 || last ? `<div class="nextstep"><p>${esc(T('rate.toProposeNote'))}</p><button class="btn ${last ? 'primary' : ''}" data-go="propose">${esc(T('rate.toPropose'))}</button></div>` : ''}`;
};

// "Partly": invite people to write the sentence their way, starting from the suggested version.
function improveBox(s) {
  if ((ME().improved || {})[s.id]) return `<div class="improve done fade"><p>✓ ${esc(T('rate.improveDone'))}</p></div>`;
  return `<div class="improve fade"><label for="improveText" class="ih">${esc(T('rate.improveH'))}</label>
    <p class="small muted">${esc(T('rate.improveP'))}</p>
    <textarea id="improveText" rows="3">${esc(C.appliedClause ? C.appliedClause(s) : s.text || '')}</textarea>
    <div class="row"><button class="btn primary" data-improve="${esc(s.id)}">${esc(T('rate.improveSend'))}</button><span class="err" role="alert"></span></div></div>`;
}

let OPEN = 'a4';   // the article opened in the suggestion view
VIEWS.propose = () => {
  const own = C.suggestions().filter(x => x.own);
  const arts = ARTS.map(a => `<details class="artd" id="art-${a.id}" ${OPEN === a.id ? 'open' : ''}>
    <summary><span class="n">${a.n}</span><span class="t">${esc(a.t)}</span><span class="cnt">${esc(T('propose.sentences', { n: a.cl.length }))}</span></summary>
    ${a.cl.map(c => `<div class="sent"><p class="cl" data-cl="${c[0]}"><span class="num">${c[0]}</span> <span>${esc(C.clauseText(c))}</span></p>
      <button class="btn small" data-whole="${c[0]}">✎ ${esc(T('propose.change'))}</button></div>`).join('')}</details>`).join('');
  return `<p class="eyebrow">${esc(T('propose.eyebrow'))}</p><h3>${esc(T('propose.h'))}</h3>
    <p class="intro">${esc(T('propose.intro'))}</p>
    <ol class="how3"><li><span>1</span>${esc(T('propose.step1'))}</li><li><span>2</span>${esc(T('propose.step2'))}</li><li><span>3</span>${esc(T('propose.step3'))}</li></ol>
    <div class="arts">${arts}</div>
    <p class="small muted tip">${esc(T('propose.tip'))}</p>
    ${own.length ? `<div class="mine"><p class="lbl">${esc(T('propose.mine'))}</p>${own.map(x => `<div class="bitem">
      <span class="meta">${esc(T('common.clause', { n: x.clause }))}</span><p class="cl-text">${C.changedClause(x)}</p>
      <span class="small muted">${esc(T('propose.waiting'))}</span></div>`).join('')}</div>` : ''}
    <div class="nav"><button class="btn" data-go="rate">← ${esc(T('take.steps.rate'))}</button><span class="navr"><button class="btn primary" data-go="done">${esc(T('propose.finish'))}</button></span></div>`;
};

VIEWS.done = () => {
  const n = C.myCounts();
  return `<h3>${esc(T('done.h'))}</h3>
    <p class="intro">${esc(T('done.p', { n: n.ratings }))}${n.proposals ? ' ' + esc(T('done.proposed', { n: n.proposals })) : ''}</p>
    <div class="topic"><p class="lbl">${esc(T('done.next'))}</p>
      <ol class="timeline"><li>${esc(T('done.n1'))}</li><li>${esc(T('done.n2'))}</li><li>${esc(T('done.n3'))}</li></ol></div>
    <div class="nav"><button class="btn" data-go="rate">${esc(T('done.more'))}</button><span class="navr"><a class="btn primary" href="results.html">${esc(T('done.results'))}</a></span></div>`;
};

// ---------- render ----------
function renderSteps() {
  const me = ME(), cur = STEPS.indexOf(me.step);
  $('steps').innerHTML = STEPS.map((id, k) => `<li class="${k === cur ? 'cur' : k < cur ? 'done' : ''}">
    <button data-go="${id}" ${k === cur ? 'aria-current="step"' : ''} ${!me.consent && id !== 'join' ? 'disabled' : ''}><span class="dot">${k < cur ? '✓' : k + 1}</span>${esc(T('take.steps.' + id))}</button></li>`).join('');
}
let LAST = '';
function render(scroll) {
  const me = ME();
  if (!me.consent) me.step = 'join';
  if (!VIEWS[me.step]) me.step = 'join';
  renderSteps();
  const pane = $('pane');
  pane.innerHTML = VIEWS[me.step]();
  const key = me.step + (me.step === 'rate' ? ':' + me.at : '');
  if (key !== LAST) { pane.classList.remove('fade'); void pane.offsetWidth; pane.classList.add('fade'); LAST = key; }
  if (scroll) {
    const top = $('main').getBoundingClientRect().top + scrollY - 12;
    if (scrollY > top) scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
}
function go(id) {
  const me = ME();
  if (id !== 'join' && !me.consent) return;
  me.step = id; save(); render(true);
  try { if (location.hash.slice(1) !== id) history.replaceState(null, '', location.pathname + location.search + '#' + id); } catch {}
}

// ---------- events ----------
document.addEventListener('click', ev => {
  const me = ME(), t = ev.target;
  const g = t.closest('[data-go]'); if (g && !g.disabled) return go(g.dataset.go);
  if (t.closest('[data-reset]')) { C.reset(); try { localStorage.removeItem('pc-demo-proposals'); } catch {} ORDER = null; return render(); }
  const r = t.closest('[data-rate]');
  if (r) {
    const id = r.dataset.rate, v = +r.dataset.v;
    me.ratings[id] = v; SESSION.add(id); save();
    saveJudgement('rating:' + id, { v });
    return render();
  }
  const im = t.closest('[data-improve]');
  if (im && window.PC) {
    const s = C.suggestions().find(x => x.id === im.dataset.improve); if (!s) return;
    const box = im.closest('.improve'), err = box.querySelector('.err'), text = $('improveText').value.trim();
    const f = C.clauseByNumber(s.clause), full = C.clauseText(f.c);
    if (!text || text === full.trim() || text === C.appliedClause(s).trim()) { err.textContent = T('rate.improveSame'); return; }
    im.disabled = true;
    PC.submitProposal({ clause: s.clause, op: 'replace', new_text: text, rationale: '',
      anchor: { quote: full, start: 0, end: full.length, lang: window.PC_LANG || 'en', improves: s.id } })
      .then(() => { (me.improved = me.improved || {})[s.id] = true; save(); render(); })
      .catch(e => { im.disabled = false; err.textContent = e.message || String(e); });
    return;
  }
  const tile = t.closest('[data-art]');
  if (tile) {
    OPEN = tile.dataset.art; render();
    const el = $('art-' + OPEN); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    return;
  }
  const st = t.closest('[data-step]');
  if (st) { me.at = Math.max(0, Math.min(order().length - 1, (me.at || 0) + +st.dataset.step)); save(); return render(true); }
  const wh = t.closest('[data-whole]');
  if (wh && window.PC) {
    const f = C.clauseByNumber(wh.dataset.whole), full = C.clauseText(f.c);
    return PC.propose({ number: f.c[0], quote: full, start: 0, end: full.length, insert: false });
  }
});
document.addEventListener('change', ev => {
  const me = ME(), t = ev.target;
  if (t.id === 'consent') { me.consent = t.checked; save(); if (t.checked) { saveJudgement('consent', { at: new Date().toISOString(), lang: window.PC_LANG }); saveProfile(); } return render(); }
  if (t.dataset.pf) { if (t.value) me.profile[t.dataset.pf] = t.value; else delete me.profile[t.dataset.pf]; save(); if (me.consent) saveProfile(); }
});
document.addEventListener('toggle', ev => { if (ev.target.classList && ev.target.classList.contains('artd') && ev.target.open) OPEN = ev.target.id.replace('art-', ''); }, true);
document.addEventListener('pc:proposed', () => render());
document.addEventListener('pc:ready', () => render());
const fromHash = location.hash.slice(1);
if (STEPS.includes(fromHash)) ME().step = fromHash;
render();
})();
