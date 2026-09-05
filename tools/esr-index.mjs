#!/usr/bin/env node
/**
 * ESR index builder and normaliser.
 *
 * Walks scripts/, sensors/ and versions/, repairs anything an ad-hoc upload got
 * wrong (missing GUID id, missing slug, missing release, wrong folder, filename
 * that is not the slug), files superseded versions under versions/, and rewrites
 * index.json.
 *
 * index.json is a machine artefact: one file covering scripts and sensors both,
 * read by the Chrome extension and by ESR Manager and by nothing else. It is not
 * meant to be read in the repository, so it carries no prose, no markers and no
 * hand-maintained sections — it is regenerated whole.
 *
 * Run by .github/workflows/index.yml on every push, so a contributor can drop a
 * JSON file into the repo through the GitHub web UI and never touch the index.
 *
 * ESR Manager writes this file too. The two are compared by *content*, not by
 * text: this tool only rewrites index.json when the data in it is actually wrong,
 * so a whitespace or key-spacing difference between the two writers is harmless
 * and cannot cause the pair to churn commits at each other.
 *
 *   node tools/esr-index.mjs            rewrite in place
 *   node tools/esr-index.mjs --check    exit 1 if anything would change
 *
 * ---- Where a version lives -------------------------------------------------
 *
 * The newest version of an item — its head — lives at scripts/<os>/<slug>.json
 * or sensors/<os>/<slug>.json. Every older version of the same id lives at
 * versions/<id>/<version>.json. Keyed by the GUID rather than the slug because a
 * rename, a platform change or a script that became a sensor must not orphan an
 * item's history.
 *
 * That history is what makes a rollback possible: delete the head and the
 * highest version left in versions/ takes its place.
 *
 * ---- What goes in the index ------------------------------------------------
 *
 * The head of every id, plus — when the head is a testing build — the newest
 * production version behind it, so the extension keeps serving the working
 * version while a new one is being tried. A retired head is listed alone: the
 * item is retired, not rolled back, so nothing takes its place.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join, dirname, basename } from 'node:path';

const ROOT = process.cwd();
const CHECK = process.argv.includes('--check');

export const INDEX_FILE = 'index.json';
export const INDEX_VERSION = 1;
export const VERSIONS_DIR = 'versions';
export const SCHEMA_VERSION = '1.2';

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const OS_FOLDER = { Windows: 'windows', macOS: 'macos', Linux: 'linux' };
const OS_FROM_FOLDER = { windows: 'Windows', macos: 'macOS', linux: 'Linux' };
const OS_RANK = { Windows: 0, macOS: 1, Linux: 2 };
const TYPE_RANK = { script: 0, sensor: 1 };

export const RELEASES = ['production', 'testing', 'retired'];
export const DEFAULT_RELEASE = 'production';

const log = [];
const note = (m) => log.push(m);

// ---- helpers ---------------------------------------------------------------

export function slugify(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * A missing or unrecognised release reads as production, so a file uploaded by
 * hand — or written before the field existed — still reaches the extension.
 */
export function release(x) {
  const r = String((x && x.release) || '').trim().toLowerCase();
  return RELEASES.includes(r) ? r : DEFAULT_RELEASE;
}

/** Numeric-aware semver compare. Returns >0 when a is newer. */
export function compareVersions(a, b) {
  const pa = String(a || '0.0.0').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b || '0.0.0').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  }
  return 0;
}

/**
 * The one version of an id that is its head: highest version, then production
 * over anything else, then most recently modified, then path. Takes items (which
 * carry their path as __path and a modified date) or index rows (which carry
 * neither), so the tool and the index agree on which row is the head.
 */
export function beats(candidate, current) {
  const v = compareVersions(candidate.version, current.version);
  if (v !== 0) return v > 0;

  const pa = release(candidate) === 'production';
  const pb = release(current) === 'production';
  if (pa !== pb) return pa;

  const ma = Date.parse(candidate.modified || '') || 0;
  const mb = Date.parse(current.modified || '') || 0;
  if (ma !== mb) return ma > mb;

  return String(candidate.__path || candidate.path || '') < String(current.__path || current.path || '');
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.toLowerCase().endsWith('.json')) out.push(full);
  }
  return out;
}

const rel = (p) => p.slice(ROOT.length + 1).split('\\').join('/');

// ---- normalising -----------------------------------------------------------

/**
 * Fills in whatever an uploaded file is missing. Mutates and reports whether the
 * on-disk JSON has to be rewritten. Folder is only a hint for type and OS, and is
 * ignored under versions/, where the folder says nothing about either.
 */
export function normalise(item, path) {
  let changed = false;
  const set = (key, value) => {
    if (item[key] !== value) { item[key] = value; changed = true; }
  };

  const parts = path.split('/');
  const archived = parts[0] === VERSIONS_DIR;
  const folderType = parts[0] === 'sensors' ? 'sensor' : 'script';
  const folderOs = archived ? undefined : OS_FROM_FOLDER[(parts[1] || '').toLowerCase()];

  if (item.type !== 'script' && item.type !== 'sensor') set('type', archived ? 'script' : folderType);
  if (!OS_RANK.hasOwnProperty(item.os)) set('os', folderOs || 'Windows');

  if (typeof item.id !== 'string' || !GUID.test(item.id.trim().toLowerCase())) {
    // A pre-GUID slug id becomes the slug so the file keeps its name.
    if (typeof item.id === 'string' && SLUG.test(item.id) && !item.slug) item.slug = item.id;
    set('id', randomUUID());
    note(`${path}: assigned id ${item.id}`);
  } else if (item.id !== item.id.trim().toLowerCase()) {
    set('id', item.id.trim().toLowerCase());
  }

  if (typeof item.slug !== 'string' || !SLUG.test(item.slug)) {
    // Under versions/ the filename is the version number, which is no basis for
    // a slug — the name is.
    const stem = archived ? '' : basename(path).replace(/\.json$/i, '');
    set('slug', (SLUG.test(stem) && stem) || slugify(stem) || slugify(item.name) || item.id.slice(0, 8));
    note(`${path}: assigned slug ${item.slug}`);
  }

  if (item.schemaVersion !== SCHEMA_VERSION) set('schemaVersion', SCHEMA_VERSION);
  if (!item.version || !/^\d+\.\d+\.\d+$/.test(item.version)) set('version', '1.0.0');
  if (item.release !== release(item)) set('release', release(item));
  if (!item.icon) set('icon', item.type === 'sensor' ? '📊' : '⚙️');
  if (typeof item.name !== 'string' || !item.name.trim()) set('name', item.slug);
  if (typeof item.description !== 'string') set('description', '');

  const tags = Array.isArray(item.tags)
    ? [...new Set(item.tags.map((t) => String(t).trim()).filter(Boolean))]
    : [];
  if (JSON.stringify(tags) !== JSON.stringify(item.tags)) { item.tags = tags; changed = true; }

  return changed;
}

/** Where the newest version of an item belongs. */
export function livePath(item) {
  const folder = item.type === 'sensor' ? 'sensors' : 'scripts';
  return `${folder}/${OS_FOLDER[item.os] || 'windows'}/${item.slug}.json`;
}

/** Where every older version of an item belongs — keyed by id, so a rename cannot orphan it. */
export function archivePath(item) {
  return `${VERSIONS_DIR}/${item.id}/${item.version}.json`;
}

export function expectedPath(item, isHead = true) {
  return isHead ? livePath(item) : archivePath(item);
}

const KEY_ORDER = ['schemaVersion', 'id', 'slug', 'type', 'name', 'description', 'version', 'release',
  'os', 'icon', 'author', 'tags', 'created', 'modified', 'notes', 'workspaceOne', 'codeBase64'];
const W1_ORDER = ['language', 'executionContext', 'executionArchitecture', 'timeout',
  'responseDataType', 'appCatalog', 'variables'];

function ordered(source, order) {
  const out = {};
  for (const key of order) if (source[key] !== undefined && source[key] !== null) out[key] = source[key];
  for (const key of Object.keys(source)) {
    if (!order.includes(key) && !key.startsWith('__') && source[key] !== null) out[key] = source[key];
  }
  return out;
}

/** Byte-for-byte what ESR Manager writes, so an app publish and a workflow run never differ. */
export function serialise(item) {
  const copy = ordered(item, KEY_ORDER);
  if (copy.workspaceOne && typeof copy.workspaceOne === 'object') {
    copy.workspaceOne = ordered(copy.workspaceOne, W1_ORDER);
  }
  return JSON.stringify(copy, null, 2) + '\n';
}

// ---- the index -------------------------------------------------------------

/**
 * One catalog row. Everything the extension and the app filter on lives here, so
 * neither has to download an item to search it. Accepts an item (which carries its
 * path as __path) or a row read back out of the index, and is idempotent.
 */
export function toRow(item) {
  return {
    id: String(item.id || '').trim().toLowerCase(),
    type: item.type === 'sensor' ? 'sensor' : 'script',
    name: String(item.name || '').trim(),
    description: String(item.description || ''),
    version: String(item.version || '1.0.0').trim(),
    release: release(item),
    os: String(item.os || '').trim(),
    icon: item.icon || '📄',
    tags: Array.isArray(item.tags)
      ? [...new Set(item.tags.map((t) => String(t).trim()).filter(Boolean))]
      : [],
    path: String(item.__path || item.path || '').trim()
  };
}

/**
 * Scripts before sensors, then Windows → macOS → Linux, then name, then path.
 * Ordinal on the lower-cased text, which is what StringComparer.OrdinalIgnoreCase
 * does in ESR Manager — a locale-aware compare would order some names differently.
 */
export function sortRows(rows) {
  const ord = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  return [...rows].sort((a, b) =>
    (TYPE_RANK[a.type] ?? 9) - (TYPE_RANK[b.type] ?? 9) ||
    (OS_RANK[a.os] ?? 9) - (OS_RANK[b.os] ?? 9) ||
    ord(a.name.toLowerCase(), b.name.toLowerCase()) ||
    ord(a.path, b.path));
}

/** Groups rows or items by identity — the id, or the path for anything without one. */
function byId(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = String(row.id || row.__path || row.path || '').toLowerCase();
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return groups;
}

/**
 * What the index actually carries: the head of every id, plus the newest
 * production version behind a testing head.
 *
 * A retired head is listed alone. Retiring an item retires the item — it is not a
 * rollback, so the version before it does not come back to take its place.
 */
export function channelRows(rows) {
  const out = [];

  for (const group of byId(rows).values()) {
    let head = group[0];
    for (const row of group) if (beats(row, head)) head = row;
    out.push(head);

    const kind = release(head);
    if (kind === 'production' || kind === 'retired') continue;

    let prod = null;
    for (const row of group) {
      if (row === head || release(row) !== 'production') continue;
      if (!prod || beats(row, prod)) prod = row;
    }
    if (prod) out.push(prod);
  }

  return out;
}

/**
 * The canonical index: one row per channel, sorted, one row per line.
 *
 * The wrapper is written by hand and each row is compact JSON, which keeps the file
 * small, keeps a diff to the rows that actually changed, and is trivial for ESR
 * Manager to reproduce exactly — no pretty-printer to agree with.
 */
export function renderIndex(rows) {
  const items = sortRows(channelRows(rows.map(toRow)));
  const head = `{\n  "indexVersion": ${INDEX_VERSION},\n  "items": [`;
  if (items.length === 0) return `${head}]\n}\n`;
  return `${head}\n${items.map((r) => '    ' + JSON.stringify(r)).join(',\n')}\n  ]\n}\n`;
}

/** Reads rows back. Tolerates a bare array. Returns null if the file is unusable. */
export function parseIndex(text) {
  let doc;
  try {
    doc = JSON.parse(text);
  } catch {
    return null;
  }
  const items = Array.isArray(doc) ? doc : Array.isArray(doc?.items) ? doc.items : null;
  if (!items) return null;
  return items.filter((r) => r && typeof r === 'object' && r.path).map(toRow);
}

/** Content equality — what decides whether the index is actually out of date. */
export function sameRows(a, b) {
  return JSON.stringify(sortRows(channelRows(a.map(toRow)))) ===
         JSON.stringify(sortRows(channelRows(b.map(toRow))));
}

// ---- main ------------------------------------------------------------------

/**
 * Decides where every file belongs before touching any of them, so a head that is
 * being demoted and the version replacing it cannot fight over one path.
 */
function plan(items) {
  const claimed = new Map();   // target path -> item
  const targets = new Map();   // item -> target path
  const skipped = new Set();   // items left where they are

  const groups = byId(items);
  const heads = new Set();

  for (const group of groups.values()) {
    let head = group[0];
    for (const item of group) if (beats(item, head)) head = item;
    heads.add(head);
  }

  // Heads first, then whatever is already sitting where it belongs, then by path.
  // A file that is already at its target keeps it, so a stray copy of a version
  // that is already filed never overwrites the filed one.
  const settled = (item) => (expectedPath(item, heads.has(item)) === item.__path ? 1 : 0);

  const ordered = [...items].sort((a, b) =>
    (heads.has(b) ? 1 : 0) - (heads.has(a) ? 1 : 0) ||
    settled(b) - settled(a) ||
    (a.__path < b.__path ? -1 : a.__path > b.__path ? 1 : 0));

  for (const item of ordered) {
    const isHead = heads.has(item);
    let target = expectedPath(item, isHead);

    if (claimed.has(target) && claimed.get(target) !== item) {
      if (isHead) {
        // Two different items want the same file name. Keep both, and give the
        // second its short id — the same thing ESR Manager does on a clash.
        item.slug = `${item.slug}-${item.id.slice(0, 8)}`;
        target = livePath(item);
      }

      if (claimed.has(target)) {
        // Same id and same version twice. Nothing can be moved without one
        // overwriting the other, so the loser stays exactly where it is and is
        // left out of the index.
        note(`${item.__path}: duplicate of ${claimed.get(target).__path} — left where it is and out of the index`);
        skipped.add(item);
        continue;
      }
    }

    claimed.set(target, item);
    targets.set(item, target);
  }

  return { targets, skipped, heads };
}

function main() {
  const files = [
    ...walk(join(ROOT, 'scripts')),
    ...walk(join(ROOT, 'sensors')),
    ...walk(join(ROOT, VERSIONS_DIR))
  ];

  const items = [];
  let wouldWrite = 0;

  for (const file of files) {
    const path = rel(file);
    const raw = readFileSync(file, 'utf8');

    let item;
    try {
      item = JSON.parse(raw);
    } catch {
      note(`${path}: not valid JSON — skipped`);
      continue;
    }

    normalise(item, path);
    item.__path = path;
    item.__raw = raw;
    items.push(item);
  }

  const { targets, skipped, heads } = plan(items);

  // Every path something ends up at. A move is only ever a write followed by a
  // delete of the *old* path, and a path another item is moving into is never
  // deleted: publishing v2 beside v1 has them swap places, and doing that one
  // file at a time would delete whichever was written first.
  const claimed = new Set(targets.values());
  for (const item of skipped) claimed.add(item.__path);

  const writes = [];
  const removes = new Set();

  for (const item of items) {
    if (skipped.has(item)) continue;

    const path = item.__path;
    const target = targets.get(item);

    if (target !== path) {
      note(`${path}: ${heads.has(item) ? 'moved to' : 'superseded — filed as'} ${target}`);
      wouldWrite++;
      writes.push([target, serialise(item)]);
      removes.add(path);
      item.__path = target;
    } else if (serialise(item) !== item.__raw) {
      wouldWrite++;
      note(`${path}: normalised`);
      writes.push([path, serialise(item)]);
    }
  }

  if (!CHECK) {
    for (const [path, content] of writes) {
      mkdirSync(dirname(join(ROOT, path)), { recursive: true });
      writeFileSync(join(ROOT, path), content);
    }

    for (const path of removes) {
      if (claimed.has(path)) continue;
      try {
        rmSync(join(ROOT, path));
      } catch (e) {
        note(`${path}: could not be removed after the move (${e.code}) — delete it by hand`);
      }
    }
  }

  const rows = items.filter((i) => !skipped.has(i)).map(toRow);
  const listed = channelRows(rows);

  const full = join(ROOT, INDEX_FILE);
  const existing = existsSync(full) ? readFileSync(full, 'utf8') : null;
  const current = existing === null ? null : parseIndex(existing);

  // Compared by content: ESR Manager writes this file too, and a difference in
  // formatting is not a reason to churn a commit.
  if (current === null || !sameRows(current, rows)) {
    wouldWrite++;
    note(`${INDEX_FILE}: ${listed.length} row(s) written`);
    if (!CHECK) writeFileSync(full, renderIndex(rows));
  }

  for (const line of log) console.log(line);

  const archived = items.filter((i) => !heads.has(i) && !skipped.has(i)).length;
  console.log(
    `${items.length} file(s), ${heads.size} item(s), ${archived} older version(s), ` +
    `${listed.length} row(s) indexed, ${wouldWrite} file(s) ${CHECK ? 'would change' : 'written'}.`);

  if (CHECK && wouldWrite > 0) {
    console.error('Index is out of date. Run: node tools/esr-index.mjs');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
