import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { tmpdir } from "node:os";

async function loadParticipantsStore() {
  return import(new URL("./cred-bureau-rewards-participants-store.ts", import.meta.url).href);
}

const TEST_DATA_DIR = fs.mkdtempSync(path.join(tmpdir(), "synagent-rewards-test-"));
process.env.SYNAGENT_DATA_DIR = TEST_DATA_DIR;
process.on("exit", () => {
  try { fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true }); } catch {}
});
const TEST_PARTICIPANTS_PATH = path.join(TEST_DATA_DIR, "cred-bureau-rewards-participants.json");

function cleanupTestFiles() {
  try { fs.unlinkSync(TEST_PARTICIPANTS_PATH); } catch {}
}

test("Participants store validates wallet format", async () => {
  const { buildRewardParticipant } = await loadParticipantsStore();
  cleanupTestFiles();

  // Test invalid wallet (wrong length)
  try {
    buildRewardParticipant({
      displayName: "Test Participant",
      telegram: "@test",
      wallet: "0x123",
    });
    assert.fail("Should have thrown error for invalid wallet");
  } catch (error: any) {
    assert.match(error.message, /Wallet must be an EVM address/);
  }

  // Test invalid wallet (no 0x prefix)
  try {
    buildRewardParticipant({
      displayName: "Test Participant",
      telegram: "@test",
      wallet: "1234567890123456789012345678901234567890",
    });
    assert.fail("Should have thrown error for invalid wallet");
  } catch (error: any) {
    assert.match(error.message, /Wallet must be an EVM address/);
  }

  // Test valid wallet
  const mixedCaseWallet = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
  const participant = buildRewardParticipant({
    displayName: "Test Participant",
    telegram: "@test",
    wallet: mixedCaseWallet,
  });
  assert.ok(participant.id.startsWith("cbrp_"));
  assert.equal(participant.displayName, "Test Participant");
  assert.equal(participant.telegram, "@test");
  assert.equal(participant.wallet, mixedCaseWallet);
  assert.equal(participant.status, "active");

  cleanupTestFiles();
});

test("Participants store requires display name and contact info", async () => {
  const { buildRewardParticipant } = await loadParticipantsStore();
  cleanupTestFiles();

  // Test missing display name
  try {
    buildRewardParticipant({
      displayName: "",
      telegram: "@test",
      wallet: "0x1111111111111111111111111111111111111111",
    });
    assert.fail("Should have thrown error for missing display name");
  } catch (error: any) {
    assert.match(error.message, /Display name is required/);
  }

  // Test missing contact info
  try {
    buildRewardParticipant({
      displayName: "Test Participant",
      wallet: "0x1111111111111111111111111111111111111111",
    });
    assert.fail("Should have thrown error for missing contact info");
  } catch (error: any) {
    assert.match(error.message, /Telegram handle or email is required/);
  }

  cleanupTestFiles();
});