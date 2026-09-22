/* AutoForm Fill — content entry: message router, shortcuts, globals */
(() => {
  'use strict';

  const AFF = globalThis.AFF_CONTENT_UTILS;
  if (window.__AFF_LOADED) return;
  window.__AFF_LOADED = true;

  const API = globalThis.chrome || globalThis.browser;

  /* ---- message router (popup / background → content) ---- */
  async function handleMessage(msg) {
    if (!msg || typeof msg !== 'object') return { ok: false, error: 'bad message' };
    switch (msg.type) {
      case 'AFF_PING':
        return { ok: true, version: '2.0.0' };
      case 'AFF_FILL':
        return await AFF.fill(msg.opts || {});
      case 'AFF_CLEAR':
        return await AFF.clearForm(msg.opts || {});
      case 'AFF_PICK':
        return await AFF.startPicker((selection) => {
          AFF.fill({ only: selection }).catch((e) => AFF.warn('picker fill failed', e));
        });
      case 'AFF_PICK_CANCEL':
        AFF.stopPicker(null);
        return { ok: true };
      default:
        return { ok: false, error: 'unknown command' };
    }
  }

  if (API?.runtime?.onMessage) {
    API.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      handleMessage(msg)
        .then((r) => sendResponse(r))
        .catch((e) => sendResponse({ ok: false, error: String(e && e.message || e) }));
      return true; // keep channel open for the async response
    });
  }

  /* ---- in-page keyboard shortcut: Ctrl/Cmd+Shift+V pressed twice (legacy, configurable) ---- */
  let shortcutEnabled = true;
  let lastVPress = 0;

  async function syncShortcutFlag() {
    try {
      const r = await AFFShared.storageGet('local', ['shortcutEnabled']);
      shortcutEnabled = r.shortcutEnabled !== false;
    } catch (e) { /* ignore */ }
  }
  syncShortcutFlag();

  try {
    API?.storage?.onChanged?.addListener((changes, area) => {
      if (area === 'local' && changes.shortcutEnabled) shortcutEnabled = changes.shortcutEnabled.newValue !== false;
    });
  } catch (e) { /* ignore */ }

  if (window.top === window) {
    window.addEventListener('keydown', (e) => {
      if (!shortcutEnabled) return;
      if ((e.key === 'v' || e.key === 'V') && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        const now = Date.now();
        if (now - lastVPress < 500) {
          e.preventDefault();
          e.stopPropagation();
          AFF.fill().catch((err) => AFF.warn('shortcut fill failed', err));
          lastVPress = 0;
        } else lastVPress = now;
      }
    });
  }

  /* ---- public API (page console / alias for v1 users) ---- */
  window.__AutoFormFill = (opts) => AFF.fill(opts);
  window.__AutoFormFillClear = () => AFF.clearForm();
  window.__AutoFormFillPick = () => AFF.startPicker((selection) => {
    AFF.fill({ only: selection }).catch((e) => AFF.warn('picker fill failed', e));
  });
  window.__bengaliFakeFill = (opts) => AFF.fill(opts); // v1 compatibility alias
})();
