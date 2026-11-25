// Accounts and the suggestion form, shared by every page.
// Loaded after sample-data.js (the charter text: ARTS, HOTS) and i18n.js (T()).
// With Supabase configured in config.js it reads and writes the database; without it, it runs
// the sample round and keeps suggestions in this browser only.
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
  clauses: {},         // clause number -> clause row of the current charter version (English)
  slug: params.get('space') || CFG.space || 'apertus',
  invite: params.get('invite')
};
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

// ---------- charter helpers (from the sample data, in the current language) ----------
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
    el.innerHTML = `<span class="chip" title="${esc(T('acct.sampleTip'))}">${esc(T('acct.sample'))}</span>
      ${n ? `<button class="link" data-act="list">${esc(T('acct.proposals'))} (${n})</button>` : ''}`;
    return;
  }
  if (!A.user) {
    el.innerHTML = `<button class="btn" data-act="signin">${esc(T('acct.signin'))}</button>`;
    return;
  }
  const admin = A.roles.has('admin'), member = A.roles.has('member');
  el.innerHTML = `<span class="who-am-i" title="${esc(A.user.email || '')}">${esc(A.user.email || '')}</span>
    ${admin ? `<button class="link" data-act="list">${esc(T('acct.proposals'))}</button><a class="link" href="organise.html">${esc(T('acct.organise'))}</a>` : ''}
    ${!member && A.space && A.space.access === 'open' ? `<button class="btn primary" data-act="join">${esc(T('acct.join'))}</button>` : ''}
    <button class="link" data-act="signout">${esc(T('acct.signout'))}</button>`;
}

function signInDialog(reason) {
  dialog(`<form>
    <h2>${esc(T('acct.signinH'))}</h2>
    <p class="hint">${esc(reason || T('acct.signinP'))}</p>
    <label>${esc(T('acct.email'))}<input type="email" name="email" required autocomplete="email"></label>
    <p class="err" role="alert"></p>
    <div class="actions"><button type="button" class="btn" data-close>${esc(T('common.cancel'))}</button><button type="submit" class="btn primary">${esc(T('acct.send'))}</button></div>
  </form>`, async (fd, d) => {
    const { error } = await A.db.auth.signInWithOtp({ email: fd.get('email'), options: { emailRedirectTo: location.href } });
    if (error) throw error;
    d.querySelector('form').innerHTML = `<h2>${esc(T('acct.checkH'))}</h2><p class="hint">${esc(T('acct.checkP', { email: fd.get('email') }))}</p>
      <div class="actions"><button type="button" class="btn" data-close>${esc(T('common.close'))}</button></div>`;
  });
}

// Admins only (Organise page); kept in English.
function inviteDialog() {
  dialog(`<form>
    <h2>${esc(T('acct.invite'))}</h2>
    <p class="hint">Create a link for ${esc(A.space.name)}. Anyone with the link can join until it expires or runs out of uses.</p>
    <div class="two">
      <label>Uses<input type="number" name="uses" min="1" max="500" value="1" required></label>
      <label>Valid for (days)<input type="number" name="days" min="1" max="90" value="14" required></label>
    </div>
    <label>Note (optional)<input type="text" name="note"></label>
    <div class="linkbox" hidden><input type="text" readonly aria-label="Invitation link"><button type="button" class="btn" data-copy>Copy</button></div>
    <p class="err" role="alert"></p>
    <div class="actions"><button type="button" class="btn" data-close>${esc(T('common.close'))}</button><button type="submit" class="btn primary">Create link</button></div>
  </form>`, async (fd, d) => {
    const { data, error } = await A.db.rpc('create_invitation', {
      sp: A.space.id, n_uses: +fd.get('uses'), days: +fd.get('days'), invite_role: 'member', invite_note: fd.get('note') || null });
    if (error) throw error;
    const url = new URL(location.href);
    url.search = ''; url.hash = ''; url.pathname = url.pathname.replace(/[^/]*$/, 'participate.html');
    url.searchParams.set('space', A.space.slug); url.searchParams.set('invite', data);
    const box = d.querySelector('.linkbox'); box.hidden = false;
    const inp = box.querySelector('input'); inp.value = url.toString(); inp.select();
    box.querySelector('[data-copy]').onclick = () => { navigator.clipboard && navigator.clipboard.writeText(inp.value); toast('Link copied'); };
  });
}

// ---------- suggesting a change ----------
// target: {number, quote, start, end, insert}
function proposeDialog(t) {
  const found = clauseByNumber(t.number); if (!found) return;
  const full = clauseText(found.cl);
  const before = full.slice(0, t.start), q = full.slice(t.start, t.end), after = full.slice(t.end);
  const shown = t.insert ? `${esc(before)}<mark>[+]</mark>${esc(after)}` : `${esc(before)}<mark>${esc(q)}</mark>${esc(after)}`;
  const ops = t.insert
    ? `<label><input type="radio" name="op" value="insert" checked> ${esc(T('form.addHere'))}</label>`
    : `<label><input type="radio" name="op" value="replace" checked> ${esc(T('form.replace'))}</label>
       <label><input type="radio" name="op" value="delete"> ${esc(T('form.remove'))}</label>
       <label><input type="radio" name="op" value="insert"> ${esc(T('form.add'))}</label>`;
  const d = dialog(`<form>
    <p class="eyebrow">${esc(T('common.clause', { n: t.number }))} · ${esc(found.art.t)}</p>
    <h2>${esc(T('form.h'))}</h2>
    ${t.bridge ? `<p class="hint">${esc(T('form.bridge'))}</p>` : ''}
    <p class="clause-quote">${shown}</p>
    <fieldset><legend>${esc(T('form.what'))}</legend>${ops}</fieldset>
    <label data-newtext>${esc(T('form.newText'))}<textarea name="new_text" placeholder="${esc(T('form.newTextPh'))}"></textarea></label>
    <label>${esc(T('form.why'))}<textarea name="rationale" placeholder="${esc(T('form.whyPh'))}"></textarea></label>
    <p class="err" role="alert"></p>
    <div class="actions"><button type="button" class="btn" data-close>${esc(T('common.cancel'))}</button><button type="submit" class="btn primary">${esc(T('form.submit'))}</button></div>
  </form>`, async (fd, dlg) => {
    const op = fd.get('op'), raw = fd.get('new_text') || '', rationale = (fd.get('rationale') || '').trim();
    // Keep leading spaces on an insertion, so ", and ..." joins the text as typed.
    const newText = op === 'insert' ? raw.replace(/\s+$/, '') : raw.trim();
    if (op !== 'delete' && !newText.trim()) throw new Error(T('form.needText'));
    const anchor = op === 'insert' && !t.insert
      ? { quote: q, start: t.end, end: t.end } : { quote: q, start: t.start, end: t.start + q.length };
    anchor.lang = window.PC_LANG || 'en';     // offsets refer to the charter text in this language
    await submitProposal({ clause: t.number, op, anchor, new_text: op === 'delete' ? '' : newText, rationale });
    dlg.close();
    toast(LIVE ? T('form.sentLive') : T('form.sentSample'));
  });
  const sync = () => {
    const op = d.querySelector('input[name=op]:checked').value;
    d.querySelector('[data-newtext]').hidden = op === 'delete';
  };
  d.querySelectorAll('input[name=op]').forEach(r => r.addEventListener('change', sync));
  sync();
}

// Save a suggestion (from the popup, or from the "partly" box on Take part) and tell the page.
async function submitProposal(rec) {
  if (LIVE) await saveLive(rec); else saveLocal(rec);
  renderAcct();
  document.dispatchEvent(new CustomEvent('pc:proposed'));
}

function saveLocal(rec) {
  const list = loadDemo();
  list.unshift({ ...rec, id: Date.now().toString(36), created_at: new Date().toISOString() });
  saveDemo(list);
}

async function saveLive(rec) {
  if (!A.user) throw new Error(T('form.signFirst'));
  if (!A.roles.has('member')) throw new Error(T('form.joinFirst'));
  const cl = A.clauses[rec.clause];
  if (!cl) throw new Error(T('form.notInCharter', { n: rec.clause }));
  // The database holds the English charter text. English anchors are re-checked against it;
  // anchors in other languages keep their quote and language, and refer to the translated text.
  let anchor = rec.anchor;
  if (anchor.lang === 'en' && anchor.quote) {
    const at = cl.text.indexOf(anchor.quote);
    if (at >= 0) anchor = anchor.start === anchor.end
      ? { ...anchor, start: at + anchor.quote.length, end: at + anchor.quote.length }
      : { ...anchor, start: at, end: at + anchor.quote.length };
  }
  const { error } = await A.db.from('proposal').insert({
    space_id: A.space.id, clause_id: cl.id, author_id: A.user.id, op: rec.op, anchor,
    new_text: rec.new_text, rationale: rec.rationale });
  if (error) throw error;
}

function proposalItem(p) {
  const old = p.op !== 'insert' && p.anchor && p.anchor.quote ? `<del>${esc(p.anchor.quote)}</del> ` : '';
  const nw = p.op !== 'delete' ? `<ins>${esc(p.new_text)}</ins>` : '';
  const when = new Date(p.created_at).toLocaleDateString(window.PC_LANG);
  return `<li><span class="meta">${esc(T('common.clause', { n: p.clause }))} · ${esc(when)}</span><span class="d">${old}${nw}</span>
    ${p.rationale ? `<span class="r">${esc(p.rationale)}</span>` : ''}</li>`;
}

async function listDialog() {
  let items = [], note = '';
  if (LIVE) {
    if (!A.space) { note = T('acct.cannotSee'); }
    else {
      const { data, error } = await A.db.from('proposal')
        .select('id, op, anchor, new_text, rationale, created_at, clause:clause_id(number)')
        .eq('space_id', A.space.id).order('created_at', { ascending: false }).limit(100);
      if (error) note = error.message;
      items = (data || []).map(p => ({ ...p, clause: p.clause && p.clause.number }));
      note = note || T('acct.listLive', { n: items.length });
    }
  } else {
    items = loadDemo();
    note = T('acct.listSample');
  }
  const d = dialog(`<div class="body">
    <h2>${esc(T('acct.listH'))}</h2><p class="hint">${esc(note)}</p>
    ${items.length ? `<ul class="plist">${items.map(proposalItem).join('')}</ul>` : `<p class="hint">${esc(T('acct.listNone'))}</p>`}
    <div class="actions">${!LIVE && items.length ? `<button type="button" class="btn" data-clear>${esc(T('acct.clear'))}</button>` : ''}<button type="button" class="btn" data-close>${esc(T('common.close'))}</button></div>
  </div>`);
  const clr = d.querySelector('[data-clear]');
  if (clr) clr.onclick = () => { saveDemo([]); d.close(); renderAcct(); document.dispatchEvent(new CustomEvent('pc:proposed')); };
}

// Ask to sign in / join before opening the form in live mode.
function startProposal(t) {
  if (LIVE && !A.user) return signInDialog(T('acct.signinPropose'));
  if (LIVE && !A.roles.has('member')) return toast(A.space && A.space.access === 'open' ? T('acct.joinOpen') : T('acct.inviteOnly'));
  proposeDialog(t);
}

// ---------- selecting words in a clause -> floating button ----------
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
  const span = p1.querySelector('span:not(.num)') || p1;
  const pre = document.createRange(); pre.selectNodeContents(span); pre.setEnd(r.startContainer, r.startOffset);
  const raw = s.toString(), quote = raw.trim();
  if (!quote) return null;
  const guess = pre.toString().length + (raw.length - raw.trimStart().length);
  const start = full.slice(guess, guess + quote.length) === quote ? guess : full.indexOf(quote);
  if (start < 0) return null;                // selection spans tracked changes; ignore
  return { number, quote, start, end: start + quote.length, insert: false, rect: r.getBoundingClientRect() };
}
document.addEventListener('mouseup', () => setTimeout(() => {
  hideSel();
  const t = selectionTarget(); if (!t) return;
  selBtn = document.createElement('button');
  selBtn.className = 'btn sel-btn'; selBtn.type = 'button'; selBtn.textContent = T('form.selBtn');
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
    await loadSpace(); toast(T('acct.joined', { name: A.space.name })); ready();
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
      // The public site has one open space: signing in is enough to join it.
      if (!A.roles.has('member') && A.space.access === 'open') {
        const { error } = await A.db.rpc('join_open_space', { sp: A.space.id });
        if (!error) A.roles.add('member');
      }
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
  if (!error && A.space) toast(T('acct.welcome', { name: A.space.name }));
}

// Shared with the other pages.
window.PC = { state: A, live: LIVE, toast, dialog, signInDialog, inviteDialog, esc, propose: startProposal, submitProposal, clauseOfHot, hotOffset, clauseText };
const ready = () => document.dispatchEvent(new CustomEvent('pc:ready'));

async function init() {
  renderAcct();
  if (!LIVE) return ready();
  const { data: { session } } = await A.db.auth.getSession();
  A.user = session ? session.user : null;
  await loadSpace();
  await acceptInvite();
  if (A.invite && !A.user) signInDialog(T('acct.invited'));
  ready();
  A.db.auth.onAuthStateChange(async (_e, s) => {
    const was = A.user && A.user.id; A.user = s ? s.user : null;
    if ((A.user && A.user.id) === was) return;
    await loadSpace(); await acceptInvite(); ready();
  });
}
init();
})();
