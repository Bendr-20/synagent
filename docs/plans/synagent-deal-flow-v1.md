# Synagent Deal Flow V1

## Why this exists

Right now Synagent is good at discovery and weak at routing actual work.

The current prototype does three things well:
- presents a clear front door
- shows dossiers with trust signals
- routes interest into `/match`

What it does not do yet:
- capture enough structured intent from buyers
- capture enough operational detail from providers
- track a deal after the first match
- learn from outcomes

The fix is simple.

Synagent needs three structured layers:
1. request intake
2. provider profile data
3. deal pipeline records

## Product principle

The public experience should stay simple and boutique.

Users should feel like they are asking for help, not filling out a marketplace compliance form.

So the UI should feel light, while the backend captures structured fields that improve matching, response quality, and close rate.

## Core outcome

What we want Synagent to understand:
- what the buyer needs
- who is actually a fit
- who is available now
- how to contact both sides
- what happened after the intro

That gives us:
- better matching
- fewer dead-end intros
- faster time to first response
- better pricing clarity
- better trust data over time

## 1. Request Intake Schema

This is the buyer-side payload created from `/match`.

### Required fields

- `title`
- `description`
- `category`
- `budgetRange`
- `urgency`
- `desiredOutcome`
- `communicationPreference`
- `timezone`
- `confidentiality`
- `paymentPreference`
- `contact.email` or `contact.telegram` or both

### Recommended fields

- `projectStage`
- `scopeSize`
- `deliveryType`
- `preferredOverlapHours`
- `decisionMakerStatus`
- `deadlineAt`
- `attachments`
- `successCriteria[]`
- `constraints[]`
- `tools[]`
- `industry`
- `geoPreference`
- `language`

### Suggested enums

#### `category`
- `mvp-build`
- `operator-support`
- `ai-consulting`
- `automation`
- `design`
- `growth`
- `research`
- `other`

#### `budgetRange`
- `under-1k`
- `1k-3k`
- `3k-10k`
- `10k-25k`
- `25k-plus`
- `unknown`

#### `urgency`
- `asap`
- `this-week`
- `this-month`
- `flexible`

#### `deliveryType`
- `human-only`
- `agent-only`
- `hybrid`
- `unsure`

#### `projectStage`
- `idea`
- `planning`
- `building`
- `stuck`
- `live-optimizing`

#### `communicationPreference`
- `email`
- `telegram`
- `either`
- `scheduled-call`

#### `confidentiality`
- `public`
- `private`
- `nda-required`

#### `paymentPreference`
- `usd`
- `usdc`
- `cred`
- `open`

### Example request object

```json
{
  "title": "Need an MVP for an AI intake and routing tool",
  "description": "Need a lightweight web MVP with intake, matching, and admin review.",
  "category": "mvp-build",
  "budgetRange": "3k-10k",
  "urgency": "this-month",
  "desiredOutcome": "Working MVP with clean handoff in 10 days",
  "projectStage": "planning",
  "scopeSize": "medium",
  "deliveryType": "hybrid",
  "communicationPreference": "telegram",
  "timezone": "UTC-6",
  "preferredOverlapHours": 3,
  "confidentiality": "private",
  "paymentPreference": "usdc",
  "decisionMakerStatus": "decision-maker",
  "deadlineAt": "2026-04-30T00:00:00.000Z",
  "successCriteria": [
    "working intake form",
    "routing logic",
    "simple admin dashboard"
  ],
  "constraints": [
    "no enterprise stack",
    "needs quick deployment"
  ],
  "contact": {
    "email": "founder@example.com",
    "telegram": "@founderhandle"
  }
}
```

## 2. Provider Profile Schema

This is the operational layer behind a Synagent dossier.

Current dossiers are mostly presentation. They need structured supply-side data to make matching real.

### Required fields

- `displayName`
- `headline`
- `services[]`
- `idealProjects[]`
- `pricingModel`
- `minEngagement`
- `typicalTurnaround`
- `capacityStatus`
- `responseSla`
- `timezone`
- `channels.email` or `channels.telegram` or both
- `paymentPreferences[]`

### Recommended fields

- `location`
- `languages[]`
- `availabilityWindow`
- `maxConcurrentProjects`
- `portfolio[]`
- `caseStudies[]`
- `tools[]`
- `industries[]`
- `deliveryModes[]`
- `teamSupport`
- `linkedAgents[]`
- `verificationSignals`
- `credProfile`
- `notAvailableUntil`

### Suggested enums

#### `pricingModel`
- `hourly`
- `fixed`
- `retainer`
- `milestone`
- `custom`

#### `capacityStatus`
- `available-now`
- `available-soon`
- `limited`
- `waitlist`
- `unavailable`

#### `responseSla`
- `under-1h`
- `same-day`
- `24h`
- `48h`

#### `deliveryModes`
- `async`
- `live-collab`
- `done-for-you`
- `advisory`
- `hybrid`

### Example provider object

```json
{
  "displayName": "Synagent Atlas",
  "headline": "MVP builder for fast AI product launches",
  "services": [
    "mvp-build",
    "workflow-design",
    "prompt-systems"
  ],
  "idealProjects": [
    "0 to 1 prototypes",
    "intake systems",
    "internal AI tools"
  ],
  "pricingModel": "fixed",
  "minEngagement": 2500,
  "typicalTurnaround": "7-10 days",
  "capacityStatus": "available-now",
  "responseSla": "same-day",
  "timezone": "UTC-6",
  "languages": ["en"],
  "channels": {
    "email": "atlas@synagent.ai",
    "telegram": "@synagentatlas"
  },
  "paymentPreferences": ["usdc", "cred"],
  "deliveryModes": ["done-for-you", "hybrid"],
  "teamSupport": {
    "hasHumanSupport": true,
    "hasAgentSupport": true
  },
  "linkedAgents": ["81", "104"],
  "portfolio": [
    {
      "title": "AI Intake Funnel",
      "summary": "Built and deployed a lightweight lead qualification flow in 6 days.",
      "outcome": "Reduced manual back and forth by 60%"
    }
  ]
}
```

## 3. Deal Pipeline Schema

This is the missing operating system.

Every request should become a trackable deal record, even if it starts as a lightweight intake.

### Core fields

- `requestId`
- `matchedProfileIds[]`
- `status`
- `internalOwner`
- `leadScore`
- `matchReason[]`
- `nextActionAt`
- `contactLog[]`
- `notes[]`
- `budgetActual`
- `selectedProfileId`
- `outcome`
- `rating`
- `closedAt`

### Suggested statuses

- `new`
- `qualified`
- `matching`
- `matched`
- `contacted`
- `responded`
- `intro-booked`
- `proposal-sent`
- `won`
- `lost`
- `completed`
- `archived`

### Suggested outcome reasons

#### Won / completed
- `completed-successfully`
- `repeat-client`
- `expanded-scope`

#### Lost / stalled
- `no-response`
- `budget-mismatch`
- `timing-mismatch`
- `bad-fit`
- `scope-unclear`
- `trust-gap`
- `chose-other-provider`

### Example deal object

```json
{
  "requestId": "req_2026_0414_001",
  "matchedProfileIds": ["synagent-atlas", "builder-core"],
  "status": "matched",
  "internalOwner": "bendr",
  "leadScore": 82,
  "matchReason": [
    "fits MVP build category",
    "available now",
    "accepts USDC",
    "timezone overlap"
  ],
  "nextActionAt": "2026-04-14T18:00:00.000Z",
  "contactLog": [
    {
      "at": "2026-04-14T04:20:00.000Z",
      "channel": "telegram",
      "direction": "outbound",
      "summary": "Initial match alert sent to provider"
    }
  ],
  "notes": [
    {
      "at": "2026-04-14T04:21:00.000Z",
      "author": "bendr",
      "text": "Buyer seems serious and has clear budget range."
    }
  ],
  "selectedProfileId": null,
  "outcome": null,
  "rating": null,
  "closedAt": null
}
```

## 4. What helps both sides most

### For buyers
Capture:
- budget reality
- urgency
- decision-maker status
- desired outcome
- communication preference
- confidentiality
- success criteria

Why it matters:
- reduces bad matches
- makes pricing conversations faster
- helps them get real responses, not generic outreach

### For providers
Capture:
- actual services
- turnaround
- capacity
- pricing model
- minimum engagement
- response SLA
- preferred channels
- ideal project types

Why it matters:
- fewer dead leads
- less scope confusion
- better routing quality
- more conversions from matching

### For Synagent itself
Track:
- which requests convert
- which profiles respond fastest
- which provider categories close best
- where deals die
- what budget ranges actually clear

Why it matters:
- this is how trust becomes operational instead of decorative

## 5. Matching Logic V1

No heavy AI magic required at first.

Start with rule-based matching plus human review.

### Match inputs
- category fit
- budget fit
- urgency fit
- timezone overlap
- payment rail compatibility
- capacity status
- communication compatibility
- credibility score
- ideal project alignment

### V1 scoring suggestion
- category fit: 25%
- availability/capacity: 20%
- credibility/trust: 15%
- budget fit: 15%
- delivery type fit: 10%
- timezone overlap: 10%
- communication/payment compatibility: 5%

Then let an internal operator approve the top 1-3 matches before outreach.

## 6. Contact and notification logic

### Buyer side
Collect at least one reachable channel:
- email
- Telegram

### Provider side
Collect at least one reachable channel:
- email
- Telegram

### Recommended behavior
- email is default durable channel
- Telegram is fast-path channel
- if both exist, store both
- every profile/request should also store `preferredChannel`

## 7. Privacy model

Public dossiers should not expose raw contact data until the platform wants them exposed.

### Public
- trust signals
- service focus
- availability status
- masked contact presence

### Private / internal
- raw email
- raw Telegram handle
- pricing notes
- internal routing notes
- lead quality notes

This keeps the front-end elegant while making the backend useful.

## 8. MVP implementation order

### Phase 1
- expand `/match` to capture structured request data
- expand provider data model behind dossiers
- add contact fields and notification preferences
- create internal deal record on every submission

### Phase 2
- add rule-based match scoring
- add internal review queue
- notify matched providers
- track response timestamps

### Phase 3
- add outcome tracking
- add ratings and repeat-work signals
- feed outcomes back into Cred / trust graph layers

## 9. Sharp summary for review

Synagent does not just need prettier profiles.

It needs:
- structured buyer intent
- structured provider availability
- structured deal tracking

That is the layer that turns a cool front door into an actual work-routing system.

## 10. Questions for Rendr review

1. Does the public intake feel too heavy, or is this the right level?
2. Which fields should stay internal vs visible on a dossier?
3. Should pricing be public, semi-public, or request-only?
4. Should availability be binary or more expressive?
5. Should we present Synagents as individuals, teams, or both from day one?
6. Does the boutique front door still feel clean with this backend structure behind it?
