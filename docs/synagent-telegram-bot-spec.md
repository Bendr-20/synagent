# Synagent Telegram Bot Spec

Last updated: 2026-05-23 UTC
Status: v0 product and technical spec

## Summary

Build a new Synagent Telegram bot as a concierge layer for reviewed intake, match routing, Cred Bureau review, and internal team ops.

Do not reuse the Helixa bot wholesale. Reuse only the proven Telegram plumbing patterns: command registration, polling, health checks, rate limiting, simple state machines, and optional LLM fallback. Synagent-specific behavior should live in a new service and call Synagent's existing APIs instead of duplicating website business logic.

## Product goal

The bot should make Synagent feel like a responsive concierge, not a public marketplace bot.

Primary jobs:

1. Capture requests from Telegram users and submit them into Synagent's existing match pipeline.
2. Notify reviewers when new match requests or Cred Bureau applications need attention.
3. Let authorized reviewers inspect and update queues from Telegram without exposing review keys in group chat.
4. Answer lightweight questions about Synagent, reviewed access, Cred Bureau, and how to start a request.
5. Keep all approvals, invitations, and dispatch decisions under human control during reviewed access.

## Non-goals for v1

- No auto-approval for Cred Bureau applications.
- No automatic group invites.
- No payment, escrow, or x402 checkout flow.
- No provider marketplace claims beyond current reviewed intake positioning.
- No direct writes to Synagent JSON data files from the bot.
- No Helixa-branded report cards, mint flows, $CRED balance commands, or agent-only cred gates.

## Recommended approach

### Option A - Fork Helixa bot and strip it down

Fastest path, but carries brand and logic baggage. Risk of leaving Helixa-specific commands, $CRED assumptions, and API coupling in a Synagent product.

Use only if the goal is a same-day throwaway demo.

### Option B - New bot service with copied plumbing patterns

Recommended.

Create `synagent-bot/` as a separate Node service. Copy or reimplement the small useful patterns from `helixa-bot`: Telegram polling, health endpoint, command routing, user state map, rate limiting, and deployment shape. All product logic calls Synagent HTTP APIs.

Best balance of speed and cleanliness.

### Option C - Embed Telegram handling inside the Next app

One repo and one deploy, but worse operational isolation. Telegram polling or webhooks can interfere with Next runtime constraints, and bot secrets become more entangled with app secrets.

Better later if Synagent moves to a full server/API deployment model.

## MVP scope

### Public commands

`/start`
- Explains what Synagent does in one short message.
- Primary CTA: start a request with `/request`.
- Secondary CTAs: open `/match`, view `/synagents`, open `/cred-bureau`.

`/request`
- Starts a guided intake wizard.
- If started in a group, redirects the user to DM before collecting any fields.
- Collects the minimum data needed for `MatchRequestPayload` in DM only:
  - requester name or handle
  - desired outcome
  - category
  - budget range
  - urgency
  - delivery type
  - communication preference
  - contact email or Telegram
  - optional brief
- Submits to `POST /api/match`.
- Returns request ID, public status, and next-action copy.
- If the result is `needs-review`, say a human will review it.
- If the result has a recommended match, present it as a recommendation, not a guaranteed booking.

`/providers`
- Links to `https://synagent.helixa.xyz/synagents`.
- Optional: show 3 public provider summaries from current Synagent data.

`/cred-bureau`
- Links to `https://synagent.helixa.xyz/cred-bureau`.
- Explains that Cred Bureau access requires a Helixa human profile and manual review.

`/help`
- Lists only active commands.
- Keeps copy short and non-marketplace-y.

Mention handler
- If mentioned in a group, answer only if directly asked or if the text clearly asks about Synagent.
- Status questions in groups must never reveal request, application, contact, reviewer, or queue details. Redirect the requester or reviewer to DM.
- Default to concise concierge behavior.
- Do not respond to casual chatter.

### Reviewer commands

Reviewer commands require authorization. The first version should use an allowlist of Telegram user IDs plus server-side `SYNAGENT_REVIEW_API_KEY` for API calls. Authorized reviewer roster should match current Synagent review security docs: Jim, Quigley, and Epifani.

Reviewer detail and mutation commands are DM-only in v1. If a reviewer runs them in a group, the bot should reply with a brief acknowledgement and instruct the reviewer to DM the bot. Group replies must not include private queue, request, applicant, contact, reviewer-note, or dispatch details.

`/queue`
- DM-only for authorized reviewers.
- Shows a compact summary:
  - open match requests
  - queued notifications
  - pending Cred Bureau applications
- Calls protected APIs:
  - `GET /api/match/requests`
  - `GET /api/match/notifications`
  - `GET /api/cred-bureau/applications`

`/request_status <request_id>`
- DM-only for authorized reviewers.
- Shows match request detail, top recommended provider, confidence, fallback reason, queued notifications, and next action.

`/dispatch <request_id>`
- DM-only for authorized reviewers.
- Calls `POST /api/match/dispatch`.
- Only works if notification mode and secrets allow dispatch.
- If mode is queue-only, return a clear message instead of trying to send.

`/applications`
- DM-only for authorized reviewers.
- Lists pending Cred Bureau applications.
- Shows applicant name, Telegram, Helixa profile ref, status, and whether review box is closed.

`/application <id>`
- DM-only for authorized reviewers.
- Shows full application review summary.
- Includes Helixa profile URL and review addendum.

`/approve_app <id> [notes]`
- DM-only for authorized reviewers.
- Calls `PATCH /api/cred-bureau/applications` with status `approved`.
- Must state that manual group add is still required.
- Does not send an invite.

`/reject_app <id> [notes]`
- DM-only for authorized reviewers.
- Calls `PATCH /api/cred-bureau/applications` with status `rejected`.
- Does not message the applicant automatically in v1.

`/close_app <id>`
- DM-only for authorized reviewers.
- Calls `PATCH /api/cred-bureau/applications` with `closeReviewBox: true`.

## Core flows

### Flow 1 - Public match intake from Telegram

1. User sends `/request`.
2. If the command came from a group, bot redirects the user to DM and stops.
3. Bot starts a step-by-step intake in DM.
4. Bot validates required fields before submit.
5. Bot submits normalized payload to `POST /api/match`.
6. Synagent app stores the request and queues notifications.
7. Bot replies with:
   - request ID
   - review status
   - top recommendation if available
   - next-action timing
8. Bot does not send proactive reviewer alerts in Phase 1 or Phase 2. Internal alerts are Phase 3 only, after explicit enablement and smoke testing.

### Flow 2 - Reviewer checks queue

1. Reviewer sends `/queue`.
2. Bot verifies Telegram user ID is authorized.
3. Bot calls protected Synagent APIs using `SYNAGENT_REVIEW_API_KEY` from environment.
4. Bot returns a compact action list.
5. Reviewer follows up with specific commands like `/application <id>` or `/request_status <id>`.

### Flow 3 - Cred Bureau review action

1. Reviewer sends `/application <id>`.
2. Bot returns applicant summary and profile link.
3. Reviewer sends `/approve_app <id> notes` or `/reject_app <id> notes`.
4. Bot updates Synagent via protected PATCH endpoint.
5. Bot reminds reviewer that approved applicants require manual group add.
6. Reviewer can close the review box with `/close_app <id>` after manual work is complete.

### Flow 4 - Mention-based concierge

1. User mentions the bot in the group.
2. Bot classifies intent:
   - start request
   - ask about Cred Bureau
   - ask about providers
   - ask about status
   - general Synagent question
3. Bot answers briefly or points to the right command/link.
4. If ambiguous, bot asks one short clarifying question.

## Architecture

### Service layout

Create a new service directory:

```text
synagent-bot/
  package.json
  index.js
  config.js
  telegram.js
  synagent-api.js
  commands/
    public.js
    reviewer.js
    intake.js
  flows/
    request-flow.js
  auth.js
  formatters.js
  store.js
  llm.js
  ecosystem.config.js
  README.md
```

### Responsibilities

`index.js`
- Boot Telegram bot.
- Register commands.
- Start Express health endpoint.
- Own global error logging.

`config.js`
- Load environment variables.
- Validate required secrets.
- Centralize Synagent base URL and review API key.

`telegram.js`
- Thin wrapper around `node-telegram-bot-api`.
- Common helpers for safe sends, edit attempts, callbacks, and parse mode.

`synagent-api.js`
- Calls Synagent endpoints.
- Never imports Next internals.
- Handles auth headers for protected reviewer endpoints.

`commands/public.js`
- `/start`, `/help`, `/providers`, `/cred-bureau`.

`commands/intake.js`
- `/request` wizard.
- In-memory state for v1.
- Timeout stale sessions after 30 minutes.

`commands/reviewer.js`
- Queue, application, approval, rejection, dispatch commands.

`auth.js`
- Telegram user ID allowlist.
- Optional internal review chat ID allowlist.
- No review key exposure in messages.

`formatters.js`
- Converts match requests, notifications, and applications into short Telegram-safe messages.

`store.js`
- V1 in-memory state only for active intake sessions.
- No durable source of truth. Synagent app remains source of truth.

`llm.js`
- Optional.
- Only for FAQ and light concierge responses.
- System prompt must be Synagent-specific.
- No secrets or review key in context.
- Never send intake payloads, applicant data, private notes, emails, contact fields, protected queue details, or reviewer-only context to the LLM or conversation history.

## API contracts

### Cred Bureau status updates

Reviewer mutation commands must call `PATCH /api/cred-bureau/applications` with one of these bodies:

```json
{ "id": "cba_...", "status": "approved", "reviewerNotes": "Approved by <reviewer label>: ..." }
```

```json
{ "id": "cba_...", "status": "rejected", "reviewerNotes": "Rejected by <reviewer label>: ..." }
```

```json
{ "id": "cba_...", "closeReviewBox": true }
```

The Synagent API remains responsible for writing the review log entry. The bot must include a reviewer label in notes for human auditability, but it must not expose reviewer notes outside authorized DMs. Closing a review box means the manual review/admin work is complete; it does not change application status by itself.

### Match request ownership

Cred Bureau review ownership is already locked. Broader Synagent match-request ownership is not locked yet. Until the team assigns it, match requests should be treated as shared manual review owned by the internal ops chat, with no promised SLA beyond the public `nextActionAt` returned by the API.

## Integrations

### Synagent API

Required:

- `POST /api/match`
- `GET /api/match/requests`
- `GET /api/match/notifications`
- `POST /api/match/dispatch`
- `GET /api/cred-bureau/applications`
- `PATCH /api/cred-bureau/applications`

Potential additions after MVP:

- `GET /api/health` for app health.
- `GET /api/synagents` for provider summaries instead of importing static data.
- `PATCH /api/match/requests` if the team wants reviewer status updates beyond dispatch.

### Telegram

MVP should use polling because it matches Helixa bot and is fastest to ship.

Webhook mode can come later if we want lower latency or tighter production infrastructure.

### Notifications

The bot should not automatically flip Synagent from queue-only to live notification mode.

Current safe rule:

- Queue-only remains default.
- Proactive reviewer alerts are Phase 3 only.
- Telegram delivery can be enabled only after `SYNAGENT_TELEGRAM_BOT_TOKEN`, review mode, and a smoke test are configured.
- Bot commands can inspect queue-only state and tell reviewers what is pending.

## Environment variables

```text
SYNAGENT_BOT_TOKEN=
SYNAGENT_BOT_PORT=3857
SYNAGENT_BASE_URL=https://synagent.helixa.xyz
SYNAGENT_REVIEW_API_KEY=
SYNAGENT_REVIEWER_IDS=<jim_id>,<quigley_id>,<epifani_id>
SYNAGENT_INTERNAL_CHAT_ID=
SYNAGENT_NOTIFICATION_MODE=queue-only
SYNAGENT_LLM_API_KEY=
SYNAGENT_LLM_MODEL=
```

Notes:

- `SYNAGENT_REVIEWER_IDS` should mirror the current authorized roster.
- `SYNAGENT_INTERNAL_CHAT_ID` should be optional until we choose an ops chat.
- Do not post any secret or review key in Telegram.

## Security and safety rules

- Reviewer commands are deny-by-default.
- Review API key lives only in environment variables.
- Bot never logs request bodies that may contain private contact details.
- Bot never sends review keys, applicant emails, or private notes into public group chats.
- In group chats, reviewer detail and mutation commands must refuse and ask reviewer to DM the bot.
- Approval commands never auto-invite users.
- Dispatch commands never run unless Synagent notification mode allows it.
- Bot should include rate limiting per Telegram user and per chat.
- Intake sessions expire after 30 minutes.
- Escape and truncate all user-provided fields before inserting them into Telegram Markdown/HTML.
- Enforce message-size limits so long briefs cannot break delivery or hide important footer warnings.

## Data handling

Source of truth:

- Match requests: Synagent app via `data/match-requests.json` behind API.
- Match notifications: Synagent app via `data/match-notifications.json` behind API.
- Cred Bureau applications: Synagent app via `data/cred-bureau-applications.json` behind API.

Bot-local state:

- Active intake wizard state.
- Last message IDs for optional edits.
- Optional recent conversation history for LLM mode.

Bot-local state can be in memory for v1. If the bot becomes important for production intake volume, move active flows to a small JSON file or SQLite.

## Copy and tone

The bot should sound like Synagent:

- Useful, direct, concierge-first.
- No marketplace hype.
- No promise of instant hiring.
- No promise of payment rails until built.
- Clear that reviewed access and manual routing are intentional quality controls.

Example `/start` copy:

```text
Synagent routes serious AI build requests to reviewed humans and agents.

Start a request with /request.
View providers: https://synagent.helixa.xyz/synagents
Cred Bureau: https://synagent.helixa.xyz/cred-bureau
```

Example match confirmation:

```text
Request received: synreq_123

Status: needs review
Next: the Synagent team will review the brief and route it manually if no strong provider match is available.
```

## Testing plan

Unit tests:

- Intake payload normalization.
- Reviewer authorization.
- Command parsing.
- Formatters for requests, notifications, and applications.
- Synagent API client error handling.

Integration smoke tests:

- `/start` responds.
- `/request` creates a real request in preview or local app.
- `/queue` refuses unauthorized users.
- `/queue` works for an authorized test reviewer.
- `/application <id>` loads protected application data.
- `/approve_app` updates status and creates a review log entry.
- `/dispatch` refuses in queue-only mode.

Manual Telegram tests:

- Private DM intake flow.
- Group mention behavior.
- Telegram in-app browser links.
- Reviewer commands work in DM and refuse with a DM redirect in groups.

## Rollout plan

### Phase 0 - Spec approval

- Team reviews this spec.
- Decide bot username.
- Confirm reviewer commands are DM-only.
- Decide internal ops chat ID.

### Phase 1 - MVP bot

- Build `synagent-bot` as separate Node service.
- Implement `/start`, `/help`, `/request`, `/providers`, `/cred-bureau`.
- Implement health endpoint and PM2 config.
- Submit requests to Synagent API.
- No reviewer mutation commands yet.

### Phase 2 - Reviewer ops

- Add reviewer auth.
- Add `/queue`, `/request_status`, `/applications`, `/application`.
- Add approval, rejection, close commands for Cred Bureau.
- Keep sensitive details DM-only.

### Phase 3 - Notification bridge

- Add optional internal ops alerts for new requests and applications.
- Keep Synagent notification mode queue-only unless explicitly changed and smoke-tested.

### Phase 4 - Polish

- Add LLM FAQ fallback.
- Add richer provider summaries.
- Add persistent active-flow store if needed.
- Consider webhooks if polling becomes operationally annoying.

## Open decisions

1. Bot identity: should it be `SynagentBot`, `SynagentHQBot`, or something more character-driven?
2. Internal alerts: send to Fool Spectrum, a private ops chat, or no proactive alerts yet?
3. Match request ops: who owns broader Synagent request review and what SLA should public copy imply?
4. Intake depth: ultra-short lead capture first, or full `/match` wizard inside Telegram?
5. LLM fallback: ship in v1, or keep deterministic commands only until core ops are stable?

## Recommendation

Ship Phase 1 and Phase 2 as the first real version.

Keep the bot deterministic at first. Add LLM fallback only after the request and review workflows are stable. The bot's value is not being chatty. Its value is making Synagent intake and review feel fast, controlled, and human-backed.
