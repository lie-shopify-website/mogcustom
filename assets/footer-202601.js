/**
 * Footer 手风琴：主题未包含 Bootstrap，需自行切换 .show（与 data-bs-target 对齐）。
 */
(function () {
  const root = document.querySelector('.footer-202601');
  if (!root) return;

  root.addEventListener('click', function (e) {
    const trigger = e.target.closest('a.footer-collapse-trigger');
    if (!trigger || !root.contains(trigger)) return;
    e.preventDefault();
    const sel = trigger.getAttribute('data-bs-target');
    if (!sel) return;
    const panel = document.querySelector(sel);
    if (!panel || !panel.classList.contains('mf-collapse')) return;
    const expanded = panel.classList.toggle('show');
    trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    trigger.classList.toggle('collapsed', !expanded);
  });
})();
