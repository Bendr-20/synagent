import assert from "node:assert/strict";
import test from "node:test";

async function loadRewardConfig() {
  return import(new URL("./cred-bureau-rewards-config.ts", import.meta.url).href);
}

test("Cred Bureau reward config locks the beta pool, seasons, and categories", async () => {
  const { CRED_BUREAU_REWARD_CONFIG } = await loadRewardConfig();
  assert.equal(CRED_BUREAU_REWARD_CONFIG.totalPoolPercent, 1);
  assert.equal(CRED_BUREAU_REWARD_CONFIG.betaDurationWeeks, 6);
  assert.equal(CRED_BUREAU_REWARD_CONFIG.seasons.length, 2);
  assert.equal(CRED_BUREAU_REWARD_CONFIG.seasons[0].durationWeeks, 3);
  assert.equal(CRED_BUREAU_REWARD_CONFIG.seasons[0].allocationShare, 0.4);
  assert.equal(CRED_BUREAU_REWARD_CONFIG.seasons[1].durationWeeks, 3);
  assert.equal(CRED_BUREAU_REWARD_CONFIG.seasons[1].allocationShare, 0.6);
  assert.equal(CRED_BUREAU_REWARD_CONFIG.socialContributionSeasonPayoutCapShare, 0.15);
  assert.ok(CRED_BUREAU_REWARD_CONFIG.categories.some((category: { id: string }) => category.id === "human-ai-task"));
});
