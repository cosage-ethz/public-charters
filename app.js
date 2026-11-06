// Participation layer for Public Charters: accounts, invitations and proposals.
// Loaded on every page after sample-data.js; the proposal form uses the charter data (ARTS, HOTS).
// With Supabase configured in config.js it reads and writes the database;
// without it, it runs in demo mode and keeps proposals in this browser only.
(() => {
'use strict';

const CFG = window.PC_CONFIG || {};
const LIVE = !!(CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase);
const DEMO_KEY = 'pc-demo-proposals';
const params = new URLSearchParams(location.search);
const A = {
  db: LIVE ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey) : null,
  user: null,          // signed-in user
  space: null,         // space row
  roles: new Set(),    // this user's roles in the space
  clauses: {},         // clause number -> clause row of the current charter version
  slug: params.get('space') || CFG.space || 'apertus-demo',
  invite: params.get('invite')
};
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

// ---------- charter helpers (from the viewer's data) ----------
const clauseText = c => c[1].map(p => typeof p === 'string' ? p : HOTS[p.h].base).join('');
function clauseOfHot(k) {
  for (const a of ARTS) for (const c of a.cl) if (c[1].some(p => p.h === k)) return { art: a, cl: c };
  return null;
}
function clauseByNumber(n) {
  for (const a of ARTS) for (const c of a.cl) if (c[0] === n) return { art: a, cl: c };
  return null;
}
// Offset of a hot spot inside its clause text (for insertions, the point where text is added).
function hotOffset(c, k) {
  let o = 0;
  for (const p of c[1]) {
    if (typeof p === 'string') { o += p.length; continue; }
    if (p.h === k) return o;
    o += HOTS[p.h].base.length;
  }
  return -1;
}

// ---------- small UI helpers ----------
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4200);
}
function dialog(html, onSubmit) {
  const d = document.createElement('dialog');
  d.className = 'pc';
  d.innerHTML = html;
  document.body.appendChild(d);
  d.addEventListener('close', () => d.remove());
  d.addEventListener('click', ev => {
    if (ev.target === d) d.close();                  // click on the backdrop
    if (ev.target.closest('[data-close]')) d.close();
  });
  const form = d.querySelector('form');
  if (form && onSubmit) form.addEventListener('submit', async ev => {
    ev.preventDefault();
    const err = form.querySelector('.err'), btn = form.querySelector('[type=submit]');
    if (err) err.textContent = '';
    if (btn) btn.disabled = true;
    try { await onSubmit(new FormData(form), d); }
    catch (e) { if (err) err.textContent = e.message || String(e); }
    finally { if (btn) btn.disabled = false; }
  });
  d.showModal();
  return d;
}
const loadDemo = () => { try { return JSON.parse(localStorage.getItem(DEMO_KEY)) || []; } catch { return []; } };
const saveDemo = list => { try { localStorage.setItem(DEMO_KEY, JSON.stringify(list)); } catch {} };

// ---------- account area ----------
function renderAcct() {
  const el = $('acct'); if (!el) return;
  if (!LIVE) {
    const n = loadDemo().length;
    el.innerHTML = `<span class="chip" title="No database configured. Proposals stay in this browser.">Demo mode</span>
      <button class="link" data-act="list">Proposals${n ? ` (${n})` : ''}</button>`;
    return;
  }
  if (!A.user) {
    el.innerHTML = `<button class="link" data-act="list">Proposals</button><button class="btn" data-act="signin">Sign in</button>`;
    return;
  }
  const admin = A.roles.has('admin'), member = A.roles.has('member');
  el.innerHTML = `<span class="who-am-i" title="${esc(A.user.email || '')}">${esc(A.user.email || 'Signed in')}${A.roles.has('panel') ? ' · panel' : ''}</span>
    <button class="link" data-act="list">Proposals</button>
    ${admin ? '<button class="link" data-act="invite">Invite people</button>' : ''}
    ${!member && A.space && A.space.access === 'open' ? '<button class="btn primary" data-act="join">Join this space</button>' : ''}
    <button class="link" data-act="signout">Sign out</button>`;
}

function signInDialog(reason) {
  dialog(`<form>
    <h2>Sign in</h2>
    <p class="hint">${esc(reason || 'We email you a sign-in link. No password needed.')}</p>
    <label>Email<input type="email" name="email" required autocomplete="email"></label>
    <p class="err" role="alert"></p>
    <div class="actions"><button type="button" class="btn" data-close>Cancel</button><button type="submit" class="btn primary">Send link</button></div>
  </form>`, async (fd, d) => {
    const { error } = await A.db.auth.signInWithOtp({ email: fd.get('email'), options: { emailRedirectTo: location.href } });
    if (error) throw error;
    d.querySelector('form').innerHTML = `<h2>Check your email</h2><p class="hint">We sent a sign-in link to ${esc(fd.get('email'))}. Open it on this device.</p>
      <div class="actions"><button type="button" class="btn" data-close>Close</button></div>`;
  });
}

function inviteDialog() {
  dialog(`<form>
    <h2>Invite people</h2>
    <p class="hint">Create a link for ${esc(A.space.name)}. Anyone with the link can join until it expires or runs out of uses.</p>
    <div class="two">
      <label>Uses<input type="number" name="uses" min="1" max="500" value="1" required></label>
      <label>Valid for (days)<input type="number" name="days" min="1" max="90" value="14" required></label>
    </div>
    <label>Note (optional)<input type="text" name="note" placeholder="For example: ward 3 nurses"></label>
    <div class="linkbox" hidden><input type="text" readonly aria-label="Invitation link"><button type="button" class="btn" data-copy>Copy</button></div>
    <p class="err" role="alert"></p>
    <div class="actions"><button type="button" class="btn" data-close>Close</button><button type="submit" class="btn primary">Create link</button></div>
  </form>`, async (fd, d) => {
    const { data, error } = await A.db.rpc('create_invitation', {
      sp: A.space.id, n_uses: +fd.get('uses'), days: +fd.get('days'), invite_role: 'member', invite_note: fd.get('note') || null });
    if (error) throw error;
    const url = new URL(location.href);
    url.search = ''; url.hash = '';
    url.searchParams.set('space', A.space.slug); url.searchParams.set('invite', data);
    const box = d.querySelector('.linkbox'); box.hidden = false;
    const inp = box.querySelector('input'); inp.value = url.toString(); inp.select();
    box.querySelector('[data-copy]').onclick = () => { navigator.clipboard && navigator.clipboard.writeText(inp.value); toast('Link copied'); };
  });
}

// ---------- proposals ----------
// target: {number, quote, start, end, insert}
function proposeDialog(t) {
  const found = clauseByNumber(t.number); if (!found) return;
  const full = clauseText(found.cl);
  const before = full.slice(0, t.start), q = full.slice(t.start, t.end), after = full.slice(t.end);
  const shown = t.insert ? `${esc(before)}<mark>[+]</mark>${esc(after)}` : `${esc(before)}<mark>${esc(q)}</mark>${esc(after)}`;
  const ops = t.insert
    ? `<label><input type="radio" name="op" value="insert" checked> Add text here</label>`
    : `<label><input type="radio" name="op" value="replace" checked> Reword</label>
       <label><input type="radio" name="op" value="delete"> Remove</label>
       <label><input type="radio" name="op" value="insert"> Add text after</label>`;
  const d = dialog(`<form>
    <p class="eyebrow">Clause ${esc(t.number)} · ${esc(found.art.t)}</p>
    <h2>Propose a change</h2>
    <p class="clause-quote">${shown}</p>
    <fieldset><legend>Change</legend>${ops}</fieldset>
    <label data-newtext>New text<textarea name="new_text" placeholder="The words you would use instead"></textarea></label>
    <label>Why<textarea name="rationale" required placeholder="What problem does this fix? Who does it affect?"></textarea></label>
    <div class="section">
      <h3>Test case</h3>
      <p class="hint">A question someone might ask the AI, where your change would make a difference. Test cases are what the model is trained and checked on.</p>
      <label>Someone asks the AI<textarea name="prompt" placeholder="Which household chemicals should never be mixed?"></textarea></label>
      <div class="two">
        <label>Today it tends to<textarea name="today" placeholder="Refuse to answer"></textarea></label>
        <label>With the change it should<textarea name="with_edit" placeholder="Name the dangerous pairs and why"></textarea></label>
      </div>
    </div>
    <p class="err" role="alert"></p>
    <div class="actions"><button type="button" class="btn" data-close>Cancel</button><button type="submit" class="btn primary">Submit proposal</button></div>
  </form>`, async (fd, dlg) => {
    const op = fd.get('op'), raw = fd.get('new_text') || '', rationale = fd.get('rationale').trim();
    // Keep leading spaces on an insertion, so ", and ..." or " only when ..." joins the text as typed.
    const newText = op === 'insert' ? raw.replace(/\s+$/, '') : raw.trim();
    if (op !== 'delete' && !newText.trim()) throw new Error('Write the new text, or choose Remove.');
    const tc = { prompt: (fd.get('prompt') || '').trim(), today: (fd.get('today') || '').trim(), with_edit: (fd.get('with_edit') || '').trim() };
    const anchor = op === 'insert' && !t.insert
      ? { quote: q, start: t.end, end: t.end } : { quote: q, start: t.start, end: t.end };
    const rec = { clause: t.number, op, anchor, new_text: op === 'delete' ? '' : newText, rationale, test_case: tc.prompt ? tc : null };
    if (LIVE) await saveLive(rec); else saveLocal(rec);
    dlg.close();
    toast(LIVE ? 'Proposal submitted. Thank you.' : 'Saved in this browser (demo mode).');
    renderAcct();
  });
  const sync = () => {
    const op = d.querySelector('input[name=op]:checked').value;
    d.querySelector('[data-newtext]').hidden = op === 'delete';
  };
  d.querySelectorAll('input[name=op]').forEach(r => r.addEventListener('change', sync));
  sync();
}

function saveLocal(rec) {
  const list = loadDemo();
  list.unshift({ ...rec, id: Date.now().toString(36), created_at: new Date().toISOString() });
  saveDemo(list);
}

async function saveLive(rec) {
  if (!A.user) throw new Error('Sign in first.');
  if (!A.roles.has('member')) throw new Error('Join this space first. Ask an organiser for an invitation.');
  const cl = A.clauses[rec.clause];
  if (!cl) throw new Error(`Clause ${rec.clause} is not in this space's charter.`);
  // Re-anchor on the database text, which is the reference.
  const at = rec.anchor.quote ? cl.text.indexOf(rec.anchor.quote) : -1;
  const anchor = at >= 0 && rec.anchor.start !== rec.anchor.end
    ? { quote: rec.anchor.quote, start: at, end: at + rec.anchor.quote.length }
    : at >= 0 ? { quote: rec.anchor.quote, start: at + rec.anchor.quote.length, end: at + rec.anchor.quote.length }
    : rec.anchor;
  const { data: p, error } = await A.db.from('proposal').insert({
    space_id: A.space.id, clause_id: cl.id, author_id: A.user.id, op: rec.op, anchor,
    new_text: rec.new_text, rationale: rec.rationale }).select('id').single();
  if (error) throw error;
  if (rec.test_case) {
    const { error: e2 } = await A.db.from('test_case').insert({
      space_id: A.space.id, proposal_id: p.id, clause_id: cl.id, author_id: A.user.id, origin: 'human', ...rec.test_case });
    if (e2) throw e2;
  }
}

function proposalItem(p) {
  const verb = { replace: 'Reword', insert: 'Add', delete: 'Remove' }[p.op];
  const old = p.op !== 'insert' && p.anchor && p.anchor.quote ? `<del>${esc(p.anchor.quote)}</del> ` : '';
  const nw = p.op !== 'delete' ? `<ins>${esc(p.new_text)}</ins>` : '';
  const tc = p.test_case ? `<span class="tc">Test case: “${esc(p.test_case.prompt)}”</span>` : '';
  const when = new Date(p.created_at).toLocaleDateString();
  return `<li><span class="meta">Clause ${esc(p.clause)} · ${verb} · ${esc(when)}</span><span class="d">${old}${nw}</span>
    ${p.rationale ? `<span class="r">${esc(p.rationale)}</span>` : ''}${tc}</li>`;
}

async function listDialog() {
  let items = [], note = '';
  if (LIVE) {
    if (!A.space) { note = 'You cannot see this space yet. Sign in, or ask for an invitation.'; }
    else {
      const { data, error } = await A.db.from('proposal')
        .select('id, op, anchor, new_text, rationale, created_at, clause:clause_id(number), test_case(prompt)')
        .eq('space_id', A.space.id).order('created_at', { ascending: false }).limit(100);
      if (error) note = error.message;
      items = (data || []).map(p => ({ ...p, clause: p.clause && p.clause.number, test_case: p.test_case && p.test_case[0] }));
      note = note || `${items.length} proposal${items.length === 1 ? '' : 's'} in ${A.space.name}, newest first. Scores appear after the next aggregation run.`;
    }
  } else {
    items = loadDemo();
    note = 'Demo mode: these proposals are saved only in this browser.';
  }
  const d = dialog(`<div class="body">
    <h2>Proposals</h2><p class="hint">${esc(note)}</p>
    ${items.length ? `<ul class="plist">${items.map(proposalItem).join('')}</ul>` : '<p class="hint">No proposals yet. Select words in a clause, or open a highlight, to propose a change.</p>'}
    <div class="actions">${!LIVE && items.length ? '<button type="button" class="btn" data-clear>Clear</button>' : ''}<button type="button" class="btn" data-close>Close</button></div>
  </div>`);
  const clr = d.querySelector('[data-clear]');
  if (clr) clr.onclick = () => { saveDemo([]); d.close(); renderAcct(); };
}

// Ask to sign in / join before opening the proposal form in live mode.
function startProposal(t) {
  if (LIVE && !A.user) return signInDialog('Sign in to propose a change. We email you a sign-in link.');
  if (LIVE && !A.roles.has('member')) {
    return toast(A.space && A.space.access === 'open' ? 'Join this space first (top right).' : 'This space is invitation-only. Ask an organiser for a link.');
  }
  proposeDialog(t);
}

// ---------- selection in a clause -> floating button ----------
let selBtn = null;
function hideSel() { if (selBtn) { selBtn.remove(); selBtn = null; } }
function selectionTarget() {
  const s = getSelection();
  if (!s || s.isCollapsed || !s.rangeCount) return null;
  const r = s.getRangeAt(0);
  const p1 = r.startContainer.parentElement && r.startContainer.parentElement.closest('.cl[data-cl]');
  const p2 = r.endContainer.parentElement && r.endContainer.parentElement.closest('.cl[data-cl]');
  if (!p1 || p1 !== p2) return null;
  const number = p1.dataset.cl, found = clauseByNumber(number); if (!found) return null;
  const full = clauseText(found.cl);
  // Map the selection to clause offsets via the text before it in the clause's text span.
  const span = p1.querySelector('span:not(.num)') || p1;
  const pre = document.createRange(); pre.selectNodeContents(span); pre.setEnd(r.startContainer, r.startOffset);
  const raw = s.toString(), quote = raw.trim();
  if (!quote) return null;
  const guess = pre.toString().length + (raw.length - raw.trimStart().length);
  let start = full.slice(guess, guess + quote.length) === quote ? guess : full.indexOf(quote);
  if (start < 0) return null;                // selection spans tracked changes; ignore
  return { number, quote, start, end: start + quote.length, insert: false, rect: r.getBoundingClientRect() };
}
document.addEventListener('mouseup', () => setTimeout(() => {
  hideSel();
  const t = selectionTarget(); if (!t) return;
  selBtn = document.createElement('button');
  selBtn.className = 'btn sel-btn'; selBtn.type = 'button'; selBtn.textContent = 'Propose a change';
  selBtn.style.left = Math.max(8, t.rect.left + scrollX) + 'px';
  selBtn.style.top = (t.rect.bottom + scrollY + 8) + 'px';
  selBtn.addEventListener('mousedown', ev => ev.preventDefault());
  selBtn.addEventListener('click', () => { hideSel(); getSelection().removeAllRanges(); startProposal(t); });
  document.body.appendChild(selBtn);
}, 0));
document.addEventListener('keydown', ev => { if (ev.key === 'Escape') hideSel(); });

// ---------- clicks ----------
document.addEventListener('click', async ev => {
  const pr = ev.target.closest('[data-propose]');
  if (pr) {
    const k = pr.dataset.propose, found = clauseOfHot(k); if (!found) return;
    const base = HOTS[k].base, start = hotOffset(found.cl, k);
    return startProposal({ number: found.cl[0], quote: base, start, end: start + base.length, insert: !base });
  }
  const act = ev.target.closest('[data-act]'); if (!act) return;
  const a = act.dataset.act;
  if (a === 'signin') signInDialog();
  else if (a === 'signout') { await A.db.auth.signOut(); }
  else if (a === 'invite') inviteDialog();
  else if (a === 'list') listDialog();
  else if (a === 'join') {
    const { error } = await A.db.rpc('join_open_space', { sp: A.space.id });
    if (error) return toast(error.message);
    await loadSpace(); toast(`You joined ${A.space.name}.`);
  }
});

// ---------- live data ----------
async function loadSpace() {
  const { data: sp } = await A.db.from('space').select('*').eq('slug', A.slug).maybeSingle();
  A.space = sp || null; A.roles = new Set(); A.clauses = {};
  if (A.space) {
    if (A.user) {
      const { data: ms } = await A.db.from('membership').select('role').eq('space_id', A.space.id).eq('user_id', A.user.id);
      (ms || []).forEach(m => A.roles.add(m.role));
    }
    const { data: v } = await A.db.from('charter_version').select('id')
      .eq('space_id', A.space.id).eq('status', 'published').order('published_at', { ascending: false }).limit(1).maybeSingle();
    if (v) {
      const { data: cls } = await A.db.from('clause').select('id, number, text').eq('charter_version_id', v.id);
      (cls || []).forEach(c => { A.clauses[c.number] = c; });
    }
  }
  renderAcct();
}

async function acceptInvite() {
  if (!A.invite || !A.user) return;
  const tok = A.invite; A.invite = null;
  const { data, error } = await A.db.rpc('accept_invitation', { invite_token: tok });
  const url = new URL(location.href); url.searchParams.delete('invite');
  if (!error && data) { url.searchParams.set('space', data); A.slug = data; }
  history.replaceState(null, '', url);
  if (error) toast(error.message);
  await loadSpace();
  if (!error && A.space) toast(`Welcome. You joined ${A.space.name}.`);
}

// Shared with the other pages (participate.html, organise.html).
window.PC = { state: A, live: LIVE, toast, dialog, signInDialog, inviteDialog, esc };
const ready = () => document.dispatchEvent(new CustomEvent('pc:ready'));

async function init() {
  renderAcct();
  if (!LIVE) return ready();
  const { data: { session } } = await A.db.auth.getSession();
  A.user = session ? session.user : null;
  await loadSpace();
  await acceptInvite();
  if (A.invite && !A.user) signInDialog('You have been invited to take part. Sign in with your email to accept.');
  ready();
  A.db.auth.onAuthStateChange(async (_e, s) => {
    const was = A.user && A.user.id; A.user = s ? s.user : null;
    if ((A.user && A.user.id) === was) return;
    await loadSpace(); await acceptInvite(); ready();
  });
}
init();
})();
