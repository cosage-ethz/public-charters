#!/usr/bin/env node
// Copies the English text from lang/en.js into the HTML pages, so every page is readable even
// without JavaScript (and for search engines). The language script replaces it in the browser.
// Run after editing lang/en.js:   node tools/fill-fallback.js
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
global.window = {};
require(path.join(ROOT, 'lang/en.js'));
const EN = window.I18N.en;
const get = k => k.split('.').reduce((o, p) => (o == null ? undefined : o[p]), EN);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const PAGES = ['index.html', 'participate.html', 'results.html', 'charter.html', 'about.html', 'organise.html'];
let total = 0;
for (const page of PAGES) {
  const file = path.join(ROOT, page);
  let html = fs.readFileSync(file, 'utf8'), n = 0;
  // <tag ... data-i18n="key" ...>old text</tag>   and   data-i18n-html="key"
  html = html.replace(/<(\w+)(\s[^>]*?\bdata-i18n(-html)?="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/g, (m, tag, attrs, isHtml, key, old) => {
    const v = get(key);
    if (typeof v !== 'string') { console.warn(`  ${page}: no English text for "${key}"`); return m; }
    n++;
    return `<${tag}${attrs}>${isHtml ? v : esc(v)}</${tag}>`;
  });
  // <title> from <meta name="i18n-title" content="key">
  const t = html.match(/<meta name="i18n-title" content="([^"]+)">/);
  if (t && typeof get(t[1]) === 'string') html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(get(t[1]))}</title>`);
  fs.writeFileSync(file, html);
  console.log(`${page}: ${n} texts`);
  total += n;
}
console.log(`Done: ${total} texts filled in from lang/en.js.`);
