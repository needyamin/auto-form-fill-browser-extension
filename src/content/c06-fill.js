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
