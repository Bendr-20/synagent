# Synagent Prelaunch Checklist

Last updated: 2026-05-13 UTC

## Status key
- GREEN: launch-ready
- YELLOW: usable but needs tightening before launch
- RED: blocker or trust-breaking issue

## 1. Launch definition
- [x] YELLOW - Launch mode selected: reviewed access / concierge routing
- [x] YELLOW - Primary offer selected: Create an MVP
- [x] GREEN - Launch copy defines reviewed access boundaries and avoids open-marketplace promises
- [x] GREEN - Cred Bureau reviewed access review owner and SLA locked
- [x] GREEN - Cred Bureau applicant rules locked as manual-only approval for reviewed access

Notes:
- MVP should be concierge routing with Helixa trust underneath.
- Cred Bureau review ops are locked in `docs/cred-bureau-review-ops.md`: Quigley review owner, Jim backup reviewer and manual group adds, same-business-day SLA.
- Cred Bureau applicant rules are locked in `docs/cred-bureau-applicant-rules.md`: manual approval only for this launch phase; automation can be considered later.
- Broader Synagent MVP request handling can reuse this ops pattern, but should be explicitly confirmed before broad public launch.

## 2. Offer + homepage clarity
- [x] GREEN - Homepage is refocused around reviewed MVP intake
- [x] GREEN - Plain how-it-works section exists
- [x] GREEN - CTA language matches the reviewed-intake flow
- [x] GREEN - Support lanes are secondary instead of equal marketplace promises

Notes:
- Step 6 copy pass completed on 2026-05-13 UTC after team approval in group.
- Homepage now leads with reviewed intake, manual routing, and reviewed access boundaries instead of instant matching or marketplace density.

## 3. Directory integrity
- [x] YELLOW - Fake provider directory removed from public export
- [x] YELLOW - Only real public provider shown for now
- [ ] YELLOW - Confirm public provider availability before launch
- [ ] YELLOW - Add 2-3 more real provider profiles or explicitly launch as concierge with thin supply

Notes:
- Public provider list is intentionally thin.
- Degeneer is public with Helixa profile status pending. Do not imply verified profile coverage until profiles exist.

## 4. Intake flow
- [x] GREEN - `/match` route exists and build passes
- [x] GREEN - `/api/match` stores requests and returns matched providers
- [x] GREEN - No-strong-match fallback returns `needs-review`
- [x] YELLOW - Basic local rate limit added to `/api/match`
- [x] YELLOW - Mobile 390px overflow fixed and screenshot-verified
- [ ] YELLOW - Test full flow on desktop manually in deployed preview
- [ ] YELLOW - Test full flow in Telegram in-app browser

Notes:
- Local limiter is enough for soft launch, not enough for broad public traffic.
- Weird/unrelated requests no longer auto-route just because there is one provider.

## 5. Notification + review ops
- [x] GREEN - Review/dispatch endpoint exists: `/api/match/dispatch`
- [x] GREEN - Protected request queue endpoint exists: `/api/match/requests`
- [x] GREEN - Protected notification queue endpoint exists: `/api/match/notifications`
- [x] GREEN - Cred Bureau review key configured and server-side security audit passed
- [x] GREEN - Cred Bureau authorized reviewer roster restricted to Jim, Quigley, and Epifani
- [ ] YELLOW - Rotate review key before wider access if private distribution cannot be confirmed
- [x] GREEN - Reviewed access notification mode selected: queue-only/manual queue review
- [x] GREEN - Missing delivery secrets resolve to queue-only instead of outbound alerts
- [ ] YELLOW - Configure and test AgentMail delivery only if email alerts are enabled later
- [ ] YELLOW - Configure and test Telegram delivery only if Telegram alerts are enabled later
- [x] GREEN - Cred Bureau review owner, backup reviewer, manual add owner, and SLA locked

Notes:
- Review endpoints require `SYNAGENT_REVIEW_API_KEY`.
- Review queue security is documented in `docs/review-queue-security.md`: authorized holders are Jim, Quigley, and Epifani; key must not be posted in group; rotate before wider access if distribution is uncertain.
- Cred Bureau review ops are locked in `docs/cred-bureau-review-ops.md`: Quigley owns review, Jim backs up and manually adds approved applicants, same-business-day SLA.
- Step 8 decision: reviewed access uses queue-only notification mode. Reviewers manually check protected queues; outbound AgentMail/Telegram alerts are disabled until real secrets and a delivery smoke test exist.
- `SYNAGENT_NOTIFICATION_MODE=queue-only` is the safe default. Explicit queue-only mode overrides configured providers so alerts do not start just because a secret was added.

## 6. Data durability
- [ ] RED - Decide if JSON file storage is acceptable for soft launch
- [ ] YELLOW - Add backups for `data/match-requests.json` and `data/match-notifications.json`
- [x] YELLOW - Minimal review/admin APIs exist for queued requests and notifications
- [ ] YELLOW - Decide retention policy for inbound requests

Notes:
- Current storage is file-backed JSON in `src/lib/match-store.ts`.
- Fine for prototype or very limited pilot, shaky for multiple reviewers or real volume.

## 7. Trust layer
- [x] YELLOW - Public directory uses only real providers
- [x] YELLOW - Fake-looking marketplace density removed
- [x] YELLOW - Privacy/contact copy added to intake
- [x] YELLOW - Fallback path exists when matching fails
- [x] GREEN - Launch copy and runbook avoid payment or escrow promises until checkout exists
- [ ] YELLOW - Finish or link Helixa profiles for launch providers where possible

Notes:
- Trust risk is much lower now, but provider supply and profile completeness are still launch constraints.

## 8. Technical QA
- [x] GREEN - Production build passes (`npm run build`)
- [x] GREEN - Core routes exist:
  - `/`
  - `/match`
  - `/synagents`
  - `/synagents/[slug]`
  - `/api/match`
  - `/api/match/dispatch`
  - `/api/match/requests`
  - `/api/match/notifications`
- [x] YELLOW - Mobile homepage and match page checked at 390px viewport
- [ ] YELLOW - Check 404 and broken-state UX manually
- [ ] YELLOW - Check metadata and social preview behavior manually
- [ ] YELLOW - Check mobile Safari and Telegram in-app browser manually
- [x] GREEN - Live HTTPS Cred Bureau page loads with valid TLS
- [x] GREEN - Live Cred Bureau smoke submit reached protected review queue
- [x] GREEN - Git tree clean after final technical check

Build result:
- `npm test` passed `next build` plus 14/14 tests on 2026-05-13 UTC.
- Live HTTPS check passed for `https://synagent.helixa.xyz/cred-bureau` with HTTP 200 and TLS verify result 0 on 2026-05-13 UTC.
- Live smoke application `cba_mp4ola1s_796356` submitted successfully, appeared in the protected review queue as `pending-review`, and was removed after verification to keep the queue clean.

## 9. Launch ops
- [ ] YELLOW - Pick launch date
- [ ] RED - Pick launch owner for inbound request handling
- [ ] RED - Set response SLA
- [ ] YELLOW - Prepare launch post/thread
- [ ] YELLOW - Prepare first outreach list
- [ ] YELLOW - Decide manual concierge flow for first users
- [ ] YELLOW - Queue x402 payment support as the first post-soft-launch payments milestone

Notes:
- Do not block soft launch on x402, but do not promise payments/escrow until the flow exists.

## 10. Success metrics
- [ ] YELLOW - Define first-2-week success criteria
- [ ] YELLOW - Track submissions
- [ ] YELLOW - Track qualified requests
- [ ] YELLOW - Track matches made
- [ ] YELLOW - Track replies sent
- [ ] YELLOW - Track paid engagements
- [ ] YELLOW - Track intake drop-off

## Current overall launch call
- RED - Not ready for broad public launch
- YELLOW - Close to limited launch once provider availability and backups are locked

## Fastest path to soft launch
1. Set notification secrets in deployment if alerts are enabled.
2. Privately confirm only Jim, Quigley, and Epifani have the review key, or rotate it before wider access.
3. Test one real request end to end in preview.
4. Confirm Degeneer availability and add 2-3 more real providers if possible.
5. Launch as concierge access, not marketplace.
