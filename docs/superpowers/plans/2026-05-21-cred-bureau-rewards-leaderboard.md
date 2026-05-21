# Cred Bureau Rewards and Leaderboard Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a v0 Cred Bureau rewards system with participant wallet capture, contribution submissions, manual review, points, public leaderboard, weekly checkpoints, and manual payout export.

**Architecture:** Keep v0 inside the existing Synagent Next.js app and JSON data pattern. Public users submit participant/contribution data, reviewers approve and assign points behind the existing `SYNAGENT_REVIEW_API_KEY`, and payout exports are blocked unless a reviewer explicitly confirms anti-farm review. Payouts remain manual CSV exports in v0.

**Tech Stack:** Next.js App Router, React, TypeScript, Node route handlers, JSON files in `data/`, `node:test`, existing `review-auth` and rate-limit helpers.

---

## Locked Product Rules

- 1% of $CRED supply is dedicated to the first Cred Bureau cohort rewards pool.
- 6-week beta split into 2 seasons of 3 weeks each.
- Season 1 receives 40% of the pool.
- Season 2 receives 60% of the pool.
- Weekly checkpoints show leaderboard movement and review status.
- Manual anti-farm review is required before any payout export can be generated.
- Payouts stay manual in v0.
- No contract migration, escrow, claim contract, auto-payout, or guaranteed payout copy in v0.

## Reward Categories

Use these categories in product copy and data models.

- `cred-review` - useful Cred reviews
- `human-ai-task` - completed human-AI work tasks
- `agent-qa` - QA reports on agents/tools
- `ecosystem-intel` - high-signal ecosystem intel
- `partner-community` - partner/community tasks, including Toshi-style work if that lands
- `social-contribution` - original posts, quote posts, and substantive replies that add useful public signal
- `task-creation` - high-quality task creation that other testers want to take
- `referral` - referrals that become active members
- `wildcard` - manual grants for unusually valuable work

## Files to Create or Modify

### Create

- `src/lib/cred-bureau-rewards-types.ts` - reward seasons, categories, participant, contribution, review log, leaderboard, and payout export types.
- `src/lib/cred-bureau-rewards-config.ts` - constants for 1% pool, two 3-week seasons, 40/60 allocation, category labels, and default point guidance.
- `src/lib/cred-bureau-rewards-store.ts` - JSON read/write helpers for participants, contributions, review decisions, and payout export records.
- `src/lib/cred-bureau-rewards-scoring.ts` - pure functions for approved points, leaderboard rows, season totals, token-unit payout allocation, CSV generation, and privacy-safe public rows.
- `src/lib/cred-bureau-rewards-config.test.ts` - config and category tests.
- `src/lib/cred-bureau-rewards-store.test.ts` - validation and JSON store tests.
- `src/lib/cred-bureau-rewards-scoring.test.ts` - leaderboard, privacy, payout math, rounding, and remainder tests.
- `src/lib/cred-bureau-rewards-api.test.ts` - Next route integration tests.
- `src/lib/cred-bureau-rewards-ui.test.ts` - static page and docs copy tests.
- `src/app/api/cred-bureau/rewards/participants/route.ts` - public participant wallet/profile capture plus protected reviewer list.
- `src/app/api/cred-bureau/rewards/contributions/route.ts` - public contribution submission plus protected review queue and PATCH updates.
- `src/app/api/cred-bureau/rewards/payout-export/route.ts` - protected payout export creation, past export list, and CSV download.
- `src/app/cred-bureau/rewards/page.tsx` - public rules and contribution submission entry point.
- `src/app/cred-bureau/rewards/reward-submission-form.tsx` - client form for participant and contribution submission.
- `src/app/cred-bureau/leaderboard/page.tsx` - public leaderboard with season filter.
- `src/app/review/cred-bureau/rewards/page.tsx` - protected reviewer queue for contributions, scoring, anti-farm notes, weekly checkpoint status, and export links.
- `src/app/review/cred-bureau/rewards/reward-review-controls.tsx` - client controls for approve/reject/needs-info and point assignment.
- `docs/cred-bureau-rewards-rules.md` - public-facing reward rules and internal source of truth.
- `docs/cred-bureau-rewards-review-rubric.md` - reviewer scoring and anti-farm rubric.
- `docs/cred-bureau-rewards-weekly-ops.md` - weekly checkpoint, weekly recap, and final winners post operating process.

### Modify

- `src/app/cred-bureau/page.tsx` - link to rewards rules and last-chance cohort application copy.
- `src/app/page.tsx` - add rewards/leaderboard CTA carefully without overwriting the current uncommitted hero copy change.
- `src/components/site-shell.tsx` - add a lightweight public link only if it does not make the nav crowded.
- `src/app/globals.css` - mobile rules for rewards forms, leaderboard rows, and review queue controls.
- `src/lib/cred-bureau-application.test.ts` - add assertions for links from existing Cred Bureau surfaces.
- `package.json` - add the new reward test files to `npm test`.
- `docs/launch/mvp-launch.md` - add rewards ops section.
- `docs/prelaunch-checklist.md` - add rewards launch checks.

### Data Files Written at Runtime

- `data/cred-bureau-reward-participants.json`
- `data/cred-bureau-reward-contributions.json`
- `data/cred-bureau-reward-review-log.json`
- `data/cred-bureau-payout-exports.json`

---

## Chunk 0: Branch Safety and Current State

### Task 0: Preserve current work before implementation

**Files:**
- Inspect: `src/app/page.tsx`
- Create or switch: implementation branch/worktree chosen by the implementer

- [ ] **Step 1: Confirm current repo state**

Run:

```bash
git status --short --branch
git diff -- src/app/page.tsx
```

Expected: repo shows the existing uncommitted hero copy change in `src/app/page.tsx`:

```text
Build with AI.
Refine with Humans.
```

- [ ] **Step 2: Create implementation isolation**

Preferred:

```bash
git switch -c feature/cred-bureau-rewards-leaderboard
```

If current workspace must stay untouched, create a worktree from the current branch and manually preserve the homepage diff before editing.

- [ ] **Step 3: Verify the hero copy is still present**

Run:

```bash
grep -n "Build with AI\|Refine with Humans" src/app/page.tsx
```

Expected: both strings are found.

- [ ] **Step 4: Commit nothing yet**

Do not commit until the first tested code chunk passes.

---

## Chunk 1: Reward Domain, Rules, and Config Tests

### Task 1: Add reward types and config

**Files:**
- Create: `src/lib/cred-bureau-rewards-types.ts`
- Create: `src/lib/cred-bureau-rewards-config.ts`
- Create: `src/lib/cred-bureau-rewards-config.test.ts`

- [ ] **Step 1: Write failing tests for locked config**

Add tests that import reward config and assert:

```ts
assert.equal(CRED_BUREAU_REWARD_CONFIG.totalPoolPercent, 1);
assert.equal(CRED_BUREAU_REWARD_CONFIG.betaDurationWeeks, 6);
assert.equal(CRED_BUREAU_REWARD_CONFIG.seasons.length, 2);
assert.equal(CRED_BUREAU_REWARD_CONFIG.seasons[0].durationWeeks, 3);
assert.equal(CRED_BUREAU_REWARD_CONFIG.seasons[0].allocationShare, 0.4);
assert.equal(CRED_BUREAU_REWARD_CONFIG.seasons[1].durationWeeks, 3);
assert.equal(CRED_BUREAU_REWARD_CONFIG.seasons[1].allocationShare, 0.6);
assert.ok(CRED_BUREAU_REWARD_CONFIG.categories.some((category) => category.id === "human-ai-task"));
```

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test src/lib/cred-bureau-rewards-config.test.ts
```

Expected: FAIL because reward config files do not exist yet.

- [ ] **Step 3: Create types**

Define these exported types:

```ts
export type CredBureauRewardSeasonId = "season-1" | "season-2";
export type CredBureauRewardCategoryId =
  | "cred-review"
  | "human-ai-task"
  | "agent-qa"
  | "ecosystem-intel"
  | "partner-community"
  | "social-contribution"
  | "task-creation"
  | "referral"
  | "wildcard";

export type CredBureauRewardParticipant = {
  id: string;
  createdAt: string;
  updatedAt: string;
  displayName: string;
  telegram?: string | null;
  email?: string | null;
  wallet: string;
  helixaProfileUrl?: string | null;
  applicationId?: string | null;
  status: "active" | "suspended";
};

export type CredBureauRewardContributionStatus = "submitted" | "needs-info" | "approved" | "rejected";

export type CredBureauRewardContribution = {
  id: string;
  createdAt: string;
  updatedAt: string;
  participantId: string;
  seasonId: CredBureauRewardSeasonId;
  categoryId: CredBureauRewardCategoryId;
  title: string;
  description: string;
  evidenceUrl?: string | null;
  requestedPoints?: number | null;
  assignedPoints: number;
  status: CredBureauRewardContributionStatus;
  reviewerNotes?: string | null;
  antiFarmNotes?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  needsInfoAt?: string | null;
  payoutEligible: boolean;
};

export type CredBureauRewardReviewLogEntry = {
  id: string;
  contributionId: string;
  participantId: string;
  loggedAt: string;
  previousStatus: CredBureauRewardContributionStatus;
  status: CredBureauRewardContributionStatus;
  assignedPoints: number;
  payoutEligible: boolean;
  reviewedBy: string;
  reviewerNotes?: string | null;
  antiFarmNotes?: string | null;
};

export type CredBureauPayoutExportRecord = {
  id: string;
  createdAt: string;
  seasonId: CredBureauRewardSeasonId;
  seasonTokenPool: string;
  totalPoints: number;
  rowCount: number;
  createdBy: string;
  antiFarmReviewComplete: true;
  antiFarmReviewNotes: string;
  rows: CredBureauPayoutExportRow[];
};

export type CredBureauPayoutExportRow = {
  participantId: string;
  displayName: string;
  wallet: string;
  seasonId: CredBureauRewardSeasonId;
  points: number;
  amount: string;
  amountUnits: string;
  reason: string;
};
```

- [ ] **Step 4: Create config**

Include:

```ts
export const CRED_BUREAU_REWARD_CONFIG = {
  totalPoolPercent: 1,
  betaDurationWeeks: 6,
  weeklyCheckpointCadence: "weekly",
  seasons: [
    { id: "season-1", label: "Season 1", durationWeeks: 3, allocationShare: 0.4 },
    { id: "season-2", label: "Season 2", durationWeeks: 3, allocationShare: 0.6 },
  ],
  categories: [
    { id: "cred-review", label: "Useful Cred reviews", defaultPointGuidance: "10-40 points" },
    { id: "human-ai-task", label: "Completed human-AI work tasks", defaultPointGuidance: "25-100 points" },
    { id: "agent-qa", label: "QA reports on agents/tools", defaultPointGuidance: "10-60 points" },
    { id: "ecosystem-intel", label: "High-signal ecosystem intel", defaultPointGuidance: "10-50 points" },
    { id: "partner-community", label: "Partner/community tasks", defaultPointGuidance: "10-75 points" },
    { id: "social-contribution", label: "Original posts, quote posts, and substantive replies", defaultPointGuidance: "0-20 points, max 2 scored per day" },
    { id: "task-creation", label: "High-quality task creation", defaultPointGuidance: "10-40 points" },
    { id: "referral", label: "Referrals that become active members", defaultPointGuidance: "10-30 points" },
    { id: "wildcard", label: "Wildcard grants", defaultPointGuidance: "Manual" },
  ],
} as const;
```

- [ ] **Step 5: Run test and verify it passes**

Run:

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test src/lib/cred-bureau-rewards-config.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/cred-bureau-rewards-types.ts src/lib/cred-bureau-rewards-config.ts src/lib/cred-bureau-rewards-config.test.ts
git commit -m "Add Cred Bureau reward domain config"
```

---

## Chunk 2: JSON Store and Scoring

### Task 2: Add storage helpers and pure scoring

**Files:**
- Create: `src/lib/cred-bureau-rewards-store.ts`
- Create: `src/lib/cred-bureau-rewards-scoring.ts`
- Create: `src/lib/cred-bureau-rewards-store.test.ts`
- Create: `src/lib/cred-bureau-rewards-scoring.test.ts`

- [ ] **Step 1: Add failing tests for participant and contribution validation**

In `src/lib/cred-bureau-rewards-store.test.ts`, test these cases:

- wallet is required
- wallet must be an EVM address, `0x` plus 40 hex chars
- display name is required
- contribution title and description are required
- invalid category is rejected
- invalid season is rejected
- social contribution daily cap rejects or marks over-cap items as non-scoring after 2 scored social contributions per participant per UTC day
- contribution POST payload with missing evidence URL is allowed but stored as `null`

Use a temp data directory so tests do not mutate real `data/` files.

- [ ] **Step 2: Add failing tests for leaderboard privacy and approval states**

In `src/lib/cred-bureau-rewards-scoring.test.ts`, test:

- approved eligible contribution affects leaderboard
- approved contribution with `payoutEligible: false` affects public leaderboard but not payout rows
- rejected contribution does not affect leaderboard
- submitted contribution does not affect leaderboard
- public leaderboard rows never include wallet, email, reviewer notes, anti-farm notes, or reviewer key
- `lastApprovedAt` is taken from `approvedAt`, not `createdAt`
- emoji-only, one-word, `gm`, `based`, and similar low-effort social replies score 0

- [ ] **Step 3: Add failing tests for payout math**

Test this fixture with `seasonTokenPool = "400000"`:

```ts
const approved = [
  { participantId: "alice", seasonId: "season-1", assignedPoints: 80, status: "approved", payoutEligible: true },
  { participantId: "bob", seasonId: "season-1", assignedPoints: 20, status: "approved", payoutEligible: true },
];
```

Expected:

- Alice receives `320000`
- Bob receives `80000`
- total exported amount equals the input pool

Also test decimal/remainder behavior:

- `seasonTokenPool = "1"`, 3 equal participants, 18 token decimals
- allocate floor amounts by BigInt units
- distribute leftover smallest units to highest-ranked rows in deterministic order
- total exported `amountUnits` equals exactly `1000000000000000000`

- [ ] **Step 4: Run tests and verify failure**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test src/lib/cred-bureau-rewards-store.test.ts src/lib/cred-bureau-rewards-scoring.test.ts
```

Expected: FAIL because store/scoring do not exist.

- [ ] **Step 5: Implement store helpers**

Store functions should include:

```ts
createOrUpdateRewardParticipant(payload, options?)
getRewardParticipants(options?)
appendRewardContribution(payload, options?)
getRewardContributions(options?)
updateRewardContributionReview(id, reviewPayload, options?)
appendRewardPayoutExport(exportRecord, options?)
getRewardPayoutExports(options?)
getRewardPayoutExportById(id, options?)
```

Rules:

- Use JSON writes matching the existing app style.
- Keep runtime files under `data/` by default.
- Allow tests to pass `{ dataDir }` so real data is not touched.
- Normalize Telegram to `@handle`.
- Require wallet format to start with `0x` and contain 40 hex chars.
- On approve, require `reviewedBy`, set `reviewedAt`, `approvedAt`, `assignedPoints`, and `payoutEligible`.
- For `social-contribution`, enforce max 2 scored social contributions per participant per UTC day. Extra approved social items can remain visible in review history but must get `assignedPoints: 0` or `payoutEligible: false`.
- On reject, set `reviewedAt`, `rejectedAt`, and `payoutEligible: false`.
- On needs-info, set `reviewedAt`, `needsInfoAt`, and `payoutEligible: false`.
- Append review log entries for every protected review transition.

- [ ] **Step 6: Implement scoring helpers**

Functions:

```ts
buildCredBureauLeaderboard(participants, contributions, seasonId?)
calculateSeasonPayoutRows(participants, contributions, seasonId, seasonTokenPool)
buildPayoutCsv(rows)
buildPublicLeaderboardRows(rows)
parseTokenAmountToUnits(amount, decimals?)
formatTokenUnits(units, decimals?)
```

Rules:

- Leaderboard counts only approved contributions.
- Payout rows count only approved contributions where `payoutEligible === true`.
- Sort leaderboard by points desc, then earliest `approvedAt`, then display name.
- CSV columns: `wallet,amount,participantId,displayName,seasonId,points,reason`.
- If a season has no eligible approved points, payout export returns no rows and a clear warning.
- `seasonTokenPool` must be a positive decimal string.
- Convert token amounts to 18-decimal BigInt units.
- Allocate floor units by points and distribute remaining smallest units by leaderboard order.
- Never use floating point for final payout amounts.

- [ ] **Step 7: Run tests and verify they pass**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test src/lib/cred-bureau-rewards-store.test.ts src/lib/cred-bureau-rewards-scoring.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/cred-bureau-rewards-store.ts src/lib/cred-bureau-rewards-scoring.ts src/lib/cred-bureau-rewards-store.test.ts src/lib/cred-bureau-rewards-scoring.test.ts
git commit -m "Add Cred Bureau reward storage and scoring"
```

---

## Chunk 3: API Routes

### Task 3: Add participant, contribution, and payout APIs

**Files:**
- Create: `src/app/api/cred-bureau/rewards/participants/route.ts`
- Create: `src/app/api/cred-bureau/rewards/contributions/route.ts`
- Create: `src/app/api/cred-bureau/rewards/payout-export/route.ts`
- Create: `src/lib/cred-bureau-rewards-api.test.ts`

- [ ] **Step 1: Add failing integration tests**

Use the existing `next start` integration pattern from current tests.

Test:

- `POST /api/cred-bureau/rewards/participants` creates or updates a participant.
- participant POST is rate-limited.
- `POST /api/cred-bureau/rewards/contributions` creates a submitted contribution.
- contribution POST is rate-limited.
- protected `GET /api/cred-bureau/rewards/contributions` returns 401 without key.
- protected PATCH approves a contribution and assigns points.
- protected payout export refuses to generate without explicit anti-farm review confirmation.
- protected payout export stores an export record after anti-farm confirmation.
- protected CSV download returns a CSV from a stored export id.

- [ ] **Step 2: Run test and verify failure**

```bash
npm run build
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test src/lib/cred-bureau-rewards-api.test.ts
```

Expected: FAIL because routes do not exist.

- [ ] **Step 3: Implement participant route**

Behavior:

- Public POST accepts display name, wallet, Telegram/email, Helixa profile URL, optional application id.
- Protected GET lists participants for reviewers.
- Use `assertReviewAuthorized` for reviewer GET.
- Apply `checkRateLimit` to public POST using `x-forwarded-for`.

- [ ] **Step 4: Implement contribution route**

Behavior:

- Public POST accepts participant id or participant payload, season, category, title, description, evidence URL.
- Public POST creates status `submitted`, assigned points `0`, payout eligible `false`.
- Protected GET lists submitted, needs-info, approved, and rejected contributions.
- Protected PATCH allows reviewer to set status, assigned points, notes, anti-farm notes, and payout eligibility.
- PATCH must reject negative points.
- PATCH must reject points above 250 unless category is `wildcard`.
- PATCH must enforce the social scoring cap: max 2 scored social contributions per participant per UTC day.
- Use `assertReviewAuthorized` for protected GET/PATCH.
- Apply `checkRateLimit` to public POST using `x-forwarded-for`.

- [ ] **Step 5: Implement payout export route**

Behavior:

- Protected only.
- `POST /api/cred-bureau/rewards/payout-export` creates and stores a payout export.
- POST body requires `seasonId`, `seasonTokenPool`, `createdBy`, `antiFarmReviewComplete: true`, and `antiFarmReviewNotes` with at least 20 non-whitespace chars.
- POST rejects missing/invalid `seasonTokenPool` and non-positive amounts.
- POST rejects if there are zero eligible approved points.
- POST appends to `data/cred-bureau-payout-exports.json`.
- `GET /api/cred-bureau/rewards/payout-export` lists past exports without dumping all wallets unless `includeRows=1` is provided by an authorized reviewer.
- `GET /api/cred-bureau/rewards/payout-export?exportId=...&format=csv` downloads CSV for a stored export.
- CSV export never creates a fresh payout calculation. It only downloads stored exports, so anti-farm confirmation cannot be bypassed.

- [ ] **Step 6: Run tests and verify pass**

```bash
npm run build
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test src/lib/cred-bureau-rewards-api.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/cred-bureau/rewards src/lib/cred-bureau-rewards-api.test.ts
git commit -m "Add Cred Bureau reward APIs"
```

---

## Chunk 4: Public Rewards, Submission, and Leaderboard UI

### Task 4: Add public pages

**Files:**
- Create: `src/app/cred-bureau/rewards/page.tsx`
- Create: `src/app/cred-bureau/rewards/reward-submission-form.tsx`
- Create: `src/app/cred-bureau/leaderboard/page.tsx`
- Create: `src/lib/cred-bureau-rewards-ui.test.ts`
- Modify: `src/app/cred-bureau/page.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/components/site-shell.tsx` if needed
- Modify: `src/app/globals.css`
- Modify: `src/lib/cred-bureau-application.test.ts`

- [ ] **Step 1: Add failing static copy and privacy tests**

Assert public copy includes:

- `1% of the $CRED supply`
- `2 seasons`
- `3 weeks`
- `40/60`
- `leaderboard`
- `weekly checkpoint`
- `manual review before payouts`
- `last chance to apply`

Assert public copy does not include:

- `automatic payout`
- `guaranteed payout`
- `claim contract`
- `escrow`

Assert public leaderboard code does not render:

- wallet
- email
- reviewer notes
- anti-farm notes
- reviewer key

- [ ] **Step 2: Add rewards page**

Content:

- Headline: `Cred Bureau Rewards`
- Explain that it is being wired up and will begin soon if launch flag is off.
- State 1% pool, 2 seasons, 3 weeks each, 40/60 split.
- State rewards are earned through useful Cred reviews, human-AI task work, agent/tool QA, ecosystem intel, partner/community work, substantive social contributions, task creation, referrals, and wildcard grants.
- Link to application page for last chance to join.
- Link to leaderboard.
- Include submission form only if `NEXT_PUBLIC_CRED_BUREAU_REWARDS_OPEN=1`, otherwise show `Submissions opening soon`.

- [ ] **Step 3: Add contribution submission form**

Fields:

- Display name
- Telegram or email
- Wallet
- Helixa profile URL
- Season
- Category
- Title
- Description
- Evidence URL

Submission result:

- Show contribution id.
- Say it is pending manual review.
- Do not say a payout is guaranteed.

- [ ] **Step 4: Add leaderboard page**

Public data shown:

- Rank
- Display name
- Season points
- Total approved contributions
- Top category
- Last approved contribution date

Do not show:

- Wallet
- Email
- Reviewer notes
- Anti-farm notes

- [ ] **Step 5: Add links from existing surfaces**

- `/cred-bureau` links to `/cred-bureau/rewards` and `/cred-bureau/leaderboard`.
- Homepage adds a low-profile CTA after the current hero section.
- Preserve the current uncommitted homepage hero change: `Build with AI. Refine with Humans.`

- [ ] **Step 6: Run tests**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test src/lib/cred-bureau-application.test.ts src/lib/cred-bureau-rewards-ui.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/cred-bureau src/app/page.tsx src/components/site-shell.tsx src/app/globals.css src/lib/cred-bureau-application.test.ts src/lib/cred-bureau-rewards-ui.test.ts
git commit -m "Add Cred Bureau rewards and leaderboard pages"
```

---

## Chunk 5: Reviewer UI, Weekly Checkpoints, and Payout Export

### Task 5: Add protected reward review queue

**Files:**
- Create: `src/app/review/cred-bureau/rewards/page.tsx`
- Create: `src/app/review/cred-bureau/rewards/reward-review-controls.tsx`
- Modify: `src/app/review/cred-bureau/page.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/lib/cred-bureau-rewards-ui.test.ts`

- [ ] **Step 1: Add failing review UI tests**

Test server-rendered page includes:

- reviewer key required state
- contribution queue
- status controls
- point assignment field
- anti-farm notes field
- weekly checkpoint section
- weekly recap prompt/template link
- final winners post prompt/template link
- payout export form
- anti-farm review confirmation field
- payout export link

- [ ] **Step 2: Implement protected page**

Behavior:

- URL: `/review/cred-bureau/rewards?key=...`
- Same key model as existing review queue.
- Show submitted and needs-info first.
- Show approved/rejected below with filter controls.
- Link each participant to Helixa profile if provided.
- Keep wallet visible only on reviewer page.

- [ ] **Step 3: Implement client review controls**

Reviewer can set:

- status: submitted, needs-info, approved, rejected
- assigned points
- payout eligible
- reviewer notes
- anti-farm notes
- reviewed by

- [ ] **Step 4: Add weekly checkpoint section**

Show:

- active season
- current approved points
- submitted count awaiting review
- approved count by category
- current top 10 leaderboard
- link to docs weekly recap template

This is enough for the team to publish weekly updates manually without introducing posting automation.

- [ ] **Step 5: Add payout export controls**

- Season selector.
- Token amount input for the season pool.
- Reviewer name input.
- Required anti-farm review confirmation checkbox.
- Required anti-farm notes textarea.
- Create export button that POSTs to payout export route.
- Export JSON link for stored export.
- Export CSV link for stored export.
- Copy warning: `Manual review required before sending rewards.`

- [ ] **Step 6: Run tests**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test src/lib/cred-bureau-rewards-ui.test.ts src/lib/cred-bureau-rewards-api.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/review/cred-bureau src/app/globals.css src/lib/cred-bureau-rewards-ui.test.ts src/lib/cred-bureau-rewards-api.test.ts
git commit -m "Add Cred Bureau reward review queue"
```

---

## Chunk 6: Docs, Ops, and Full Verification

### Task 6: Document rules and verify end to end

**Files:**
- Create: `docs/cred-bureau-rewards-rules.md`
- Create: `docs/cred-bureau-rewards-review-rubric.md`
- Create: `docs/cred-bureau-rewards-weekly-ops.md`
- Modify: `docs/launch/mvp-launch.md`
- Modify: `docs/prelaunch-checklist.md`
- Modify: `package.json`
- Modify: `src/lib/cred-bureau-rewards-ui.test.ts`

- [ ] **Step 1: Add docs static tests**

In `src/lib/cred-bureau-rewards-ui.test.ts`, assert docs include:

- `1%`
- `6-week`
- `2 seasons`
- `3 weeks`
- `40/60`
- `manual anti-farm review`
- `weekly checkpoint`
- `weekly recap`
- `final winners post`
- `no guaranteed rewards`

- [ ] **Step 2: Add rules doc**

Rules doc must include:

- 1% pool
- 6-week beta
- 2 seasons of 3 weeks
- 40/60 split
- categories
- weekly checkpoint cadence
- manual review before payouts
- no guaranteed rewards
- no automated payout in v0

- [ ] **Step 3: Add reviewer rubric doc**

Rubric doc must include:

- point ranges by category
- social scoring rubric: original post/thread 10 base points, quote post with real commentary 6, substantive reply 3, emoji-only/one-word/simple reply 0, quality multiplier 0x/1x/1.5x/2x, max 2 scored social contributions per participant per UTC day
- duplicate/spam handling
- evidence quality rules
- conflict notes
- when to mark payout eligible false
- anti-farm review checklist required before export

- [ ] **Step 4: Add weekly ops doc**

Weekly ops doc must include:

```md
## Weekly checkpoint
- Review all submitted contributions.
- Approve/reject/needs-info with points and notes.
- Check public leaderboard for obvious duplicate/farm patterns.
- Publish a short recap: top categories, shipped feedback, next task themes.

## Weekly recap template
This week in Cred Bureau: [approved contributions], [product fixes], [leaderboard movement], [next focus]. Rewards are still subject to final anti-farm review.

## Final winners post template
Cred Bureau Season [N] is complete. After manual anti-farm review, rewards were allocated based on approved contributions across [categories]. Top contributors: [names]. Full payout transaction details: [link when sent].
```

- [ ] **Step 5: Add reward tests to package script**

Update `package.json`:

```json
"test": "next build && node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test src/lib/review-auth.test.ts src/lib/notification-dispatch.test.ts src/lib/match-api.test.ts src/lib/mobile-ux.test.ts src/lib/cred-bureau-application.test.ts src/lib/cred-bureau-rewards-config.test.ts src/lib/cred-bureau-rewards-store.test.ts src/lib/cred-bureau-rewards-scoring.test.ts src/lib/cred-bureau-rewards-api.test.ts src/lib/cred-bureau-rewards-ui.test.ts"
```

- [ ] **Step 6: Run full test suite**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 7: Run local smoke**

```bash
npm run build
SYNAGENT_REVIEW_API_KEY=test-review-key npm start -- --port 3050
```

In another shell:

```bash
curl -i http://127.0.0.1:3050/cred-bureau/rewards
curl -i http://127.0.0.1:3050/cred-bureau/leaderboard
curl -i http://127.0.0.1:3050/api/cred-bureau/rewards/contributions
curl -i -H 'Authorization: Bearer test-review-key' http://127.0.0.1:3050/api/cred-bureau/rewards/contributions
```

Expected:

- public pages return 200
- unauthenticated protected API returns 401
- authenticated protected API returns 200

- [ ] **Step 8: Commit**

```bash
git add package.json docs/cred-bureau-rewards-rules.md docs/cred-bureau-rewards-review-rubric.md docs/cred-bureau-rewards-weekly-ops.md docs/launch/mvp-launch.md docs/prelaunch-checklist.md src/lib/cred-bureau-rewards-ui.test.ts
git commit -m "Document Cred Bureau reward operations"
```

---

## Chunk 7: Deployment and Launch Checks

### Task 7: Deploy safely after local verification

**Files:**
- No planned code files unless deployment docs reveal a missing step.

- [ ] **Step 1: Check deploy method**

Run:

```bash
git remote -v
git log --oneline -5
```

Confirm whether Synagent deploys from GitHub pull, local service restart, or existing server process.

- [ ] **Step 2: Push branch only after tests pass**

```bash
git push origin HEAD
```

Expected: push succeeds.

- [ ] **Step 3: Deploy using existing Synagent method**

Use the deployment method documented in the repo or service history. Do not invent a new service command.

- [ ] **Step 4: Live smoke checks**

```bash
curl -L -sS -o /dev/null -w '%{http_code} %{time_total}s\n' https://synagent.helixa.xyz/cred-bureau/rewards
curl -L -sS -o /dev/null -w '%{http_code} %{time_total}s\n' https://synagent.helixa.xyz/cred-bureau/leaderboard
```

Expected: both return 200.

- [ ] **Step 5: Report launch state**

Report:

- live URLs
- whether submissions are open or coming soon
- reviewer URL format
- exact tests run
- any manual payout blockers still remaining

---

## Execution Notes

- Start implementation in a dedicated branch or worktree because `/home/ubuntu/synagent/src/app/page.tsx` currently has an uncommitted hero-copy change.
- Do not overwrite that hero copy.
- Do not expose reviewer key, wallets, or emails publicly.
- Do not add token claim mechanics in v0.
- Do not call this a guaranteed rewards program.
- Keep all payouts as CSV/manual review until real abuse patterns are known.
