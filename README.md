# Enterprise Script Repository

A shared library of Workspace ONE UEM scripts and sensors, published from **ESR Manager**
and consumed by the **Enterprise Script Repository** Chrome extension inside the console.

## Layout

```
index.json                   The whole catalog — generated, never hand-edited
scripts/windows/*.json       One self-contained item per file — the newest version
scripts/macos/*.json
sensors/windows/*.json
sensors/macos/*.json
sensors/linux/*.json
versions/<id>/<version>.json Every version those replaced — generated, what a rollback restores from
schema/esr-item.schema.json  What a valid item looks like
tools/esr-index.mjs          Rebuilds index.json from the files on disk
.github/workflows/index.yml  Runs that tool on every push
```

## Item format

One JSON object holds everything: metadata, the exact console settings, and the script body
base64-encoded. The extension needs nothing else to recreate the item.

```jsonc
{
  "schemaVersion": "1.1",
  "id": "9f1c0a3e-5b62-4c1d-9f8a-2b7d61e40c11",  // permanent GUID identity
  "slug": "set-device-hostname",   // filename stem only
  "type": "script",                // script | sensor
  "name": "Set Device Hostname",
  "description": "…",
  "version": "1.0.0",
  "release": "production",         // production | testing | retired
  "os": "Windows",                 // Windows | macOS | Linux
  "icon": "🖥️",                    // shown in the panel
  "author": "…",
  "tags": ["provisioning"],        // searchable from the console panel
  "workspaceOne": {
    "language": "POWERSHELL",
    "executionContext": "SYSTEM",
    "executionArchitecture": "EITHER64OR32BIT",
    "timeout": 60,
    "appCatalog": { "enabled": false, "displayName": "", "displayDescription": "", "category": "" },
    "variables": [ { "key": "ESR_PREFIX", "value": "WKS" } ]
  },
  "codeBase64": "…"
}
```

Which `workspaceOne` fields apply depends on the type and platform — sensors have a
`responseDataType` and no `timeout`, macOS has no `executionArchitecture`, Windows sensors
have no variables. The schema encodes all of it; validate with any Draft 2020-12 validator.

## Identity and versions

`id` is a GUID and never changes once minted. Publishing an item whose id is already in the
repository *is* publishing a new version of it. Everything else is cosmetic. Renaming the
item, moving it to another platform, or changing `slug` moves the file; the id, and so the
item, stays the same. A genuinely different item gets a new GUID (ESR Manager's
**Duplicate** does this).

`slug` is only the filename stem, so the repository stays readable. If two different items
want the same file name, the second gets its short id appended.

The newest version of an item lives under `scripts/` or `sensors/`; every version it
replaced is filed at `versions/<id>/<version>.json`. Keyed by the GUID rather than the slug,
so a rename or a platform change cannot orphan an item's history.

## Rolling back

That history is the point of keeping it. Remove the published version and the highest
version left takes its place — same file, same index row — so a bad publish is one action
to undo. **Roll back…** in ESR Manager does it to a version you pick; everything above that
version is deleted, because the index always lists an item at its highest version and an
older one cannot be current while a newer file is still there. Anything below stays filed.

An item with nothing filed has nothing to fall back to, so removing it removes it.

## Release channels

Every version is `production`, `testing` or `retired`.

- **`production`** — what the Chrome extension serves.
- **`testing`** — not served. While a testing version is the newest one, the extension
  keeps serving the newest production version behind it, so trying a change never takes the
  working one away from anybody.
- **`retired`** — withdrawn from the extension, and nothing takes its place. The item is
  still here, and still in ESR Manager.

ESR Manager lists every channel and badges anything that is not production. A new item
starts on `testing`. A file that arrives with no `release` field at all reads as
`production`, so nothing written before the field existed disappears.

## The index

`index.json` is the whole catalog — scripts and sensors in one file — and it exists so that
the extension and ESR Manager can list, search and filter everything after a single request,
without downloading an item to find out what it is. It is a machine artefact, not
documentation: it is generated whole, it is not meant to be read here, and a hand edit to it
is simply overwritten on the next push.

```jsonc
{
  "indexVersion": 1,
  "items": [
    {"id":"…","type":"script","name":"…","description":"…","version":"1.0.0",
     "release":"production","os":"Windows","icon":"🖥️","tags":["provisioning"],
     "path":"scripts/windows/…json"}
  ]
}
```

One row per `id` — its highest version — plus, behind a testing one, the newest production
version still being served. `tags` is in the row because search runs against the index, so a
tag that is not here cannot be found. `release` is in the row for the same reason: it is what
the extension filters on. One row per line keeps a diff to the items
that actually changed.

Two things write the file, and they write the same bytes:

- **ESR Manager**, which commits the item and the rebuilt index together, and
- **the `Rebuild index` workflow**, which runs `tools/esr-index.mjs` on every push.

They are compared by *content*, not by text — the workflow rewrites `index.json` only when
the data in it is wrong — so if the two ever differ over whitespace, nothing churns.

## Adding an item

**With ESR Manager** — the normal route. It only offers values the console actually has,
validates before publishing, and writes the item and the index in one commit. It can also
import a `.json` item or a raw `.ps1`/`.sh`/`.zsh`/`.py` file that someone sent you, or a
drag-and-drop of several at once, and publish them straight up.

**Without anything installed** — use *Add file → Upload files* on github.com, or a PR, and
drop the JSON anywhere under `scripts/` or `sensors/`. The workflow then:

- gives it a GUID `id` if it has none, and a `slug` from the file name,
- moves it into the folder its `type` and `os` say it belongs in, renaming the file to match
  its slug,
- normalises the JSON to the canonical field order and formatting,
- files any version it supersedes under `versions/<id>/<version>.json` instead of leaving two
  copies of one item in the catalog,
- rebuilds `index.json`.

Nobody needs a clone, and nobody edits an index by hand. Run the same tool locally with
`node tools/esr-index.mjs` (or `--check` to see what it would change).
