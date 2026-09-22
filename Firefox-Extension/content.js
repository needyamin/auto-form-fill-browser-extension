/*
 * AutoForm Fill v2.0.0 — GENERATED FILE. Do not edit directly.
 * Edit files under src/ and run: node build.js
 */
/* ========== src/shared/shared.js ========== */
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

/* ========== src/content/c01-utils.js ========== */
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

/* ========== src/content/c02-locales.js ========== */
/* AutoForm Fill — locale datasets (fictional/realistic data per region) */
(() => {
  'use strict';

  const AFF = globalThis.AFF_CONTENT_UTILS;

  const LOCALE_DATA = {
    'en-US': {
      firstNames: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Daniel',
        'Matthew', 'Andrew', 'Joshua', 'Kevin', 'Brian', 'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth',
        'Sarah', 'Jessica', 'Karen', 'Emily', 'Ashley', 'Amanda', 'Melissa', 'Rachel', 'Laura', 'Hannah'],
      lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
        'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Clark', 'Lewis'],
      streets: ['Main Street', 'Oak Avenue', 'Maple Drive', 'Cedar Lane', 'Washington Boulevard', 'Park Road',
        'Elm Street', 'Lakeview Drive', 'Hillcrest Avenue', 'Sunset Boulevard', 'River Road', 'Broadway',
        'Second Avenue', 'Willow Lane', 'Pine Street'],
      cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego',
        'Dallas', 'Austin', 'Seattle', 'Denver', 'Boston', 'Miami', 'Portland'],
      states: ['California', 'Texas', 'New York', 'Florida', 'Illinois', 'Washington', 'Colorado', 'Massachusetts', 'Oregon', 'Georgia'],
      zip: () => String(AFF.randInt(10001, 99899)),
      phoneLocal: () => `(212) 555-01${AFF.pad(AFF.randInt(0, 99), 2)}`,
      phoneIntl: () => `+1 212 555 01${AFF.pad(AFF.randInt(0, 99), 2)}`,
      companyBase: ['Vertex', 'BluePeak', 'Summit', 'Northstar', 'Clearwater', 'Ironclad', 'Silverline', 'Redwood', 'Pinnacle', 'Evergreen'],
      companySuffix: ['Inc', 'LLC', 'Corp', 'Group', 'Systems', 'Technologies', 'Solutions', 'Labs'],
      tlds: ['com', 'net', 'org', 'io'],
      country: 'United States',
      emailDomains: ['example.com', 'mail.com', 'demo.net', 'test.org']
    },
    'en-GB': {
      firstNames: ['Oliver', 'George', 'Harry', 'Jack', 'Noah', 'Charlie', 'Thomas', 'Oscar', 'William', 'James',
        'Charlotte', 'Amelia', 'Isla', 'Emily', 'Sophie', 'Olivia', 'Ava', 'Grace', 'Lily', 'Freya'],
      lastNames: ['Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Johnson', 'Davies', 'Robinson', 'Wright',
        'Thompson', 'Evans', 'Walker', 'White', 'Roberts', 'Green', 'Hall', 'Wood', 'Clarke', 'Patel'],
      streets: ['High Street', 'Station Road', 'Church Lane', 'Victoria Road', 'Park Avenue', 'Green Lane',
        'Manor Road', 'George Street', 'Station Approach', 'Queen Street', 'Mill Lane', 'King Street'],
      cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool', 'Bristol', 'Sheffield',
        'Edinburgh', 'Cardiff', 'Newcastle', 'Nottingham'],
      states: ['Greater London', 'Lancashire', 'Yorkshire', 'Kent', 'Essex', 'Surrey', 'Hampshire', 'Oxfordshire'],
      zip: () => `${AFF.rand(['SW', 'NW', 'EC', 'SE', 'N', 'E'])}${AFF.randInt(1, 20)} ${AFF.randInt(1, 9)}${AFF.rand(['AA', 'BB', 'CD', 'FG', 'HL'])}`,
      phoneLocal: () => `07700 900${AFF.pad(AFF.randInt(0, 999), 3)}`,
      phoneIntl: () => `+44 7700 900${AFF.pad(AFF.randInt(0, 999), 3)}`,
      companyBase: ['Harrow', 'Kingsford', 'Ashbourne', 'Fairview', 'Blackwell', 'Kestrel', 'Harbour', 'Meadowbrook'],
      companySuffix: ['Ltd', 'Group', 'Partners', 'Plc', 'Services', 'Consulting'],
      tlds: ['co.uk', 'com', 'org.uk'],
      country: 'United Kingdom',
      emailDomains: ['example.co.uk', 'mail.com', 'demo.net']
    },
    'en-IN': {
      firstNames: ['Aarav', 'Vivaan', 'Aditya', 'Rohan', 'Arjun', 'Rahul', 'Vikram', 'Amit', 'Sanjay', 'Deepak',
        'Priya', 'Ananya', 'Diya', 'Sneha', 'Kavya', 'Neha', 'Pooja', 'Ritu', 'Meera', 'Kavita'],
      lastNames: ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Reddy', 'Nair', 'Rao', 'Mehta', 'Shah',
        'Joshi', 'Verma', 'Das', 'Iyer', 'Chatterjee', 'Malhotra', 'Kapoor', 'Bhatt'],
      streets: ['MG Road', 'Park Street', 'Station Road', 'Gandhi Nagar', 'Nehru Place', 'Civil Lines',
        'Ring Road', 'Market Road', 'Hill Road', 'Lake View Road'],
      cities: ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kochi', 'Indore'],
      states: ['Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu', 'West Bengal', 'Gujarat', 'Rajasthan', 'Kerala', 'Uttar Pradesh'],
      zip: () => String(AFF.randInt(110001, 799999)),
      phoneLocal: () => `0${AFF.rand([9, 8, 7, 6])}${AFF.randInt(100000000, 999999999)}`,
      phoneIntl: () => `+91 ${AFF.rand([9, 8, 7, 6])}${AFF.randInt(100000000, 999999999)}`,
      companyBase: ['Shakti', 'Bharat', 'Sagar', 'Triton', 'Marigold', 'Emerald', 'Zenith', 'Lotus'],
      companySuffix: ['Pvt Ltd', 'Industries', 'Technologies', 'Enterprises', 'Traders'],
      tlds: ['com', 'in', 'co.in'],
      country: 'India',
      emailDomains: ['example.in', 'mail.com', 'demo.net']
    },
    'bn-BD': {
      firstNames: ['Rahim', 'Karim', 'Jamal', 'Kamal', 'Shamim', 'Rafiq', 'Nazmul', 'Faruk', 'Imran', 'Sajid',
        'Ayesha', 'Sharmin', 'Farhana', 'Nusrat', 'Jannat', 'Salma', 'Rumana', 'Tania', 'Sumaiya', 'Mahmuda'],
      lastNames: ['Uddin', 'Ahmed', 'Islam', 'Hossain', 'Rahman', 'Chowdhury', 'Miah', 'Sarkar', 'Talukder', 'Biswas', 'Alam', 'Haque'],
      streets: ['Mirpur Road', 'Dhanmondi 27', 'Banani 11', 'Gulshan 2', 'Uttara Sector 4', 'Chawk Bazar',
        'Agrabad', 'Zindabazar', 'New Market Road', 'Green Road'],
      cities: ['Dhaka', 'Chattogram', 'Sylhet', 'Khulna', 'Rajshahi', 'Barishal', 'Rangpur', 'Mymensingh', 'Cumilla', 'Gazipur'],
      states: ['Dhaka', 'Chattogram', 'Sylhet', 'Khulna', 'Rajshahi', 'Barishal', 'Rangpur', 'Mymensingh'],
      zip: () => String(AFF.randInt(1200, 9999)),
      phoneLocal: () => `01${AFF.rand([3, 4, 5, 6, 7, 8, 9])}${AFF.randInt(10000000, 99999999)}`,
      phoneIntl: () => `+8801${AFF.rand([3, 4, 5, 6, 7, 8, 9])}${AFF.randInt(10000000, 99999999)}`,
      companyBase: ['Dhaka Soft', 'Bangla Tech', 'Padma Group', 'Jamdani IT', 'Sundarban Logistics', 'Meghna Systems'],
      companySuffix: ['Ltd', 'Solutions', 'Group'],
      tlds: ['com', 'com.bd', 'net'],
      country: 'Bangladesh',
      emailDomains: ['mail.com', 'example.com', 'bdmail.com', 'demo.net']
    },
    'de-DE': {
      firstNames: ['Lukas', 'Jonas', 'Felix', 'Maximilian', 'Leon', 'Paul', 'Niklas', 'Tim', 'David', 'Simon',
        'Anna', 'Lena', 'Julia', 'Sophie', 'Marie', 'Emma', 'Hannah', 'Sarah', 'Laura', 'Lea'],
      lastNames: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann',
        'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Braun'],
      streets: ['Hauptstraße', 'Bahnhofstraße', 'Gartenstraße', 'Lindenstraße', 'Kirchstraße', 'Bergstraße',
        'Schulstraße', 'Waldstraße', 'Mozartstraße', 'Rheinstraße'],
      cities: ['Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dortmund', 'Essen', 'Bremen', 'Hannover'],
      states: ['Bayern', 'Berlin', 'Hamburg', 'Hessen', 'Sachsen', 'Baden-Württemberg', 'Nordrhein-Westfalen', 'Niedersachsen'],
      zip: () => String(AFF.randInt(10000, 99999)),
      phoneLocal: () => `0151 2${AFF.randInt(1000000, 9999999)}`,
      phoneIntl: () => `+49 151 2${AFF.randInt(1000000, 9999999)}`,
      companyBase: ['Nordwind', 'Bergmann', 'Rheinwerk', 'Stern', 'Falke', 'Lindenhof', 'Alpin'],
      companySuffix: ['GmbH', 'AG', 'Group', 'Systeme', 'Lösungen'],
      tlds: ['de', 'com'],
      country: 'Deutschland',
      emailDomains: ['example.de', 'mail.com', 'demo.net']
    },
    'fr-FR': {
      firstNames: ['Lucas', 'Hugo', 'Léo', 'Louis', 'Nathan', 'Gabriel', 'Thomas', 'Jules', 'Mathis', 'Paul',
        'Emma', 'Jade', 'Louise', 'Alice', 'Chloé', 'Léa', 'Manon', 'Camille', 'Sarah', 'Juliette'],
      lastNames: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau',
        'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux'],
      streets: ['Rue de la Paix', 'Avenue des Champs-Élysées', 'Rue Victor Hugo', 'Boulevard Saint-Michel',
        'Rue de la République', 'Avenue Jean Jaurès', 'Rue Molière', 'Rue Lafayette'],
      cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Montpellier', 'Strasbourg', 'Bordeaux', 'Lille', 'Rennes', 'Reims'],
      states: ["Île-de-France", 'Provence-Alpes-Côte d\'Azur', 'Auvergne-Rhône-Alpes', 'Occitanie', 'Nouvelle-Aquitaine', 'Grand Est', 'Hauts-de-France', 'Bretagne'],
      zip: () => String(AFF.randInt(10000, 99999)),
      phoneLocal: () => `06 ${AFF.pad(AFF.randInt(0, 99), 2)} ${AFF.pad(AFF.randInt(0, 99), 2)} ${AFF.pad(AFF.randInt(0, 99), 2)} ${AFF.pad(AFF.randInt(0, 99), 2)}`,
      phoneIntl: () => `+33 6 ${AFF.pad(AFF.randInt(0, 99), 2)} ${AFF.pad(AFF.randInt(0, 99), 2)} ${AFF.pad(AFF.randInt(0, 99), 2)} ${AFF.pad(AFF.randInt(0, 99), 2)}`,
      companyBase: ['Lumière', 'Verlaine', 'Aurore', 'Cascade', 'Bellecour', 'Horizon', 'Étoile'],
      companySuffix: ['SARL', 'SA', 'Group', 'Services', 'Conseil'],
      tlds: ['fr', 'com'],
      country: 'France',
      emailDomains: ['example.fr', 'mail.com', 'demo.net']
    }
  };

  /* Countries offered when a country select has no matching option */
  const COUNTRIES = ['United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'Bangladesh', 'Germany',
    'France', 'Spain', 'Italy', 'Netherlands', 'Brazil', 'Japan', 'Singapore', 'United Arab Emirates',
    'Saudi Arabia', 'Pakistan', 'Malaysia', 'Philippines', 'Indonesia', 'South Africa', 'Mexico', 'Sweden', 'Switzerland'];

  const SENTENCES = [
    'This is sample test data created for form testing.',
    'Customer profile generated automatically for QA purposes.',
    'Order created for demo purposes only — please ignore.',
    'Sample description used while verifying form behaviour.',
    'Placeholder note entered by the AutoForm Fill extension.',
    'Test entry to confirm long text is accepted correctly.'
  ];

  const LOREM_WORDS = ('lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum').split(' ');

  function resolveLocale(setting) {
    if (setting && setting !== 'auto' && LOCALE_DATA[setting]) return setting;
    try {
      const langs = [document.documentElement?.lang, navigator.language, ...(navigator.languages || [])].filter(Boolean);
      for (const l of langs) {
        const key = String(l).slice(0, 5);
        if (LOCALE_DATA[key]) return key;
        const base = String(l).slice(0, 2).toLowerCase();
        const map = { en: 'en-US', bn: 'bn-BD', de: 'de-DE', fr: 'fr-FR' };
        if (map[base]) return map[base];
      }
    } catch (e) { /* ignore */ }
    return 'en-US';
  }

  AFF.LOCALE_DATA = LOCALE_DATA;
  AFF.COUNTRIES = COUNTRIES;
  AFF.SENTENCES = SENTENCES;
  AFF.LOREM_WORDS = LOREM_WORDS;
  AFF.resolveLocale = resolveLocale;
})();

/* ========== src/content/c03-generator.js ========== */
/* AutoForm Fill — value generator: valid / invalid / boundary / extreme / security modes */
(() => {
  'use strict';

  const AFF = globalThis.AFF_CONTENT_UTILS;

  /* ---------------- primitive generators (valid/realistic) ---------------- */

  const gen = {};

  gen.firstName = (L) => AFF.rand(L.firstNames);
  gen.lastName = (L) => AFF.rand(L.lastNames);
  gen.fullName = (L) => `${gen.firstName(L)} ${gen.lastName(L)}`;

  gen.username = (name, seq) => {
    const base = (name || gen.fullName(AFF.LOCALE_DATA['en-US'])).toLowerCase().replace(/[^a-z]/g, '') || 'user';
    return base + (seq ? seq : AFF.randInt(10, 999));
  };

  gen.email = (ctx, L, settings, session, seq) => {
    let domain = null;
    if (/gmail/i.test(ctx)) domain = 'gmail.com';
    else if (/yahoo/i.test(ctx)) domain = 'yahoo.com';
    else if (/outlook|hotmail|live|msn/i.test(ctx)) domain = 'outlook.com';
    else if (/icloud|apple/i.test(ctx)) domain = 'icloud.com';
    else if (/proton/i.test(ctx)) domain = 'proton.me';
    else if (/company|work|office|corp|business/i.test(ctx)) domain = 'company.com';
    else if (settings?.email?.domain) domain = settings.email.domain;
    else domain = AFF.rand(L.emailDomains);

    let local;
    const style = settings?.email?.style || 'name.number';
    const first = session?.first || gen.firstName(L);
    const last = session?.last || gen.lastName(L);
    if (style === 'firstlast') local = `${first}${last}`.toLowerCase();
    else if (style === 'first.last') local = `${first}.${last}`.toLowerCase();
    else if (style === 'random') local = 'user' + AFF.randInt(1000, 9999999);
    else local = `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, '');

    if (settings?.sequence?.enabled) local += AFF.pad(seq || 1, settings.sequence.pad);
    else if (seq) local += seq;
    else local += AFF.randInt(1, 999);
    return `${local}@${domain}`;
  };

  gen.phone = (format, L) => (format === 'international' ? L.phoneIntl() : L.phoneLocal());

  gen.street = (L) => `${AFF.randInt(1, 999)} ${AFF.rand(L.streets)}`;
  gen.city = (L) => AFF.rand(L.cities);
  gen.state = (L) => AFF.rand(L.states);
  gen.zip = (L) => L.zip();
  gen.country = (L) => L.country;
  gen.company = (L) => `${AFF.rand(L.companyBase)} ${AFF.rand(L.companySuffix)}`.trim();

  const isoDate = (d) => `${d.getFullYear()}-${AFF.pad(d.getMonth() + 1, 2)}-${AFF.pad(d.getDate(), 2)}`;

  function dateInRange(fromYear, toYear) {
    const start = new Date(fromYear, 0, 1).getTime();
    const end = new Date(toYear, 11, 31).getTime();
    return new Date(start + Math.random() * (end - start));
  }

  gen.date = (settings, constraints) => {
    let min = null, max = null;
    if (constraints?.min) min = new Date(constraints.min + 'T00:00:00');
    if (constraints?.max) max = new Date(constraints.max + 'T00:00:00');
    let d = dateInRange(settings.date.fromYear, settings.date.toYear);
    if (/admission|join|enroll|start.*date|from.*date/i.test(constraints?.ctx || '')) d = new Date();
    if (min && d < min) d = min;
    if (max && d > max) d = max;
    return isoDate(d);
  };

  gen.birthDate = (settings, constraints) => {
    let min = null, max = null;
    if (constraints?.min) min = new Date(constraints.min + 'T00:00:00');
    if (constraints?.max) max = new Date(constraints.max + 'T00:00:00');
    let d = dateInRange(settings.birth.fromYear, settings.birth.toYear);
    if (min && d < min) d = min;
    if (max && d > max) d = max;
    return isoDate(d);
  };

  gen.time = () => `${AFF.pad(AFF.randInt(8, 18), 2)}:${AFF.rand(['00', '15', '30', '45'])}`;
  gen.datetime = () => { const d = new Date(Date.now() + AFF.randInt(-30, 30) * 86400000); return isoDate(d) + 'T' + gen.time(); };
  gen.month = () => `${new Date().getFullYear()}-${AFF.pad(AFF.randInt(1, 12), 2)}`;
  gen.week = () => `${new Date().getFullYear()}-W${AFF.pad(AFF.randInt(1, 52), 2)}`;

  gen.number = (ctx, settings, constraints) => {
    let min = settings.number.min, max = settings.number.max;
    const dec = settings.number.decimals || 0;
    if (constraints?.min != null) min = Math.max(min, Number(constraints.min));
    if (constraints?.max != null) max = Math.min(max, Number(constraints.max));
    if (/age|year.*old|years?\s*old/i.test(ctx)) { min = Math.max(min, 18); max = Math.min(max, 75); }
    else if (/qty|quantity|count|num.*item/i.test(ctx)) { min = Math.max(min, 1); max = Math.min(max, 50); }
    else if (/year|birth\s*year|graduation/i.test(ctx)) { min = 1980; max = 2005; }
    else if (/percent|%/i.test(ctx)) { min = Math.max(min, 0); max = Math.min(max, 100); }
    else if (/price|salary|amount|income|revenue/i.test(ctx)) { min = 1000; max = 150000; }
    if (min > max) max = min;
    if (dec > 0) return (min + Math.random() * (max - min)).toFixed(dec);
    return String(AFF.randInt(min, max));
  };

  gen.password = (settings) => {
    const style = settings.password.style;
    const len = AFF.clamp(settings.password.length || 12, 6, 64);
    if (style === 'simple') return String(AFF.randInt(1000, 999999));
    if (style === 'complex') {
      const sets = ['abcdefghijkmnpqrstuvwxyz', 'ABCDEFGHJKLMNPQRSTUVWXYZ', '23456789', '!@#$%&*?'];
      let out = sets.map((s) => s[AFF.randInt(0, s.length - 1)]).join('');
      while (out.length < len) out += AFF.rand(sets.join(''));
      return AFF.shuffle(out.split('')).join('');
    }
    return 'Test' + AFF.randInt(1000, 9999) + '@' + AFF.pad(AFF.randInt(1, 99), 2);
  };

  gen.url = (ctx, L) => {
    const slug = AFF.rand(['demo', 'example', 'test-site', 'my-page', 'portfolio']);
    const tld = AFF.rand(L.tlds);
    if (/linkedin/i.test(ctx)) return `https://www.linkedin.com/in/${slug}-test`;
    if (/github/i.test(ctx)) return `https://github.com/${slug}dev`;
    if (/facebook/i.test(ctx)) return `https://www.facebook.com/${slug}.page`;
    if (/twitter|x\.com/i.test(ctx)) return `https://x.com/${slug}_test`;
    if (/www\./i.test(ctx)) return `https://www.${slug}.${tld}`;
    return `https://${slug}.${tld}`;
  };

  gen.sentence = () => AFF.rand(AFF.SENTENCES);
  gen.paragraph = (n) => Array.from({ length: n || 2 }, () => AFF.rand(AFF.SENTENCES)).join(' ');

  gen.lorem = (sentences) => {
    const n = sentences || 2;
    const out = [];
    for (let i = 0; i < n; i++) {
      const words = [];
      for (let w = 0; w < AFF.randInt(14, 24); w++) words.push(AFF.rand(AFF.LOREM_WORDS));
      out.push(words.join(' ').replace(/^./, (c) => c.toUpperCase()) + '.');
    }
    return out.join(' ');
  };

  gen.longText = (settings) => {
    const s = settings.textarea || {};
    if (s.strategy === 'lorem') return gen.lorem(s.sentences);
    return gen.paragraph(s.sentences);
  };

  gen.idNumber = (ctx) => {
    const digits = (n) => String(AFF.randInt(Math.pow(10, n - 1), Math.pow(10, n) - 1));
    if (/passport/i.test(ctx)) return AFF.rand(['B', 'A', 'X']) + digits(7);
    if (/voter/i.test(ctx)) return digits(3) + AFF.pad(AFF.randInt(0, 9999999999), 10);
    if (/driving|licence|license|dl\b/i.test(ctx)) return digits(2) + '-' + digits(4) + '-' + digits(5);
    if (/tax|tin\b/i.test(ctx)) return digits(12);
    if (/ssn/i.test(ctx)) return `${digits(3)}-${digits(2)}-${digits(4)}`;
    if (/iban/i.test(ctx)) return 'DE' + digits(2) + ' ' + digits(4) + ' ' + digits(4) + ' ' + digits(4) + ' ' + digits(4);
    if (/swift|bic/i.test(ctx)) return 'TESTUS33XXX';
    if (/routing/i.test(ctx)) return String(AFF.randInt(100000000, 999999999));
    if (/card|credit|debit/i.test(ctx)) return '4111 1111 1111 1111';
    if (/cvv|cvc/i.test(ctx)) return String(AFF.randInt(100, 999));
    if (/dash|hyphen|format|xxxx/i.test(ctx)) { const n = digits(12); return `${n.slice(0, 4)}-${n.slice(4, 8)}-${n.slice(8)}`; }
    return digits(10);
  };

  gen.color = () => '#' + Array.from({ length: 6 }, () => '0123456789abcdef'[AFF.randInt(0, 15)]).join('');

  /* ---------------- mode variants ---------------- */

  const INVALID = {
    name: () => AFF.rand(['12345', 'J0hn D03', '!!!', '   ']),
    email: () => AFF.rand(['not-an-email', 'user@@invalid', '@no-domain', 'user@', 'spaces in@mail.com']),
    phone: () => AFF.rand(['123', 'not-a-phone', '0000000000', 'abc-def-ghij']),
    address: () => AFF.rand(['!!!', 'x', '1234567890 '.repeat(6)]),
    city: () => '!!!!',
    zip: () => 'X0X0X0',
    state: () => '!!!!',
    country: () => '!!!!',
    company: () => '!!! ???',
    date: () => AFF.rand(['2021-02-30', '31/31/9999', 'not-a-date', '0000-00-00']),
    birthdate: () => '2077-13-45',
    number: () => AFF.rand(['-1', '0.5.5', '99999999999999999999', 'NaN']),
    password: () => AFF.rand(['123', 'a', '   ', '***']),
    url: () => AFF.rand(['not-a-url', 'ftp://', 'http://', 'javascript:void(0)']),
    id: () => AFF.rand(['0000', '!!!', 'ABCDEFGHI']),
    textarea: () => ''
  };

  const SECURITY_PAYLOADS = [
    '<script>alert("xss")</script>',
    '"><img src=x onerror=alert(1)>',
    "javascript:alert(1)",
    "' OR '1'='1' --",
    "1'; DROP TABLE users; --",
    '../../etc/passwd',
    '${jndi:ldap://probe.example/a}',
    '{{7*7}}',
    '<svg onload=alert(1)>',
    '\x00\x00',
    '%00%1b%5d',
    "Robert'); DROP TABLE Students;--",
    '<iframe src="javascript:alert(1)">',
    'union select null, null, null --'
  ];

  function extremeFor(type) {
    const UNI = 'Ünïcödé 🌍 日本語 العربية עברית 🚀 Γεία';
    switch (type) {
      case 'name': return UNI + ' ' + 'N'.repeat(120);
      case 'email': return 'a'.repeat(80) + '@' + 'b'.repeat(60) + '.' + 'c'.repeat(30);
      case 'phone': return '+99999999999999999999';
      case 'address': return UNI + ', ' + '9'.repeat(200);
      case 'city': return UNI + ' '.repeat(30);
      case 'zip': return '999999999999';
      case 'state': return UNI.repeat(3);
      case 'country': return UNI.repeat(3);
      case 'company': return UNI + ' ' + 'Co'.repeat(60);
      case 'date': return AFF.rand(['1900-01-01', '9999-12-31', '2000-13-40']);
      case 'birthdate': return '9999-12-31';
      case 'number': return AFF.rand(['9999999999999999999999', '-9999999999999999999999', '0', '1e999']);
      case 'password': return 'P@ss' + 'w0rd'.repeat(30) + '!🔥';
      case 'url': return 'https://' + 'x'.repeat(200) + '.' + 'y'.repeat(60) + '/';
      case 'id': return '9'.repeat(80);
      case 'textarea': return gen.paragraph(4) + ' ' + UNI + '\n\n' + 'z'.repeat(500);
      default: return UNI;
    }
  }

  function boundaryFor(type, el, valid, settings, constraints) {
    const maxLen = constraints?.maxlength;
    const minLen = constraints?.minlength;
    const textLike = ['name', 'email', 'phone', 'address', 'city', 'zip', 'state', 'country', 'company', 'password', 'url', 'id'];
    if (textLike.includes(type)) {
      if (maxLen) return valid.slice(0, 0) + 'B'.repeat(maxLen);
      if (minLen) return 'b'.repeat(minLen);
      return 'B'.repeat(255);
    }
    if (type === 'textarea') return 'B'.repeat(maxLen || 1000);
    if (type === 'number') {
      if (constraints?.max != null) return String(constraints.max);
      if (constraints?.min != null) return String(constraints.min);
      return String(settings.number.max);
    }
    if (type === 'date' || type === 'birthdate') {
      if (constraints?.max) return String(constraints.max);
      if (constraints?.min) return String(constraints.min);
      return type === 'birthdate' ? `${settings.birth.toYear}-12-31` : `${settings.date.toYear}-12-31`;
    }
    return valid;
  }

  /* ---------------- main entry: generate a value for a type in the current mode ---------------- */

  function generate(type, ctx, env) {
    const { mode = 'valid', settings, session = {}, L, el, constraints = {}, index = 0, seq = 0 } = env || {};
    if (!L) return '';
    const s = settings;

    if (mode === 'security' && type !== 'select' && type !== 'checkbox' && type !== 'radio' && type !== 'file') {
      return SECURITY_PAYLOADS[index % SECURITY_PAYLOADS.length];
    }

    let valid;
    switch (type) {
      case 'name': {
        const nameCtx = ctx || '';
        if (/first|fname|given/i.test(nameCtx)) valid = session.first || (session.first = gen.firstName(L));
        else if (/last|lname|sur|family/i.test(nameCtx)) valid = session.last || (session.last = gen.lastName(L));
        else if (/middle|mname/i.test(nameCtx)) valid = gen.firstName(L);
        else if (/username|user\s*name|login/i.test(nameCtx)) valid = gen.username(session.first && session.last ? session.first + session.last : gen.fullName(L), seq || null);
        else valid = session.name || (session.name = gen.fullName(L));
        break;
      }
      case 'email': valid = session.email || (session.email = gen.email(ctx, L, s, session, seq)); break;
      case 'phone': valid = session.phone || (session.phone = gen.phone(s.phoneFormat, L)); break;
      case 'address':
        if (/city|town/i.test(ctx)) { valid = gen.city(L); break; }
        if (/zip|post|pin/i.test(ctx)) { valid = gen.zip(L); break; }
        if (/state|province|region|county/i.test(ctx)) { valid = gen.state(L); break; }
        if (/country|nation(?!al)/i.test(ctx)) { valid = L.country; break; }
        valid = gen.street(L); break;
      case 'city': valid = gen.city(L); break;
      case 'zip': valid = gen.zip(L); break;
      case 'state': valid = gen.state(L); break;
      case 'country': valid = L.country; break;
      case 'company': valid = session.company || (session.company = gen.company(L)); break;
      case 'date': valid = /birth|dob/i.test(ctx) ? gen.birthDate(s, constraints) : gen.date(s, constraints); break;
      case 'birthdate': valid = gen.birthDate(s, constraints); break;
      case 'number': valid = gen.number(ctx, s, constraints); break;
      case 'password': valid = gen.password(s); break;
      case 'url': valid = gen.url(ctx, L); break;
      case 'id': valid = gen.idNumber(ctx); break;
      case 'textarea': valid = gen.longText(s); break;
      default: valid = s.unknownText || 'Test';
    }

    if (mode === 'invalid') {
      const inv = INVALID[type];
      return inv ? inv() : valid;
    }
    if (mode === 'boundary') return boundaryFor(type, el, valid, s, constraints);
    if (mode === 'extreme') return extremeFor(type);
    return valid;
  }

  /* ---------------- token expansion for fixed-value rules ---------------- */

  function expandTokens(str, env) {
    const { session = {}, L, seq = 0, index = 0, settings } = env || {};
    if (!L) return String(str);
    return String(str)
      .replace(/\{seq(?::(\d+))?\}/gi, (_, p) => AFF.pad(seq || 1, p ? parseInt(p, 10) : (settings?.sequence?.pad || 0)))
      .replace(/\{uuid\}/gi, () => (crypto?.randomUUID ? crypto.randomUUID() : AFF.uid()))
      .replace(/\{ts\}/gi, () => String(Date.now()))
      .replace(/\{date\}/gi, () => isoDate(new Date()))
      .replace(/\{time\}/gi, () => gen.time())
      .replace(/\{rand:(\d+)\}/gi, (_, n) => Array.from({ length: parseInt(n, 10) || 5 }, () => '0123456789'[AFF.randInt(0, 9)]).join(''))
      .replace(/\{first\}/gi, () => session.first || gen.firstName(L))
      .replace(/\{last\}/gi, () => session.last || gen.lastName(L))
      .replace(/\{email\}/gi, () => session.email || gen.email('', L, settings, session, seq))
      .replace(/\{phone\}/gi, () => session.phone || gen.phone(settings?.phoneFormat || 'local', L))
      .replace(/\{city\}/gi, () => gen.city(L))
      .replace(/\{country\}/gi, () => L.country)
      .replace(/\{index\}/gi, () => String(index));
  }

  gen.isoDate = isoDate;
  gen.SECURITY_PAYLOADS = SECURITY_PAYLOADS;

  AFF.gen = gen;
  AFF.generate = generate;
  AFF.expandTokens = expandTokens;
})();

/* ========== src/content/c04-detect.js ========== */
/* AutoForm Fill — field detection, labels, constraints */
(() => {
  'use strict';

  const AFF = globalThis.AFF_CONTENT_UTILS;

  /* Build a human label for reports and matching */
  function getLabel(el) {
    try {
      const root = el.getRootNode?.();
      const doc = root && root.host ? root : document;
      if (el.id) {
        const lbl = doc.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (lbl?.textContent.trim()) return lbl.textContent.trim().slice(0, 60);
      }
      const wrap = el.closest('label');
      if (wrap && wrap !== el) {
        const own = Array.from(wrap.childNodes).filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(' ');
        if (own) return own.slice(0, 60);
      }
      const aria = el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('data-label');
      if (aria?.trim()) return aria.trim().slice(0, 60);
      if (el.placeholder?.trim()) return el.placeholder.trim().slice(0, 60);
      if (el.name) return String(el.name).slice(0, 60);
    } catch (e) { /* ignore */ }
    return (el.tagName || 'field').toLowerCase() + (el.type ? `[${el.type}]` : '');
  }

  /* Everything that might hint at what the field is for */
  function getFieldContext(el) {
    const attrs = [
      el.name, el.id, el.placeholder,
      typeof el.className === 'string' ? el.className : '',
      el.getAttribute?.('data-field'), el.getAttribute?.('data-testid'), el.getAttribute?.('data-test'),
      el.getAttribute?.('data-qa'), el.getAttribute?.('data-name'), el.getAttribute?.('data-label'),
      el.getAttribute?.('formcontrolname'), el.getAttribute?.('ng-reflect-name'),
      el.getAttribute?.('autocomplete'), el.getAttribute?.('title'), el.getAttribute?.('inputmode')
    ].filter(Boolean).join(' ').toLowerCase();

    let label = '';
    try {
      const root = el.getRootNode?.();
      const doc = root && root.host ? root : document;
      if (el.id) {
        const lbl = doc.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (lbl) label = lbl.textContent.toLowerCase();
      }
      if (!label) {
        const wrap = el.closest('label');
        if (wrap && wrap !== el) label = wrap.textContent.toLowerCase();
      }
      if (!label) {
        const parent = el.closest('div, td, th, li, p, section, fieldset');
        const lbl = parent?.querySelector('label, .label, [class*="label"], legend');
        if (lbl) label = lbl.textContent.toLowerCase();
      }
      if (!label) {
        const legend = el.closest('fieldset')?.querySelector('legend');
        if (legend) label = legend.textContent.toLowerCase();
      }
    } catch (e) { /* ignore */ }

    const aria = [el.getAttribute?.('aria-label'), el.getAttribute?.('aria-placeholder')].filter(Boolean).join(' ').toLowerCase();
    return (attrs + ' ' + label + ' ' + aria).replace(/\s+/g, ' ').trim().slice(0, 400);
  }

  /* Value constraints from attributes — used by boundary mode & clamping */
  function getConstraints(el) {
    const c = {};
    try {
      if (el.maxLength && el.maxLength > 0) c.maxlength = el.maxLength;
      if (el.minLength && el.minLength > 0) c.minlength = el.minLength;
      if (el.min !== undefined && el.min !== '' && !isNaN(Number(el.min))) c.min = Number(el.min);
      if (el.max !== undefined && el.max !== '' && !isNaN(Number(el.max))) c.max = Number(el.max);
      if (el.step && Number(el.step) > 0) c.step = Number(el.step);
      if (el.pattern) c.pattern = el.pattern;
      if (el.accept) c.accept = el.accept;
      if (el.multiple) c.multiple = true;
      if (el.required) c.required = true;
      if (el.min && isNaN(Number(el.min))) c.min = el.min;   // date min="2020-01-01"
      if (el.max && isNaN(Number(el.max))) c.max = el.max;
      c.ctx = getFieldContext(el);
    } catch (e) { /* ignore */ }
    return c;
  }

  /* What kind of value belongs in this field? Returns '<type>' or '<type>:<sub>' */
  function detectFieldType(el, ctx) {
    const ac = (el.getAttribute?.('autocomplete') || '').toLowerCase().replace(/^section-\w+\s+/, '');
    if (ac && ac !== 'off' && ac !== 'nope') {
      if (/email/.test(ac)) return 'email';
      if (/tel|mobile/.test(ac)) return 'phone';
      if (/given-name|fname/.test(ac)) return 'name:first';
      if (/family-name|lname|surname/.test(ac)) return 'name:last';
      if (/^name$|full-name/.test(ac)) return 'name:full';
      if (/username/.test(ac)) return 'name:username';
      if (/street-address|address-line/.test(ac)) return 'address';
      if (/postal|zip/.test(ac)) return 'address:zip';
      if (/address-level2|city|locality/.test(ac)) return 'address:city';
      if (/address-level1|state|province/.test(ac)) return 'address:state';
      if (/country/.test(ac)) return 'address:country';
      if (/organization|company/.test(ac)) return 'company';
      if (/bday|birthday/.test(ac)) return 'date:birth';
      if (/password|new-password|current-password/.test(ac)) return 'password';
      if (/url|website/.test(ac)) return 'url';
      if (/one-time-code/.test(ac)) return 'number';
    }

    const type = el.type || '';
    if (type === 'email') return 'email';
    if (type === 'tel') return 'phone';
    if (type === 'password') return 'password';
    if (type === 'url') return 'url';
    if (type === 'number') return 'number';
    if (type === 'range') return 'range';
    if (type === 'color') return 'color';
    if (type === 'date') return /birth|dob/i.test(ctx) ? 'date:birth' : 'date';
    if (type === 'datetime-local' || type === 'time' || type === 'month' || type === 'week') return 'date:' + type;

    const rules = [
      [/national.*id|nid\b|passport|voter.*id|birth.*cert|ssn|social.*security|tax.*id|tin\b/i, 'id'],
      [/iban|swift|bic|routing.*num/i, 'id'],
      [/card.*(num|no)|credit.*card|debit.*card/i, 'id'],
      [/cvv|cvc|security.*code/i, 'id'],
      [/confirm.*pass|re-?type.*pass|pass.*confirm|pass.*again|repeat.*pass/i, 'password'],
      [/first.*name|given.*name|fname/i, 'name:first'],
      [/middle.*name|mname/i, 'name:middle'],
      [/last.*name|sur.*name|family.*name|lname/i, 'name:last'],
      [/full.*name|complete.*name|student.*name|applicant.*name|holder.*name|customer.*name/i, 'name:full'],
      [/(?:^|\s)name(?:\s|$)/i, 'name:full'],
      [/user.*name|username|login|nick/i, 'name:username'],
      [/(?:phone|mobile|cell|tel|whatsapp|contact.*number|.*mobile.*no|.*phone.*no)\b/i, 'phone'],
      [/e-?mail|email.*address/i, 'email'],
      [/father|mother|parent|guardian|spouse|husband|wife|emergency.*contact|reference/i, 'name:full'],
      [/company|organization|employer|institute|school|college|university|business/i, 'company'],
      [/street|address.*line|residence|permanent.*address|present.*address|local.*address/i, 'address'],
      [/\bcity\b|town|municipality|upazila/i, 'address:city'],
      [/zip|post.*code|postal|pin.*code/i, 'address:zip'],
      [/\bstate\b|province|region|county|division/i, 'address:state'],
      [/country|nation(?!al)/i, 'address:country'],
      [/birth|dob|b\.?d\.?\b|date.*of.*birth/i, 'date:birth'],
      [/\bdate\b|join.*date|start.*date|end.*date|expir|issued|valid.*till/i, 'date'],
      [/\bage\b|year.*old|qty|quantity|amount.*of|count|salary|price|gpa|cgpa|marks|score|weight|height/i, 'number'],
      [/desc|about|note|comment|remark|detail|message|bio|summary|address.*full|feedback/i, 'textarea'],
      [/url|website|link|linkedin|facebook|github|portfolio/i, 'url'],
      [/coupon|promo|voucher|code\b/i, 'id']
    ];
    for (const [re, t] of rules) if (re.test(ctx)) return t;

    if (el.getAttribute?.('inputmode') === 'email') return 'email';
    if (el.getAttribute?.('inputmode') === 'tel') return 'phone';
    if (el.getAttribute?.('inputmode') === 'numeric') return 'number';
    if (el.getAttribute?.('inputmode') === 'decimal') return 'number';
    if (el.tagName === 'TEXTAREA') return 'textarea';
    return null;
  }

  /* Parent fill toggle for a detected type: 'name:first' -> 'name' */
  function toggleKeyFor(detected) {
    const [type] = String(detected).split(':');
    if (type === 'textarea') return 'textarea';
    return type;
  }

  /* Does this custom dropdown look like it holds a specific kind of value? */
  function dropdownKind(ctx) {
    if (/gender|sex/i.test(ctx)) return 'gender';
    if (/blood/i.test(ctx)) return 'blood';
    if (/country|nation/i.test(ctx)) return 'country';
    if (/state|province|region|county|division/i.test(ctx)) return 'state';
    if (/city|town/i.test(ctx)) return 'city';
    if (/month/i.test(ctx)) return 'month';
    if (/day/i.test(ctx)) return 'day';
    if (/year/i.test(ctx)) return 'year';
    if (/title|salutation/i.test(ctx)) return 'title';
    if (/yes\s*\/\s*no|agree|consent|terms/i.test(ctx)) return 'yesno';
    if (/shift/i.test(ctx)) return 'shift';
    if (/status/i.test(ctx)) return 'status';
    return null;
  }

  AFF.getLabel = getLabel;
  AFF.getFieldContext = getFieldContext;
  AFF.getConstraints = getConstraints;
  AFF.detectFieldType = detectFieldType;
  AFF.toggleKeyFor = toggleKeyFor;
  AFF.dropdownKind = dropdownKind;
})();

/* ========== src/content/c05-dom.js ========== */
/* AutoForm Fill — DOM layer: collection, value setting, frameworks, guard, picker, clear */
(() => {
  'use strict';

  const AFF = globalThis.AFF_CONTENT_UTILS;
  const MAX_FIELDS = 500;
  const SHADOW_SCAN_CAP = 600;

  /* ---------------- click safety ---------------- */

  function isDangerousClick(el) {
    if (!el) return true;
    const tag = (el.tagName || '').toLowerCase();
    if (tag === 'a') {
      const href = el.getAttribute('href');
      if (href && href !== '#' && !href.startsWith('javascript:')) return true;
    }
    if (tag === 'button') {
      const t = (el.getAttribute('type') || 'submit').toLowerCase();
      if (t === 'submit' || t === 'reset') return true;
    }
    if (el.type === 'submit' || el.type === 'reset') return true;
    return false;
  }

  function safeClick(el) {
    if (isDangerousClick(el)) return false;
    try {
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      return true;
    } catch (e) { return false; }
  }

  /* ---------------- value setting ---------------- */

  function setValueAndNotify(el, value) {
    try {
      const proto = el.tagName === 'TEXTAREA' ? (window.HTMLTextAreaElement?.prototype || HTMLTextAreaElement.prototype)
        : (window.HTMLInputElement?.prototype || HTMLInputElement.prototype);
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) setter.call(el, value); else el.value = value;
    } catch (e) {
      el.value = value;
    }
    const opts = { bubbles: true, cancelable: true };
    try { el.dispatchEvent(new InputEvent('input', { ...opts, inputType: 'insertText', data: String(value) })); }
    catch (e) { el.dispatchEvent(new Event('input', opts)); }
    el.dispatchEvent(new Event('change', opts));
    try { el.dispatchEvent(new Event('blur', opts)); } catch (e) { /* ignore */ }
  }

  /* ---------------- form scoping ---------------- */

  function isNavOrSearchForm(form) {
    if (form.closest('header, nav, [role=navigation], .navbar, .header, .topbar')) return true;
    if (form.getAttribute('role') === 'search') return true;
    const inputs = form.querySelectorAll('input:not([type=hidden])');
    return inputs.length === 1 && (inputs[0].type === 'search' || /search/i.test(inputs[0].name + inputs[0].id + inputs[0].placeholder));
  }

  function getPrimaryForm() {
    const forms = Array.from(document.querySelectorAll('form')).filter(
      (f) => !isNavOrSearchForm(f) && f.querySelectorAll('input:not([type=hidden]), select, textarea').length >= 2
    );
    if (!forms.length) return null;
    return forms.sort((a, b) => b.querySelectorAll('input,select,textarea').length - a.querySelectorAll('input,select,textarea').length)[0];
  }

  function getFillScope(scopeSetting) {
    if (scopeSetting === 'page') return document.body;
    return getPrimaryForm()
      || document.querySelector('main, [role=main], .filament-main, .fi-main, .page-content, .content-area, #content, [class*="main-content"]')
      || document.body;
  }

  function isInExcludedZone(el) {
    return !!el.closest('header, nav, aside, footer, [role=navigation], [role=banner], .navbar, .sidebar, .fi-sidebar, .fi-topbar, #site-header, #mobile-menu, [aria-hidden="true"]');
  }

  /* ---------------- guard: block submits while filling ---------------- */

  function beginFillGuard() {
    const restore = [];
    const block = (e) => { e.preventDefault(); e.stopImmediatePropagation(); return false; };
    document.querySelectorAll('form').forEach((f) => {
      f.addEventListener('submit', block, true);
      const orig = f.submit.bind(f);
      f.submit = () => {};
      restore.push(() => { f.removeEventListener('submit', block, true); f.submit = orig; });
    });
    ['turbo:before-visit', 'turbo:submit-start', 'htmx:beforeRequest'].forEach((ev) => {
      document.addEventListener(ev, block, true);
      restore.push(() => document.removeEventListener(ev, block, true));
    });
    const blockClick = (e) => {
      const el = e.target?.closest?.('a[href], button, input[type=submit], input[type=image]');
      if (el && isDangerousClick(el)) { e.preventDefault(); e.stopImmediatePropagation(); }
    };
    document.addEventListener('click', blockClick, true);
    restore.push(() => document.removeEventListener('click', blockClick, true));
    const blockEnter = (e) => {
      if (e.key !== 'Enter' || (e.target?.tagName || '').toLowerCase() === 'textarea') return;
      if (e.target?.closest?.('form')) { e.preventDefault(); e.stopImmediatePropagation(); }
    };
    document.addEventListener('keydown', blockEnter, true);
    restore.push(() => document.removeEventListener('keydown', blockEnter, true));
    return () => restore.reverse().forEach((fn) => { try { fn(); } catch (e) { /* ignore */ } });
  }

  /* ---------------- collection ---------------- */

  function isVisible(el) {
    try {
      if (!el.getClientRects().length) return false;
      const style = getComputedStyle(el);
      return style.visibility !== 'hidden' && style.display !== 'none';
    } catch (e) { return true; }
  }

  function collectFromRoot(root, list) {
    if (!root || list.seen.has(root) || list.count > MAX_FIELDS) return;
    list.seen.add(root);
    const q = (sel) => Array.from((root.querySelectorAll || root.querySelector)?.call(root, sel) || []);
    const add = (type, el) => {
      if (list.count >= MAX_FIELDS || list.seenEl.has(el)) return;
      list.seenEl.add(el);
      list.count++;
      list.items.push({ type, el });
    };

    q('input').forEach((el) => {
      const t = (el.type || 'text').toLowerCase();
      if (['hidden', 'submit', 'button', 'image', 'reset'].includes(t)) return;
      if (t === 'file') { add('file', el); return; }
      if (t === 'checkbox') { add('checkbox', el); return; }
      if (t === 'radio') { add('radio', el); return; }
      if (t === 'range') { add('range', el); return; }
      if (t === 'color') { add('color', el); return; }
      const cls = typeof el.className === 'string' ? el.className : '';
      const ph = (el.placeholder || '').toLowerCase();
      if (el.classList.contains('flatpickr-input')) add('input', el);
      else if (ph.includes('select') || el.classList.contains('vs__search') || /vs__search|react-select|ant-select|select2|select2-search__field|select__input/i.test(cls)) add('vue-select', el);
      else add('input', el);
    });

    q('textarea').forEach((el) => add('textarea', el));
    q('select').forEach((el) => {
      if (el.multiple) add('multiselect', el); else add('select', el);
    });
    q('[contenteditable=true], [contenteditable=""]').forEach((el) => {
      if (el.isContentEditable) add('contenteditable', el);
    });

    /* framework dropdowns that don't expose a real input we already caught */
    q('[role="combobox"]').forEach((el) => {
      const input = el.querySelector('input');
      if (input) { add('vue-select', input); return; }
      const btn = el.querySelector('button[type="button"], [role=button][aria-haspopup]');
      if (btn && !isDangerousClick(btn)) add('custom-dropdown', el);
    });
    q('.ant-select, .react-select, .react-select__control, .MuiSelect-select, mat-select, mat-form-field, .v-select, .vue-select, .p-dropdown, .ng-select-container, .ts-wrapper, .ts-control, .choices, .select2, [aria-haspopup="listbox"]').forEach((el) => {
      if (list.wrapperSeen.has(el)) return;
      const input = el.querySelector('input:not([type=hidden])');
      if (input) {
        if (!list.seenEl.has(input)) add('vue-select', input);
        list.wrapperSeen.add(el);
        return;
      }
      if (!list.seenEl.has(el)) {
        add('custom-dropdown', el);
        list.wrapperSeen.add(el);
      }
    });

    /* standalone listbox pattern: button + <ul role=listbox> (generic custom widgets).
       Only when closed/hidden — visible portals belong to framework widgets handled above. */
    q('[role="listbox"]').forEach((ul) => {
      try {
        if (isVisible(ul)) return;
        if (ul.closest('.v-select, .ant-select, .react-select, .p-dropdown, .ng-select-container, .choices, .ts-wrapper, .select2, .MuiPopover-root, [data-aff-listbox]')) return;
        const trigger = ul.previousElementSibling || (ul.parentElement ? ul.parentElement.querySelector('button, [role=button]') : null);
        if (trigger && !isDangerousClick(trigger) && !list.seenEl.has(trigger) && !list.seenEl.has(ul)) {
          list.seenEl.add(ul);
          add('custom-dropdown', trigger);
        }
      } catch (e) { /* ignore */ }
    });

    /* shadow DOM (web components) */
    try {
      let scanned = 0;
      q('*').forEach((el) => {
        if (scanned > SHADOW_SCAN_CAP) return;
        scanned++;
        if (el.shadowRoot && !list.seen.has(el.shadowRoot)) collectFromRoot(el.shadowRoot, list);
      });
    } catch (err) { /* ignore */ }
  }

  function docPosSort(items) {
    return items.sort((a, b) => {
      const pos = a.el.compareDocumentPosition(b.el);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });
  }

  /* Inputs that live inside known JS-dropdown wrappers are dropdown searches, not text fields */
  const DROPDOWN_WRAPPER_RX = '.ts-wrapper, .ts-control, .choices, .ng-select-container, .vs__dropdown-toggle, .v-select, .vue-select, .ant-select, .react-select, .p-dropdown, .select2, .select2-container, [role="combobox"]';

  /* Containment across shadow boundaries: body.contains() misses shadow internals */
  function containsDeep(root, el) {
    if (!root || !el) return false;
    if (root.contains(el)) return true;
    let node = el;
    try {
      while (node) {
        const sr = node.getRootNode ? node.getRootNode() : null;
        if (sr && sr.host) {
          node = sr.host;
          if (root.contains(node)) return true;
        } else break;
      }
    } catch (e) { /* ignore */ }
    return false;
  }

  function collect(scopeSetting) {
    const list = { items: [], seen: new Set(), seenEl: new Set(), wrapperSeen: new Set(), count: 0 };
    const root = scopeSetting === 'page' ? document.body : (getFillScope(scopeSetting) || document.body);
    collectFromRoot(root, list);
    for (const item of list.items) {
      if (item.type !== 'input' || item.el.classList.contains('flatpickr-input')) continue;
      try {
        if (item.el.closest(DROPDOWN_WRAPPER_RX)) item.type = 'vue-select';
      } catch (e) { /* ignore */ }
    }
    const seen = new Set();
    const unique = [];
    for (const item of list.items) {
      if (!seen.has(item.el)) { seen.add(item.el); unique.push(item); }
    }
    return docPosSort(unique).filter((item) => containsDeep(root, item.el) && !isInExcludedZone(item.el));
  }

  /* ---------------- highlighting & scrolling ---------------- */

  function flashHighlight(el, settings) {
    if (!settings.highlight) return;
    try {
      const original = el.style.boxShadow;
      const originalTrans = el.style.transition;
      el.style.transition = 'box-shadow 0.2s ease';
      el.style.boxShadow = `0 0 8px 2px ${settings.highlightColor || '#2563eb'}`;
      if (!isVisible(el)) return;
      const r = el.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) el.scrollIntoView({ behavior: 'auto', block: 'center' });
      setTimeout(() => {
        el.style.boxShadow = original;
        el.style.transition = originalTrans;
      }, 350);
    } catch (e) { /* ignore */ }
  }

  /* ---------------- dynamic "Add" sections ---------------- */

  function fieldCountIn(root) {
    return (root || document.body).querySelectorAll('input:not([type=hidden]), select, textarea').length;
  }

  function isAddNewButton(el) {
    if (!el || isInExcludedZone(el)) return false;
    const tag = (el.tagName || '').toLowerCase();
    if (tag === 'a') {
      const href = el.getAttribute('href') || '';
      if (href && href !== '#' && !href.startsWith('javascript:')) return false;
    } else if (tag === 'button') {
      if ((el.getAttribute('type') || 'submit').toLowerCase() !== 'button') return false;
    } else if (el.getAttribute('role') !== 'button') return false;
    const text = (el.textContent || el.getAttribute('aria-label') || el.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
    const hint = (text + ' ' + (el.className || '') + ' ' + (el.id || '') + ' ' + (el.getAttribute('name') || '')).toLowerCase();
    if (/remove|delete|cancel|submit|save\b|back|prev|next|close|clear|edit|upload/i.test(text) && !/add/i.test(text)) return false;
    if (/\b(add|new row|new field|new entry|another|insert|append|repeater)\b/i.test(hint)) return true;
    if (/add[-_]|btn-add|addnew|add_more|field-add|repeater-add|fi-fo-repeater|fi-ac-action/i.test(hint)) return true;
    if (/^\+$|^add$/i.test(text)) return true;
    if (/plus|fa-plus|icon-plus/i.test(hint) && text.length < 24) return true;
    return false;
  }

  async function expandDynamicSections(scope, minAdds = 3) {
    const root = scope || document.body;
    const btns = [...new Set(Array.from(root.querySelectorAll('button, [role=button], a')).filter(
      (b) => isVisible(b) && isAddNewButton(b) && root.contains(b)
    ))];
    if (!btns.length) return;
    for (const btn of btns) {
      for (let i = 0; i < minAdds; i++) {
        const before = fieldCountIn(root);
        safeClick(btn);
        await AFF.sleep(350);
        if (fieldCountIn(root) <= before) break;
      }
    }
  }

  /* ---------------- custom dropdown handling ---------------- */

  function pickOptionFor(kind, options, L, settings) {
    const texts = options.map((o) => (o.textContent || '').trim());
    const pool = options.filter((o, i) => !/^(select|choose|pick|--|none|null|loading|please)/i.test(texts[i] || ''));
    const use = pool.length ? pool : options;
    switch (kind) {
      case 'gender': {
        const sub = use.filter((o) => /^(male|female|m|f)$/i.test((o.textContent || '').trim()));
        if (sub.length) return AFF.rand(sub);
        break;
      }
      case 'blood': {
        const sub = use.filter((o) => /^[ABO][+-]$/i.test((o.textContent || '').trim()));
        if (sub.length) return AFF.rand(sub);
        break;
      }
      case 'country': {
        const sub = use.filter((o) => (o.textContent || '').trim() === L.country);
        if (sub.length) return sub[0];
        break;
      }
      case 'title': {
        const sub = use.filter((o) => /^(mr|mrs|ms|miss|dr)\b/i.test((o.textContent || '').trim()));
        if (sub.length) return AFF.rand(sub);
        break;
      }
      case 'yesno': {
        const sub = use.filter((o) => /^(yes|no|true|false)$/i.test((o.textContent || '').trim()));
        if (sub.length) return AFF.rand(sub);
        break;
      }
      case 'status': {
        const sub = use.filter((o) => /active|enabled|pending|published/i.test((o.textContent || '').trim()));
        if (sub.length) return AFF.rand(sub);
        break;
      }
      default: break;
    }
    return AFF.rand(use);
  }

  /* Generic open-then-pick for JS dropdown widgets (AntD, react-select, vue-select, MUI, Tom Select, Choices, ng-select, PrimeNG…) */
  function openAndPick(trigger, { itemSelector, kind, ctx }) {
    const L = AFF.LOCALE_DATA[AFF.currentLocale] || AFF.LOCALE_DATA['en-US'];
    return new Promise((resolve) => {
      let attempts = 0;
      const tryPick = () => {
        if (attempts++ > 9) { resolve(); return; }
        safeClick(trigger);
        setTimeout(() => {
          const opts = Array.from(document.querySelectorAll(itemSelector)).filter((o) => {
            try {
              const r = o.getBoundingClientRect();
              if (r.width < 2 || r.height < 2) return false;
              if (o.getAttribute('aria-disabled') === 'true' || o.classList.contains('disabled') || /(^|\s)(is-)?disabled(\s|$)/.test(o.className)) return false;
              return !/select|choose|loading/i.test((o.textContent || '').trim().slice(0, 30));
            } catch (e) { return false; }
          });
          if (opts.length) {
            const pick = pickOptionFor(kind || AFF.dropdownKind(ctx || ''), opts, L, {});
            if (pick) {
              try { pick.scrollIntoView({ block: 'nearest' }); } catch (e) { /* ignore */ }
              safeClick(pick);
              setTimeout(resolve, 60);
              return;
            }
          }
          setTimeout(tryPick, 140);
        }, 110);
      };
      tryPick();
    });
  }

  async function processCustomWidget(el, ctx) {
    if (el.disabled || el.getAttribute?.('aria-disabled') === 'true') return;
    const ant = el.closest?.('.ant-select');
    if (ant && !ant.classList.contains('ant-select-disabled')) {
      const trigger = ant.querySelector('.ant-select-selector') || el;
      return openAndPick(trigger, { itemSelector: '.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item:not(.ant-select-item-disabled)', kind: AFF.dropdownKind(ctx), ctx });
    }
    const react = el.closest?.('.react-select');
    if (react) {
      const trigger = react.querySelector('.react-select__control') || el;
      return openAndPick(trigger, { itemSelector: '.react-select__menu .react-select__option', kind: AFF.dropdownKind(ctx), ctx });
    }
    const ts = el.closest?.('.ts-wrapper, .ts-control');
    if (ts) {
      const trigger = ts.classList.contains('ts-control') ? ts : ts.querySelector('.ts-control') || el;
      return openAndPick(trigger, { itemSelector: '.ts-dropdown [data-selectable]', kind: AFF.dropdownKind(ctx), ctx });
    }
    const choices = el.closest?.('.choices');
    if (choices) {
      return openAndPick(choices.querySelector('.choices__inner') || el, { itemSelector: '.choices__list--dropdown .choices__item--choice:not(.is-disabled)', kind: AFF.dropdownKind(ctx), ctx });
    }
    const ng = el.closest?.('.ng-select-container');
    if (ng) {
      return openAndPick(ng, { itemSelector: '.ng-dropdown-panel .ng-option:not(.ng-option-disabled)', kind: AFF.dropdownKind(ctx), ctx });
    }
    const pdrop = el.closest?.('.p-dropdown');
    if (pdrop && !pdrop.classList.contains('p-disabled')) {
      return openAndPick(pdrop, { itemSelector: '.p-dropdown-items .p-dropdown-item:not(.p-disabled)', kind: AFF.dropdownKind(ctx), ctx });
    }

    /* v-select / vue-select with search input */
    const toggle = el.closest?.('.vs__dropdown-toggle');
    const vselect = toggle ? toggle.closest('.v-select, .vue-select') || toggle.parentElement : el.closest?.('.v-select, .vue-select');
    if (vselect) {
      const arrow = vselect.querySelector('.vs__open-indicator, .vs__actions, .vs__dropdown-toggle');
      return openAndPick(arrow || toggle || el, { itemSelector: '.vs__dropdown-menu .vs__dropdown-option:not(.vs__dropdown-option--disabled), ul[role=listbox] [role=option]', kind: AFF.dropdownKind(ctx), ctx });
    }

    /* last resort: element with a popup trigger */
    const btn = el.closest?.('[aria-haspopup], [role=button]') || el;
    return openAndPick(btn, {
      itemSelector: '[role="option"]:not([aria-disabled=true]), .dropdown-item:not(.disabled), .MuiListItem-root:not(.Mui-disabled), .mat-option:not(.mat-option-disabled), [role=menuitemradio]',
      kind: AFF.dropdownKind(ctx), ctx
    });
  }

  function fillSelect2() {
    if (!window.jQuery || !window.jQuery.fn.select2) return;
    try {
      window.jQuery('select.select2, .select2-hidden-accessible').each(function () {
        const $sel = window.jQuery(this);
        if ($sel.prop('disabled') || $sel.prop('readonly')) return;
        if ($sel.val() && $sel.val() !== '' && $sel.val() !== '0') return;
        const opts = $sel.find('option:not([disabled])').filter(function () {
          return $sel(this).val() && !/^(select|choose|pick|--|none|null)$/i.test($sel(this).text().trim());
        });
        if (opts.length) $sel.val(opts.eq(AFF.randInt(0, opts.length - 1)).val()).trigger('change').trigger('change.select2');
      });
    } catch (e) { /* ignore */ }
  }

  /* ---------------- native <select> ---------------- */

  function looksLikePlaceholder(opt) {
    const t = (opt.textContent || '').trim().toLowerCase();
    return !opt.value && (t === '' || /^(select|choose|pick|--|—|none|null|please)/i.test(t) || opt.disabled);
  }

  function fillNativeSelect(sel, ctx, L, settings, mode) {
    if (sel.disabled) return 'skipped';
    const options = Array.from(sel.options);
    if (!options.length) return 'skipped';

    const placeholders = options.filter(looksLikePlaceholder);
    const candidates = options.filter((o) => !looksLikePlaceholder(o) && !o.disabled && o.value !== '');

    if (mode === 'invalid' && placeholders.length) {
      sel.selectedIndex = options.indexOf(placeholders[0]);
      sel.dispatchEvent(new Event('input', { bubbles: true }));
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      return 'filled';
    }

    let pool = candidates.length ? candidates : options.slice(placeholders.length ? options.indexOf(placeholders[placeholders.length - 1]) + 1 : 1);
    if (!pool.length) pool = options.slice(1);
    if (!pool.length) return 'skipped';

    const kind = AFF.dropdownKind(ctx);
    let choice = pickOptionFor(kind, pool, L, settings);
    if (!choice) choice = AFF.rand(pool);

    if (sel.multiple) {
      options.forEach((o) => { o.selected = false; });
      const count = Math.min(AFF.clamp(settings.multiselectCount || 2, 1, pool.length), pool.length);
      const picks = AFF.shuffle(pool).slice(0, count);
      picks.forEach((o) => { o.selected = true; });
    } else {
      sel.value = choice.value;
      if (sel.selectedIndex < 0) sel.selectedIndex = options.indexOf(choice);
    }
    sel.dispatchEvent(new Event('input', { bubbles: true }));
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    if (window.jQuery) { try { window.jQuery(sel).trigger('change'); } catch (e) { /* ignore */ } }
    return 'filled';
  }

  /* ---------------- file inputs ---------------- */

  function dataURLtoFile(dataurl, filename) {
    if (!dataurl) return null;
    try {
      const arr = dataurl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);
      return new File([u8arr], filename, { type: mime });
    } catch (e) { return null; }
  }

  function setFilesAndNotify(el, files) {
    try {
      if (!files || !files.length) return;
      el.files = files;
      ['input', 'change', 'blur'].forEach((ev) => el.dispatchEvent(new Event(ev, { bubbles: true })));
      let p = el.parentElement;
      for (let i = 0; i < 3 && p; i++) { p.dispatchEvent(new Event('change', { bubbles: true })); p = p.parentElement; }
    } catch (e) { /* ignore */ }
  }

  function fillFileInput(el, ctx, customFiles) {
    const isImage = /image|photo|picture|avatar|logo|pic/i.test(ctx);
    const isPdf = /pdf|document|resume|cv/i.test(ctx);
    const multiple = el.hasAttribute('multiple');
    const accept = (el.getAttribute('accept') || '').toLowerCase();
    const hasImage = accept.includes('image') || /\.(jpg|jpeg|png|gif|bmp|webp|svg)/i.test(accept) || isImage;
    const hasPdf = accept.includes('pdf') || /\.(pdf|doc|docx)/i.test(accept) || isPdf;

    const cf = customFiles || {};
    const TINY_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    try {
      const dt = new DataTransfer();
      if (hasImage) {
        const f = cf.image ? dataURLtoFile(cf.image, cf.imageName || 'custom-image.png') : dataURLtoFile(TINY_PNG, 'demo-image.png');
        if (f) dt.items.add(f);
        if (hasPdf) {
          const pf = cf.pdf ? dataURLtoFile(cf.pdf, cf.pdfName || 'custom-doc.pdf') : new File([new Blob(['%PDF-1.4\n%Demo'], { type: 'application/pdf' })], 'demo-doc.pdf', { type: 'application/pdf' });
          if (pf) dt.items.add(pf);
        }
        if (multiple) {
          const f2 = cf.image ? dataURLtoFile(cf.image, 'custom-image-2.png') : dataURLtoFile(TINY_PNG, 'demo-image-2.png');
          if (f2) dt.items.add(f2);
        }
      } else if (hasPdf) {
        const f = cf.pdf ? dataURLtoFile(cf.pdf, cf.pdfName || 'custom-doc.pdf') : new File([new Blob(['%PDF-1.4\n%Demo PDF'], { type: 'application/pdf' })], 'demo-doc.pdf', { type: 'application/pdf' });
        if (f) dt.items.add(f);
        if (multiple) dt.items.add(new File([new Blob(['%PDF-1.4\n%Demo 2'], { type: 'application/pdf' })], 'demo-doc-2.pdf', { type: 'application/pdf' }));
      } else {
        dt.items.add(new File([new Blob(['Demo file content'], { type: 'text/plain' })], 'demo.txt', { type: 'text/plain' }));
        if (multiple) dt.items.add(new File([new Blob(['Demo file 2'], { type: 'text/plain' })], 'demo-2.txt', { type: 'text/plain' }));
      }
      setFilesAndNotify(el, dt.files);
    } catch (e) { AFF.warn('file fill failed', e); }
  }

  /* ---------------- clear form ---------------- */

  function clearValue(el) {
    const tag = (el.tagName || '').toLowerCase();
    const t = (el.type || '').toLowerCase();
    if (t === 'checkbox' || t === 'radio') {
      if (el.checked) { el.checked = false; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
      return true;
    }
    if (t === 'file') { try { el.value = ''; } catch (e) { /* ignore */ } return true; }
    if (tag === 'select') {
      const emptyOpt = Array.from(el.options).find((o) => o.value === '');
      if (el.multiple) { Array.from(el.options).forEach((o) => { o.selected = false; }); }
      else if (emptyOpt) { el.value = ''; } else { el.selectedIndex = -1; }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      if (window.jQuery) { try { window.jQuery(el).trigger('change'); } catch (e) { /* ignore */ } }
      return true;
    }
    if (el.isContentEditable) {
      el.textContent = '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }
    if (el.value !== '') {
      setValueAndNotify(el, '');
    }
    return true;
  }

  /* ---------------- field picker ---------------- */

  const picker = { active: false, included: new Set(), styles: new Map(), panel: null, onFill: null };

  function pickerOutline(el, selected) {
    el.style.outline = selected ? '2px solid #22c55e' : '2px dashed #9ca3af';
    el.style.outlineOffset = '1px';
    el.style.backgroundColor = selected ? 'rgba(34,197,94,.12)' : 'rgba(156,163,175,.08)';
  }

  function pickerReset(el, saved) {
    el.style.outline = saved.outline;
    el.style.outlineOffset = saved.outlineOffset;
    el.style.backgroundColor = saved.bg;
  }

  function buildPickerPanel(count) {
    const host = document.createElement('div');
    host.id = 'aff-picker-host';
    host.style.cssText = 'all:initial;position:fixed;top:12px;right:12px;z-index:2147483647;font:13px/1.4 system-ui,-apple-system,sans-serif;';
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        .panel{background:#111827;color:#f9fafb;border-radius:10px;padding:12px;box-shadow:0 10px 30px rgba(0,0,0,.35);width:270px}
        .t{font-weight:600;margin-bottom:6px;font-size:13px}
        .hint{color:#9ca3af;font-size:11px;margin-bottom:10px}
        .row{display:flex;gap:6px;flex-wrap:wrap}
        button{flex:1;cursor:pointer;border:none;border-radius:6px;padding:7px 8px;font:inherit;font-size:12px}
        .fill{background:#22c55e;color:#052e16;font-weight:600}
        .all,.none{background:#374151;color:#e5e7eb}
        .cancel{background:#7f1d1d;color:#fecaca}
        .count{color:#22c55e;font-weight:600}
      </style>
      <div class="panel">
        <div class="t">AutoForm Fill — field picker</div>
        <div class="hint">Click fields to include/exclude. <span class="count">${count}</span> selected.</div>
        <div class="row">
          <button class="fill" data-a="fill">Fill selected</button>
          <button class="all" data-a="all">All</button>
          <button class="none" data-a="none">None</button>
          <button class="cancel" data-a="cancel">Cancel</button>
        </div>
      </div>`;
    return host;
  }

  async function startPicker(fillSelected) {
    if (picker.active) stopPicker(null);
    const settings = (await AFF.loadSettingsForUI?.()) || { highlightColor: '#2563eb' };
    const items = collect('page').filter((it) => it.type !== 'radio');
    picker.active = true;
    picker.included = new Set();
    picker.styles = new Map();

    for (const { el } of items) {
      picker.styles.set(el, { outline: el.style.outline, outlineOffset: el.style.outlineOffset, bg: el.style.backgroundColor });
      picker.included.add(el);
      pickerOutline(el, true);
    }

    const clickCapture = (e) => {
      const el = e.target?.closest ? e.target.closest('input, textarea, select, [contenteditable=true], .ant-select, .react-select, .v-select, .p-dropdown, .ng-select-container, .ts-control, .choices, [role=combobox]') : null;
      if (el && picker.styles.has(el)) {
        e.preventDefault(); e.stopPropagation();
        const on = picker.included.has(el);
        if (on) picker.included.delete(el); else picker.included.add(el);
        pickerOutline(el, !on);
        updateCount();
        return;
      }
      if (e.target === document.body || e.target === document.documentElement) return;
    };
    const keyHandler = (e) => { if (e.key === 'Escape') stopPicker(null); };
    picker.clickCapture = clickCapture;
    picker.keyHandler = keyHandler;
    document.documentElement.addEventListener('mousedown', clickCapture, true);
    document.documentElement.addEventListener('touchstart', clickCapture, true);
    document.addEventListener('keydown', keyHandler, true);

    const host = buildPickerPanel(picker.included.size);
    picker.panel = host;
    document.documentElement.appendChild(host);
    host.shadowRoot.querySelectorAll('button').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.preventDefault();
        const a = b.dataset.a;
        if (a === 'fill') { const sel = new Set(picker.included); stopPicker(sel); }
        else if (a === 'cancel') stopPicker(null);
        else if (a === 'all') { picker.styles.forEach((s, el) => { picker.included.add(el); pickerOutline(el, true); }); updateCount(); }
        else if (a === 'none') { picker.included.clear(); picker.styles.forEach((s, el) => pickerOutline(el, false)); updateCount(); }
      });
    });
    function updateCount() {
      const c = host.shadowRoot.querySelector('.count');
      if (c) c.textContent = String(picker.included.size);
    }
    picker.onFill = fillSelected;
    return { ok: true, count: items.length };
  }

  function stopPicker(selection) {
    if (!picker.active) return;
    picker.active = false;
    if (picker.clickCapture) {
      document.documentElement.removeEventListener('mousedown', picker.clickCapture, true);
      document.documentElement.removeEventListener('touchstart', picker.clickCapture, true);
    }
    if (picker.keyHandler) document.removeEventListener('keydown', picker.keyHandler, true);
    picker.styles.forEach((saved, el) => { try { pickerReset(el, saved); } catch (e) { /* ignore */ } });
    try { picker.panel?.remove(); } catch (e) { /* ignore */ }
    picker.styles = new Map();
    picker.panel = null;
    if (selection && picker.onFill) picker.onFill(selection);
    picker.onFill = null;
  }

  /* ---------------- toast ---------------- */

  function showToast(report, settings) {
    if (!settings.toast) return;
    try {
      const old = document.getElementById('aff-toast-host');
      if (old) old.remove();
      const host = document.createElement('div');
      host.id = 'aff-toast-host';
      host.style.cssText = 'all:initial;position:fixed;bottom:16px;right:16px;z-index:2147483647;';
      const shadow = host.attachShadow({ mode: 'open' });
      const color = report.failed > 0 ? '#f59e0b' : '#22c55e';
      shadow.innerHTML = `
        <style>
          .t{background:#111827;color:#f9fafb;border-radius:10px;padding:10px 14px;box-shadow:0 10px 30px rgba(0,0,0,.35);
             font:13px/1.4 system-ui,-apple-system,sans-serif;border-left:4px solid ${color};max-width:320px}
          b{color:${color}}
        </style>
        <div class="t"><b>Filled ${report.filled}</b> · skipped ${report.skipped}${report.failed ? ` · <b>${report.failed} failed</b>` : ''}${report.steps > 1 ? ` · ${report.steps} steps` : ''}<br><span style="color:#9ca3af;font-size:11px">AutoForm Fill — ${report.mode} mode</span></div>`;
      document.documentElement.appendChild(host);
      setTimeout(() => { try { host.remove(); } catch (e) { /* ignore */ } }, 4000);
    } catch (e) { /* ignore */ }
  }

  Object.assign(AFF, {
    isDangerousClick, safeClick, setValueAndNotify,
    isNavOrSearchForm, getPrimaryForm, getFillScope, isInExcludedZone,
    beginFillGuard, isVisible, collect, flashHighlight,
    expandDynamicSections, isAddNewButton,
    processCustomWidget, fillSelect2, fillNativeSelect,
    fillFileInput, clearValue,
    startPicker, stopPicker, isPickerActive: () => picker.active,
    showToast
  });
})();

/* ========== src/content/c06-fill.js ========== */
/* AutoForm Fill — fill orchestrator: report, rules, multi-step, clear */
(() => {
  'use strict';

  const AFF = globalThis.AFF_CONTENT_UTILS;

  function matchRule(rules, ctx) {
    if (!Array.isArray(rules)) return null;
    for (const rule of rules) {
      if (rule.enabled === false || !rule.pattern) continue;
      let matched = false;
      if (rule.match === 'regex') {
        try { matched = new RegExp(rule.pattern, 'i').test(ctx); } catch (e) { /* bad regex — ignore */ }
      } else {
        matched = ctx.toLowerCase().includes(String(rule.pattern).toLowerCase());
      }
      if (matched) return rule;
    }
    return null;
  }

  function truncVal(v, n = 60) {
    const s = String(v ?? '');
    return s.length > n ? s.slice(0, n) + '…' : s;
  }

  function setRangeValue(el, constraints) {
    const min = constraints.min != null ? constraints.min : (parseFloat(el.min) || 0);
    const max = constraints.max != null ? constraints.max : (parseFloat(el.max) || 100);
    let step = constraints.step || parseFloat(el.step) || 1;
    const span = Math.max(0, max - min);
    let v = min + Math.floor(Math.random() * (span / step + 1)) * step;
    if (v > max) v = max;
    setValue(el, String(v));
  }

  function setValue(el, value) {
    AFF.setValueAndNotify(el, value);
    try {
      if (el.classList.contains('flatpickr-input') && el._flatpickr) el._flatpickr.setDate(value, true);
    } catch (e) { /* ignore */ }
  }

  function validityBlocks(el, mode) {
    if (mode !== 'valid') return false; // invalid/boundary/extreme intentionally break validation
    try { return !!(el.willValidate && el.validity && !el.validity.valid); } catch (e) { return false; }
  }

  /* Fill one collected item; returns {status, type, value} */
  async function fillItem(item, env) {
    const { el } = item;
    const { settings, mode, rules, customFiles, L } = env;
    const type0 = item.type;

    if (el.disabled) return { status: 'skipped', type: type0, reason: 'disabled' };
    if (el.readOnly && type0 === 'input' && !el.classList.contains('flatpickr-input')) {
      return { status: 'skipped', type: type0, reason: 'readonly' };
    }
    if (!AFF.isPickerActive() && !AFF.isVisible(el)) return { status: 'skipped', type: type0, reason: 'hidden' };

    const ctx = AFF.getFieldContext(el);
    const constraints = AFF.getConstraints(el);

    /* non-text controls first */
    if (type0 === 'checkbox') {
      if (!settings.fill.checkbox) return { status: 'skipped', type: 'checkbox', reason: 'type off' };
      const consent = settings.checkConsents && /terms|agree|consent|privacy|policy|condition|gdpr|confirm/i.test(ctx);
      const on = mode === 'valid' ? (consent || Math.random() < 0.6) : mode === 'invalid' ? Math.random() < 0.3 : Math.random() < 0.5;
      if (el.checked !== on) {
        el.checked = on;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return { status: 'filled', type: 'checkbox', value: on ? 'checked' : 'unchecked' };
    }
    if (type0 === 'file') {
      if (!settings.fill.file) return { status: 'skipped', type: 'file', reason: 'type off' };
      AFF.fillFileInput(el, ctx, customFiles);
      return { status: 'filled', type: 'file', value: 'uploaded' };
    }
    if (type0 === 'range') {
      if (!settings.fill.range) return { status: 'skipped', type: 'range', reason: 'type off' };
      setRangeValue(el, constraints);
      return { status: 'filled', type: 'range', value: truncVal(el.value) };
    }
    if (type0 === 'color') {
      if (!settings.fill.color) return { status: 'skipped', type: 'color', reason: 'type off' };
      setValue(el, AFF.gen.color());
      return { status: 'filled', type: 'color', value: truncVal(el.value) };
    }
    if (type0 === 'select' || type0 === 'multiselect') {
      if (!settings.fill.select) return { status: 'skipped', type: 'select', reason: 'type off' };
      const st = AFF.fillNativeSelect(el, ctx, L, settings, mode);
      return { status: st === 'filled' ? 'filled' : 'skipped', type: 'select', value: truncVal(el.value || el.selectedOptions?.[0]?.textContent || '') };
    }
    if (type0 === 'vue-select' || type0 === 'custom-dropdown') {
      if (!settings.fill.select) return { status: 'skipped', type: 'select', reason: 'type off' };
      await AFF.withTimeout(AFF.processCustomWidget(el, ctx), 2400);
      return { status: 'filled', type: 'select', value: 'widget' };
    }
    if (type0 === 'contenteditable') {
      if (!settings.fill.textarea) return { status: 'skipped', type: 'textarea', reason: 'type off' };
      const detected = AFF.detectFieldType(el, ctx) || 'textarea';
      const rule = matchRule(rules, ctx);
      const text = rule && rule.action === 'fixed' && rule.fixedValue
        ? AFF.expandTokens(rule.fixedValue, env)
        : AFF.generate(rule?.action === 'generate' ? rule.type : 'textarea', ctx, env);
      el.textContent = text;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return { status: 'filled', type: 'textarea', value: truncVal(text) };
    }

    /* text-ish inputs & textareas */
    const isTextarea = type0 === 'textarea';
    const inputType = (el.type || 'text').toLowerCase();

    /* date & time input types */
    if (!isTextarea && ['date', 'datetime-local', 'time', 'month', 'week'].includes(inputType)) {
      if (!settings.fill.date) return { status: 'skipped', type: 'date', reason: 'type off' };
      let value;
      if (inputType === 'time') value = mode === 'valid' ? AFF.gen.time() : mode === 'invalid' ? '99:99' : '23:59';
      else if (inputType === 'month') value = mode === 'valid' ? AFF.gen.month() : '9999-99';
      else if (inputType === 'week') value = mode === 'valid' ? AFF.gen.week() : '9999-W99';
      else if (inputType === 'datetime-local') value = mode === 'valid' ? AFF.gen.datetime() : '9999-12-31T99:99';
      else {
        value = AFF.generate(/birth|dob/i.test(ctx) ? 'birthdate' : 'date', ctx, { ...env, constraints });
        if (mode === 'valid') { // clamp to attribute range only when validation matters
          if (constraints.min && value < constraints.min) value = constraints.min;
          if (constraints.max && value > constraints.max) value = constraints.max;
        }
      }
      const old = el.value;
      setValue(el, value);
      if (validityBlocks(el, mode)) { setValue(el, old); return { status: 'failed', type: 'date', reason: 'rejected' }; }
      return { status: 'filled', type: 'date', value: truncVal(value) };
    }

    if (!isTextarea && inputType === 'number') {
      if (!settings.fill.number) return { status: 'skipped', type: 'number', reason: 'type off' };
      let value = AFF.generate('number', ctx, { ...env, constraints });
      if (mode === 'valid') { // clamp only when validation matters
        const c = constraints;
        if (c.min != null) value = String(Math.max(Number(value), c.min));
        if (c.max != null) value = String(Math.min(Number(value), c.max));
      }
      const old = el.value;
      setValue(el, value);
      if (validityBlocks(el, mode)) { setValue(el, old); return { status: 'failed', type: 'number', reason: 'rejected' }; }
      return { status: 'filled', type: 'number', value: truncVal(value) };
    }

    /* decide the logical value type: rules → detection → fallbacks */
    let genType = null;
    const rule = matchRule(rules, ctx);
    if (rule) {
      if (rule.action === 'skip') return { status: 'skipped', type: 'rule', reason: `rule: ${truncVal(rule.pattern, 30)}` };
      if (rule.action === 'fixed' && rule.fixedValue) {
        const value = AFF.expandTokens(rule.fixedValue, env);
        const clipped = constraints.maxlength ? AFF.truncate(value, constraints.maxlength) : value;
        setValue(el, clipped);
        return { status: 'filled', type: 'fixed', value: truncVal(clipped) };
      }
      if (rule.action === 'generate') genType = rule.type;
    }
    if (!genType) {
      const detected = AFF.detectFieldType(el, ctx);
      if (detected) genType = detected.split(':')[0];
      else if (!isTextarea && (inputType === 'number' || el.getAttribute('inputmode') === 'numeric' || el.getAttribute('inputmode') === 'decimal')) genType = 'number';
      else if (!isTextarea && inputType === 'email') genType = 'email';
      else if (!isTextarea && inputType === 'tel') genType = 'phone';
      else if (!isTextarea && inputType === 'password') genType = 'password';
      else if (!isTextarea && inputType === 'url') genType = 'url';
      else if (!isTextarea) genType = null; // unknown text handled below
    }

    if (!isTextarea && !genType) {
      if (!settings.fill.name) return { status: 'skipped', type: 'text', reason: 'unknown field' };
      const value = constraints.maxlength ? AFF.truncate(settings.unknownText || 'Test', constraints.maxlength) : (settings.unknownText || 'Test');
      setValue(el, value);
      return { status: 'filled', type: 'text', value: truncVal(value) };
    }

    const toggle = isTextarea ? 'textarea' : AFF.toggleKeyFor(genType);
    if (!settings.fill[toggle]) return { status: 'skipped', type: genType, reason: 'type off' };

    let value = AFF.generate(isTextarea ? 'textarea' : genType, ctx, { ...env, constraints });
    if (constraints.maxlength) value = AFF.truncate(value, constraints.maxlength);
    if (constraints.minlength && value.length < constraints.minlength) value = (value + value).slice(0, constraints.minlength);

    const old = el.value;
    if (isTextarea) {
      setValue(el, value);
    } else {
      setValue(el, value);
      if (validityBlocks(el, mode)) {
        setValue(el, old);
        return { status: 'failed', type: genType, reason: 'rejected by validation' };
      }
    }
    return { status: 'filled', type: isTextarea ? 'textarea' : genType, value: truncVal(value) };
  }

  function fillRadioGroups(scopeEl, env) {
    const { settings, mode } = env;
    const groups = {};
    (scopeEl || document).querySelectorAll('input[type=radio]').forEach((r) => {
      if (r.disabled || AFF.isInExcludedZone(r)) return;
      if (env.only && !env.only.has(r)) return;
      if (!AFF.isVisible(r)) return;
      const name = r.name || `__aff_${AFF.uid()}`;
      (groups[name] ||= []).push(r);
    });
    let filled = 0;
    Object.values(groups).forEach((list) => {
      if (!list.length || mode === 'invalid') return;
      const pick = AFF.rand(list);
      if (pick && !pick.checked) {
        pick.checked = true;
        pick.dispatchEvent(new Event('input', { bubbles: true }));
        pick.dispatchEvent(new Event('change', { bubbles: true }));
      }
      filled++;
    });
    return filled;
  }

  function findNextButton() {
    const candidates = document.querySelectorAll('button[type="button"], [role="button"], a');
    for (const el of candidates) {
      if (!AFF.isVisible(el) || AFF.isInExcludedZone(el) || AFF.isDangerousClick(el)) continue;
      const text = (el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (/^(next|continue|proceed|next step|weiter|suivant|siguiente)\b/i.test(text)) return el;
    }
    return null;
  }

  /* Main fill entry */
  async function fill(opts = {}) {
    const t0 = Date.now();
    const data = await AFFShared.loadData();
    const profile = AFFShared.resolveProfile(data, location.href, opts.profileId);
    const settings = AFFShared.mergeSettings({ ...profile.settings, ...(opts.settings || {}) });
    AFF.debugEnabled = !!settings.debug;

    const mode = opts.mode || settings.mode;
    const locale = AFF.resolveLocale(settings.locale);
    AFF.currentLocale = locale;
    const L = AFF.LOCALE_DATA[locale] || AFF.LOCALE_DATA['en-US'];

    const customFiles = await AFFShared.getFiles();
    const env = {
      settings, mode,
      rules: profile.rules || [],
      customFiles, locale, L,
      session: {},
      seq: AFF.nextSeq(settings.sequence),
      index: 0,
      only: opts.only || null
    };

    const report = {
      ok: true, filled: 0, skipped: 0, failed: 0, steps: 1,
      mode, profile: profile.name, url: location.href,
      durationMs: 0, fields: []
    };

    const endGuard = AFF.beginFillGuard();
    try {
      const scopeSetting = opts.scope || settings.scope;
      const addStep = async () => {
        if (settings.expandDynamic && !opts.only) {
          await AFF.expandDynamicSections(AFF.getFillScope(scopeSetting), settings.dynamicAdds);
        }
        return AFF.collect(scopeSetting);
      };

      let items = await addStep();
      if (opts.only) items = items.filter((it) => opts.only.has(it.el) || it.type === 'radio');

      const runPass = async (list) => {
        for (const item of list) {
          if (item.type === 'radio') continue; // handled per-group below
          env.index++;
          try {
            const res = await fillItem(item, env);
            if (res.status === 'filled') report.filled++;
            else if (res.status === 'failed') report.failed++;
            else report.skipped++;
            if (res.status !== 'skipped' || report.fields.length < 200) {
              report.fields.push({ label: AFF.getLabel(item.el), type: res.type, status: res.status, value: res.value || '', reason: res.reason || '' });
            }
            if (res.status === 'filled') AFF.flashHighlight(item.el, settings);
            if (item.type === 'file') await AFF.sleep(120);
            else if (settings.fillDelay > 0) await AFF.sleep(settings.fillDelay);
          } catch (e) {
            report.failed++;
            report.fields.push({ label: AFF.getLabel(item.el), type: item.type, status: 'failed', value: '', reason: String(e && e.message || e).slice(0, 80) });
          }
        }
        if (settings.fill.radio) report.filled += fillRadioGroups(AFF.getFillScope(scopeSetting), env);
        if (settings.fill.select) AFF.fillSelect2();
      };

      await runPass(items);

      /* multi-step forms: fill → next → fill again */
      if (settings.autoAdvance && !opts.only) {
        for (let step = 1; step < AFF.clamp(settings.maxSteps || 5, 1, 20); step++) {
          await AFF.sleep(600);
          const next = findNextButton();
          if (!next) break;
          AFF.safeClick(next);
          await AFF.sleep(1000);
          const nextItems = await addStep();
          if (!nextItems.length) break;
          report.steps++;
          await runPass(nextItems);
        }
      }
    } finally {
      endGuard();
    }

    report.durationMs = Date.now() - t0;
    AFF.showToast(report, settings);

    try {
      const API = globalThis.chrome || globalThis.browser;
      API?.runtime?.sendMessage?.({ type: 'AFF_REPORT', filled: report.filled, failed: report.failed });
    } catch (e) { /* ignore */ }

    try {
      await AFFShared.saveLog({
        ts: Date.now(), url: report.url, profile: report.profile, mode: report.mode,
        filled: report.filled, skipped: report.skipped, failed: report.failed,
        durationMs: report.durationMs, fields: report.fields.slice(0, 40)
      });
    } catch (e) { /* ignore */ }

    AFF.log('fill report', report);
    return report;
  }

  /* Clear all fillable fields */
  async function clearForm(opts = {}) {
    const data = await AFFShared.loadData();
    const profile = AFFShared.resolveProfile(data, location.href, opts.profileId);
    const settings = AFFShared.mergeSettings(profile.settings);
    AFF.debugEnabled = !!settings.debug;
    const scopeSetting = opts.scope || settings.scope;
    const endGuard = AFF.beginFillGuard();
    let cleared = 0;
    try {
      const items = AFF.collect(scopeSetting);
      for (const { el } of items) {
        try {
          if (AFF.clearValue(el)) cleared++;
          if (settings.fillDelay > 0) await AFF.sleep(Math.min(settings.fillDelay, 30));
        } catch (e) { /* ignore */ }
      }
      document.querySelectorAll('input[type=radio]').forEach((r) => {
        if (r.checked && !AFF.isInExcludedZone(r)) { r.checked = false; r.dispatchEvent(new Event('change', { bubbles: true })); }
      });
    } finally {
      endGuard();
    }
    return { ok: true, cleared };
  }

  AFF.fill = fill;
  AFF.clearForm = clearForm;
  AFF.loadSettingsForUI = async () => {
    try {
      const data = await AFFShared.loadData();
      return AFFShared.mergeSettings(AFFShared.resolveProfile(data, location.href).settings);
    } catch (e) { return AFFShared.defaultSettings(); }
  };
})();

/* ========== src/content/c07-main.js ========== */
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
