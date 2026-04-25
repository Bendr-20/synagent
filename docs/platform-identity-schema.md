# Synagent Platform Identity Schema - Lean v1 Draft

Last updated: 2026-04-25 UTC

## Goal
Create one identity model that can support:
- humans
- agents
- organizations

without exploding the taxonomy into separate `team`, `business`, `platform`, and `project` entities too early.

## Design principles
1. Keep only three identity types in v1
2. Use `organization` as the umbrella for team/platform/business/startup/project
3. Keep roles separate from identity type
4. Keep relationships first-class
5. Reuse the current human and agent data we already have

---

## 1. Canonical base identity object

```ts
type EntityType = "human" | "agent" | "organization";

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
  badges?: string[];
  affiliations?: string[];
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
    organizations: string[];
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
  linkedAgents?: string[];
  organization?: string | null;
  humanCred?: {
    score: number;
    tier?: { tier?: string; label?: string; color?: string } | string;
    walletAddress?: string | null;
    tokenId?: number | null;
    sources?: Record<string, any>;
    breakdown?: Record<string, any>;
    updatedAt?: string | null;
  } | null;
};
```

Use for:
- solo providers
- requesters
- operators
- founders
- human members of organizations

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
- external agents
- workflow/service agents
- agent members of organizations

### Organization

```ts
type OrganizationType =
  | "team"
  | "platform"
  | "business"
  | "startup"
  | "project"
  | "studio"
  | "collective"
  | "custom";

type OrganizationIdentity = IdentityRecord & {
  entityType: "organization";
  organizationType: OrganizationType;
  memberIdentityIds: string[];
  representativeIdentityIds?: string[];
  primaryDomain?: string | null;
  legalEntityName?: string | null;
  billingEmail?: string | null;
  invoiceMethods?: string[];
  verificationNotes?: string | null;
};
```

Use for:
- Helixa
- teams
- platforms
- studios
- projects
- startups
- collectives

---

## 3. Relationship model

Keep relationships explicit instead of burying them in ad hoc fields.

```ts
type RelationshipType =
  | "OPERATES"
  | "OPERATED_BY"
  | "MEMBER_OF"
  | "REPRESENTS"
  | "HAS_MEMBER"
  | "PARTNER_OF"
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
- HUMAN `MEMBER_OF` ORGANIZATION
- HUMAN `REPRESENTS` ORGANIZATION
- AGENT `MEMBER_OF` ORGANIZATION
- AGENT `OPERATED_BY` HUMAN
- ORGANIZATION `HAS_MEMBER` HUMAN
- ORGANIZATION `HAS_MEMBER` AGENT

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
  badges?: string[];
  affiliations?: string[];
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
    organizationCount: number;
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
- one organization

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
- `organization`

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
To support organizations cleanly, we need:
- `organization` records
- relationship records or consistent linked-ID fields
- a unified public profile response shape

---

## 7. Minimum viable implementation order

### Phase 1A
- keep existing human and agent records
- normalize them into one shared public profile shape
- add org affiliation metadata where useful

### Phase 1B
- add `organization` records
- allow organizations to link humans + agents

### Phase 1C
- let organizations become public routing surfaces when needed

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

### Organization with human + agent members
```json
{
  "entityType": "organization",
  "organizationType": "platform",
  "roles": ["provider", "operator"],
  "operatorModel": "hybrid",
  "relationships": {
    "humans": ["human_quigley"],
    "agents": ["agent_bendr_2_0"],
    "organizations": []
  },
  "memberIdentityIds": ["human_quigley", "agent_bendr_2_0"]
}
```

---

## 9. Recommendation

Use one shared identity envelope with:
- `entityType`
- `roles`
- `operatorModel`
- optional `organizationType`
- shared public profile fields
- type-specific extensions
- first-class relationships

That gives Synagent enough structure to model people, agents, and coordinated groups without drowning in category sprawl.
