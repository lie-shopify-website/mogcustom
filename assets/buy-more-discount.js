import { copyTextToClipboard } from '@theme/utilities';

const TOOLTIP_MS = 2200;
/** @type {WeakMap<HTMLElement, ReturnType<typeof setTimeout>>} */
const tooltipHideTimers = new WeakMap();

/**
 * Copy container: `.js-buyMoreCodeContainer`.
 * Button inside: `.buy-more-copy-btn` with `data-code` and tooltip labels.
 * Global API: `Theme.utilities.copyText(string)` (same as `copyTextToClipboard` from `@theme/utilities`).
 */
function initBuyMoreCopyButtons() {
  document.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const container = target.closest('.js-buyMoreCodeContainer');
    if (!(container instanceof HTMLElement)) return;

    const btn = container.querySelector('.buy-more-copy-btn');
    if (!(btn instanceof HTMLButtonElement)) return;

    event.preventDefault();

    const code = btn.dataset.code;
    if (!code) return;

    const ok = await copyTextToClipboard(code);

    const tooltip = btn.querySelector('.buy-more-tooltip');
    const copyLabel = btn.dataset.copyLabel ?? 'Copy';
    const copiedLabel = btn.dataset.copiedLabel ?? 'Copied!';
    const failLabel = btn.dataset.copyFailedLabel ?? 'Copy failed';

    if (tooltip instanceof HTMLElement) {
      tooltip.textContent = ok ? copiedLabel : failLabel;
    }

    btn.classList.add('buy-more-copy-btn--tooltip-visible');

    const prev = tooltipHideTimers.get(btn);
    if (prev !== undefined) clearTimeout(prev);

    const timerId = setTimeout(() => {
      btn.classList.remove('buy-more-copy-btn--tooltip-visible');
      if (tooltip instanceof HTMLElement) tooltip.textContent = copyLabel;
      tooltipHideTimers.delete(btn);
    }, TOOLTIP_MS);

    tooltipHideTimers.set(btn, timerId);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBuyMoreCopyButtons, { once: true });
} else {
  initBuyMoreCopyButtons();
}
