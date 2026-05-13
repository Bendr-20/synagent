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
- Add tests proving backups are created and pruned.
- Update launch docs and prelaunch checklist.

Out of scope:
- Database migration.
- S3 or remote backup automation.
- Admin UI for retention cleanup.
- Automatic deletion/redaction jobs.

## Architecture

Add a small shared storage helper, likely `src/lib/json-data-store.ts`, that owns file-backed JSON behavior:

- Ensure the `data/` directory exists before writes.
- Read JSON with a fallback when the file is missing or malformed, matching current behavior.
- Before overwriting an existing data file, copy it to `data/backups/`.
- Name backups with the source base name plus a timestamp and short suffix so multiple writes in the same millisecond do not collide.
- Prune older backups for that source base name after each backup creation, keeping the newest 50.
- Write formatted JSON with a trailing newline for consistency.

`cred-bureau-store.ts` and `match-store.ts` should use this helper instead of maintaining separate read/write helpers.

## Data Flow

For each write:

1. Caller builds the next JSON value.
2. Shared helper checks whether the target file exists.
3. If it exists, helper copies the current file to `data/backups/<source>.<timestamp>.<suffix>.bak.json`.
4. Helper prunes backups for that source, keeping 50 newest.
5. Helper writes the new JSON file.

If the source file does not exist, the helper writes the new file without creating an empty backup.

## Error Handling

- If reading a JSON file fails, keep current behavior and return the fallback value.
- If backup creation fails, the write should fail rather than silently losing the previous state.
- If pruning one old backup fails, the write should fail so the operator sees the filesystem issue.
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
- Shared JSON helper keeps at most 50 backups for a source file.
- Existing Cred Bureau and match API tests continue passing with the helper in place.

## Success Criteria

- Backup helper is used by both Cred Bureau and match JSON stores.
- Tests prove backup creation and pruning.
- `npm test` passes.
- Prelaunch checklist marks JSON storage acceptable for small closed beta with backup caveat.
- Prelaunch checklist marks local backups added for match and Cred Bureau data files.
- Launch runbook documents retention policy and the database requirement before broad launch.
