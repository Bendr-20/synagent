# Cred Bureau Approve Suggested Design

Date: 2026-06-02 UTC
Status: approved by Epifani/Quigley in Telegram

## Goal

Make reward review feel like an advanced assistant workflow instead of manual scoring homework. The reviewer should see Bendr's suggested point value and be able to approve it with one obvious action: `Approve Suggested`.

## Non-negotiable Data Safety

- Do not rewrite, reseed, or clear production reward JSON as part of this change.
- Snapshot live reward JSON before work starts.
- Tests must run against `SYNAGENT_DATA_DIR` temporary folders only.
- After verification, compare live reward JSON hashes against the pre-change snapshot before claiming success.
- Production data paths to protect:
  - `/home/ubuntu/synagent/data/cred-bureau-rewards-contributions.json`
  - `/home/ubuntu/synagent/data/cred-bureau-rewards-participants.json`
  - `/home/ubuntu/synagent/data/cred-bureau-rewards-review-log.json`
  - `/home/ubuntu/synagent/data/cred-bureau-payout-exports.json`
- Hash procedure: run `sha256sum` on the protected files before coding, store it in the manual backup directory, then run `sha256sum -c` against that file after tests/build/restart. Code deploy should not mutate these JSON files.

## Reviewer Experience

Each reward card should show server-generated scoring fields from the same shared scoring helper used by the API:

- Suggested points
- Short explanation for the recommendation
- Any review flags, such as low-effort social evidence or wildcard manual review
- Existing manual point/status controls for overrides
- A one-click `Approve Suggested` button when a numeric suggestion is safe

The browser must not duplicate scoring logic. The score shown to the reviewer and the score persisted by `Approve Suggested` must come from the same server-side helper.

`Approve Suggested` should submit an approved review using the server-calculated suggestion, not a client-only number.

## Scoring Design

Use deterministic rubric scoring in v1. This avoids LLM cost, flaky model output, and accidental private-data leakage while still making the human workflow easy.

Rules:

- Matched task: 25-100 points
- Task creation: 10-40 points
- Bug/friction log: 10-60 points
- Product feedback: 10-50 points
- Referral: 10-30 points
- Wildcard: requested points if present, clamped to 1-250; otherwise no numeric suggestion and no `Approve Suggested` button
- Requested points are treated as a signal, clamped to the category range.
- Evidence URL, description depth, and category-specific signal words can move a score upward.
- Low-effort social evidence suggests 0 points.

## Server Contract

PATCH `/api/cred-bureau/rewards/contributions` accepts `useSuggestedPoints: true`.

Semantics:

- If `status === "approved"` and `useSuggestedPoints === true`, the API calculates the suggestion from the stored contribution and uses that as `assignedPoints`.
- If `assignedPoints` is also sent, `useSuggestedPoints` wins so the one-click workflow cannot drift from the server rubric.
- If the suggestion has no numeric value, the API rejects `useSuggestedPoints` with a clear manual-review error.
- If `status !== "approved"`, `useSuggestedPoints` is ignored and points remain governed by the existing transition rules.

This keeps the server authoritative even if the browser UI is stale.

## Verification

- Add failing tests first for suggested approval behavior and review UI copy.
- Run targeted tests for rewards API/UI.
- Run full `npm test` before deploy.
- Verify live reward JSON hashes are unchanged except for intentional reviewer actions, which this code deploy should not perform.
