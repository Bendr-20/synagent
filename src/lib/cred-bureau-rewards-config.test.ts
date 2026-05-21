import assert from "node:assert/strict";
import test from "node:test";

async function loadRewardConfig() {
  return import(new URL("./cred-bureau-rewards-config.ts", import.meta.url).href);
}

test("Cred Bureau reward config locks the beta pool, seasons, and category allocation", async () => {
  const { CRED_BUREAU_REWARD_CONFIG } = await loadRewardConfig();
  assert.equal(CRED_BUREAU_REWARD_CONFIG.totalPoolPercent, 1);
  assert.equal(CRED_BUREAU_REWARD_CONFIG.betaDurationWeeks, 6);
  assert.equal(CRED_BUREAU_REWARD_CONFIG.seasons.length, 2);
  assert.equal(CRED_BUREAU_REWARD_CONFIG.seasons[0].durationWeeks, 3);
  assert.equal(CRED_BUREAU_REWARD_CONFIG.seasons[0].allocationShare, 0.4);
  assert.equal(CRED_BUREAU_REWARD_CONFIG.seasons[1].durationWeeks, 3);
  assert.equal(CRED_BUREAU_REWARD_CONFIG.seasons[1].allocationShare, 0.6);
  assert.equal(CRED_BUREAU_REWARD_CONFIG.socialContributionSeasonPayoutCapShare, 0.15);
  assert.equal(CRED_BUREAU_REWARD_CONFIG.socialContribution.maxScoredPerUtcDay, 2);
  assert.equal(CRED_BUREAU_REWARD_CONFIG.socialContribution.role, "supporting-signal-only");

  assert.deepEqual(
    CRED_BUREAU_REWARD_CONFIG.categories.map((category) => ({ id: category.id, allocationShare: category.allocationShare })),
    [
      { id: "matched-task", allocationShare: 0.5 },
      { id: "task-creation", allocationShare: 0.15 },
      { id: "bug-friction-log", allocationShare: 0.15 },
      { id: "product-feedback", allocationShare: 0.1 },
      { id: "referral", allocationShare: 0.05 },
      { id: "wildcard", allocationShare: 0.05 },
    ],
  );

  const categoryAllocation = CRED_BUREAU_REWARD_CONFIG.categories.reduce((total, category) => total + category.allocationShare, 0);
  assert.equal(categoryAllocation, 1);
});
