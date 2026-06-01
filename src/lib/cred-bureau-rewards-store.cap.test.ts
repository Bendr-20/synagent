import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { tmpdir } from "node:os";

async function loadRewardStore() {
  return import(new URL("./cred-bureau-rewards-store.ts", import.meta.url).href);
}

const TEST_DATA_DIR = fs.mkdtempSync(path.join(tmpdir(), "synagent-rewards-test-"));
process.env.SYNAGENT_DATA_DIR = TEST_DATA_DIR;
process.on("exit", () => {
  try { fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true }); } catch {}
});
const TEST_CONTRIBUTIONS_PATH = path.join(TEST_DATA_DIR, "cred-bureau-rewards-contributions.json");
const TEST_PARTICIPANTS_PATH = path.join(TEST_DATA_DIR, "cred-bureau-rewards-participants.json");
const TEST_REVIEW_LOG_PATH = path.join(TEST_DATA_DIR, "cred-bureau-rewards-review-log.json");

function cleanupTestFiles() {
  try { fs.unlinkSync(TEST_CONTRIBUTIONS_PATH); } catch {}
  try { fs.unlinkSync(TEST_PARTICIPANTS_PATH); } catch {}
  try { fs.unlinkSync(TEST_REVIEW_LOG_PATH); } catch {}
}

test("Daily social cap applied during review approval", async () => {
  const { buildRewardContribution, appendRewardContribution, updateRewardContributionReview } = await loadRewardStore();
  cleanupTestFiles();

  // Create 2 social contributions
  const contribution1 = buildRewardContribution({
    participantId: "social-participant",
    seasonId: "season-1",
    categoryId: "matched-task",
    title: "Social post 1",
    description: "Great post about Synagent",
    socialEvidence: true,
  });
  appendRewardContribution(contribution1);

  const contribution2 = buildRewardContribution({
    participantId: "social-participant",
    seasonId: "season-1",
    categoryId: "matched-task",
    title: "Social post 2",
    description: "Another great post",
    socialEvidence: true,
  });
  appendRewardContribution(contribution2);

  const contribution3 = buildRewardContribution({
    participantId: "social-participant",
    seasonId: "season-1",
    categoryId: "matched-task",
    title: "Social post 3",
    description: "Third post",
    socialEvidence: true,
  });
  appendRewardContribution(contribution3);

  // Approve first 2 contributions
  const result1 = updateRewardContributionReview(
    contribution1.id,
    "approved",
    "reviewer-1",
    "Good post",
    null,
    10,
  );
  assert.equal(result1.contribution.assignedPoints, 10);
  assert.equal(result1.contribution.payoutEligible, true);

  const result2 = updateRewardContributionReview(
    contribution2.id,
    "approved",
    "reviewer-1",
    "Good post",
    null,
    8,
  );
  assert.equal(result2.contribution.assignedPoints, 8);
  assert.equal(result2.contribution.payoutEligible, true);

  // Third contribution should be capped
  const result3 = updateRewardContributionReview(
    contribution3.id,
    "approved",
    "reviewer-1",
    "Good post",
    null,
    6,
  );
  assert.equal(result3.contribution.assignedPoints, 0);
  assert.equal(result3.contribution.payoutEligible, false);
  assert.match(result3.contribution.reviewerNotes || "", /Daily social cap reached/);

  cleanupTestFiles();
});

test("Low-effort social detection", async () => {
  const { buildRewardContribution } = await loadRewardStore();
  cleanupTestFiles();

  // Test emoji-only
  const emojiContribution = buildRewardContribution({
    participantId: "test-participant",
    seasonId: "season-1",
    categoryId: "matched-task",
    title: "Emoji post",
    description: "🔥",
    socialEvidence: true,
  });
  assert.equal(emojiContribution.assignedPoints, 0);
  assert.equal(emojiContribution.payoutEligible, false);

  // Test "gm"
  const gmContribution = buildRewardContribution({
    participantId: "test-participant",
    seasonId: "season-1",
    categoryId: "matched-task",
    title: "GM post",
    description: "gm",
    socialEvidence: true,
  });
  assert.equal(gmContribution.assignedPoints, 0);
  assert.equal(gmContribution.payoutEligible, false);

  // Test "based"
  const basedContribution = buildRewardContribution({
    participantId: "test-participant",
    seasonId: "season-1",
    categoryId: "matched-task",
    title: "Based post",
    description: "based",
    socialEvidence: true,
  });
  assert.equal(basedContribution.assignedPoints, 0);
  assert.equal(basedContribution.payoutEligible, false);

  // Test non-low-effort social
  const normalContribution = buildRewardContribution({
    participantId: "test-participant",
    seasonId: "season-1",
    categoryId: "matched-task",
    title: "Normal post",
    description: "This is a substantive post about Synagent features",
    socialEvidence: true,
  });
  assert.equal(normalContribution.assignedPoints, 0); // Initially 0
  assert.equal(normalContribution.payoutEligible, false); // Not payout eligible until reviewer approval

  cleanupTestFiles();
});