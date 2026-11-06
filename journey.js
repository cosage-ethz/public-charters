// Guided participation journey (participate.html), modelled on Deliberative Polling:
// join, survey before, balanced briefing, contribute, survey after, what happens next.
// Progress is kept in this browser; with a database configured, answers are also saved
// as judgements (surveys and points on the space, ratings on proposals).
(() => {
'use strict';
const KEY = 'pc-journey';
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const toast = msg => window.PC ? PC.toast(msg) : null;

// ---------- content ----------
const STEPS = [
  { id: 'join',   t: 'Join',              s: 'Agree how your input is used' },
  { id: 'before', t: 'What you think now', s: '6 quick questions' },
  { id: 'learn',  t: 'Learn',             s: 'The main options, side by side' },
  { id: 'act',    t: 'Contribute',        s: 'Rate, prioritise, propose' },
  { id: 'after',  t: 'What you think now', s: 'The same questions again' },
  { id: 'next',   t: 'What happens next', s: 'Scoring, panel, new model' }
];
const AGREE = ['Strongly disagree', 'Strongly agree'];
const QUESTIONS = [
  { id: 'refuse',   q: 'When a request could be harmful, the AI should refuse, even if that also blocks some honest questions.', ends: AGREE },
  { id: 'adults',   q: 'The AI should treat people as capable adults who make their own choices, even risky ones.', ends: AGREE },
  { id: 'humans',   q: 'In serious decisions, such as medical ones, a named person should always make the final call, not the AI.', ends: AGREE },
  { id: 'say',      q: 'The AI should say openly when it holds back information or applies a safety rule.', ends: AGREE },
  { id: 'depend',   q: 'The AI should step in when it notices someone relying on it too much.', ends: AGREE },
  { id: 'know',     q: 'How well do you understand how AI models like this one are trained?', ends: ['Not at all', 'Very well'] }
];
// Briefing topics: clauses with rival proposals in the sample data.
const TOPICS = ['h4', 'h10', 'h12'];
// Priority points: n points on one clause cost n² credits.
const BUDGET = 36;
const PT_CLAUSES = ['4.1', '4.3', '8.2', '8.3', '10.1', '10.3'];
const verbOf = { replace: 'Reword', insert: 'Add', delete: 'Remove' };

const findClause = k => { for (const a of ARTS) for (const c of a.cl) if (c[1].some(p => p.h === k)) return { a, c }; return null; };
const byNumber = n => { for (const a of ARTS) for (const c of a.cl) if (c[0] === n) return { a, c }; return null; };
const clauseText = c => c[1].map(p => typeof p === 'string' ? p : HOTS[p.h].base).join('');
const readingName = v => { for (const g of Object.values(GROUPS)) { const x = g.list.find(y => y.id === v); if (x) return x.name; } return 'members'; };

// ---------- state ----------
const blank = () => ({ step: 0, done: [], consent: false, profile: {}, before: {}, after: {}, read: false, ratings: {}, points: {}, tab: 'rate' });
let J;
try { J = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch { J = blank(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(J)); } catch {} };

// ---------- live saving ----------
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

// Proposals to rate: from the database when connected, else the sample data.
let PROPS = null;
async function proposals() {
  if (PROPS) return PROPS;
  if (live()) {
    const { data } = await P().db.from('proposal').select('id, op, anchor, new_text, rationale, clause:clause_id(number)')
      .eq('space_id', P().space.id).order('created_at', { ascending: false }).limit(30);
    PROPS = (data || []).map(p => ({ id: p.id, live: true, clause: p.clause && p.clause.number, op: p.op,
      base: p.anchor && p.anchor.quote || '', text: p.new_text, why: p.rationale, by: '' }));
  } else {
    const all = [];
    Object.entries(HOTS).forEach(([k, h]) => h.edits.forEach((e, i) => {
      const f = findClause(k);
      all.push({ id: `${k}-${i}`, clause: f ? f.c[0] : '', op: e.op, base: h.base, text: e.text, why: e.why, by: readingName(e.v) });
    }));
    // A fixed shuffle, so everyone sees proposals in a different order from how they were written.
    PROPS = all.map((p, i) => [((i * 7919) % 97), p]).sort((a, b) => a[0] - b[0]).map(x => x[1]).slice(0, 8);
  }
  return PROPS;
}

// ---------- rendering ----------
function renderRail() {
  $('rail').innerHTML = STEPS.map((s, i) => {
    const cls = i === J.step ? 'cur' : J.done.includes(s.id) ? 'done' : '';
    const mark = J.done.includes(s.id) && i !== J.step ? '✓' : i + 1;
    return `<li class="${cls}"><button data-go="${i}" ${i === J.step ? 'aria-current="step"' : ''}>
      <span class="dot" aria-hidden="true">${mark}</span><span class="t">${esc(s.t)}</span><span class="s">${esc(s.s)}</span></button></li>`;
  }).join('');
  $('railFoot').textContent = `${J.done.length} of ${STEPS.length} steps done`;
}
function renderPhase() {
  const s = P() && P().space, st = (s && s.settings) || {};
  const phase = st.phase || 'open', until = st.open_until || '22 November';
  const label = { setup: 'Setting up', open: 'Open track', panel: 'Panel deliberating', published: 'New version published' }[phase] || 'Open track';
  const where = s ? esc(s.name) : 'Apertus Charter (demo)';
  $('phase').innerHTML = `<span class="pill good">${label}</span><span><b>${where}</b>${phase === 'open' ? ` · contributions open until ${esc(until)}` : ''}</span>`;
}

function scaleHTML(set, q) {
  const v = set[q.id];
  return `<div class="q" role="group" aria-labelledby="q-${q.id}"><p id="q-${q.id}">${esc(q.q)}</p>
    <div class="scale">${[1, 2, 3, 4, 5, 6, 7].map(n => `<label><input type="radio" name="${q.id}" value="${n}" data-n="${n}" ${v === n ? 'checked' : ''} aria-label="${n} of 7"></label>`).join('')}</div>
    <div class="ends"><span>${esc(q.ends[0])}</span><span>${esc(q.ends[1])}</span></div></div>`;
}
function navHTML(nextLabel, canNext, hint) {
  return `<div class="nav">${J.step > 0 ? '<button class="btn" data-go="prev">← Back</button>' : '<span></span>'}
    <span style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">${hint ? `<span class="small muted">${esc(hint)}</span>` : ''}
    ${nextLabel ? `<button class="btn primary" data-go="next" ${canNext ? '' : 'disabled'}>${esc(nextLabel)}</button>` : ''}</span></div>`;
}

const VIEWS = {
  join() {
    const s = P();
    let acct = '';
    if (window.PC && PC.live) {
      if (!s.user) acct = `<p class="note">Sign in with the email address your invitation was sent to. <button class="btn" data-act="signin" style="margin-left:6px">Sign in</button></p>`;
      else if (!s.roles.has('member')) acct = `<p class="note">You are signed in as ${esc(s.user.email)}, but not yet a member of this space. Open your invitation link, or ask an organiser for one.</p>`;
      else acct = `<p class="note">Signed in as ${esc(s.user.email)}. Your answers are saved to this space.</p>`;
    } else acct = `<p class="note"><b>Demo mode.</b> No database is connected, so your answers stay in this browser. Everything else works as it will for members.</p>`;
    const p = J.profile;
    const opt = (name, list) => `<select id="pf-${name}" data-pf="${name}"><option value="">Prefer not to say</option>${list.map(x => `<option ${p[name] === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>`;
    return `<p class="eyebrow">Step 1 of 6</p><h3>Join this round</h3>
      <p class="intro">You are helping decide how an AI model should behave in your community. Here is how your input is used, so you can decide whether to take part.</p>
      ${acct}
      <ul class="small" style="max-width:40em;margin:16px 0;padding-left:20px;display:flex;flex-direction:column;gap:6px">
        <li>Your answers and ratings are private. Only combined results are published.</li>
        <li>Proposals and test cases you write are visible to other members, without your email address.</li>
        <li>The final charter is decided by a panel drawn by lot from all members. You may be invited.</li>
        <li>The model is then trained on the agreed test cases, and checked on others it never saw.</li>
      </ul>
      <p class="lbl" style="margin-top:20px">Optional, only used to keep the panel balanced</p>
      <div class="form-grid" style="margin-top:8px">
        <label for="pf-role">Your role${opt('role', ['Clinician', 'Care worker', 'Administration', 'Patient or relative', 'Other'])}</label>
        <label for="pf-lang">Main language${opt('lang', ['German', 'French', 'Italian', 'Romansh', 'English', 'Other'])}</label>
        <label for="pf-age">Age${opt('age', ['Under 25', '25 to 44', '45 to 64', '65 or older'])}</label>
      </div>
      <label class="consent"><input type="checkbox" id="consent" ${J.consent ? 'checked' : ''}> I understand how my input is used and want to take part.</label>
      ${navHTML('Start', J.consent, J.consent ? '' : 'Tick the box to continue')}`;
  },
  before() {
    return `<p class="eyebrow">Step 2 of 6</p><h3>What do you think now?</h3>
      <p class="intro">There are no right answers. We ask the same questions at the end, to see how learning and discussing changes people's views. Only the combined change is published.</p>
      <div data-survey="before">${QUESTIONS.map(q => scaleHTML(J.before, q)).join('')}</div>
      ${navHTML('Continue', QUESTIONS.every(q => J.before[q.id]), `${QUESTIONS.filter(q => J.before[q.id]).length} of ${QUESTIONS.length} answered`)}`;
  },
  learn() {
    const topics = TOPICS.map(k => {
      const h = HOTS[k], f = findClause(k); if (!f) return '';
      const full = clauseText(f.c), at = full.indexOf(h.base);
      const marked = at >= 0 ? esc(full.slice(0, at)) + `<mark>${esc(h.base)}</mark>` + esc(full.slice(at + h.base.length)) : esc(full);
      const opts = [`<div class="opt keep"><span class="lbl">Keep as is</span><span class="w">${esc(h.base)}</span><span class="r">The current wording, written by the Swiss AI Initiative.</span></div>`]
        .concat(h.edits.map(e => `<div class="opt"><span class="lbl">${verbOf[e.op]}</span><span class="w">${e.op === 'delete' ? '<del>' + esc(h.base) + '</del>' : `<ins>${esc(e.text)}</ins>`}</span>
          <span class="r">${esc(e.why)}</span><span class="by">Argued mainly by “${esc(readingName(e.v))}”</span></div>`));
      return `<div class="topic"><p class="lbl">Clause ${f.c[0]} · ${esc(f.a.t)}</p><p class="clause">${marked}</p>
        <div class="opts">${opts.join('')}</div></div>`;
    }).join('');
    return `<p class="eyebrow">Step 3 of 6</p><h3>The main options, side by side</h3>
      <p class="intro">These are the clauses where members disagree most. Each option is shown with the strongest reason its supporters give, in their own words. Read them before you contribute; the full charter, with every proposal, is on the <a href="index.html">Charter</a> page.</p>
      ${topics}
      <label class="consent"><input type="checkbox" id="read" ${J.read ? 'checked' : ''}> I have read the options.</label>
      ${navHTML('Continue', J.read)}`;
  },
  act() {
    const rated = Object.keys(J.ratings).length, spent = Object.values(J.points).reduce((n, v) => n + v * v, 0);
    let props = 0; try { props = (JSON.parse(localStorage.getItem('pc-demo-proposals')) || []).length; } catch {}
    const tab = J.tab;
    const tabs = `<div class="acts" role="group" aria-label="Activities">
      <button class="act" data-tab="rate" aria-pressed="${tab === 'rate'}"><b>Rate proposals</b><span>${rated ? `${rated} rated` : 'Is each change helpful?'}</span></button>
      <button class="act" data-tab="points" aria-pressed="${tab === 'points'}"><b>Set priorities</b><span>${spent ? `${spent} of ${BUDGET} credits used` : 'What matters most to you?'}</span></button>
      <button class="act" data-tab="propose" aria-pressed="${tab === 'propose'}"><b>Propose a change</b><span>${props ? `${props} proposed` : 'With a test case'}</span></button></div>`;
    return `<p class="eyebrow">Step 4 of 6</p><h3>Contribute</h3>
      <p class="intro">Three ways to take part. Rating is the most useful: please rate at least three proposals. Proposing your own change is optional.</p>
      ${tabs}<div id="actBody"></div>
      ${navHTML('Continue', rated >= 3, rated >= 3 ? '' : `Rate ${3 - rated} more to continue`)}`;
  },
  after() {
    const done = QUESTIONS.every(q => J.after[q.id]);
    let cmp = '';
    if (done) {
      cmp = `<div class="tbl" style="margin-top:20px"><table class="cmp"><thead><tr><th>Question</th><th>Before</th><th>After</th></tr></thead><tbody>
        ${QUESTIONS.map(q => { const a = J.before[q.id], b = J.after[q.id];
          return `<tr><td>${esc(q.q)}</td><td class="n">${a || '–'}</td><td class="n ${a && b && a !== b ? 'chg' : ''}">${b}${a && b && a !== b ? (b > a ? ' ↑' : ' ↓') : ''}</td></tr>`; }).join('')}
        </tbody></table></div><p class="small muted">1 means ${esc(AGREE[0].toLowerCase())}, 7 ${esc(AGREE[1].toLowerCase())}. Changes are normal and are exactly what this step measures.</p>`;
    }
    return `<p class="eyebrow">Step 5 of 6</p><h3>What do you think now?</h3>
      <p class="intro">The same questions as at the start. Answer as you see it now, without looking back.</p>
      <div data-survey="after">${QUESTIONS.map(q => scaleHTML(J.after, q)).join('')}</div>${cmp}
      ${navHTML('Finish', done, `${QUESTIONS.filter(q => J.after[q.id]).length} of ${QUESTIONS.length} answered`)}`;
  },
  next() {
    const rated = Object.keys(J.ratings).length, spent = Object.values(J.points).reduce((n, v) => n + v * v, 0);
    return `<p class="eyebrow">Step 6 of 6</p><h3>Thank you. Here is what happens next.</h3>
      <p class="intro">You rated ${rated} proposal${rated === 1 ? '' : 's'}${spent ? ` and spent ${spent} priority credits` : ''}. Your input now goes through the rest of the round.</p>
      <ol class="timeline">
        <li><span class="d">After the open track</span><p><b>Scoring.</b> Proposals are scored across viewpoints and sorted into endorsed, contested and weak. For contested clauses, compromise wordings are drafted.</p></li>
        <li><span class="d">Panel draw</span><p><b>A panel is drawn by lot</b> from all members, balanced by role and language. If you are drawn, you get an invitation to a moderated session with a briefing and small-group discussion.</p></li>
        <li><span class="d">Panel session</span><p><b>The panel decides</b> which changes enter the charter, and makes the final edits.</p></li>
        <li><span class="d">New version</span><p><b>The new charter is published</b> on the Charter page as tracked changes, with its test cases.</p></li>
        <li><span class="d">Scorecard</span><p><b>The model is retrained</b> and checked on test cases it never saw. The before/after scorecard shows whether it now follows the new charter.</p></li>
      </ol>
      <div class="nav"><button class="btn" data-go="prev">← Back</button><span style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn" href="about.html">How it works</a><a class="btn primary" href="index.html">Explore the charter</a></span></div>`;
  }
};

async function renderAct() {
  const el = $('actBody'); if (!el) return;
  if (J.tab === 'rate') {
    const list = await proposals();
    if (!list.length) { el.innerHTML = `<p class="note">No proposals to rate yet. Check back later, or propose the first change.</p>`; return; }
    el.innerHTML = `<p class="small muted" style="margin:6px 0 4px">Shown in random order. Rate each one on whether it would improve the charter, not on who proposed it.</p>` +
      list.map(p => {
        const r = J.ratings[p.id];
        const diff = (p.op !== 'insert' && p.base ? `<del>${esc(p.base)}</del> ` : '') + (p.op !== 'delete' ? `<ins>${esc(p.text)}</ins>` : '');
        const b = (v, l) => `<button data-rate="${esc(p.id)}" data-v="${v}" aria-pressed="${r === v}">${l}</button>`;
        return `<div class="rate"><span class="meta">Clause ${esc(p.clause)} · ${verbOf[p.op]}</span><p class="diff">${diff}</p>
          ${p.why ? `<span class="small">${esc(p.why)}</span>` : ''}
          <div class="choices" role="group" aria-label="Your rating">${b(1, 'Helpful')}${b(0.5, 'Somewhat')}${b(0, 'Not helpful')}</div></div>`;
      }).join('');
  } else if (J.tab === 'points') {
    const spent = Object.values(J.points).reduce((n, v) => n + v * v, 0);
    el.innerHTML = `<p class="small muted" style="margin:6px 0 10px;max-width:40em">You have ${BUDGET} credits. Putting n points on one clause costs n² credits (1 point costs 1, 2 cost 4, 3 cost 9), so you can show what matters most to you without being able to dominate. Points decide what the panel looks at first, never whether a change is accepted.</p>
      <p class="budget">Credits left <output>${BUDGET - spent}</output></p>
      <div class="pts">${PT_CLAUSES.map(n => { const f = byNumber(n); const v = J.points[n] || 0;
        return `<div class="pt"><span class="name">${n} · ${esc(f.a.t)}<span class="sub">${esc(clauseText(f.c))}</span></span>
          <span class="stepper"><button data-pt="${n}" data-d="-1" aria-label="One point less on clause ${n}">−</button><output aria-live="polite"><b>${v}</b> pt · ${v * v} cr</output><button data-pt="${n}" data-d="1" aria-label="One point more on clause ${n}">+</button></span></div>`; }).join('')}</div>`;
  } else {
    el.innerHTML = `<div class="note" style="margin-top:6px"><p style="margin:0 0 8px"><b>How to propose a change</b></p>
      <ol style="margin:0 0 10px;padding-left:20px;display:flex;flex-direction:column;gap:4px">
        <li>Open the charter and select the words you want to change.</li>
        <li>Click <i>Propose a change</i>, choose reword, remove or add, and write the new text and why.</li>
        <li>Add a test case: a question someone might ask, what the AI tends to do today, and what it should do instead.</li>
      </ol><a class="btn primary" href="index.html">Open the charter</a></div>
      <p class="small muted" style="max-width:40em">Concrete, everyday test cases help most. They are what the model is trained and checked on, so they matter as much as the wording.</p>`;
  }
}

function render() {
  renderRail(); renderPhase();
  const pane = $('pane');
  pane.innerHTML = VIEWS[STEPS[J.step].id]();
  pane.classList.remove('fade'); void pane.offsetWidth; pane.classList.add('fade');
  if (STEPS[J.step].id === 'act') renderAct();
}
function go(i) {
  J.step = Math.max(0, Math.min(STEPS.length - 1, i)); save(); render();
  const top = $('rail').getBoundingClientRect().top + scrollY - 16;
  if (scrollY > top) scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}
function complete() {
  const id = STEPS[J.step].id;
  if (!J.done.includes(id)) J.done.push(id);
  if (id === 'join') saveSpace('consent', { consent: true, profile: J.profile });
  if (id === 'before') saveSpace('survey_pre', J.before);
  if (id === 'after') saveSpace('survey_post', J.after);
  if (id === 'act') saveSpace('points', J.points);
  go(J.step + 1);
}

// ---------- events ----------
document.addEventListener('click', ev => {
  const g = ev.target.closest('[data-go]');
  if (g) { const d = g.dataset.go; return d === 'next' ? complete() : d === 'prev' ? go(J.step - 1) : go(+d); }
  const t = ev.target.closest('[data-tab]');
  if (t) { J.tab = t.dataset.tab; save(); return render(); }
  const r = ev.target.closest('[data-rate]');
  if (r) {
    const id = r.dataset.rate, v = +r.dataset.v;
    J.ratings[id] = v; save();
    const p = (PROPS || []).find(x => x.id === id);
    if (p && p.live) saveJudgement('proposal', id, 'rating', { helpful: v });
    r.parentElement.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === r));
    const rated = Object.keys(J.ratings).length;
    document.querySelector('[data-tab="rate"] span').textContent = `${rated} rated`;
    const nx = document.querySelector('.nav [data-go="next"]'); nx.disabled = rated < 3;
    const hint = nx.previousElementSibling; if (hint && hint.classList.contains('small')) hint.textContent = rated >= 3 ? '' : `Rate ${3 - rated} more to continue`;
    return;
  }
  const pt = ev.target.closest('[data-pt]');
  if (pt) {
    const n = pt.dataset.pt, d = +pt.dataset.d, cur = J.points[n] || 0, nv = Math.max(0, cur + d);
    const spent = Object.entries(J.points).reduce((s, [k, v]) => s + (k === n ? 0 : v * v), 0);
    if (spent + nv * nv > BUDGET) return toast(`Not enough credits: ${nv} points cost ${nv * nv}.`);
    if (nv) J.points[n] = nv; else delete J.points[n];
    save(); renderAct();
    const used = Object.values(J.points).reduce((s, v) => s + v * v, 0);
    document.querySelector('[data-tab="points"] span').textContent = used ? `${used} of ${BUDGET} credits used` : 'What matters most to you?';
  }
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.id === 'consent') { J.consent = t.checked; save(); return render(); }
  if (t.id === 'read') { J.read = t.checked; save(); return render(); }
  if (t.dataset.pf) { J.profile[t.dataset.pf] = t.value || undefined; save(); return; }
  const sv = t.closest('[data-survey]');
  if (sv && t.type === 'radio') {
    J[sv.dataset.survey][t.name] = +t.value; save();
    const set = J[sv.dataset.survey], n = QUESTIONS.filter(q => set[q.id]).length, all = n === QUESTIONS.length;
    if (sv.dataset.survey === 'after' && all) return render();
    const nx = document.querySelector('.nav [data-go="next"]'); nx.disabled = !all;
    nx.previousElementSibling.textContent = `${n} of ${QUESTIONS.length} answered`;
  }
});
document.addEventListener('pc:ready', () => { PROPS = null; render(); });
render();
})();
