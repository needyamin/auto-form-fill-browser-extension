/*
 * AutoForm Fill — shared schema, defaults, storage & migration.
 * Loaded by: content bundle (inlined), popup, options, background (MV2 script list / MV3 importScripts).
 * Exposes globalThis.AFFShared. No DOM required.
 */
(() => {
  'use strict';

  const API = globalThis.chrome || globalThis.browser;

  const DATA_KEY = 'affData';      // everything: profiles, rules, settings
  const LOGS_KEY = 'affLogs';      // recent fill reports
  const FILES_KEY = 'affFiles';    // custom upload files (dataURLs)
  const LEGACY = {
    settings: 'formSettings',      // sync, per-type toggles
    rules: 'customRules',          // sync, [{pattern, fillType, regex}]
    shortcut: 'shortcutEnabled',   // sync
    phone: 'phoneFormat',          // sync
    files: 'customFiles'           // local
  };

  const SCHEMA_VERSION = 2;

  const FIELD_TYPES = [
    { key: 'name', label: 'Names' },
    { key: 'email', label: 'Emails' },
    { key: 'phone', label: 'Phone numbers' },
    { key: 'address', label: 'Addresses' },
    { key: 'company', label: 'Companies' },
    { key: 'date', label: 'Dates' },
    { key: 'number', label: 'Numbers' },
    { key: 'password', label: 'Passwords' },
    { key: 'url', label: 'URLs' },
    { key: 'id', label: 'IDs (NID, passport…)' },
    { key: 'textarea', label: 'Long text' },
    { key: 'select', label: 'Dropdowns' },
    { key: 'checkbox', label: 'Checkboxes' },
    { key: 'radio', label: 'Radio buttons' },
    { key: 'file', label: 'File uploads' },
    { key: 'range', label: 'Range sliders' },
    { key: 'color', label: 'Color pickers' }
  ];

  const MODES = [
    { key: 'valid', label: 'Valid', hint: 'Realistic data that passes validation' },
    { key: 'invalid', label: 'Invalid', hint: 'Malformed values to test error handling' },
    { key: 'boundary', label: 'Boundary', hint: 'Min/max lengths, limits and edge values' },
    { key: 'extreme', label: 'Extreme', hint: 'Huge, unicode, emoji and weird input' },
    { key: 'security', label: 'Security', hint: 'XSS / injection probe strings — authorized testing only' }
  ];

  const LOCALES = [
    { key: 'auto', label: 'Auto (page language)' },
    { key: 'en-US', label: 'English (US)' },
    { key: 'en-GB', label: 'English (UK)' },
    { key: 'en-IN', label: 'English (India)' },
    { key: 'bn-BD', label: 'Bangla (Bangladesh)' },
    { key: 'de-DE', label: 'German (Germany)' },
    { key: 'fr-FR', label: 'French (France)' }
  ];

  const GEN_TYPES = [
    'name', 'email', 'phone', 'address', 'city', 'zip', 'state', 'country',
    'company', 'date', 'birthdate', 'number', 'password', 'url', 'id', 'textarea'
  ];

  const RULE_ACTIONS = [
    { key: 'generate', label: 'Generate type' },
    { key: 'fixed', label: 'Fixed value / tokens' },
    { key: 'skip', label: 'Skip field' }
  ];

  function defaultSettings() {
    return {
      locale: 'auto',
      mode: 'valid',
      phoneFormat: 'local',                     // local | international
      sequence: { enabled: false, start: 1, step: 1, pad: 3 },
      number: { min: 1, max: 999, decimals: 0 },
      date: { fromYear: 2000, toYear: 2018 },
      birth: { fromYear: 1950, toYear: 2005 },
      password: { length: 12, style: 'strong' }, // strong | complex | simple
      textarea: { strategy: 'contextual', sentences: 2 }, // contextual | lorem
      fill: {
        name: true, email: true, phone: true, address: true, company: true,
        date: true, number: true, password: true, url: true, id: true,
        textarea: true, select: true, checkbox: true, radio: true,
        file: true, range: true, color: true
      },
      unknownText: 'Test',
      checkConsents: true,
      multiselectCount: 2,
      // behaviour
      scope: 'form',                            // form | page
      expandDynamic: true,
      dynamicAdds: 3,
      autoAdvance: false,
      maxSteps: 5,
      fillDelay: 40,
      // appearance / feedback
      highlight: true,
      highlightColor: '#2563eb',
      toast: true,
      debug: false
    };
  }

  function uid() {
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function defaultRules() {
    return [];
  }

  function defaultProfile() {
    return {
      id: 'default',
      name: 'Default',
      builtin: true,
      sites: [],
      settings: defaultSettings(),
      rules: defaultRules()
    };
  }

  function defaultData() {
    return {
      schemaVersion: SCHEMA_VERSION,
      activeProfileId: 'default',
      shortcutEnabled: true,
      profiles: [defaultProfile()]
    };
  }

  /* ---------- storage access (callback style works on chrome MV2/MV3 + Firefox) ---------- */

  function storageGet(area, keys) {
    return new Promise((resolve) => {
      try {
        if (!API || !API.storage || !API.storage[area]) return resolve({});
        API.storage[area].get(keys, (r) => resolve(r || {}));
      } catch (e) {
        resolve({});
      }
    });
  }

  function storageSet(area, obj) {
    return new Promise((resolve) => {
      try {
        if (!API || !API.storage || !API.storage[area]) return resolve(false);
        API.storage[area].set(obj, () => resolve(!API.runtime?.lastError));
      } catch (e) {
        resolve(false);
      }
    });
  }

  function storageRemove(area, keys) {
    return new Promise((resolve) => {
      try {
        if (!API || !API.storage || !API.storage[area]) return resolve(false);
        API.storage[area].remove(keys, () => resolve(true));
      } catch (e) {
        resolve(false);
      }
    });
  }

  /* ---------- migration ---------- */

  function migrateRules(oldRules) {
    if (!Array.isArray(oldRules)) return [];
    return oldRules
      .filter((r) => r && String(r.pattern || '').trim())
      .map((r) => ({
        id: uid(),
        enabled: true,
        match: r.regex === true ? 'regex' : 'text',
        pattern: String(r.pattern).trim(),
        action: r.fillType === 'skip' ? 'skip' : 'generate',
        type: r.fillType === 'skip' ? 'name' : (GEN_TYPES.includes(r.fillType) ? r.fillType : 'name'),
        fixedValue: ''
      }));
  }

  async function loadData() {
    const local = await storageGet('local', [DATA_KEY, LOGS_KEY, FILES_KEY]);
    if (local[DATA_KEY] && local[DATA_KEY].schemaVersion === SCHEMA_VERSION) {
      return local[DATA_KEY];
    }
    // Read legacy sync keys (v1.x)
    const legacy = await storageGet('sync', [LEGACY.settings, LEGACY.rules, LEGACY.shortcut, LEGACY.phone]);
    const data = defaultData();
    const p = data.profiles[0];
    if (legacy[LEGACY.settings] && typeof legacy[LEGACY.settings] === 'object') {
      const old = legacy[LEGACY.settings];
      if (old.phoneFormat) p.settings.phoneFormat = old.phoneFormat;
      for (const k of Object.keys(p.settings.fill)) {
        if (old[k] === false) p.settings.fill[k] = false;
      }
    }
    if (legacy[LEGACY.phone]) p.settings.phoneFormat = legacy[LEGACY.phone] === 'international' ? 'international' : 'local';
    if (Array.isArray(legacy[LEGACY.rules]) && legacy[LEGACY.rules].length) p.rules = migrateRules(legacy[LEGACY.rules]);
    if (legacy[LEGACY.shortcut] === false) data.shortcutEnabled = false;
    await storageSet('local', { [DATA_KEY]: data });
    return data;
  }

  async function saveData(data) {
    data.schemaVersion = SCHEMA_VERSION;
    return storageSet('local', { [DATA_KEY]: data });
  }

  /* ---------- profile helpers ---------- */

  function getActiveProfile(data) {
    return data.profiles.find((p) => p.id === data.activeProfileId) || data.profiles[0];
  }

  function siteMatches(pattern, url) {
    try {
      if (!pattern) return false;
      if (pattern === '*') return true;
      const rx = new RegExp('^' + pattern.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$', 'i');
      return rx.test(url);
    } catch (e) {
      return false;
    }
  }

  function resolveProfile(data, url, preferredId) {
    if (preferredId) {
      const want = data.profiles.find((p) => p.id === preferredId);
      if (want) return want;
    }
    const matched = data.profiles.find(
      (p) => p.id !== data.activeProfileId && Array.isArray(p.sites) && p.sites.some((s) => siteMatches(s, url))
    );
    return matched || getActiveProfile(data);
  }

  function mergeSettings(partial) {
    const base = defaultSettings();
    if (!partial || typeof partial !== 'object') return base;
    const out = { ...base, ...partial };
    out.fill = { ...base.fill, ...(partial.fill || {}) };
    out.sequence = { ...base.sequence, ...(partial.sequence || {}) };
    out.number = { ...base.number, ...(partial.number || {}) };
    out.date = { ...base.date, ...(partial.date || {}) };
    out.birth = { ...base.birth, ...(partial.birth || {}) };
    out.password = { ...base.password, ...(partial.password || {}) };
    out.textarea = { ...base.textarea, ...(partial.textarea || {}) };
    return out;
  }

  /* ---------- logs ---------- */

  async function saveLog(entry) {
    const r = await storageGet('local', [LOGS_KEY]);
    const logs = Array.isArray(r[LOGS_KEY]) ? r[LOGS_KEY] : [];
    logs.unshift(entry);
    if (logs.length > 25) logs.length = 25;
    return storageSet('local', { [LOGS_KEY]: logs });
  }

  async function getLogs() {
    const r = await storageGet('local', [LOGS_KEY]);
    return Array.isArray(r[LOGS_KEY]) ? r[LOGS_KEY] : [];
  }

  async function clearLogs() {
    return storageSet('local', { [LOGS_KEY]: [] });
  }

  /* ---------- custom files ---------- */

  async function getFiles() {
    const r = await storageGet('local', [FILES_KEY]);
    const cf = r[FILES_KEY];
    return cf && typeof cf === 'object' ? cf : {};
  }

  async function setFiles(files) {
    return storageSet('local', { [FILES_KEY]: files });
  }

  globalThis.AFFShared = {
    SCHEMA_VERSION, DATA_KEY, LOGS_KEY, FILES_KEY,
    FIELD_TYPES, MODES, LOCALES, GEN_TYPES, RULE_ACTIONS,
    defaultSettings, defaultProfile, defaultData, uid,
    storageGet, storageSet, storageRemove,
    loadData, saveData,
    getActiveProfile, resolveProfile, siteMatches, mergeSettings, migrateRules,
    saveLog, getLogs, clearLogs,
    getFiles, setFiles
  };
})();
