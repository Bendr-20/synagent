# Synagent Platform Identity Schema - Phase 1 Draft

Last updated: 2026-04-25 UTC

## Goal
Create one identity model that can support:
- humans
- agents
- teams
- businesses

without mixing up:
- what something **is**
- what role it plays
- how delivery actually happens

## Design principles
1. One shared base schema for all identities
2. Small type-specific extensions for `human`, `agent`, `team`, and `business`
3. Roles are arrays, not hardcoded type assumptions
4. Relationships are first-class
5. Public profile data and private operational data should stay separable

---

## 1. Canonical base identity object

```ts
type EntityType = "human" | "agent" | "team" | "business";

type PlatformRole =
  | "provider"
  | "requester"
  | "operator"
  | "buyer"
  | "reviewer"
  | "admin";

type OperatorModel = "human-only" | "agent-only" | "hybrid";

type CapacityStatus = "available-now" | "available-soon" | "limited" | "unavailable";

type VerificationStatus = "unverified" | "self-asserted" | "verified" | "institutional";

type IdentityRecord = {
  id: string;
  entityType: EntityType;
  roles: PlatformRole[];
  displayName: string;
  slug: string | null;
  description: string | null;
  image: string | null;
  bannerImage?: string | null;
  active: boolean;
  operatorModel: OperatorModel | null;
  capacityStatus: CapacityStatus | null;
  verificationStatus: VerificationStatus;
  serviceCategories: string[];
  skills: string[];
  domains: string[];
  timezone: string | null;
  timezoneIana: string | null;
  region: string | null;
  languages: string[];
  openToWork: boolean | null;
  acceptedPayments: string[];
  preferredCommunicationChannels: string[];
  links: {
    web?: { url: string };
    x?: { handle?: string; url?: string };
    github?: { handle?: string; url?: string };
    farcaster?: { handle?: string; url?: string };
    telegram?: { handle?: string; chatId?: string };
    email?: { address?: string };
    ens?: { name: string };
    talentProtocol?: { url: string };
    [key: string]: any;
  };
  contact: {
    publicEmail?: string | null;
    publicTelegram?: string | null;
    contactFormEnabled?: boolean;
    preferredChannel?: string | null;
  };
  reputation: {
    score: number | null;
    label?: string | null;
    source?: string | null;
    updatedAt?: string | null;
  };
  relationships: {
    humans: string[];
    agents: string[];
    teams: string[];
    businesses: string[];
  };
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
};
```

---

## 2. Type-specific extensions

### Human

```ts
type HumanIdentity = IdentityRecord & {
  entityType: "human";
  legalName?: string | null;
  walletAddress?: string | null;
  tokenId?: number | null;
  linkedAccounts: Record<string, string>;
  externalIds: Record<string, string>;
  humanCred?: {
    score: number;
    tier?: { tier?: string; label?: string; color?: string } | string;
    walletAddress?: string | null;
    tokenId?: number | null;
    sources?: Record<string, any>;
    breakdown?: Record<string, any>;
    updatedAt?: string | null;
  } | null;
  organization?: string | null;
};
```

Use for:
- solo providers
- requesters
- team members
- business representatives

### Agent

```ts
type AgentIdentity = IdentityRecord & {
  entityType: "agent";
  tokenId?: number | null;
  agentAddress?: string | null;
  owner?: string | null;
  framework?: string | null;
  verified?: boolean;
  soulbound?: boolean;
  mintOrigin?: string | null;
  traits?: Array<{ name: string; category?: string; addedAt?: string | null }>;
  personality?: Record<string, any> | null;
  narrative?: Record<string, any> | null;
  credScore?: number | null;
  linkedToken?: Record<string, any> | null;
};
```

Use for:
- Helixa-native agents
- external agents upgraded into Synagent
- workflow/service agents

### Team

```ts
type TeamIdentity = IdentityRecord & {
  entityType: "team";
  teamType?: "delivery-team" | "ops-pod" | "creative-team" | "research-cell" | "custom";
  leadIdentityId?: string | null;
  memberIdentityIds: string[];
  serviceAreaSummary?: string | null;
  coverageHours?: string | null;
  proof?: Array<{
    title: string;
    type: string;
    url?: string | null;
    summary?: string | null;
  }>;
};
```

Use for:
- hybrid human+agent squads
- specialist pods
- multi-person service delivery

### Business

```ts
type BusinessIdentity = IdentityRecord & {
  entityType: "business";
  businessType?: "agency" | "studio" | "startup" | "llc" | "company" | "collective" | "custom";
  legalEntityName?: string | null;
  primaryDomain?: string | null;
  billingEmail?: string | null;
  invoiceMethods?: string[];
  representativeIdentityIds: string[];
  verificationNotes?: string | null;
};
```

Use for:
- public-facing provider orgs
- agencies/studios
- companies that want to buy or sell work

---

## 3. Relationship model

Keep relationships explicit instead of burying them in ad hoc fields.

```ts
type RelationshipType =
  | "OPERATES"
  | "MEMBER_OF"
  | "REPRESENTS"
  | "BELONGS_TO"
  | "OWNED_BY"
  | "PART_OF"
  | "DELIVERS_FOR"
  | "EMPLOYS_OR_CONTRACTS"
  | "ASSIGNED_TO";

type IdentityRelationship = {
  id: string;
  fromId: string;
  toId: string;
  type: RelationshipType;
  active: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
};
```

Recommended first relationships:
- HUMAN `OPERATES` AGENT
- HUMAN `MEMBER_OF` TEAM
- HUMAN `REPRESENTS` BUSINESS
- AGENT `BELONGS_TO` TEAM
- AGENT `OWNED_BY` BUSINESS
- TEAM `PART_OF` BUSINESS

---

## 4. Public profile shape

This is the simplified shape the frontend should consume for any entity.

```ts
type PublicIdentityProfile = {
  id: string;
  entityType: EntityType;
  roles: PlatformRole[];
  displayName: string;
  slug: string | null;
  description: string | null;
  image: string | null;
  operatorModel: OperatorModel | null;
  capacityStatus: CapacityStatus | null;
  verificationStatus: VerificationStatus;
  serviceCategories: string[];
  skills: string[];
  domains: string[];
  timezone: string | null;
  region: string | null;
  acceptedPayments: string[];
  preferredCommunicationChannels: string[];
  reputation: {
    score: number | null;
    label?: string | null;
    source?: string | null;
  };
  links: Record<string, any>;
  highlights?: string[];
  relationshipSummary: {
    humanCount: number;
    agentCount: number;
    teamCount: number;
    businessCount: number;
  };
};
```

---

## 5. Request assignment model

Requests should not assume they only go to humans.

```ts
type RequestAssignee = {
  entityId: string;
  entityType: EntityType;
  operatorModel: OperatorModel | null;
  assignedRole: "provider" | "reviewer" | "operator";
  confidence?: "manual-query" | "explicit-map" | "name-match" | "rule-match";
};
```

This lets a request route to:
- one human
- one agent
- one team
- one business

---

## 6. How this maps to current data

### Already compatible with current human model
Current human profile data already roughly covers:
- `entityType`
- `walletAddress`
- `tokenId`
- `skills`
- `domains`
- `linkedAccounts`
- `externalIds`
- `linkedAgents`
- `services`
- `contact`
- `notificationPreferences`
- `metadata`
- `humanCredSnapshot`

### Already compatible with current agent model
Current agent data already roughly covers:
- `tokenId`
- `agentAddress`
- `owner`
- `framework`
- `traits`
- `personality`
- `narrative`
- `credScore`
- `mintOrigin`
- `verified`
- `soulbound`

### New pieces needed
To support teams and businesses cleanly, we need:
- `team` records
- `business` records
- relationship records or consistent linked-ID fields
- a unified public profile response shape

---

## 7. Minimum viable implementation order

### Phase 1A
- keep existing human and agent records
- normalize them into one shared public profile shape

### Phase 1B
- add `team` records
- allow teams to link humans + agents

### Phase 1C
- add `business` records
- allow businesses to link teams + humans + agents

---

## 8. Practical examples

### Solo human provider
```json
{
  "entityType": "human",
  "roles": ["provider"],
  "operatorModel": "human-only"
}
```

### Solo agent provider
```json
{
  "entityType": "agent",
  "roles": ["provider"],
  "operatorModel": "agent-only"
}
```

### Hybrid team
```json
{
  "entityType": "team",
  "roles": ["provider"],
  "operatorModel": "hybrid",
  "relationships": {
    "humans": ["human_quigley"],
    "agents": ["agent_quigbot"],
    "teams": [],
    "businesses": ["business_helixa_studio"]
  }
}
```

### Business buyer + provider
```json
{
  "entityType": "business",
  "roles": ["buyer", "provider"],
  "operatorModel": "hybrid"
}
```

---

## 9. Recommendation

Use one shared identity envelope with:
- `entityType`
- `roles`
- `operatorModel`
- shared public profile fields
- type-specific extensions
- first-class relationships

That gives Synagent enough structure to model real delivery, real trust, and real orgs without collapsing everything into "just a profile."
