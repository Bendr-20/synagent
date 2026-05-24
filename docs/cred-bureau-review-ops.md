# Cred Bureau Review Ops

Last updated: 2026-05-24 UTC
Status: locked for reviewed access

## Owners

- Review owner: Quigley
  - Owns approve/reject quality.
  - Makes the final call on whether an applicant belongs in reviewed access.
- Backup reviewer: Jim
  - Covers the queue when Quigley is busy.
  - Handles technical/admin edge cases.
- Manual group adds: Jim
  - Approved applicants are added manually after review.
  - Use the copied Telegram review summary as the handoff record.

## Response SLA

- Same business day for reviewed-access applications.
- Applications submitted late in the day roll to the next morning.
- If the owner cannot review inside SLA, the backup reviewer should make the call or flag it in the team chat.

## Review workflow

1. Applicant submits the Cred Bureau form with a required Helixa human profile URL.
2. Review owner checks contact info, Helixa profile, Cred context, optional LinkedIn/website, why-join note, availability, and disclosure against `docs/cred-bureau-applicant-rules.md`.
3. Reviewer sets the application to pending, approved, or rejected manually with reviewer notes.
4. Approved/rejected decisions automatically create a Decision Log entry.
5. If approved, Jim manually adds the applicant to the group.
6. After the decision and any manual add are complete, close the review box so it leaves the active queue.
7. Closed boxes can be shown and reopened from the closed review box view if needed.

## Operating rules

- Reviewed-access approvals are manual only; criteria guide reviewers but do not auto-approve applicants.
- Do not auto-invite applicants.
- Follow `docs/cred-bureau-applicant-rules.md` for qualification, pending, rejection, and conflict handling.
- Do not approve incomplete Helixa human profiles unless Quigley explicitly wants to park or make an exception.
- Do not share the review key in the group chat.
- Follow `docs/review-queue-security.md` for authorized reviewer roster, key handling, and rotation.
- Keep reviewer notes concrete enough that the Decision Log is useful later.

## Weekly recap template

Use this after the weekly checkpoint is reviewed by the owner. Keep it public-safe: do not include wallets, reviewer keys, private notes, or individual payout promises.

```text
Cred Bureau weekly checkpoint — Week [N] / Season [1|2]

Reviewed this week:
- Approved contributions: [count]
- Points awarded after manual review: [points]
- Top contribution categories: [categories]
- Open queue: [submitted count] submitted, [needs-info count] needs-info

Current public leaderboard snapshot:
1. [display name] — [points] pts
2. [display name] — [points] pts
3. [display name] — [points] pts

Reviewer note:
- Contributions remain subject to manual review and anti-farm checks before rewards are sent.
- Next checkpoint: [date/time UTC]
```

## Final winners post template

Use this only after the season review is closed, anti-farm review is complete, the payout export has been created, and owners approve the post. Keep it public-safe: do not include wallets, reviewer keys, private notes, or payout export files.

```text
Cred Bureau Season [N] final standings

1. [display name] — [points] pts — [primary contribution type]
2. [display name] — [points] pts — [primary contribution type]
3. [display name] — [points] pts — [primary contribution type]

Season notes:
- Total reviewed contributors: [count]
- Total approved contributions: [count]
- Review window: [start date UTC] to [end date UTC]
- Manual anti-farm review completed: [yes/no + reviewer initials]

Rewards are handled manually by the team after final checks.
Questions or corrections: [contact/process]
```
