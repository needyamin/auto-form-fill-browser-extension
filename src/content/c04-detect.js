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
