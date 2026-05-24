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

test("Review transitions and review log", async () => {
  const { buildRewardContribution, appendRewardContribution, updateRewardContributionReview, getRewardReviewLog } = await loadRewardStore();
  cleanupTestFiles();

  // Create a contribution
  const contribution = buildRewardContribution({
    participantId: "test-participant",
    seasonId: "season-1",
    categoryId: "matched-task",
    title: "Test task",
    description: "Test description",
  });
  appendRewardContribution(contribution);

  // Test transition from submitted to approved
  const result1 = updateRewardContributionReview(
    contribution.id,
    "approved",
    "reviewer-1",
    "Good contribution",
    "No farm detected",
    25,
  );
  assert.equal(result1.contribution.status, "approved");
  assert.equal(result1.contribution.assignedPoints, 25);
  assert.equal(result1.contribution.reviewedBy, "reviewer-1");
  assert.ok(result1.contribution.approvedAt);
  assert.equal(result1.reviewLogEntry.previousStatus, "submitted");
  assert.equal(result1.reviewLogEntry.status, "approved");
  assert.equal(result1.reviewLogEntry.assignedPoints, 25);

  // Check review log
  const reviewLog = getRewardReviewLog();
  assert.equal(reviewLog.length, 1);
  assert.equal(reviewLog[0].contributionId, contribution.id);
  assert.equal(reviewLog[0].status, "approved");

  // Test cannot transition from approved to rejected
  try {
    updateRewardContributionReview(
      contribution.id,
      "rejected",
      "reviewer-2",
      "Rejecting",
      null,
      0,
    );
    assert.fail("Should not allow transition from approved to rejected");
  } catch (error: any) {
    assert.match(error.message, /Cannot transition from approved to rejected/);
  }

  cleanupTestFiles();
});

test("Review transitions from needs-info", async () => {
  const { buildRewardContribution, appendRewardContribution, updateRewardContributionReview, getRewardReviewLog } = await loadRewardStore();
  cleanupTestFiles();

  // Create a contribution
  const contribution = buildRewardContribution({
    participantId: "test-participant",
    seasonId: "season-1",
    categoryId: "matched-task",
    title: "Test task",
    description: "Test description",
  });
  appendRewardContribution(contribution);

  // First transition to needs-info
  const result1 = updateRewardContributionReview(
    contribution.id,
    "needs-info",
    "reviewer-1",
    "Need more details",
    null,
  );
  assert.equal(result1.contribution.status, "needs-info");
  assert.ok(result1.contribution.needsInfoAt);
  assert.equal(result1.reviewLogEntry.status, "needs-info");

  // Then transition from needs-info to approved
  const result2 = updateRewardContributionReview(
    contribution.id,
    "approved",
    "reviewer-1",
    "Now approved",
    "Checked",
    30,
  );
  assert.equal(result2.contribution.status, "approved");
  assert.equal(result2.reviewLogEntry.previousStatus, "needs-info");

  // Check total review log entries
  const reviewLog = getRewardReviewLog();
  assert.equal(reviewLog.length, 2);

  cleanupTestFiles();
});