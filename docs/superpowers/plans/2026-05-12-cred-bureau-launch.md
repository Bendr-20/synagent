# Cred Bureau Launch Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the temporary Cred Bureau application flow at `synagent.helixa.xyz/cred-bureau` with optional Helixa human profile linking and a protected manual review queue.

**Architecture:** Keep the app simple for today: Next.js route handlers persist JSON records in `data/cred-bureau-applications.json`; the public form creates pending applications; the protected review route/API lists applications and lets reviewers update status/notes. No Telegram auto-invite and no database migration today.

**Tech Stack:** Next.js App Router, React, Node fs JSON store, Node test runner, existing Synagent theme/styles.

---

## Chunk 1: Public application payload

### Task 1: Make Helixa profile optional and collect review fields

**Files:**
- Modify: `src/lib/cred-bureau-types.ts`
- Modify: `src/lib/cred-bureau-store.ts`
- Modify: `src/app/cred-bureau/cred-bureau-application-form.tsx`
- Test: `src/lib/cred-bureau-application.test.ts`

- [ ] Step 1: Add failing tests that POST without a Helixa profile but with applicant name, Telegram handle/contact, role, whyJoin, availability, and disclosure; expect `pending-review`, `profileRequired: false`, and persisted reviewer-ready fields.
- [ ] Step 2: Run `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test src/lib/cred-bureau-application.test.ts` and verify failure.
- [ ] Step 3: Update types/store/form to accept optional profile and applicant fields.
- [ ] Step 4: Run focused test and verify pass.

## Chunk 2: Protected reviewer queue

### Task 2: Add review API and review UI

**Files:**
- Modify: `src/app/api/cred-bureau/applications/route.ts`
- Create: `src/app/review/cred-bureau/page.tsx`
- Test: `src/lib/cred-bureau-application.test.ts`

- [ ] Step 1: Add failing tests for protected GET review page/API content and PATCH status update with reviewer notes.
- [ ] Step 2: Run focused test and verify failure.
- [ ] Step 3: Implement `PATCH /api/cred-bureau/applications` and `/review/cred-bureau` server-rendered reviewer cards.
- [ ] Step 4: Run focused test and verify pass.

## Chunk 3: Launch verification

### Task 3: Verify and deploy

**Files:**
- Existing app files only.

- [ ] Step 1: Run `npm test`.
- [ ] Step 2: Start local preview and verify `/cred-bureau` and `/review/cred-bureau` return expected content.
- [ ] Step 3: Deploy to the configured Synagent host/alias for `synagent.helixa.xyz`.
- [ ] Step 4: Verify live URL and report exact review URL/API key requirements.
