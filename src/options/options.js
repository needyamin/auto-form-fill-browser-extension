/* AutoForm Fill — options page logic */
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const API = globalThis.chrome || globalThis.browser;
  let data = null;
  let profile = null;
  let saveTimer = null;

  const FIELD_LABELS = {
    name: 'Names', email: 'Emails', phone: 'Phones', address: 'Addresses', city: 'Cities',
    zip: 'Postal codes', state: 'States/Regions', country: 'Countries', company: 'Companies',
    date: 'Dates', birthdate: 'Birth dates', number: 'Numbers', password: 'Passwords',
    url: 'URLs', id: 'IDs (NID, passport…)', textarea: 'Long text'
  };

  /* ---------- utils ---------- */

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = String(s ?? '');
    return d.innerHTML;
  }

  function toast(msg) {
    const el = $('toast');
    el.textContent = msg || 'Saved';
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 1800);
  }

  function getPath(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  }

  function setPath(obj, path, val) {
    const ks = path.split('.');
    const last = ks.pop();
    const target = ks.reduce((o, k) => { if (o[k] == null) o[k] = {}; return o[k]; }, obj);
    target[last] = val;
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      await AFFShared.saveData(data);
      toast('Saved');
    }, 250);
  }

  /* ---------- tabs ---------- */

  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      $(`panel-${tab.dataset.panel}`)?.classList.add('active');
    });
  });

  /* ---------- generic settings binding (data-path) ---------- */

  function bindGenerics() {
    document.querySelectorAll('[data-path]').forEach((el) => {
      const path = el.dataset.path;
      const kind = el.dataset.kind;
      const val = getPath(profile.settings, path);

      if (kind === 'toggle') {
        el.classList.toggle('on', val !== false);
        el.setAttribute('aria-checked', String(val !== false));
        el.addEventListener('click', () => {
          const on = !el.classList.contains('on');
          el.classList.toggle('on', on);
          el.setAttribute('aria-checked', String(on));
          setPath(profile.settings, path, on);
          scheduleSave();
        });
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } });
      } else {
        if (val !== undefined && val !== null) el.value = val;
        el.addEventListener('change', () => {
          let v = el.value;
          if (kind === 'number') v = v === '' ? 0 : Number(v);
          setPath(profile.settings, path, v);
          scheduleSave();
        });
      }
    });
  }

  /* ---------- mode & locale selects ---------- */

  function renderTopSelects() {
    const modeSel = $('modeSelect');
    modeSel.innerHTML = '';
    for (const m of AFFShared.MODES) {
      const o = document.createElement('option');
      o.value = m.key;
      o.textContent = `${m.label} — ${m.hint}`;
      modeSel.appendChild(o);
    }
    modeSel.value = profile.settings.mode;
    modeSel.onchange = () => { profile.settings.mode = modeSel.value; scheduleSave(); };

    const locSel = $('localeSelect');
    locSel.innerHTML = '';
    for (const l of AFFShared.LOCALES) {
      const o = document.createElement('option');
      o.value = l.key;
      o.textContent = l.label;
      locSel.appendChild(o);
    }
    locSel.value = profile.settings.locale;
    locSel.onchange = () => { profile.settings.locale = locSel.value; scheduleSave(); };
  }

  /* ---------- fields grid ---------- */

  function renderFields() {
    const grid = $('fieldGrid');
    grid.innerHTML = '';
    for (const ft of AFFShared.FIELD_TYPES) {
      const chip = document.createElement('div');
      chip.className = 'field-chip';
      const on = profile.settings.fill[ft.key] !== false;
      chip.innerHTML = `<span class="label">${escapeHtml(ft.label)}</span>`;
      const sw = document.createElement('div');
      sw.className = 'switch' + (on ? ' on' : '');
      sw.setAttribute('role', 'switch');
      sw.setAttribute('aria-checked', String(on));
      sw.tabIndex = 0;
      chip.appendChild(sw);
      const toggle = () => {
        const now = !(profile.settings.fill[ft.key] !== false);
        profile.settings.fill[ft.key] = now;
        sw.classList.toggle('on', now);
        sw.setAttribute('aria-checked', String(now));
        updateFieldCount();
        scheduleSave();
      };
      chip.addEventListener('click', toggle);
      sw.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
      grid.appendChild(chip);
    }
    updateFieldCount();
  }

  function updateFieldCount() {
    const on = AFFShared.FIELD_TYPES.filter((ft) => profile.settings.fill[ft.key] !== false).length;
    $('fieldCount').textContent = `${on} / ${AFFShared.FIELD_TYPES.length} on`;
  }

  $('fieldsAll')?.addEventListener('click', () => {
    AFFShared.FIELD_TYPES.forEach((ft) => { profile.settings.fill[ft.key] = true; });
    renderFields(); scheduleSave();
  });
  $('fieldsNone')?.addEventListener('click', () => {
    AFFShared.FIELD_TYPES.forEach((ft) => { profile.settings.fill[ft.key] = false; });
    renderFields(); scheduleSave();
  });

  /* ---------- rules ---------- */

  function ruleRow(rule, i) {
    const div = document.createElement('div');
    div.className = 'rule' + (rule.action === 'fixed' ? ' fixed' : '');

    const top = document.createElement('div');
    top.className = 'rule-top';
    top.innerHTML = `
      <span class="num">${i + 1}</span>
      <input type="checkbox" class="check-sm" ${rule.enabled !== false ? 'checked' : ''} title="Enable" />
      <input type="text" class="pattern-input" placeholder="Match text or regex against label/name/placeholder" maxlength="200" />
      <select class="matchType mini">
        <option value="text">text</option>
        <option value="regex">regex</option>
      </select>`;
    const patternInput = top.querySelector('.pattern-input');
    const matchType = top.querySelector('.matchType');
    const enabled = top.querySelector('.check-sm');
    patternInput.value = rule.pattern || '';
    matchType.value = rule.match === 'regex' ? 'regex' : 'text';

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:4px';
    actions.innerHTML = `
      <button type="button" class="icon-btn up" title="Move up">↑</button>
      <button type="button" class="icon-btn down" title="Move down">↓</button>
      <button type="button" class="icon-btn del" title="Delete">✕</button>`;
    top.appendChild(actions);

    const body = document.createElement('div');
    body.className = 'rule-body';
    const actionSel = document.createElement('select');
    actionSel.className = 'mini';
    for (const a of AFFShared.RULE_ACTIONS) {
      const o = document.createElement('option');
      o.value = a.key;
      o.textContent = a.label;
      actionSel.appendChild(o);
    }
    actionSel.value = rule.action || 'generate';

    const typeSel = document.createElement('select');
    typeSel.className = 'mini';
    for (const t of AFFShared.GEN_TYPES) {
      const o = document.createElement('option');
      o.value = t;
      o.textContent = FIELD_LABELS[t] || t;
      typeSel.appendChild(o);
    }
    typeSel.value = rule.type || 'name';

    const fixedInput = document.createElement('input');
    fixedInput.type = 'text';
    fixedInput.className = 'fixed-input';
    fixedInput.placeholder = 'Fixed value, supports {seq} {uuid} {ts} {rand:6} {first} {last} {email}…';
    fixedInput.maxLength = 500;
    fixedInput.value = rule.fixedValue || '';
    fixedInput.style.display = rule.action === 'fixed' ? 'block' : 'none';

    body.append(actionSel, typeSel, fixedInput);
    div.append(top, body);

    const save = () => scheduleSave();
    enabled.addEventListener('change', () => { rule.enabled = enabled.checked; save(); });
    patternInput.addEventListener('input', () => { rule.pattern = patternInput.value; save(); });
    matchType.addEventListener('change', () => { rule.match = matchType.value; save(); });
    actionSel.addEventListener('change', () => {
      rule.action = actionSel.value;
      fixedInput.style.display = rule.action === 'fixed' ? 'block' : 'none';
      save();
    });
    typeSel.addEventListener('change', () => { rule.type = typeSel.value; save(); });
    fixedInput.addEventListener('input', () => { rule.fixedValue = fixedInput.value; save(); });

    div.querySelector('.del').addEventListener('click', () => {
      profile.rules.splice(i, 1);
      renderRules(); scheduleSave();
    });
    div.querySelector('.up').addEventListener('click', () => {
      if (i === 0) return;
      [profile.rules[i - 1], profile.rules[i]] = [profile.rules[i], profile.rules[i - 1]];
      renderRules(); scheduleSave();
    });
    div.querySelector('.down').addEventListener('click', () => {
      if (i >= profile.rules.length - 1) return;
      [profile.rules[i + 1], profile.rules[i]] = [profile.rules[i], profile.rules[i + 1]];
      renderRules(); scheduleSave();
    });

    return div;
  }

  function renderRules() {
    const list = $('rulesList');
    list.innerHTML = '';
    if (!profile.rules || !profile.rules.length) {
      list.innerHTML = '<div class="rules-empty">No rules yet — generation is fully automatic. Add a rule to override specific fields.</div>';
      return;
    }
    profile.rules.forEach((rule, i) => list.appendChild(ruleRow(rule, i)));
  }

  $('addRule')?.addEventListener('click', () => {
    profile.rules.push({
      id: AFFShared.uid(), enabled: true, match: 'text',
      pattern: '', action: 'generate', type: 'name', fixedValue: ''
    });
    renderRules(); scheduleSave();
    const inputs = document.querySelectorAll('#rulesList .pattern-input');
    inputs[inputs.length - 1]?.focus();
  });

  /* ---------- profiles ---------- */

  function renderProfileSelect() {
    const sel = $('activeProfileSelect');
    sel.innerHTML = '';
    for (const p of data.profiles) {
      const o = document.createElement('option');
      o.value = p.id;
      o.textContent = p.name;
      sel.appendChild(o);
    }
    sel.value = data.activeProfileId;
  }

  function renderProfiles() {
    const list = $('profilesList');
    list.innerHTML = '';
    for (const p of data.profiles) {
      const item = document.createElement('div');
      item.className = 'profile-item' + (p.id === data.activeProfileId ? ' active-p' : '');
      item.innerHTML = `
        <div class="p-head">
          <span class="p-name">${escapeHtml(p.name)}</span>
          ${p.id === data.activeProfileId ? '<span class="badge">active</span>' : ''}
          ${p.builtin ? '<span class="badge green">default</span>' : ''}
          ${p.sites?.length ? `<span class="badge">${p.sites.length} site(s)</span>` : ''}
        </div>
        <div class="p-sites">
          <input type="text" placeholder="Site URL patterns, comma separated — e.g. *staging.example.com*, *localhost:3000*" maxlength="500" />
        </div>
        <div class="p-actions"></div>`;

      const sitesInput = item.querySelector('.p-sites input');
      sitesInput.value = (p.sites || []).join(', ');
      sitesInput.addEventListener('change', () => {
        p.sites = sitesInput.value.split(',').map((s) => s.trim()).filter(Boolean);
        renderProfiles(); scheduleSave();
      });

      const acts = item.querySelector('.p-actions');
      const mkBtn = (label, fn, cls = 'btn-sm') => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = cls;
        b.textContent = label;
        b.addEventListener('click', fn);
        acts.appendChild(b);
      };
      if (p.id !== data.activeProfileId) mkBtn('Activate', async () => {
        data.activeProfileId = p.id;
        await AFFShared.saveData(data);
        location.reload();
      });
      mkBtn('Duplicate', async () => {
        const copy = JSON.parse(JSON.stringify(p));
        copy.id = AFFShared.uid();
        copy.name = `${p.name} copy`;
        copy.builtin = false;
        data.profiles.push(copy);
        await AFFShared.saveData(data);
        renderProfiles(); renderProfileSelect(); toast('Profile duplicated');
      });
      if (!p.builtin) mkBtn('Delete', async () => {
        if (!confirm(`Delete profile “${p.name}”?`)) return;
        data.profiles = data.profiles.filter((x) => x.id !== p.id);
        if (data.activeProfileId === p.id) data.activeProfileId = 'default';
        await AFFShared.saveData(data);
        location.reload();
      }, 'btn-sm danger');

      list.appendChild(item);
    }
  }

  $('createProfile')?.addEventListener('click', () => {
    const name = $('newProfileName').value.trim() || `Profile ${data.profiles.length + 1}`;
    const preset = $('newProfilePreset').value;
    const p = {
      id: AFFShared.uid(),
      name,
      builtin: false,
      sites: [],
      settings: preset ? { ...AFFShared.defaultSettings(), mode: preset } : AFFShared.defaultSettings(),
      rules: []
    };
    data.profiles.push(p);
    $('newProfileName').value = '';
    AFFShared.saveData(data).then(() => {
      renderProfiles(); renderProfileSelect(); toast('Profile created');
    });
  });

  /* ---------- import / export / reset ---------- */

  $('exportBtn')?.addEventListener('click', () => {
    const payload = { kind: 'autoform-fill-config', schemaVersion: AFFShared.SCHEMA_VERSION, exportedAt: new Date().toISOString(), data };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'autoform-fill-config.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });

  $('importBtn')?.addEventListener('click', () => $('importFile').click());
  $('importFile')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const payload = JSON.parse(String(reader.result));
        if (payload.kind !== 'autoform-fill-config' || !payload.data?.profiles?.length) {
          throw new Error('Not an AutoForm Fill config file');
        }
        if (payload.schemaVersion > AFFShared.SCHEMA_VERSION) throw new Error('File was created by a newer version');
        if (!confirm('Import and replace all current profiles and settings?')) return;
        await AFFShared.saveData(payload.data);
        location.reload();
      } catch (err) {
        toast(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  $('resetBtn')?.addEventListener('click', async () => {
    if (!confirm('Reset EVERYTHING? All profiles, rules, logs and settings return to defaults.')) return;
    await AFFShared.storageSet('local', { [AFFShared.DATA_KEY]: AFFShared.defaultData() });
    location.reload();
  });

  /* ---------- datasets ---------- */

  const DS_DEFAULT_COLUMNS = ['name', 'email', 'phone', 'city', 'zip', 'state', 'country', 'company', 'date', 'number'];

  function renderDatasetColumns() {
    const grid = $('dsColumns');
    grid.innerHTML = '';
    for (const t of AFFShared.GEN_TYPES) {
      const chip = document.createElement('label');
      chip.className = 'field-chip';
      const checked = DS_DEFAULT_COLUMNS.includes(t);
      chip.innerHTML = `<input type="checkbox" class="check-sm" value="${t}" ${checked ? 'checked' : ''}/><span class="label">${escapeHtml(FIELD_LABELS[t] || t)}</span>`;
      chip.querySelector('input').addEventListener('change', () => { /* state read at generate time */ });
      grid.appendChild(chip);
    }
  }

  $('dsGenerate')?.addEventListener('click', () => {
    const rows = Math.max(1, Math.min(10000, parseInt($('dsRows').value, 10) || 100));
    const format = $('dsFormat').value;
    const cols = Array.from(document.querySelectorAll('#dsColumns input:checked')).map((c) => c.value);
    if (!cols.length) { $('dsStatus').textContent = 'Pick at least one column.'; return; }

    const localeKey = AFFShared.mergeSettings(profile.settings).locale;
    const locale = AFF.resolveLocale(localeKey);
    const L = AFF.LOCALE_DATA[locale] || AFF.LOCALE_DATA['en-US'];
    const settings = AFFShared.mergeSettings(profile.settings);

    const lines = [];
    for (let i = 0; i < rows; i++) {
      const env = { mode: 'valid', settings, session: {}, locale, L, el: null, constraints: {}, index: i, seq: i + 1 };
      lines.push(cols.map((c) => String(AFF.generate(c, c, env))));
    }

    let content;
    if (format === 'json') {
      content = JSON.stringify(lines.map((vals) => Object.fromEntries(cols.map((c, j) => [c, vals[j]]))), null, 2);
    } else {
      const esc = (s) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
      content = [cols.join(','), ...lines.map((vals) => vals.map(esc).join(','))].join('\n');
    }

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `test-data-${rows}.${format}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    $('dsStatus').textContent = `Generated ${rows} rows × ${cols.length} columns`;
    setTimeout(() => { $('dsStatus').textContent = ''; }, 4000);
  });

  /* ---------- files ---------- */

  function updateFilesStatus(cf) {
    const parts = [];
    if (cf?.image) parts.push('image');
    if (cf?.pdf) parts.push('pdf');
    if (cf?.doc) parts.push('doc');
    $('customFilesStatus').textContent = parts.length ? `Set: ${parts.join(', ')}` : 'Using built-in demo files.';
  }

  function saveCustomFile(key, dataUrl, fileName) {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) { toast('Invalid file'); return; }
    AFFShared.getFiles().then((prev) => {
      prev[key] = dataUrl;
      prev[key + 'Name'] = fileName;
      AFFShared.setFiles(prev).then(() => { updateFilesStatus(prev); toast('File saved'); });
    });
  }

  ['image', 'pdf', 'doc'].forEach((key) => {
    $(`custom${key[0].toUpperCase()}${key.slice(1)}`)?.addEventListener('change', function (e) {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 2000000) { toast('File too large (max 2MB)'); return; }
      const reader = new FileReader();
      reader.onload = () => saveCustomFile(key, reader.result, file.name);
      reader.readAsDataURL(file);
    });
  });

  $('clearCustomFiles')?.addEventListener('click', () => {
    AFFShared.setFiles({}).then(() => {
      updateFilesStatus(null);
      ['customImage', 'customPdf', 'customDoc'].forEach((id) => { if ($(id)) $(id).value = ''; });
      toast('Custom files cleared');
    });
  });

  /* ---------- logs ---------- */

  function renderLogs() {
    AFFShared.getLogs().then((logs) => {
      const list = $('logsList');
      list.innerHTML = '';
      if (!logs.length) {
        list.innerHTML = '<div class="rules-empty">No fills logged yet. Fill a form first.</div>';
        return;
      }
      for (const log of logs) {
        const item = document.createElement('div');
        item.className = 'log-item';
        const when = new Date(log.ts).toLocaleString();
        item.innerHTML = `
          <div class="log-head">
            <span><b class="n ok">${log.filled}</b> filled · <b class="n bad">${log.failed}</b> failed · ${log.skipped} skipped</span>
            <span class="url">${escapeHtml(log.url || '')}</span>
            <span>${escapeHtml(when)} · ${escapeHtml(log.mode)} · ${escapeHtml(log.profile)}</span>
          </div>
          <div class="log-fields"></div>`;
        const fieldsBox = item.querySelector('.log-fields');
        for (const f of (log.fields || [])) {
          const line = document.createElement('div');
          line.className = 'log-line';
          line.innerHTML = `<span class="dot ${escapeHtml(f.status)}"></span><span class="lbl">${escapeHtml(f.label)}</span><span class="val">${escapeHtml(f.status === 'failed' ? (f.reason || 'failed') : f.value)}</span>`;
          fieldsBox.appendChild(line);
        }
        item.querySelector('.log-head').addEventListener('click', () => item.classList.toggle('open'));
        list.appendChild(item);
      }
    });
  }

  $('copyLogs')?.addEventListener('click', async () => {
    const logs = await AFFShared.getLogs();
    try {
      await navigator.clipboard.writeText(JSON.stringify(logs, null, 2));
      toast('Logs copied');
    } catch (e) {
      toast('Clipboard blocked by browser');
    }
  });

  $('clearLogs')?.addEventListener('click', () => {
    AFFShared.clearLogs().then(() => { renderLogs(); toast('Logs cleared'); });
  });

  /* ---------- global shortcut toggle ---------- */

  function renderGlobalShortcut() {
    const el = $('globalShortcutToggle');
    const on = data.shortcutEnabled !== false;
    el.classList.toggle('on', on);
    el.setAttribute('aria-checked', String(on));
  }
  $('globalShortcutToggle')?.addEventListener('click', () => {
    data.shortcutEnabled = !(data.shortcutEnabled !== false);
    renderGlobalShortcut();
    scheduleSave();
  });
  $('globalShortcutToggle')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('globalShortcutToggle').click(); }
  });

  /* ---------- active profile switching ---------- */

  $('activeProfileSelect')?.addEventListener('change', async (e) => {
    data.activeProfileId = e.target.value;
    await AFFShared.saveData(data);
    location.reload();
  });

  /* ---------- init ---------- */

  async function init() {
    data = await AFFShared.loadData();
    profile = AFFShared.getActiveProfile(data);
    profile.settings = AFFShared.mergeSettings(profile.settings);
    profile.rules = Array.isArray(profile.rules) ? profile.rules : [];

    renderProfileSelect();
    renderTopSelects();
    bindGenerics();
    renderFields();
    renderRules();
    renderProfiles();
    renderDatasetColumns();

    const presetSel = $('newProfilePreset');
    for (const m of AFFShared.MODES) {
      const o = document.createElement('option');
      o.value = m.key;
      o.textContent = `Preset: ${m.label} data`;
      presetSel.appendChild(o);
    }

    AFFShared.getFiles().then(updateFilesStatus);
    renderLogs();
    renderGlobalShortcut();

    try { $('optVersion').textContent = API.runtime?.getManifest?.().version || '2.0.0'; }
    catch (e) { /* keep HTML fallback */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
