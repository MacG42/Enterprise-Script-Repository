#!/usr/bin/env node
/**
 * ESR index builder and normaliser.
 *
 * Walks scripts/ and sensors/, repairs anything an ad-hoc upload got wrong
 * (missing GUID id, missing slug, wrong folder, filename that is not the slug),
 * drops superseded duplicates, and rewrites index.json.
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
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join, dirname, basename } from 'node:path';

const ROOT = process.cwd();
const CHECK = process.argv.includes('--check');

export const INDEX_FILE = 'index.json';
export const INDEX_VERSION = 1;

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const OS_FOLDER = { Windows: 'windows', macOS: 'macos', Linux: 'linux' };
const OS_FROM_FOLDER = { windows: 'Windows', macos: 'macOS', linux: 'Linux' };
const OS_RANK = { Windows: 0, macOS: 1, Linux: 2 };
const TYPE_RANK = { script: 0, sensor: 1 };

const log = [];
const note = (m) => log.push(m);

// ---- helpers ---------------------------------------------------------------

export function slugify(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
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

/** The one item that wins for an id: highest version, then most recently modified. */
export function beats(candidate, current) {
  const v = compareVersions(candidate.version, current.version);
  if (v !== 0) return v > 0;
  const ma = Date.parse(candidate.modified || '') || 0;
  const mb = Date.parse(current.modified || '') || 0;
  if (ma !== mb) return ma > mb;
  return String(candidate.__path) < String(current.__path);
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
 * on-disk JSON has to be rewritten.
 */
export function normalise(item, path) {
  let changed = false;
  const set = (key, value) => {
    if (item[key] !== value) { item[key] = value; changed = true; }
  };

  const parts = path.split('/');
  const folderType = parts[0] === 'sensors' ? 'sensor' : 'script';
  const folderOs = OS_FROM_FOLDER[(parts[1] || '').toLowerCase()];

  if (item.type !== 'script' && item.type !== 'sensor') set('type', folderType);
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
    const stem = basename(path).replace(/\.json$/i, '');
    set('slug', SLUG.test(stem) ? stem : (slugify(stem) || slugify(item.name) || item.id.slice(0, 8)));
    note(`${path}: assigned slug ${item.slug}`);
  }

  if (item.schemaVersion !== '1.1') set('schemaVersion', '1.1');
  if (!item.version || !/^\d+\.\d+\.\d+$/.test(item.version)) set('version', '1.0.0');
  if (!item.icon) set('icon', item.type === 'sensor' ? '📊' : '⚙️');
  if (typeof item.name !== 'string' || !item.name.trim()) set('name', item.slug);
  if (typeof item.description !== 'string') set('description', '');

  const tags = Array.isArray(item.tags)
    ? [...new Set(item.tags.map((t) => String(t).trim()).filter(Boolean))]
    : [];
  if (JSON.stringify(tags) !== JSON.stringify(item.tags)) { item.tags = tags; changed = true; }

  return changed;
}

export function expectedPath(item) {
  const folder = item.type === 'sensor' ? 'sensors' : 'scripts';
  return `${folder}/${OS_FOLDER[item.os] || 'windows'}/${item.slug}.json`;
}

const KEY_ORDER = ['schemaVersion', 'id', 'slug', 'type', 'name', 'description', 'version', 'os',
  'icon', 'author', 'tags', 'created', 'modified', 'notes', 'workspaceOne', 'codeBase64'];
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

/** Keeps one row per id — the highest version. Rows with no id are keyed by path. */
export function dedupeRows(rows) {
  const best = new Map();
  for (const row of rows) {
    const key = (row.id || row.path).toLowerCase();
    const current = best.get(key);
    if (!current || compareVersions(row.version, current.version) > 0) best.set(key, row);
  }
  return [...best.values()];
}

/**
 * The canonical index: deduped, sorted, one row per line.
 *
 * The wrapper is written by hand and each row is compact JSON, which keeps the file
 * small, keeps a diff to the rows that actually changed, and is trivial for ESR
 * Manager to reproduce exactly — no pretty-printer to agree with.
 */
export function renderIndex(rows) {
  const items = sortRows(dedupeRows(rows.map(toRow)));
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
  return JSON.stringify(sortRows(dedupeRows(a.map(toRow)))) ===
         JSON.stringify(sortRows(dedupeRows(b.map(toRow))));
}

// ---- main ------------------------------------------------------------------

function main() {
  const files = [...walk(join(ROOT, 'scripts')), ...walk(join(ROOT, 'sensors'))];
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
    const target = expectedPath(item);
    let finalPath = path;

    if (target !== path) {
      let dest = target;
      if (existsSync(join(ROOT, dest))) {
        dest = dest.replace(/\.json$/, `-${item.id.slice(0, 8)}.json`);
        item.slug = basename(dest).replace(/\.json$/, '');
      }
      note(`${path}: moved to ${dest}`);
      wouldWrite++;
      if (!CHECK) {
        mkdirSync(dirname(join(ROOT, dest)), { recursive: true });
        writeFileSync(join(ROOT, dest), serialise(item));
        try {
          rmSync(file);
        } catch (e) {
          note(`${path}: could not be removed after the move (${e.code}) — delete it by hand`);
        }
      }
      finalPath = dest;
    } else if (serialise(item) !== raw) {
      wouldWrite++;
      note(`${path}: normalised`);
      if (!CHECK) writeFileSync(file, serialise(item));
    }

    item.__path = finalPath;
    items.push(item);
  }

  // One item per id — the newest version wins, the rest stay on disk but leave the index.
  const winners = new Map();
  for (const item of items) {
    const current = winners.get(item.id);
    if (!current) { winners.set(item.id, item); continue; }
    const loser = beats(item, current) ? current : item;
    if (beats(item, current)) winners.set(item.id, item);
    note(`${loser.__path}: superseded by a newer version of id ${item.id} — left out of the index`);
  }

  const rows = [...winners.values()].map(toRow);
  const full = join(ROOT, INDEX_FILE);
  const existing = existsSync(full) ? readFileSync(full, 'utf8') : null;
  const current = existing === null ? null : parseIndex(existing);

  // Compared by content: ESR Manager writes this file too, and a difference in
  // formatting is not a reason to churn a commit.
  if (current === null || !sameRows(current, rows)) {
    wouldWrite++;
    note(`${INDEX_FILE}: ${rows.length} row(s) written`);
    if (!CHECK) writeFileSync(full, renderIndex(rows));
  }

  for (const line of log) console.log(line);
  console.log(`${items.length} item(s), ${winners.size} indexed, ${wouldWrite} file(s) ${CHECK ? 'would change' : 'written'}.`);

  if (CHECK && wouldWrite > 0) {
    console.error('Index is out of date. Run: node tools/esr-index.mjs');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
