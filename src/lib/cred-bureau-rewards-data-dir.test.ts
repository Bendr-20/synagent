import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

async function loadRewardStore() {
  return import(new URL(`./cred-bureau-rewards-store.ts?data-dir-${Date.now()}-${Math.random()}`, import.meta.url).href);
}

async function loadRewardParticipantsStore() {
  return import(new URL(`./cred-bureau-rewards-participants-store.ts?data-dir-${Date.now()}-${Math.random()}`, import.meta.url).href);
}

test("reward store writes to SYNAGENT_DATA_DIR instead of the process cwd data folder", async (t) => {
  const originalCwd = process.cwd();
  const originalDataDir = process.env.SYNAGENT_DATA_DIR;
  const fakeCwd = mkdtempSync(path.join(tmpdir(), "synagent-fake-cwd-"));
  const isolatedDataDir = mkdtempSync(path.join(tmpdir(), "synagent-rewards-data-"));

  t.after(() => {
    process.chdir(originalCwd);
    if (originalDataDir === undefined) delete process.env.SYNAGENT_DATA_DIR;
    else process.env.SYNAGENT_DATA_DIR = originalDataDir;
    rmSync(fakeCwd, { recursive: true, force: true });
    rmSync(isolatedDataDir, { recursive: true, force: true });
  });

  process.chdir(fakeCwd);
  process.env.SYNAGENT_DATA_DIR = isolatedDataDir;

  const store = await loadRewardStore();
  const contribution = store.buildRewardContribution({
    participantId: "test-participant",
    seasonId: "season-1",
    categoryId: "matched-task",
    title: "Isolated data dir test",
    description: "This must not touch the repository data folder.",
  });

  store.appendRewardContribution(contribution);

  const isolatedContributionsPath = path.join(isolatedDataDir, "cred-bureau-rewards-contributions.json");
  const cwdContributionsPath = path.join(fakeCwd, "data", "cred-bureau-rewards-contributions.json");

  assert.ok(fs.existsSync(isolatedContributionsPath));
  assert.equal(fs.existsSync(cwdContributionsPath), false);
});


test("reward participants store writes to SYNAGENT_DATA_DIR instead of the process cwd data folder", async (t) => {
  const originalCwd = process.cwd();
  const originalDataDir = process.env.SYNAGENT_DATA_DIR;
  const fakeCwd = mkdtempSync(path.join(tmpdir(), "synagent-fake-cwd-"));
  const isolatedDataDir = mkdtempSync(path.join(tmpdir(), "synagent-rewards-data-"));

  t.after(() => {
    process.chdir(originalCwd);
    if (originalDataDir === undefined) delete process.env.SYNAGENT_DATA_DIR;
    else process.env.SYNAGENT_DATA_DIR = originalDataDir;
    rmSync(fakeCwd, { recursive: true, force: true });
    rmSync(isolatedDataDir, { recursive: true, force: true });
  });

  process.chdir(fakeCwd);
  process.env.SYNAGENT_DATA_DIR = isolatedDataDir;

  const store = await loadRewardParticipantsStore();
  const participant = store.buildRewardParticipant({
    displayName: "Isolated participant",
    wallet: "0x0000000000000000000000000000000000000001",
    telegram: "isolated",
  });

  store.appendRewardParticipant(participant);

  const isolatedParticipantsPath = path.join(isolatedDataDir, "cred-bureau-rewards-participants.json");
  const cwdParticipantsPath = path.join(fakeCwd, "data", "cred-bureau-rewards-participants.json");

  assert.ok(fs.existsSync(isolatedParticipantsPath));
  assert.equal(fs.existsSync(cwdParticipantsPath), false);
});

test("reward review page reads payout exports through the shared data dir", () => {
  const reviewPage = fs.readFileSync("src/app/review/cred-bureau/rewards/page.tsx", "utf8");

  assert.match(reviewPage, /SYNAGENT_DATA_DIR/);
  assert.doesNotMatch(reviewPage, /path\.join\(process\.cwd\(\), "data", "cred-bureau-payout-exports\.json"\)/);
});


test("reward store snapshots the previous rewards JSON before overwriting it", async (t) => {
  const originalDataDir = process.env.SYNAGENT_DATA_DIR;
  const isolatedDataDir = mkdtempSync(path.join(tmpdir(), "synagent-rewards-backup-"));

  t.after(() => {
    if (originalDataDir === undefined) delete process.env.SYNAGENT_DATA_DIR;
    else process.env.SYNAGENT_DATA_DIR = originalDataDir;
    rmSync(isolatedDataDir, { recursive: true, force: true });
  });

  process.env.SYNAGENT_DATA_DIR = isolatedDataDir;
  const contributionsPath = path.join(isolatedDataDir, "cred-bureau-rewards-contributions.json");
  const originalRows = [
    {
      id: "existing-contribution",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
      participantId: "existing-participant",
      seasonId: "season-1",
      categoryId: "product-feedback",
      title: "Existing report",
      description: "This row must survive in the automatic backup.",
      evidenceUrl: null,
      socialEvidence: false,
      requestedPoints: null,
      assignedPoints: 0,
      status: "submitted",
      payoutEligible: false,
    },
  ];
  fs.mkdirSync(isolatedDataDir, { recursive: true });
  fs.writeFileSync(contributionsPath, `${JSON.stringify(originalRows, null, 2)}\n`);

  const store = await loadRewardStore();
  const newContribution = store.buildRewardContribution({
    participantId: "new-participant",
    seasonId: "season-1",
    categoryId: "product-feedback",
    title: "New report",
    description: "Writing this should snapshot the previous file first.",
  });

  store.appendRewardContribution(newContribution);

  const backupDir = path.join(isolatedDataDir, "auto-backups");
  const backups = fs.readdirSync(backupDir).filter((name) => name.startsWith("cred-bureau-rewards-contributions.json.") && name.endsWith(".bak"));

  assert.equal(backups.length, 1);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(backupDir, backups[0]), "utf8")), originalRows);
});
