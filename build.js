/* AutoForm Fill — zero-dependency build script.
 * Bundles src/ into Chrome-Extension/ (MV3) and Firefox-Extension/ (MV2).
 * Usage: node build.js [--zip] */
'use strict';

const fs = require('fs');
const path = require('path');

const root = __dirname;
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;

const CONTENT_FILES = [
  'src/shared/shared.js',
  'src/content/c01-utils.js',
  'src/content/c02-locales.js',
  'src/content/c03-generator.js',
  'src/content/c04-detect.js',
  'src/content/c05-dom.js',
  'src/content/c06-fill.js',
  'src/content/c07-main.js'
];
const ENGINE_FILES = [
  'src/content/c01-utils.js',
  'src/content/c02-locales.js',
  'src/content/c03-generator.js'
];
const COPY_FILES = {
  'src/popup/popup.html': 'popup.html',
  'src/popup/popup.css': 'popup.css',
  'src/popup/popup.js': 'popup.js',
  'src/options/options.html': 'options.html',
  'src/options/options.css': 'options.css',
  'src/options/options.js': 'options.js',
  'src/shared/shared.js': 'shared.js',
  'src/background/background.js': 'background.js'
};

function read(p) { return fs.readFileSync(path.join(root, p), 'utf8'); }

function bundle(files) {
  return banner + '\n' + files.map((f) => `/* ========== ${f} ========== */\n` + read(f)).join('\n');
}

const banner = `/*
 * AutoForm Fill v${version} — GENERATED FILE. Do not edit directly.
 * Edit files under src/ and run: node build.js
 */`;

/* ---------- zip (store method, no deps) ---------- */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function buildZip(files) {
  const chunks = [];
  const central = [];
  let offset = 0;
  const dosTime = 0, dosDate = ((new Date().getFullYear() - 1980) << 9) | (1 << 5) | 1;

  for (const { name, data } of files) {
    const nameBuf = Buffer.from(name, 'utf8');
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);           // store
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    chunks.push(local, nameBuf, data);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(0, 10);
    cd.writeUInt16LE(dosTime, 12);
    cd.writeUInt16LE(dosDate, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(data.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt32LE(offset, 42);
    central.push(Buffer.concat([cd, nameBuf]));
    offset += 30 + nameBuf.length + data.length;
  }

  const cdBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, cdBuf, eocd]);
}

/* ---------- build ---------- */

function cleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function build(target, manifestSrc) {
  const out = path.join(root, target);
  cleanDir(out);

  // bundled scripts
  fs.writeFileSync(path.join(out, 'content.js'), bundle(CONTENT_FILES));
  fs.writeFileSync(path.join(out, 'engine.js'),
    bundle(ENGINE_FILES) + `\nglobalThis.AFF = globalThis.AFF_CONTENT_UTILS;\n`);
  fs.writeFileSync(path.join(out, 'shared.js'), read('src/shared/shared.js'));

  // static assets
  for (const [src, dest] of Object.entries(COPY_FILES)) {
    if (src.endsWith('shared.js')) continue;
    fs.copyFileSync(path.join(root, src), path.join(out, dest));
  }

  // icons
  const iconsOut = path.join(out, 'icons');
  fs.mkdirSync(iconsOut, { recursive: true });
  for (const f of fs.readdirSync(path.join(root, 'assets/icons'))) {
    fs.copyFileSync(path.join(root, 'assets/icons', f), path.join(iconsOut, f));
  }

  // manifest (version-stamped)
  const manifest = JSON.parse(read(manifestSrc));
  manifest.version = version;
  fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

  console.log(`built ${target}/ (v${version})`);
  return out;
}

const chromeDir = build('Chrome-Extension', 'manifests/manifest.chrome.json');
const firefoxDir = build('Firefox-Extension', 'manifests/manifest.firefox.json');

if (process.argv.includes('--zip')) {
  fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
  for (const [dir, label] of [[chromeDir, 'chrome'], [firefoxDir, 'firefox']]) {
    const files = [];
    const walk = (d, base = '') => {
      for (const f of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, f.name);
        const rel = base ? `${base}/${f.name}` : f.name;
        if (f.isDirectory()) walk(full, rel);
        else files.push({ name: rel, data: fs.readFileSync(full) });
      }
    };
    walk(dir);
    const zipPath = path.join(root, 'dist', `autoform-fill-${label}-v${version}.zip`);
    fs.writeFileSync(zipPath, buildZip(files));
    console.log(`zipped dist/autoform-fill-${label}-v${version}.zip (${files.length} files)`);
  }
}

console.log('done.');
