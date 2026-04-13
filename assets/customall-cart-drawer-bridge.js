/**
 * Customall 等第三方通过 fetch 调用 /cart/add 时，往往不会走主题的 product-form，
 * 也不会触发购物车抽屉。此脚本在「非主题自带」的成功加购响应后：
 * 1. 分发 CartUpdateEvent 以更新角标
 * 2. 调用 cart-drawer-component.open() 打开抽屉
 *
 * 若响应含 `sections`（主题 buy-buttons 的加购），则跳过，避免与主题重复处理。
 * 若插件在加购后使用 window.location 整页跳转 /cart，须在 Customall 应用内关闭「跳转购物车」类选项。
 */
import { CartUpdateEvent } from '@theme/events';

const origFetch = window.fetch.bind(window);

window.fetch = function (...args) {
  return origFetch(...args).then(async (response) => {
    try {
      const req = args[0];
      const url = typeof req === 'string' ? req : req?.url || '';
      if (!url.includes('/cart/add') || !response.ok) {
        return response;
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('json') && !contentType.includes('javascript')) {
        return response;
      }

      const clone = response.clone();
      const data = await clone.json();

      // 主题 ProductForm 会带 sections，交给原有逻辑（含 CartAddEvent / 抽屉）
      if (data && data.sections) {
        return response;
      }

      // 常见错误响应（Ajax API）
      if (data && (data.status === 422 || data.status === 'bad_request')) {
        return response;
      }

      const cartJsonUrl = window.__cartJsonUrl || '/cart.js';
      const cart = await fetch(cartJsonUrl, {
        headers: { Accept: 'application/json' },
      }).then((r) => r.json());

      document.dispatchEvent(
        new CartUpdateEvent(cart, 'customall-cart-drawer-bridge', {
          itemCount: cart.item_count,
          source: 'customall-fetch-bridge',
        })
      );

      const drawer = document.querySelector('cart-drawer-component');
      if (drawer && typeof drawer.open === 'function') {
        drawer.open();
      }
    } catch {
      /* 非 JSON 或解析失败，忽略 */
    }

    return response;
  });
};
