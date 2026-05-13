# JSON Data Backups and Retention Design

Date: 2026-05-13 UTC
Status: approved for Step 7 implementation
Repository: `https://github.com/Bendr-20/synagent.git`

## Goal

Step 7 makes JSON-backed storage safer for a very small curated beta without pretending it is production-grade durability.

Synagent currently stores Cred Bureau applications, Cred Bureau review logs, MVP requests, and match notifications as JSON files under `data/`. That is acceptable only for low-volume closed beta if every write creates a recoverable local backup and the docs define retention limits.

## Scope

In scope:
- Add rolling local backups before JSON data files are overwritten.
- Cover these files:
  - `data/cred-bureau-applications.json`
  - `data/cred-bureau-review-log.json`
  - `data/match-requests.json`
  - `data/match-notifications.json`
- Keep backups under `data/backups/`.
- Keep the latest 50 backups per source file.
- Add tests proving backups are created, pruned, and failure-safe.
- Update `docs/prelaunch-checklist.md` and `docs/launch/mvp-curated-beta.md`.

Out of scope:
- Database migration.
- S3 or remote backup automation.
- Admin UI for retention cleanup.
- Automatic deletion/redaction jobs.
- Atomic write protocol or concurrent write locking. Closed beta assumes one server process owns these JSON writes; broad launch must move to a database.

## Architecture

Add a small shared storage helper at `src/lib/json-data-store.ts` that owns file-backed JSON behavior.

Exports:

```ts
export const JSON_BACKUP_LIMIT = 50;

export function readJsonFile<T>(filePath: string, fallback: T): T;

export function writeJsonFile<T>(filePath: string, value: T): void;

export function getJsonBackupDir(filePath: string): string;
```

Interface rules:
- `filePath` is the concrete JSON data file path, for example `path.join(process.cwd(), "data", "match-requests.json")`.
- `getJsonBackupDir(filePath)` returns `path.join(path.dirname(filePath), "backups")`, so current data files back up to `data/backups/` and tests can use temporary directories without touching real production data.
- `JSON_BACKUP_LIMIT` is owned by the helper and used by pruning logic and tests.
- `readJsonFile` returns `fallback` when the file is missing or malformed, matching current behavior.
- `writeJsonFile` ensures the parent data directory exists, creates the backup directory before backup copy, backs up an existing file, prunes old backups for that same source file, then writes formatted JSON with a trailing newline.

`cred-bureau-store.ts` and `match-store.ts` should import this helper instead of maintaining separate read/write helpers.

## Backup Naming and Pruning

Backup file names must use the full source JSON basename, including `.json`, so each source file has an unambiguous prefix:

```text
<basename>.backup.<ISO-like timestamp>.<short suffix>.bak
```

Example:

```text
match-requests.json.backup.2026-05-13T22-55-31-123Z.a1b2c3.bak
```

Pruning rules:
- For a target file `data/match-requests.json`, only files in `data/backups/` whose names start with `match-requests.json.backup.` and end with `.bak` are considered backups for that source.
- Do not prune backups for other source files.
- Sort matching backups by filename descending, because the timestamp format is lexicographically sortable.
- Keep the newest `JSON_BACKUP_LIMIT` files and delete older matching files.

## Data Flow

For each write:

1. Caller builds the next JSON value.
2. Shared helper checks whether the target file exists.
3. If it exists, helper creates `data/backups/` if needed.
4. Helper copies the current file to `data/backups/<basename>.backup.<timestamp>.<suffix>.bak`.
5. Helper prunes matching backups for that source, keeping 50 newest by filename.
6. Helper writes the new JSON file.

If the source file does not exist, the helper writes the new file without creating an empty backup.

## Error Handling

- If reading a JSON file fails, keep current behavior and return the fallback value.
- If backup directory creation, backup copy, or pruning fails, the write should fail rather than silently losing the previous state.
- If pruning one old backup fails, the write should fail so the operator sees the filesystem issue.
- If writing the final JSON file fails, the backup remains available for manual recovery.
- Backup files remain git-ignored because `data/` is already ignored.

## Retention Policy

Document the policy, do not automate deletion in this step:

- JSON file storage is acceptable for closed beta only while volume is low and one server owns writes.
- Approved Cred Bureau applicants can be retained through closed beta and 90 days after beta ends unless they request removal.
- Rejected applicants should be retained for 30 days for abuse review, duplicate detection, and appeal context, then contact/profile fields should be deleted or redacted.
- Decision logs may keep status, timestamp, and reviewer notes longer, but should not retain full applicant contact/profile data forever.
- MVP request and notification records should be reviewed after 90 days. Delete or redact contact details when no longer needed for delivery or support.
- Before broad public launch, move storage to a database and define automated retention cleanup.

## Tests

Add focused tests before implementation:

- Shared JSON helper creates a backup containing the old file contents before overwriting.
- Shared JSON helper writes no backup for a first write when the source file does not exist.
- Shared JSON helper keeps at most `JSON_BACKUP_LIMIT` backups for one source file.
- Shared JSON helper does not prune backups for other source files.
- Shared JSON helper surfaces backup/prune failures by throwing instead of continuing silently. Use temporary test directories and filesystem setup that forces failure without touching real `data/`.
- Existing Cred Bureau and match API tests continue passing with the helper in place.

## Success Criteria

- Backup helper is used by both Cred Bureau and match JSON stores.
- Tests prove backup creation, source-specific pruning, and failure behavior.
- `npm test` passes.
- `docs/prelaunch-checklist.md` marks JSON storage acceptable for small closed beta with backup caveat.
- `docs/prelaunch-checklist.md` marks local backups added for match and Cred Bureau data files.
- `docs/launch/mvp-curated-beta.md` documents retention policy and the database requirement before broad launch.
