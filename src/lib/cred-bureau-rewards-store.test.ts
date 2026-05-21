import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

async function loadRewardStore() {
  return import(new URL("./cred-bureau-rewards-store.ts", import.meta.url).href);
}

function createTempDataDir() {
  const dir = mkdtempSync(join(tmpdir(), "cred-bureau-rewards-test-"));
  const cleanup = () => rmSync(dir, { recursive: true });
  return { dir, cleanup };
}

test("Cred Bureau reward store validates participant wallet format", async (t) => {
  const { dir, cleanup } = createTempDataDir();
  t.after(cleanup);
  const store = await loadRewardStore();

  // valid wallet passes
  const participant = store.createOrUpdateRewardParticipant({
    displayName: "Test User",
    wallet: "0x1234567890123456789012345678901234567890",
  }, { dataDir: dir });
  assert.equal(participant.wallet, "0x1234567890123456789012345678901234567890");

  // missing wallet throws
  assert.throws(
    () => store.createOrUpdateRewardParticipant({
      displayName: "Test",
      wallet: "",
    }, { dataDir: dir }),
    /Wallet is required/,
  );

  // invalid wallet format throws
  assert.throws(
    () => store.createOrUpdateRewardParticipant({
      displayName: "Test",
      wallet: "0x123",
    }, { dataDir: dir }),
    /Wallet must be an EVM address/,
  );
});

test("Cred Bureau reward store validates required fields", async (t) => {
  const { dir, cleanup } = createTempDataDir();
  t.after(cleanup);
  const store = await loadRewardStore();

  const participant = store.createOrUpdateRewardParticipant({
    displayName: "Test",
    wallet: "0x1234567890123456789012345678901234567890",
  }, { dataDir: dir });

  // missing title throws
  assert.throws(
    () => store.appendRewardContribution({
      participantId: participant.id,
      seasonId: "season-1",
      categoryId: "matched-task",
      title: "",
      description: "Description",
    }, { dataDir: dir }),
    /Title is required/,
  );

  // missing description throws
  assert.throws(
    () => store.appendRewardContribution({
      participantId: participant.id,
      seasonId: "season-1",
      categoryId: "matched-task",
      title: "Title",
      description: "",
    }, { dataDir: dir }),
    /Description is required/,
  );
});

test("Cred Bureau reward store rejects invalid category and season", async (t) => {
  const { dir, cleanup } = createTempDataDir();
  t.after(cleanup);
  const store = await loadRewardStore();

  const participant = store.createOrUpdateRewardParticipant({
    displayName: "Test",
    wallet: "0x1234567890123456789012345678901234567890",
  }, { dataDir: dir });

  // invalid category
  assert.throws(
    () => store.appendRewardContribution({
      participantId: participant.id,
      seasonId: "season-1",
      categoryId: "cred-review", // not a valid category (old category)
      title: "Title",
      description: "Description",
    }, { dataDir: dir }),
    /Invalid category/,
  );

  // invalid season
  assert.throws(
    () => store.appendRewardContribution({
      participantId: participant.id,
      seasonId: "season-3",
      categoryId: "matched-task",
      title: "Title",
      description: "Description",
    }, { dataDir: dir }),
    /Invalid season/,
  );
});

test("Cred Bureau reward store enforces social daily cap (2 scored per UTC day)", async (t) => {
  const { dir, cleanup } = createTempDataDir();
  t.after(cleanup);
  const store = await loadRewardStore();

  const participant = store.createOrUpdateRewardParticipant({
    displayName: "Test",
    wallet: "0x1234567890123456789012345678901234567890",
  }, { dataDir: dir });

  // add two social contributions
  const c1 = store.appendRewardContribution({
    participantId: participant.id,
    seasonId: "season-1",
    categoryId: "wildcard",
    title: "Social 1",
    description: "Description",
    socialEvidence: true,
    requestedPoints: 10,
  }, { dataDir: dir });
  assert.equal(c1.assignedPoints, 10);
  assert.equal(c1.payoutEligible, true);

  const c2 = store.appendRewardContribution({
    participantId: participant.id,
    seasonId: "season-1",
    categoryId: "wildcard",
    title: "Social 2",
    description: "Description",
    socialEvidence: true,
    requestedPoints: 5,
  }, { dataDir: dir });
  assert.equal(c2.assignedPoints, 5);
  assert.equal(c2.payoutEligible, true);

  // third social contribution should be stored but points zero, payoutEligible false
  const c3 = store.appendRewardContribution({
    participantId: participant.id,
    seasonId: "season-1",
    categoryId: "wildcard",
    title: "Social 3",
    description: "Description",
    socialEvidence: true,
    requestedPoints: 8,
  }, { dataDir: dir });
  assert.equal(c3.assignedPoints, 0);
  assert.equal(c3.payoutEligible, false);
});

test("Cred Bureau reward store handles optional evidence URL", async (t) => {
  const { dir, cleanup } = createTempDataDir();
  t.after(cleanup);
  const store = await loadRewardStore();

  const participant = store.createOrUpdateRewardParticipant({
    displayName: "Test",
    wallet: "0x1234567890123456789012345678901234567890",
  }, { dataDir: dir });

  const withUrl = store.appendRewardContribution({
    participantId: participant.id,
    seasonId: "season-1",
    categoryId: "matched-task",
    title: "With URL",
    description: "Description",
    evidenceUrl: "https://example.com/proof.png",
  }, { dataDir: dir });
  assert.equal(withUrl.evidenceUrl, "https://example.com/proof.png");

  const withoutUrl = store.appendRewardContribution({
    participantId: participant.id,
    seasonId: "season-1",
    categoryId: "matched-task",
    title: "Without URL",
    description: "Description",
  }, { dataDir: dir });
  assert.equal(withoutUrl.evidenceUrl, null);
});
