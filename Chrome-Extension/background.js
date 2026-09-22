/* AutoForm Fill — background: commands, context menus, badge feedback.
 * MV3: service worker (imports shared.js itself). MV2/Firefox: manifest loads shared.js first. */
(() => {
  'use strict';
  if (typeof importScripts === 'function') { try { importScripts('shared.js'); } catch (e) { /* ignore */ } }

  const API = globalThis.chrome || globalThis.browser;
  const action = API.action || API.browserAction;

  function sendToActiveTab(msg) {
    API.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs && tabs[0];
      if (!tab?.id) return;
      try { API.tabs.sendMessage(tab.id, msg, () => void API.runtime.lastError); }
      catch (e) { /* ignore */ }
    });
  }

  /* keyboard commands (chrome://extensions/shortcuts) */
  API.commands?.onCommand.addListener((command) => {
    if (command === 'fill-form') sendToActiveTab({ type: 'AFF_FILL' });
    else if (command === 'clear-form') sendToActiveTab({ type: 'AFF_CLEAR' });
    else if (command === 'pick-fields') sendToActiveTab({ type: 'AFF_PICK' });
  });

  /* context menus */
  API.runtime.onInstalled.addListener(() => {
    try {
      API.contextMenus?.removeAll(() => {
        API.contextMenus?.create({ id: 'aff-fill', title: 'Fill form with test data', contexts: ['page', 'editable', 'selection'] });
        API.contextMenus?.create({ id: 'aff-clear', title: 'Clear form fields', contexts: ['page', 'editable'] });
        API.contextMenus?.create({ id: 'aff-pick', title: 'Select fields to fill…', contexts: ['page', 'editable'] });
      });
    } catch (e) { /* ignore */ }
  });

  API.contextMenus?.onClicked.addListener((info, tab) => {
    if (!tab?.id) return;
    const type = info.menuItemId === 'aff-fill' ? 'AFF_FILL' : info.menuItemId === 'aff-clear' ? 'AFF_CLEAR' : 'AFF_PICK';
    try { API.tabs.sendMessage(tab.id, { type }, () => void API.runtime.lastError); } catch (e) { /* ignore */ }
  });

  /* badge: show how many fields were filled, briefly */
  API.runtime.onMessage.addListener((msg, sender) => {
    if (msg && msg.type === 'AFF_REPORT' && sender.tab) {
      try {
        action.setBadgeBackgroundColor({ color: msg.failed ? '#f59e0b' : '#16a34a' });
        action.setBadgeText({ tabId: sender.tab.id, text: String(msg.filled || '') });
        setTimeout(() => { try { action.setBadgeText({ tabId: sender.tab.id, text: '' }); } catch (e) { /* ignore */ } }, 4000);
      } catch (e) { /* ignore */ }
    }
  });
})();
