// Languages for the public site: English, German, French.
// Every piece of text lives in lang/en.js, lang/de.js and lang/fr.js (loaded before this file).
// The language comes from ?lang=..., then the visitor's saved choice, then the browser, then English.
//
// In HTML:  <h2 data-i18n="home.title"></h2>          sets the text
//           <p data-i18n-html="home.lede"></p>         sets HTML (for links and bold text)
//           <input data-i18n-attr="placeholder:form.x"> sets attributes (several: "a:k1;b:k2")
// In code:  T('rate.count', { n: 3 })                  "{n}" placeholders; key_one / key_other for plurals
(function () {
'use strict';
const LANGS = ['en', 'de', 'fr'];
const KEY = 'pc-lang';
const q = new URLSearchParams(location.search).get('lang');
let stored = null;
try { stored = localStorage.getItem(KEY); } catch {}
const browser = (navigator.language || 'en').slice(0, 2).toLowerCase();
const lang = LANGS.includes(q) ? q : LANGS.includes(stored) ? stored : LANGS.includes(browser) ? browser : 'en';
if (LANGS.includes(q)) { try { localStorage.setItem(KEY, q); } catch {} }
window.PC_LANG = lang;
document.documentElement.lang = lang;

const DICT = window.I18N || {};
const get = (o, k) => k.split('.').reduce((x, p) => (x == null ? undefined : x[p]), o);
function T(key, vars) {
  const v = vars || {};
  let k = key;
  if (typeof v.n === 'number') {
    const plural = key + (v.n === 1 ? '_one' : '_other');
    if (get(DICT[lang], plural) != null || get(DICT.en, plural) != null) k = plural;
  }
  let s = get(DICT[lang], k);
  if (s == null) s = get(DICT.en, k);
  if (s == null) return key;
  return typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (m, name) => (v[name] != null ? v[name] : m)) : s;
}

function apply(root) {
  const r = root || document;
  r.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = T(el.dataset.i18n); });
  r.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = T(el.dataset.i18nHtml); });
  r.querySelectorAll('[data-i18n-attr]').forEach(el => {
    el.dataset.i18nAttr.split(';').forEach(pair => {
      const [attr, k] = pair.split(':').map(x => x.trim());
      if (attr && k) el.setAttribute(attr, T(k));
    });
  });
  // Language switch: <span data-langs></span>
  r.querySelectorAll('[data-langs]').forEach(el => {
    el.classList.add('langs');
    el.setAttribute('aria-label', T('nav.language'));
    el.innerHTML = LANGS.map(l => {
      const u = new URL(location.href); u.searchParams.set('lang', l);
      return `<a href="${u.pathname.split('/').pop() || './'}${u.search}${u.hash}" lang="${l}" hreflang="${l}"${l === lang ? ' aria-current="true"' : ''}>${l.toUpperCase()}</a>`;
    }).join('');
  });
  const title = document.querySelector('meta[name="i18n-title"]');
  if (title) document.title = T(title.content);
}

window.T = T;
window.PC_I18N = { lang, LANGS, T, apply };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => apply());
else apply();
})();
