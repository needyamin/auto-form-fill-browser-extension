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
