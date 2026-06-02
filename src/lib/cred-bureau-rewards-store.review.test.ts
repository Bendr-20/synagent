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

test("Store rejects transitions from terminal statuses (approved/rejected)", async () => {
  const { buildRewardContribution, appendRewardContribution, updateRewardContributionReview } = await loadRewardStore();
  cleanupTestFiles();

  const contribution = buildRewardContribution({
    participantId: "test-participant",
    seasonId: "season-1",
    categoryId: "matched-task",
    title: "Test task",
    description: "Test description",
  });
  appendRewardContribution(contribution);

  // First approve
  const result1 = updateRewardContributionReview(
    contribution.id,
    "approved",
    "reviewer-1",
    "Approve",
    null,
    10,
  );
  assert.equal(result1.contribution.status, "approved");

  // Attempt to transition from approved to needs-info
  try {
    updateRewardContributionReview(
      contribution.id,
      "needs-info",
      "reviewer-2",
      "Reopen",
      null,
    );
    assert.fail("Should not allow transition from approved to needs-info");
  } catch (error: any) {
    assert.match(error.message, /Cannot transition from approved to needs-info/);
  }

  // Create a rejected contribution
  const contribution2 = buildRewardContribution({
    participantId: "test-participant-2",
    seasonId: "season-1",
    categoryId: "task-creation",
    title: "Another",
    description: "Another",
  });
  appendRewardContribution(contribution2);
  const result2 = updateRewardContributionReview(
    contribution2.id,
    "rejected",
    "reviewer-1",
    "Reject",
    null,
    0,
  );
  assert.equal(result2.contribution.status, "rejected");

  // Attempt to transition from rejected to approved
  try {
    updateRewardContributionReview(
      contribution2.id,
      "approved",
      "reviewer-2",
      "Approve later",
      null,
      5,
    );
    assert.fail("Should not allow transition from rejected to approved");
  } catch (error: any) {
    assert.match(error.message, /Cannot transition from rejected to approved/);
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
test("Suggested reward review gives reviewers a server-side score and reason", async () => {
  const { buildRewardContribution, buildSuggestedRewardReview } = await loadRewardStore();
  cleanupTestFiles();

  const contribution = buildRewardContribution({
    participantId: "test-participant",
    seasonId: "season-1",
    categoryId: "product-feedback",
    title: "Approval workflow feedback",
    description: "Detailed feedback with implementation suggestion that changes reviewer workflow and reduces manual scoring friction.",
    evidenceUrl: "https://example.com/evidence",
    requestedPoints: 47,
  });

  const suggestion = buildSuggestedRewardReview(contribution);

  assert.equal(suggestion.suggestedPoints, 47);
  assert.equal(suggestion.approveSuggestedAvailable, true);
  assert.match(suggestion.suggestedReason, /Product-changing feedback/i);
  assert.match(suggestion.suggestedReason, /requested 47/i);
  assert.deepEqual(suggestion.reviewFlags, []);

  cleanupTestFiles();
});

test("Approve Suggested applies the same server-generated score that review cards display", async () => {
  const { buildRewardContribution, appendRewardContribution, buildSuggestedRewardReview, updateRewardContributionReview } = await loadRewardStore();
  cleanupTestFiles();

  const contribution = buildRewardContribution({
    participantId: "test-participant",
    seasonId: "season-1",
    categoryId: "bug-friction-log",
    title: "Critical bug report with repro",
    description: "Critical blocking bug report with reproduction steps, workaround, and suggested fix for reviewers.",
    evidenceUrl: "https://example.com/bug-report",
  });
  appendRewardContribution(contribution);

  const suggestion = buildSuggestedRewardReview(contribution);
  assert.equal(suggestion.suggestedPoints, 60);

  const result = updateRewardContributionReview(
    contribution.id,
    "approved",
    "reviewer-1",
    "Approved suggested score",
    "No farm detected",
    5,
    true,
  );

  assert.equal(result.contribution.status, "approved");
  assert.equal(result.contribution.assignedPoints, suggestion.suggestedPoints);
  assert.equal(result.contribution.payoutEligible, true);
  assert.match(result.contribution.reviewerNotes || "", /Approved suggested score/);
  assert.equal(result.reviewLogEntry.assignedPoints, suggestion.suggestedPoints);

  cleanupTestFiles();
});

test("Wildcard without requested points requires manual review instead of Approve Suggested", async () => {
  const { buildRewardContribution, buildSuggestedRewardReview, appendRewardContribution, updateRewardContributionReview } = await loadRewardStore();
  cleanupTestFiles();

  const contribution = buildRewardContribution({
    participantId: "test-participant",
    seasonId: "season-1",
    categoryId: "wildcard",
    title: "Unusual contribution",
    description: "Something useful but not enough information for a deterministic score.",
  });
  appendRewardContribution(contribution);

  const suggestion = buildSuggestedRewardReview(contribution);
  assert.equal(suggestion.suggestedPoints, null);
  assert.equal(suggestion.approveSuggestedAvailable, false);
  assert.match(suggestion.reviewFlags.join(" "), /manual review/i);

  assert.throws(
    () => updateRewardContributionReview(contribution.id, "approved", "reviewer-1", null, null, undefined, true),
    /manual review/i,
  );

  cleanupTestFiles();
});
