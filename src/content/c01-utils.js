/* AutoForm Fill — content utils */
(() => {
  'use strict';

  const AFF = {};

  AFF.randInt = (min, max) => {
    min = Math.ceil(min); max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  AFF.rand = (arr) => arr[AFF.randInt(0, arr.length - 1)];
  AFF.chance = (p) => Math.random() < p;
  AFF.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  AFF.uid = () => 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);

  AFF.pad = (n, width) => String(n).padStart(width || 0, '0');

  AFF.truncate = (str, n) => {
    str = String(str);
    if (!n || n < 1 || str.length <= n) return str;
    return str.slice(0, n);
  };

  AFF.clamp = (v, min, max) => {
    if (min != null && !isNaN(min) && v < min) v = min;
    if (max != null && !isNaN(max) && v > max) v = max;
    return v;
  };

  AFF.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = AFF.randInt(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  AFF.escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  /* Debug logger — enabled per profile (settings.debug) */
  AFF.debugEnabled = false;
  AFF.log = (...args) => {
    if (AFF.debugEnabled) console.log('%c[AutoFormFill]', 'color:#2563eb;font-weight:bold', ...args);
  };
  AFF.warn = (...args) => {
    if (AFF.debugEnabled) console.warn('[AutoFormFill]', ...args);
  };

  /* Session sequence counter — persists per tab via sessionStorage so repeated
     fills produce unique values (email3@…, email4@…). */
  AFF.nextSeq = (sequence) => {
    if (!sequence || !sequence.enabled) return 0;
    let n = sequence.start || 1;
    try {
      const cur = parseInt(sessionStorage.getItem('affSeq') || '', 10);
      if (!isNaN(cur) && cur >= (sequence.start || 1)) n = cur + (sequence.step || 1);
      sessionStorage.setItem('affSeq', String(n));
    } catch (e) { /* sessionStorage unavailable — fall back to start */ }
    return n;
  };

  /* Small helper for retrying async dropdown picking with timeout */
  AFF.withTimeout = (promise, ms = 2000) => new Promise((resolve) => {
    const t = setTimeout(() => resolve('timeout'), ms);
    Promise.resolve(promise).then(
      (res) => { clearTimeout(t); resolve(res); },
      () => { clearTimeout(t); resolve('error'); }
    );
  });

  globalThis.AFF_CONTENT_UTILS = AFF;
})();
