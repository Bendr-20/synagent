import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function read(path: string) {
  return fs.readFileSync(path, "utf8");
}

test("Cred Bureau rewards public copy is accurate, manual, and modest", () => {
  const rewardsPage = read("src/app/cred-bureau/rewards/page.tsx");
  const submissionForm = read("src/app/cred-bureau/rewards/reward-submission-form.tsx");
  const leaderboardPage = read("src/app/cred-bureau/leaderboard/page.tsx");
  const publicCopy = [rewardsPage, submissionForm, leaderboardPage].join("\n");

  for (const required of [
    "1% of the $CRED supply",
    "2 seasons",
    "3 weeks",
    "40/60",
    "leaderboard",
    "weekly checkpoint",
    "manual review before payouts",
    "last chance to apply",
  ]) {
    assert.match(publicCopy, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }

  for (const disallowed of [
    /automatic payout/i,
    /guaranteed payout/i,
    /claim contract/i,
    /escrow/i,
  ]) {
    assert.doesNotMatch(publicCopy, disallowed);
  }
});

test("Cred Bureau public leaderboard source avoids private reviewer and participant fields", () => {
  const leaderboardPage = read("src/app/cred-bureau/leaderboard/page.tsx");

  assert.doesNotMatch(leaderboardPage, /wallet/i);
  assert.doesNotMatch(leaderboardPage, /email/i);
  assert.doesNotMatch(leaderboardPage, /reviewer notes/i);
  assert.doesNotMatch(leaderboardPage, /anti-farm notes/i);
  assert.doesNotMatch(leaderboardPage, /reviewer key/i);

  for (const publicField of [
    /Rank/i,
    /Display name/i,
    /Season points/i,
    /Total approved contributions/i,
    /Top category/i,
    /Last approved contribution date/i,
  ]) {
    assert.match(leaderboardPage, publicField);
  }
});

test("Cred Bureau rewards links are exposed from public surfaces without changing the hero", () => {
  const homePage = read("src/app/page.tsx");
  const credBureauPage = read("src/app/cred-bureau/page.tsx");
  const css = read("src/app/globals.css");

  assert.match(homePage, /Build with AI\.\s*<\/span>/);
  assert.match(homePage, /Refine with Humans\.\s*<\/span>/);
  assert.match(homePage, /href="\/cred-bureau\/rewards"/);
  assert.match(homePage, /href="\/cred-bureau\/leaderboard"/);
  assert.match(credBureauPage, /href="\/cred-bureau\/rewards"/);
  assert.match(credBureauPage, /href="\/cred-bureau\/leaderboard"/);
  assert.match(css, /cred-bureau-rewards-grid/);
  assert.match(css, /cred-bureau-leaderboard-row/);
});
