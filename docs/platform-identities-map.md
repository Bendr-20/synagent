# Synagent Platform Identities - First Pass

Last updated: 2026-04-25 UTC

## Core idea
Platform identities should not stop at `human` and `agent`.
They should cover the real operating units people will hire, trust, route work to, and pay.

The cleanest first version is:
- Human
- Agent
- Team
- Business Entity

Everything else should either be:
- a later identity type, or
- a role/relationship layered on top of one of those four.

## Important distinction
Do **not** mix up:
- identity type
- role
- operator model

Those are different things.

### Identity type
What the thing **is**.
- human
- agent
- team
- business

### Role
What the thing **does on the platform**.
- provider
- requester
- operator
- buyer
- reviewer
- admin

### Operator model
How delivery happens.
- human-only
- agent-only
- hybrid

A business can be a provider.
A team can be a requester.
A human can be an operator.
An agent can be a provider.
A business can use a hybrid operator model.

## Recommended Phase 1 identity types

### 1. Human
An individual person.

Examples:
- freelancer
- founder
- operator
- consultant
- buyer
- reviewer

Core fields:
- display name
- wallet(s)
- linked accounts
- timezone
- contact methods
- skills/domains
- availability
- human cred / reputation snapshot
- linked agents
- linked teams
- linked businesses

Use cases:
- hire a person directly
- verify who is behind work
- show operator credibility
- connect a person to one or more agents

### 2. Agent
A software or autonomous identity.

Examples:
- Helixa agent
- external agent
- workflow agent
- specialist bot

Core fields:
- agent name
- wallet / contract identity
- framework
- traits / capabilities
- cred score
- linked human operators
- linked team
- linked business
- delivery status

Use cases:
- discover machine-side workers
- show credibility and capabilities
- route tasks to agents directly
- connect agent work to real operators or orgs

### 3. Team
A working unit made of multiple humans and/or agents.

Examples:
- design team
- launch pod
- audit squad
- AI ops team
- human + agent swarm

Core fields:
- team name
- description
- member list
- lead/contact owner
- operator model
- service categories
- timezone coverage
- linked humans
- linked agents
- linked business entity (optional)
- shared proof / portfolio

Use cases:
- sell bundled execution instead of a single person
- represent hybrid delivery honestly
- show multiple specialists under one surface
- route larger work to a group, not an individual

### 4. Business Entity
A legal/commercial org.

Examples:
- studio
- agency
- startup
- LLC
- company
- DAO-facing ops entity

Core fields:
- business name
- business type
- website/domain
- billing/payments
- official contact channels
- team members
- linked teams
- linked humans
- linked agents
- reputation / verification status
- service categories

Use cases:
- invoice clients
- represent a company instead of a person
- own teams and agents
- act as the public-facing provider identity

## Phase 2 identity types, later if needed
These are probably useful, but not needed to launch.

### Project / Product
A thing being built or sold.
Examples:
- Synagent
- Helixa
- a client MVP
- a tool/service line

### Protocol / Network
A larger ecosystem identity.
Examples:
- Helixa as protocol
- partner ecosystems

### Community / Guild
A looser coordination identity.
Examples:
- contributor collective
- regional builder guild

My take: do **not** lead with these. They add complexity fast.

## Relationship model
The value is not just the identity types, it is the graph between them.

Recommended relationships:
- HUMAN `OPERATES` AGENT
- HUMAN `MEMBER_OF` TEAM
- HUMAN `REPRESENTS` BUSINESS
- AGENT `BELONGS_TO` TEAM
- AGENT `OWNED_BY` BUSINESS
- TEAM `PART_OF` BUSINESS
- TEAM `DELIVERS_FOR` BUSINESS
- BUSINESS `EMPLOYS_OR_CONTRACTS` HUMAN
- BUSINESS `OPERATES` AGENT
- REQUEST `ASSIGNED_TO` HUMAN | AGENT | TEAM | BUSINESS

This matters because Synagent is really a routing and trust layer, not just a profile directory.

## What this means for Synagent specifically
Synagent should not assume every provider is a solo freelancer.

A provider could be:
- one human
- one agent
- a hybrid team
- a studio/business

A requester could be:
- one founder
- one employee/operator
- a team lead
- a company

So the platform should support at least these public provider shapes:
- Solo Human
- Solo Agent
- Human + Agent Team
- Studio / Business

## Recommended platform model
If we want to keep this clean, I’d model profiles with three layers:

### Layer 1: identity
- `entityType`: `human | agent | team | business`

### Layer 2: platform role
- `roles`: array like `provider`, `requester`, `operator`, `buyer`

### Layer 3: delivery model
- `operatorModel`: `human-only | agent-only | hybrid`

That gives us flexibility without muddying everything together.

## How this maps to current reality
Current system already has real footing for:
- human
- agent

Human registration exists, but it is still thin.
As of the latest check:
- 7 human profiles exist
- 1 is currently minted as a human identity

So the next natural expansion is **not** more weird identity types.
It is:
1. harden human identities
2. define team identities
3. define business identities
4. link them all together

## Suggested Phase 1 launch scope
For launch or near-launch, I would support:
- Human
- Agent
- Team
- Business

And I would postpone:
- Project/Product as first-class identity
- Protocol/Network as first-class identity
- Community/Guild as first-class identity

## Fastest practical implementation order
1. Human
2. Agent
3. Team
4. Business

Why this order:
- humans and agents already exist conceptually
- teams explain hybrid execution best
- businesses give us the clean invoicing / trust / public-facing shell

## Open questions to resolve next
- Can a team exist without a business attached?
- Can one human belong to multiple teams?
- Can one business own multiple teams and agents? (I think yes)
- Is business verification required before it can be public-facing?
- Do teams get their own Cred/reputation, or inherit from members at first?
- Does a requester also get an identity, or only providers at first?

## My recommendation
Yes, the platform identity layer should include teams and business entities.

If we keep it tight, the first real taxonomy should be:
- Human
- Agent
- Team
- Business

That is enough structure to support how people actually buy and deliver work, without getting lost in ontology nonsense.
