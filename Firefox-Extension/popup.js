/* AutoForm Fill — popup logic */
(() => {
  'use strict';
  const API = globalThis.chrome || globalThis.browser;

  let tabId = null;
  let data = null;
  let activeProfile = null;
  let pageReady = false;

  const $ = (id) => document.getElementById(id);

  function show(id, on) { $(id)?.classList.toggle('hidden', !on); }

  async function sendToTab(msg, timeoutMs = 5000) {
    const p = new Promise((resolve) => {
      try {
        API.tabs.sendMessage(tabId, msg, (r) => {
          if (API.runtime.lastError) resolve(null);
          else resolve(r);
        });
      } catch (e) { resolve(null); }
    });
    if (!timeoutMs) return p;
    return Promise.race([p, new Promise((r) => setTimeout(() => r(null), timeoutMs))]);
  }

  async function injectContentScript() {
    try {
      if (API.scripting) {
        await API.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
      } else if (API.tabs.executeScript) {
        await new Promise((res, rej) => API.tabs.executeScript(tabId, { file: 'content.js' }, () => API.runtime.lastError ? rej(new Error('inject failed')) : res()));
      }
      return true;
    } catch (e) { return false; }
  }

  async function ensureContentScript() {
    let pong = await sendToTab({ type: 'AFF_PING' }, 600);
    if (pong?.ok) return true;
    const ok = await injectContentScript();
    if (!ok) return false;
    pong = await sendToTab({ type: 'AFF_PING' }, 800);
    return !!(pong && pong.ok);
  }

  /* ---------- rendering ---------- */

  function renderProfiles() {
    const sel = $('profileSelect');
    sel.innerHTML = '';
    for (const p of data.profiles) {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name + (p.builtin ? '' : ' ★');
      sel.appendChild(opt);
    }
    sel.value = data.activeProfileId;
  }

  function renderModes() {
    const wrap = $('modeChips');
    wrap.innerHTML = '';
    for (const m of AFFShared.MODES) {
      const chip = document.createElement('div');
      chip.className = 'chip' + (activeProfile.settings.mode === m.key ? ' on' : '');
      chip.textContent = m.label;
      chip.title = m.hint;
      chip.addEventListener('click', () => setMode(m.key));
      wrap.appendChild(chip);
    }
  }

  function renderSequence() {
    const on = !!activeProfile.settings.sequence?.enabled;
    $('seqToggle').classList.toggle('on', on);
    $('seqToggle').setAttribute('aria-checked', String(on));
    $('seqHint').textContent = on ? `next #${activeProfile.settings.sequence.start}` : 'off';
  }

  function renderReport(report) {
    if (!report) return;
    show('report', true);
    const dur = report.durationMs != null ? ` · ${report.durationMs}ms` : '';
    $('reportMeta').textContent = `${report.profile || ''} · ${report.mode || 'valid'}${dur}`;
    $('reportCounts').innerHTML =
      `<span><b class="ok">${report.filled}</b> filled</span>` +
      `<span><b class="skip">${report.skipped}</b> skipped</span>` +
      `<span><b class="fail">${report.failed}</b> failed</span>` +
      (report.steps > 1 ? `<span>${report.steps} steps</span>` : '');
    const list = $('reportFields');
    list.innerHTML = '';
    const rows = (report.fields || []).slice(0, 60);
    for (const f of rows) {
      const line = document.createElement('div');
      line.className = 'field-line';
      const st = document.createElement('span');
      st.className = 'st ' + (f.status || 'skipped');
      const fl = document.createElement('span');
      fl.className = 'fl';
      fl.textContent = f.label || f.type;
      const vl = document.createElement('span');
      vl.className = 'vl';
      vl.textContent = f.status === 'failed' ? (f.reason || 'failed') : (f.value || '');
      line.append(st, fl, vl);
      list.appendChild(line);
    }
    if (!rows.length) list.innerHTML = '<div class="field-line"><span class="fl">No fields found on this page.</span></div>';
  }

  /* ---------- persistence helpers ---------- */

  async function updateActiveProfile(mutator) {
    const fresh = await AFFShared.loadData();
    const p = fresh.profiles.find((x) => x.id === data.activeProfileId) || fresh.profiles[0];
    mutator(p.settings);
    await AFFShared.saveData(fresh);
    data = fresh;
    activeProfile = p;
  }

  function setMode(mode) {
    updateActiveProfile((s) => { s.mode = mode; }).then(renderModes);
  }

  /* ---------- wiring ---------- */

  function wire() {
    $('fillBtn').addEventListener('click', async () => {
      const btn = $('fillBtn');
      btn.disabled = true;
      btn.textContent = 'Filling…';
      const r = await sendToTab({ type: 'AFF_FILL', opts: { profileId: data.activeProfileId } }, 120000);
      btn.disabled = false;
      btn.textContent = 'Fill form';
      renderReport(r || { ok: false, filled: 0, skipped: 0, failed: 1, fields: [{ label: 'No response from page', status: 'failed' }] });
    });

    $('clearBtn').addEventListener('click', async () => {
      const r = await sendToTab({ type: 'AFF_CLEAR' }, 60000);
      show('report', true);
      $('reportMeta').textContent = 'Clear form';
      $('reportCounts').innerHTML = `<span><b class="ok">${r?.cleared ?? 0}</b> fields cleared</span>`;
      $('reportFields').innerHTML = '';
    });

    $('pickBtn').addEventListener('click', async () => {
      const r = await sendToTab({ type: 'AFF_PICK' }, 8000);
      if (r?.ok) window.close();
      else {
        show('report', true);
        $('reportMeta').textContent = 'Field picker';
        $('reportCounts').innerHTML = `<span><b class="fail">Could not start picker</b></span>`;
      }
    });

    $('seqToggle').addEventListener('click', () => {
      const turnOn = !$('seqToggle').classList.contains('on');
      updateActiveProfile((s) => { s.sequence.enabled = turnOn; }).then(renderSequence);
    });
    $('seqToggle').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('seqToggle').click(); }
    });

    $('profileSelect').addEventListener('change', async (e) => {
      data.activeProfileId = e.target.value;
      await AFFShared.saveData(data);
      const fresh = await AFFShared.loadData();
      data = fresh;
      activeProfile = AFFShared.getActiveProfile(data);
      renderModes();
      renderSequence();
    });

    const openOptions = (e) => { e.preventDefault(); try { API.runtime.openOptionsPage(); } catch (err) { /* not available outside the extension */ } };
    $('optionsLink').addEventListener('click', openOptions);
    $('settingsBtn').addEventListener('click', openOptions);

    try {
      API.runtime.onMessage.addListener((msg, sender) => {
        if (msg?.type === 'AFF_REPORT' && sender.tab?.id === tabId) renderReport({
          filled: msg.filled, skipped: 0, failed: msg.failed || 0,
          profile: activeProfile?.name, mode: activeProfile?.settings.mode
        });
      });
    } catch (e) { /* runtime messaging unavailable */ }
  }

  /* ---------- init ---------- */

  async function init() {
    try { $('version').textContent = API.runtime?.getManifest?.().version || '2.0.0'; }
    catch (e) { $('version').textContent = '2.0.0'; }

    try {
      const tabs = await new Promise((res) => API.tabs.query({ active: true, currentWindow: true }, (t) => res(t || [])));
      tabId = tabs[0]?.id || null;
    } catch (e) { tabId = null; }

    data = await AFFShared.loadData();
    activeProfile = AFFShared.getActiveProfile(data);
    renderProfiles();
    renderModes();
    renderSequence();
    wire();

    pageReady = await ensureContentScript();
    if (!pageReady) {
      show('pageError', true);
      $('fillBtn').disabled = true;
      $('clearBtn').disabled = true;
      $('pickBtn').disabled = true;
    }
    show('main', true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
