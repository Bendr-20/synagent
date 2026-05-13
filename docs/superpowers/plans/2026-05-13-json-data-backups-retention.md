# JSON Data Backups and Retention Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add rolling local backups and documented retention rules for Synagent JSON-backed beta data.

**Architecture:** Create one shared JSON storage helper that owns read/write, backup creation, and backup pruning. Wire Cred Bureau and match stores through the helper so all four JSON files get the same safety behavior. Keep the scope intentionally local: no database migration, no remote backups, no automated retention cleanup.

**Tech Stack:** Next.js app, TypeScript, Node `fs`/`path`, Node test runner.

---

## Chunk 1: Shared JSON backup helper, store integration, docs

### Task 1: Add failing helper tests

**Files:**
- Create: `src/lib/json-data-store.test.ts`
- Later create: `src/lib/json-data-store.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/json-data-store.test.ts` with tests that import `JSON_BACKUP_LIMIT`, `getJsonBackupDir`, `readJsonFile`, and `writeJsonFile` from `./json-data-store`.

Test cases:
- `writeJsonFile creates a backup with previous contents before overwriting`
  - Use `fs.mkdtempSync(path.join(os.tmpdir(), "json-store-"))`.
  - Create a source file like `<tmp>/data/sample.json` with `{ "version": 1 }`.
  - Call `writeJsonFile(filePath, { version: 2 })`.
  - Assert the source file now has version 2.
  - Assert `getJsonBackupDir(filePath)` contains one matching backup.
  - Assert backup file content contains version 1.
- `writeJsonFile does not create a backup for first write`
  - Use a missing source file.
  - Call `writeJsonFile(filePath, { created: true })`.
  - Assert source exists.
  - Assert backup dir is missing or contains no matching source backup.
- `writeJsonFile prunes only old backups for the same source`
  - Create `JSON_BACKUP_LIMIT + 3` fake backups matching `sample.json.backup.*.bak`.
  - Create several backups for `other.json.backup.*.bak` in the same backup dir.
  - Call `writeJsonFile(samplePath, { next: true })`.
  - Assert matching `sample.json` backups count is `JSON_BACKUP_LIMIT`.
  - Assert `other.json` backups are still present.
- `writeJsonFile throws when backup directory creation fails`
  - Create the source file.
  - Create a regular file at `<tmp>/data/backups` so creating the backup directory fails.
  - Assert `writeJsonFile` throws.
  - Assert original source file content remains unchanged.
- `writeJsonFile throws when pruning fails`
  - Create the source file and backup dir.
  - Create `JSON_BACKUP_LIMIT + 1` matching backup entries.
  - Make the oldest matching backup a directory ending in `.bak` so `fs.unlinkSync` fails during pruning.
  - Assert `writeJsonFile` throws before final source overwrite.

- [ ] **Step 2: Run helper tests to verify RED**

Run:

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test src/lib/json-data-store.test.ts
```

Expected: FAIL because `src/lib/json-data-store.ts` does not exist and exported helper functions are missing.

### Task 2: Implement the shared helper

**Files:**
- Create: `src/lib/json-data-store.ts`
- Test: `src/lib/json-data-store.test.ts`

- [ ] **Step 1: Create `src/lib/json-data-store.ts`**

Implementation requirements:
- Export `JSON_BACKUP_LIMIT = 50`.
- Export `readJsonFile<T>(filePath: string, fallback: T): T`.
- Export `writeJsonFile<T>(filePath: string, value: T): void`.
- Export `getJsonBackupDir(filePath: string): string`.
- `readJsonFile` returns fallback on any read/parse failure.
- `writeJsonFile` ensures `path.dirname(filePath)` exists.
- If `filePath` exists, create `getJsonBackupDir(filePath)`, copy the old file to a backup named `<basename>.backup.<sortable timestamp>.<suffix>.bak`, prune matching backups, then write the new JSON with two-space formatting and trailing newline.
- Matching backups are files whose names start with `<basename>.backup.` and end with `.bak`.
- Sort matching backup names descending and delete anything after the first 50.

- [ ] **Step 2: Run helper tests to verify GREEN**

Run:

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test src/lib/json-data-store.test.ts
```

Expected: PASS, all helper tests pass.

- [ ] **Step 3: Commit helper and tests**

Run:

```bash
git add src/lib/json-data-store.ts src/lib/json-data-store.test.ts
git commit -m "Add JSON data backup helper"
```

### Task 3: Wire stores through the helper

**Files:**
- Modify: `src/lib/cred-bureau-store.ts`
- Modify: `src/lib/match-store.ts`
- Test: `src/lib/cred-bureau-application.test.ts`
- Test: `src/lib/match-api.test.ts`

- [ ] **Step 1: Replace local JSON helpers in Cred Bureau store**

In `src/lib/cred-bureau-store.ts`:
- Remove local `ensureDataDir`, `readJsonFile`, and `writeJsonFile` helpers.
- Add `import { readJsonFile, writeJsonFile } from "./json-data-store";`.
- Keep `DATA_DIR`, `APPLICATIONS_PATH`, and `REVIEW_LOG_PATH` constants unchanged.
- Leave application and review-log behavior unchanged.

- [ ] **Step 2: Replace local JSON helpers in match store**

In `src/lib/match-store.ts`:
- Remove local `ensureDataDir`, `readJsonFile`, and `writeJsonFile` helpers.
- Add `import { readJsonFile, writeJsonFile } from "./json-data-store";`.
- Keep `DATA_DIR`, `REQUESTS_PATH`, and `NOTIFICATIONS_PATH` constants unchanged.
- Leave match request and notification behavior unchanged except write formatting now includes a trailing newline.

- [ ] **Step 3: Run integration tests**

Run:

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test src/lib/json-data-store.test.ts src/lib/cred-bureau-application.test.ts src/lib/match-api.test.ts
```

Expected: PASS, all selected tests pass.

- [ ] **Step 4: Commit store integration**

Run:

```bash
git add src/lib/cred-bureau-store.ts src/lib/match-store.ts
git commit -m "Use JSON backup helper in data stores"
```

### Task 4: Update launch docs and checklist

**Files:**
- Modify: `docs/prelaunch-checklist.md`
- Modify: `docs/launch/mvp-curated-beta.md`

- [ ] **Step 1: Update data durability checklist**

In `docs/prelaunch-checklist.md` section `## 6. Data durability`:
- Mark JSON file storage as acceptable only for very small closed beta.
- Mark rolling local backups as added for Cred Bureau applications, Cred Bureau review log, match requests, and match notifications.
- Mark retention policy as decided.
- Keep broad public launch status cautious: JSON is not acceptable for broad launch.

- [ ] **Step 2: Add data durability and retention policy to runbook**

In `docs/launch/mvp-curated-beta.md` add a `## Data durability and retention` section covering:
- JSON file storage is acceptable for closed beta only while volume is low and one server owns writes.
- Every overwrite of the four JSON data files creates a local rolling backup under `data/backups/`.
- Keep latest 50 backups per source file.
- Approved Cred Bureau applicant retention: through closed beta and 90 days after beta ends unless removal requested.
- Rejected applicant retention: 30 days, then delete/redact applicant contact/profile fields.
- Decision logs may keep status/timestamp/reviewer notes longer but should not retain full contact/profile data forever.
- MVP request and notification records should be reviewed after 90 days and contact details deleted/redacted when no longer needed.
- Before broad public launch, move to database storage and automated retention cleanup.

- [ ] **Step 3: Commit docs**

Run:

```bash
git add docs/prelaunch-checklist.md docs/launch/mvp-curated-beta.md
git commit -m "Document JSON data retention policy"
```

### Task 5: Final verification and push

**Files:**
- Verify entire repository state.

- [ ] **Step 1: Run full test suite**

Run:

```bash
npm test
```

Expected: `next build` succeeds and all Node tests pass with zero failures.

- [ ] **Step 2: Inspect git status and recent commits**

Run:

```bash
git status --short
git log --oneline -5
```

Expected: only intentional committed changes or a clean tree before push.

- [ ] **Step 3: Push**

Run:

```bash
git push
```

Expected: main pushes to `https://github.com/Bendr-20/synagent.git`.

- [ ] **Step 4: Report Step 7 completion**

Report:
- Backup helper added.
- All four JSON stores are covered.
- Retention policy documented.
- Test evidence from `npm test`.
- Latest commit hash.
