// Gentle scroll-in animation for elements with class "reveal" (optional data-delay in ms).
// Without JavaScript, without IntersectionObserver, or with "reduce motion" switched on,
// everything is simply shown.
(function () {
'use strict';
const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduce) return;
document.documentElement.classList.add('motion');
let io = null;
function start() {
  const els = [...document.querySelectorAll('.reveal:not(.on)')];
  els.forEach(el => { if (el.dataset.delay) el.style.transitionDelay = el.dataset.delay + 'ms'; });
  if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('on')); return; }
  io = io || new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach(el => io.observe(el));
}
// Pages that render content later call PCReveal() to animate it too.
window.PCReveal = start;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
