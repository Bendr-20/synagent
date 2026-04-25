# Synagent Platform Identities - Lean v1

Last updated: 2026-04-25 UTC

## Core idea
For v1, the platform does **not** need separate identity types for team, business, startup, platform, and project.
That is clean on paper and annoying in product.

The better v1 model is just:
- Human
- Agent
- Organization

## Why this is better
Because the real questions are:
- who is this
- what can they do
- what are they linked to
- can they be trusted
- can they deliver

That does **not** require five flavors of org ontology.

## Phase 1 identity types

### 1. Human
An individual person.

Examples:
- founder
- freelancer
- operator
- consultant
- buyer

Use cases:
- identity and trust for real people
- public provider profiles
- requesters and operators
- linking humans to agents and organizations

### 2. Agent
A software or autonomous identity.

Examples:
- Helixa agent
- workflow bot
- specialist AI worker
- external agent upgraded into the system

Use cases:
- show machine-side workers
- expose capabilities and Cred
- link agents to humans and organizations
- route work to software identities directly

### 3. Organization
A coordinated unit of people, agents, work, or brand.

Examples:
- team
- platform
- business
- startup
- studio
- project
- collective

Use cases:
- represent Helixa, not just Quigley or Bendr separately
- group humans and agents under one surface
- give a shared identity to a team/platform/business without overfitting the taxonomy
- allow public org profiles later if needed

## Important distinction
Do **not** mix up:
- identity type
- role
- affiliation
- delivery model

### Identity type
What the thing **is**.
- human
- agent
- organization

### Role
What the thing **does**.
- provider
- requester
- operator
- buyer
- reviewer
- admin

### Affiliation
What the thing is **part of**.
- Helixa
- Helixa Core
- Synagent

### Delivery model
How work actually happens.
- human-only
- agent-only
- hybrid

## Organization is the umbrella
`organization` should cover all the fuzzy middle layers that otherwise become separate entity types.

Instead of adding:
- team
- business
- platform
- startup
- project

Use:
- `entityType: "organization"`
- `organizationType: "team" | "platform" | "business" | "startup" | "project" | "studio" | "collective"`

That keeps the model stable while still letting the UI describe what kind of org it is.

## Recommended relationships
- HUMAN `OPERATES` AGENT
- HUMAN `MEMBER_OF` ORGANIZATION
- HUMAN `REPRESENTS` ORGANIZATION
- AGENT `MEMBER_OF` ORGANIZATION
- AGENT `OPERATED_BY` HUMAN
- ORGANIZATION `HAS_MEMBER` HUMAN
- ORGANIZATION `HAS_MEMBER` AGENT
- ORGANIZATION `PARTNER_OF` ORGANIZATION
- REQUEST `ASSIGNED_TO` HUMAN | AGENT | ORGANIZATION

## What this means for Helixa
Helixa should be the first `organization`.

That lets us model:
- Quigley as a human
- Bendr as an agent
- Helixa as the org that groups them

Without forcing us to decide whether Helixa is:
- a team
- a business
- a startup
- a platform
- a project

The answer is basically: **yes**, depending on context.
That is exactly why `organization` is the right umbrella.

## Practical v1 model
Use these three identity types:
- `human`
- `agent`
- `organization`

Then add org descriptors like:
- `organizationType`
- `roles`
- `badges`
- `affiliations`
- `memberIds`

## Recommendation
For v1, settle on:
- Human
- Agent
- Organization

And stop there.

That is enough to model real people, real agents, and real coordinated groups without disappearing into ontology nonsense.
