# Synagent MVP Curated Beta Runbook

Last updated: 2026-05-13 UTC

## Launch mode

Synagent launches as a curated beta, not an open marketplace.

The MVP promise is reviewed intake and concierge routing: a requester submits an MVP/build request, Synagent stores the intake, a human reviews fit, and only credible matches move toward an operator intro. If no match is strong enough, the request stays in manual review.

## Lead offer

Primary offer: Create an MVP.

Support lanes:
- Human operator support
- AI implementation guidance
- Automation, design, growth, and research only when a real provider fit exists

Do not position Synagent as an open marketplace, instant matching engine, escrow product, or guaranteed delivery network yet.

## Current launch providers and profile status

Public provider list:
- Degeneer, remote, USDC/CRED accepted, profile pending in Helixa

Current supply is intentionally thin. If public providers remain below 3 real operators, launch copy should frame this as reviewed concierge beta handling, not marketplace density.

## Owner and SLA fields

Cred Bureau closed beta:

- Review owner: Quigley
- Backup reviewer: Jim
- Response SLA: same business day; late-day submissions roll to next morning
- Manual group adds: Jim
- Applicant approval mode: manual only during closed beta; automation can be considered later
- Applicant rules: `docs/cred-bureau-applicant-rules.md`
- Escalation path: flag in Fool Spectrum without posting the review key
- Provider availability check cadence: TBD

Before broad public launch, confirm whether the same owner/SLA model also applies to general MVP/build requests.

## Required ops secrets

Set these in the deployment environment, never in git:

```bash
SYNAGENT_NOTIFICATION_MODE=review
SYNAGENT_REVIEW_API_KEY=<strong shared review key; private to Jim, Quigley, Epifani during closed beta>
SYNAGENT_AGENTMAIL_API_KEY=<agentmail api key, if email dispatch is enabled>
SYNAGENT_AGENTMAIL_INBOX_ID=<agentmail inbox id, if email dispatch is enabled>
SYNAGENT_AGENTMAIL_BASE_URL=https://api.agentmail.to
SYNAGENT_TELEGRAM_BOT_TOKEN=<telegram bot token, if telegram dispatch is enabled>
SYNAGENT_TELEGRAM_BASE_URL=https://api.telegram.org
```

Review queue security is documented in `docs/review-queue-security.md`. Do not paste the key in group chat; rotate it before wider beta if distribution is uncertain.

Recommended MVP mode:
- `queue-only` until the reviewer has checked request quality manually
- `review` once AgentMail or Telegram secrets are configured and tested
- `live` only after the team is comfortable with automatic dispatch behavior

## Provider onboarding checklist

Before adding a provider publicly:

1. Confirm the provider is real and has consented to receive requests.
2. Confirm service categories, capacity, payment rails, timezone, and contact channel.
3. Confirm whether the provider should receive email, Telegram, or both.
4. Add or link the Helixa profile where available.
5. Mark profile status honestly, for example `profile-pending` if not complete.
6. Add the provider to `src/app/synagents/data.ts`.
7. Add any explicit provider-resolution mapping only if verified.
8. Run a local `/api/match` request that should match this provider.
9. Verify no unrelated request routes to this provider automatically.
10. Commit the provider profile update.

## Request review steps

1. Open the review queue:

```bash
curl -H "Authorization: Bearer $SYNAGENT_REVIEW_API_KEY" \
  "https://<deployment-host>/api/match/requests?limit=20"
```

2. Inspect the latest request:
- title and brief
- contact method
- category and category source
- urgency and budget range
- `status`
- `review.needsManualReview`
- `matchedAgents`

3. If `status` is `matched`, verify the match still makes human sense before dispatch.
4. If `status` is `needs-review`, route manually or reply with a polite fallback.
5. Do not dispatch if contact information looks spammy, the category is outside current supply, or the request asks for something Synagent should not handle.

## Dispatch steps

Check queued notifications:

```bash
curl -H "Authorization: Bearer $SYNAGENT_REVIEW_API_KEY" \
  "https://<deployment-host>/api/match/notifications?limit=20"
```

Dispatch a reviewed request:

```bash
curl -X POST "https://<deployment-host>/api/match/dispatch" \
  -H "Authorization: Bearer $SYNAGENT_REVIEW_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"requestId":"req_...","reviewedBy":"<reviewer>"}'
```

Expected behavior:
- `queue-only`: dispatch is blocked because providers are not configured
- `review`: reviewer can send queued notifications after checking fit
- `live`: notifications can be sent through configured channels

## Fallback path when no match is strong

If no curated beta provider meets the threshold:

1. Keep the request in manual review.
2. Do not introduce the requester to a random provider.
3. Reply manually if the request is viable but supply is thin.
4. If the request is outside scope, decline clearly and offer to revisit when the provider network expands.
5. Use the fallback reason in `review.fallbackReason` as the internal explanation.

Suggested requester copy:

> We received your request. It does not have a strong curated-provider match yet, so a reviewer is checking it manually instead of routing it to the wrong operator. No automatic match, payment, or delivery promise has been created.

## Anti-spam posture

Current protection:
- `/api/match` uses a local in-memory rate limit of 5 requests per 10 minutes per normalized client key.
- This is acceptable for a soft launch behind limited distribution.

Before public launch, upgrade to one or more of:
- shared edge/database-backed rate limiting
- bot challenge or turnstile
- disposable email checks
- request size and repeated-content scoring
- moderation queue filters

## What not to promise publicly

Do not promise:
- a large marketplace
- instant automatic matching for every request
- guaranteed delivery timelines before reviewer/provider confirmation
- payments, payment handling, or escrow through Synagent until checkout exists
- x402 checkout in the launch MVP
- verified Helixa profiles for providers whose profiles are still pending
- public exposure of requester contact details
- automatic dispatch for requests outside the curated supply

## MVP-ready definition

For soft launch, MVP-ready means:
- homepage and mobile intake are usable
- only real providers are public
- weird requests fall back to review
- spam has basic rate limiting
- review APIs are protected by a review key
- ops secrets are set in deployment
- a human owner and SLA are named
- applicant rules are locked and manual-only for closed beta
- launch copy frames Synagent as reviewed intake, manual routing, and curated beta access
- at least one end-to-end request has been tested in the deployed environment
