import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

async function loadRewardStore() {
  return import(new URL("./cred-bureau-rewards-store.ts", import.meta.url).href);
}

const TEST_DATA_DIR = path.join(process.cwd(), "data");
const TEST_CONTRIBUTIONS_PATH = path.join(TEST_DATA_DIR, "cred-bureau-rewards-contributions.json");
const TEST_PARTICIPANTS_PATH = path.join(TEST_DATA_DIR, "cred-bureau-rewards-participants.json");
const TEST_REVIEW_LOG_PATH = path.join(TEST_DATA_DIR, "cred-bureau-rewards-review-log.json");

function cleanupTestFiles() {
  try { fs.unlinkSync(TEST_CONTRIBUTIONS_PATH); } catch {}
  try { fs.unlinkSync(TEST_PARTICIPANTS_PATH); } catch {}
  try { fs.unlinkSync(TEST_REVIEW_LOG_PATH); } catch {}
}

test("Season payout calculation with social evidence cap", async () => {
  const { buildRewardContribution, appendRewardContribution, updateRewardContributionReview, calculateSeasonPayoutRows } = await loadRewardStore();
  cleanupTestFiles();

  // Create participants
  const participants = [
    {
      id: "participant-1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      displayName: "Test Participant 1",
      telegram: "@test1",
      email: "test1@example.com",
      wallet: "0x1111111111111111111111111111111111111111",
      status: "active" as const,
    },
    {
      id: "participant-2",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      displayName: "Test Participant 2",
      telegram: "@test2",
      email: "test2@example.com",
      wallet: "0x2222222222222222222222222222222222222222",
      status: "active" as const,
    },
  ];

  // Create contributions for participant 1
  // 100 points total, 30 points social (30% > 15% cap)
  const contribution1 = buildRewardContribution({
    participantId: "participant-1",
    seasonId: "season-1",
    categoryId: "matched-task",
    title: "Task 1",
    description: "Task description",
  });
  appendRewardContribution(contribution1);
  updateRewardContributionReview(contribution1.id, "approved", "reviewer-1", null, null, 70);

  const contribution2 = buildRewardContribution({
    participantId: "participant-1",
    seasonId: "season-1",
    categoryId: "matched-task",
    title: "Social post",
    description: "Social content",
    socialEvidence: true,
  });
  appendRewardContribution(contribution2);
  updateRewardContributionReview(contribution2.id, "approved", "reviewer-1", null, null, 30);

  // Create contributions for participant 2
  // 100 points total, 10 points social (10% < 15% cap, no reduction)
  const contribution3 = buildRewardContribution({
    participantId: "participant-2",
    seasonId: "season-1",
    categoryId: "matched-task",
    title: "Task 2",
    description: "Task description",
  });
  appendRewardContribution(contribution3);
  updateRewardContributionReview(contribution3.id, "approved", "reviewer-1", null, null, 90);

  const contribution4 = buildRewardContribution({
    participantId: "participant-2",
    seasonId: "season-1",
    categoryId: "matched-task",
    title: "Social post 2",
    description: "Social content 2",
    socialEvidence: true,
  });
  appendRewardContribution(contribution4);
  updateRewardContributionReview(contribution4.id, "approved", "reviewer-1", null, null, 10);

  // Calculate payout
  const payout = calculateSeasonPayoutRows(
    "season-1",
    "1000 USDC",
    "Anti-farm review complete",
    "admin-1",
    participants,
  );

  // Check payout structure
  assert.ok(payout.id.startsWith("payout_"));
  assert.equal(payout.seasonId, "season-1");
  assert.equal(payout.seasonTokenPool, "1000 USDC");
  assert.equal(payout.rowCount, 2);
  assert.equal(payout.createdBy, "admin-1");
  assert.equal(payout.antiFarmReviewComplete, true);
  assert.equal(payout.antiFarmReviewNotes, "Anti-farm review complete");

  // Find participant rows
  const row1 = payout.rows.find((r) => r.participantId === "participant-1");
  const row2 = payout.rows.find((r) => r.participantId === "participant-2");

  assert.ok(row1);
  assert.ok(row2);

  // Participant 1: 100 total points, 30 social points
  // Social cap: 15% of 100 = 15 points allowed
  // Excess: 30 - 15 = 15 points
  // Capped total: 100 - 15 = 85 points
  assert.equal(row1.points, 85);

  // Participant 2: 100 total points, 10 social points  
  // Social cap: 15% of 100 = 15 points allowed
  // No excess (10 < 15), so total stays 100 points
  assert.equal(row2.points, 100);

  // Total points should be 85 + 100 = 185
  assert.equal(payout.totalPoints, 185);

  cleanupTestFiles();
});