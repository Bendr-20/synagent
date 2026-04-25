# Synagent Prelaunch Checklist

Last updated: 2026-04-25 UTC

## Status key
- GREEN: launch-ready
- YELLOW: usable but needs tightening before launch
- RED: blocker or trust-breaking issue

## 1. Launch definition
- [ ] YELLOW - Decide launch mode: curated beta, soft launch, or public launch
- [ ] YELLOW - Pick one primary offer to lead with
- [ ] YELLOW - Define who Synagent is for and not for
- [ ] YELLOW - Lock response time, delivery window, and expected outcome

Notes:
- Current homepage leads with three offers at once: `Hire A Human`, `Create An MVP`, and `Human AI Consultants`.
- Recommendation: launch as **curated beta**, not open marketplace.

## 2. Offer + homepage clarity
- [ ] RED - Reduce to one primary offer above the fold
- [ ] YELLOW - Add a plain `how it works` section
- [ ] YELLOW - Make CTA language match the actual service flow
- [ ] YELLOW - Remove vague language that feels more conceptual than operational

Notes:
- Current hero and cards are clean, but the site is still trying to sell multiple lanes simultaneously.
- This weakens the first impression and makes the service feel less concrete.

## 3. Directory integrity
- [ ] RED - Remove or clearly label seeded/mock providers in `src/app/synagents/data.ts`
- [ ] RED - Confirm every public provider is real, reachable, and available
- [ ] YELLOW - Verify displayed Cred, payment methods, contact methods, and capacity
- [ ] YELLOW - Set minimum real supply target for launch, ideally 3-5 real operators

Notes:
- The repo still contains a large seeded synthetic provider list plus one real provider (`degeneer`).
- This is the biggest trust risk right now.

## 4. Intake flow
- [x] GREEN - `/match` route exists and build passes
- [x] GREEN - `/api/match` stores requests and returns matched providers
- [ ] YELLOW - Test full flow on desktop manually
- [ ] YELLOW - Test full flow on mobile and Telegram in-app browser
- [ ] RED - Add anti-spam / rate-limit / bot protection
- [ ] YELLOW - Add explicit fallback message when no strong match exists

Notes:
- Intake validation exists in `src/lib/match-engine.ts`.
- I did not see spam protection or rate limiting yet.

## 5. Notification + review ops
- [x] GREEN - Review/dispatch endpoint exists: `/api/match/dispatch`
- [ ] RED - Replace placeholder review auth and delivery config with real values
- [ ] YELLOW - Test AgentMail delivery with a real request
- [ ] YELLOW - Test Telegram delivery with a real request
- [ ] YELLOW - Decide who reviews requests and what the SLA is

Notes:
- `.env.example` still has placeholders for:
  - `SYNAGENT_REVIEW_API_KEY`
  - `SYNAGENT_AGENTMAIL_API_KEY`
  - `SYNAGENT_AGENTMAIL_INBOX_ID`
  - `SYNAGENT_TELEGRAM_BOT_TOKEN`
- Default mode is operationally safe, but not launch-complete.

## 6. Data durability
- [ ] RED - Decide if JSON file storage is acceptable for launch
- [ ] YELLOW - Add backups for `data/match-requests.json` and `data/match-notifications.json`
- [ ] YELLOW - Add a minimal review/admin workflow for queued requests
- [ ] YELLOW - Decide retention policy for inbound requests

Notes:
- Current storage is file-based in `src/lib/match-store.ts`.
- Fine for prototype/beta, shaky for anything with real volume or multiple operators.

## 7. Trust layer
- [ ] RED - Use only real bios, real operators, and real availability
- [ ] RED - Remove fake-looking marketplace density
- [ ] YELLOW - Add clear payment expectations
- [ ] YELLOW - Add privacy statement for intake submissions
- [ ] YELLOW - Add fallback contact path if matching fails

Notes:
- Trust mismatch is a bigger launch risk than code quality.

## 8. Technical QA
- [x] GREEN - Production build passes (`npm run build`)
- [x] GREEN - Core routes exist:
  - `/`
  - `/match`
  - `/synagents`
  - `/synagents/[slug]`
  - `/api/match`
  - `/api/match/dispatch`
- [ ] YELLOW - Check 404 and broken-state UX manually
- [ ] YELLOW - Check metadata and social preview behavior manually
- [ ] YELLOW - Check mobile Safari and Telegram in-app browser manually
- [ ] YELLOW - Test successful request submission end to end in production-like mode

Build result:
- `next build` passed successfully on 2026-04-25 UTC.

## 9. Launch ops
- [ ] YELLOW - Pick launch date
- [ ] YELLOW - Pick launch owner for inbound request handling
- [ ] YELLOW - Set response SLA
- [ ] YELLOW - Prepare launch post/thread
- [ ] YELLOW - Prepare first outreach list
- [ ] YELLOW - Decide manual concierge flow for first users
- [ ] YELLOW - Queue x402 payment support as the first post-soft-launch payments milestone

Notes:
- Recommendation: do not block soft launch on x402, but treat it as the first serious payments upgrade right after launch.
- Priority scope: intake deposits or service checkout in USDC first, then optional CRED-denominated paths once the operator flow is stable.

## 10. Success metrics
- [ ] YELLOW - Define first-2-week success criteria
- [ ] YELLOW - Track submissions
- [ ] YELLOW - Track qualified requests
- [ ] YELLOW - Track matches made
- [ ] YELLOW - Track replies sent
- [ ] YELLOW - Track paid engagements
- [ ] YELLOW - Track intake drop-off

## Current overall launch call
- RED - Not ready for public launch yet
- YELLOW - Can become curated beta ready quickly if the trust layer is cleaned up

## Fastest path to launch
1. Remove synthetic directory filler and keep only real launchable providers
2. Choose one lead offer and simplify homepage around it
3. Configure review + notification flow with real secrets and real operators
4. Add spam protection and a privacy note to intake
5. Launch as curated beta with concierge handling
