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

test("Basic reward store functionality", async () => {
  const { buildRewardContribution, appendRewardContribution, getRewardContributions } = await loadRewardStore();
  cleanupTestFiles();

  // Test basic contribution creation
  const contribution = buildRewardContribution({
    participantId: "test-participant",
    seasonId: "season-1",
    categoryId: "matched-task",
    title: "Test task",
    description: "Test description",
  });
  
  assert.ok(contribution.id.startsWith("cbrc_"));
  assert.equal(contribution.participantId, "test-participant");
  assert.equal(contribution.seasonId, "season-1");
  assert.equal(contribution.categoryId, "matched-task");
  assert.equal(contribution.title, "Test task");
  assert.equal(contribution.description, "Test description");
  assert.equal(contribution.evidenceUrl, null);
  assert.equal(contribution.socialEvidence, false);
  assert.equal(contribution.assignedPoints, 0);
  assert.equal(contribution.status, "submitted");
  assert.equal(contribution.payoutEligible, false);

  // Append and retrieve
  appendRewardContribution(contribution);
  const allContributions = getRewardContributions();
  assert.equal(allContributions.length, 1);
  assert.equal(allContributions[0].id, contribution.id);

  cleanupTestFiles();
});

test("Evidence URL validation", async () => {
  const { buildRewardContribution } = await loadRewardStore();
  cleanupTestFiles();

  // Test invalid evidence URL format
  try {
    buildRewardContribution({
      participantId: "test-participant",
      seasonId: "season-1",
      categoryId: "matched-task",
      title: "Test task",
      description: "Test description",
      evidenceUrl: "invalid-url",
    });
    assert.fail("Should have thrown error for invalid evidence URL");
  } catch (error: any) {
    assert.match(error.message, /Evidence URL must start with http/);
  }

  // Test valid evidence URL
  const contribution = buildRewardContribution({
    participantId: "test-participant",
    seasonId: "season-1",
    categoryId: "matched-task",
    title: "Test task",
    description: "Test description",
    evidenceUrl: "https://example.com/evidence",
  });
  assert.equal(contribution.evidenceUrl, "https://example.com/evidence");

  cleanupTestFiles();
});