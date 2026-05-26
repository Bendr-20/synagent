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
  assert.match(leaderboardPage, /export const dynamic = "force-dynamic";/);

  for (const publicField of [
    /Rank/i,
    /Name/i,
    /Points/i,
    /Completed/i,
    /How points are earned/i,
    /Rewards scoring guide/i,
  ]) {
    assert.match(leaderboardPage, publicField);
  }

  for (const removedTableField of [
    /Display name/i,
    /Season points/i,
    /Total approved contributions/i,
    /Top category/i,
    /Last approved contribution date/i,
  ]) {
    assert.doesNotMatch(leaderboardPage, removedTableField);
  }
});

test("Cred Bureau leaderboard uses compact alternating grid rows and contributor detail pages", () => {
  const leaderboardPage = read("src/app/cred-bureau/leaderboard/page.tsx");
  const detailPage = read("src/app/cred-bureau/leaderboard/[participantId]/page.tsx");
  const css = read("src/app/globals.css");

  assert.match(leaderboardPage, /cred-bureau-leaderboard-row/);
  assert.match(leaderboardPage, /cred-bureau-leaderboard-card/);
  assert.match(leaderboardPage, /cred-bureau-leaderboard-card--\$\{index % 4\}/);
  assert.match(leaderboardPage, /gridTemplateColumns: "minmax\(0,1fr\) 96px 88px"/);
  assert.match(leaderboardPage, /minHeight: "36px"/);
  assert.match(leaderboardPage, /Rank \/ Name/);
  assert.match(leaderboardPage, /href=\{`\/cred-bureau\/leaderboard\/\$\{row\.participantId\}`\}/);
  assert.doesNotMatch(leaderboardPage, /View completed work/);
  assert.match(css, /grid-template-columns: minmax\(0,1fr\) 64px 56px !important/);
  assert.match(leaderboardPage, /CRED_BUREAU_REWARD_CONFIG\.categories\.map/);
  assert.match(leaderboardPage, /Social posts are supporting evidence only/);
  assert.doesNotMatch(leaderboardPage, /Public standings show rank, name/);
  assert.match(css, /cred-bureau-leaderboard-card--0/);
  assert.match(css, /rgba\(110,236,216,0\.2\)/);
  assert.match(css, /rgba\(180,144,255,0\.18\)/);
  assert.match(css, /rgba\(128,208,255,0\.2\)/);
  assert.match(css, /rgba\(245,160,208,0\.17\)/);

  for (const required of [
    "Completed work",
    "Approved contributions",
    "Points awarded",
    "Back to leaderboard",
  ]) {
    assert.match(detailPage, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }

  assert.doesNotMatch(detailPage, /wallet/i);
  assert.doesNotMatch(detailPage, /email/i);
  assert.doesNotMatch(detailPage, /reviewer notes/i);
  assert.doesNotMatch(detailPage, /anti-farm notes/i);
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

test("Cred Bureau pages have small public toggle for rewards / leaderboard navigation", () => {
  const rewardsPage = read("src/app/cred-bureau/rewards/page.tsx");
  const leaderboardPage = read("src/app/cred-bureau/leaderboard/page.tsx");
  const credBureauPage = read("src/app/cred-bureau/page.tsx");
  
  // each page should have a small nav bar that toggles between /cred-bureau/rewards and /cred-bureau/leaderboard
  const expectedPattern = /Rewards[\s\S]*Public leaderboard|Public leaderboard[\s\S]*Rewards/i;
  assert.match(rewardsPage, expectedPattern);
  assert.match(leaderboardPage, expectedPattern);
  assert.match(credBureauPage, expectedPattern);
  
  // desktop rewards page should have a "View leaderboard" link; leaderboard page should have a "View rewards" link
  assert.match(rewardsPage, /href="\/cred-bureau\/leaderboard"/);
  assert.match(leaderboardPage, /href="\/cred-bureau\/rewards"/);
  assert.match(credBureauPage, /href="\/cred-bureau\/rewards"/);
  assert.match(credBureauPage, /href="\/cred-bureau\/leaderboard"/);
  
  // no placeholder href="#" in those pages
  assert.doesNotMatch(rewardsPage, /href="#"/);
  assert.doesNotMatch(leaderboardPage, /href="#"/);
});

test("Cred Bureau rewards protected review queue exposes manual reviewer workflow", () => {
  const reviewPage = read("src/app/review/cred-bureau/rewards/page.tsx");
  const reviewControls = read("src/app/review/cred-bureau/rewards/reward-review-controls.tsx");
  const existingReviewPage = read("src/app/review/cred-bureau/page.tsx");
  const css = read("src/app/globals.css");
  const source = [reviewPage, reviewControls, existingReviewPage, css].join("\n");

  for (const required of [
    "Reviewer key required",
    "Contribution queue",
    "Status controls",
    "Assigned points",
    "Anti-farm notes",
    "Weekly checkpoint",
    "Weekly recap prompt/template",
    "Final winners post prompt/template",
    "Payout export form",
    "Anti-farm review confirmation",
    "Manual review required before sending rewards.",
    "Export JSON",
    "Export CSV",
    "href={`/review/cred-bureau/rewards?key=${encodeURIComponent(reviewKey)}`}",
    "cred-bureau-reward-review-grid",
  ]) {
    assert.match(source, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
});

test("Cred Bureau rewards review template links target real docs anchors", () => {
  const reviewPage = read("src/app/review/cred-bureau/rewards/page.tsx");
  const reviewOps = read("docs/cred-bureau-review-ops.md");

  assert.match(reviewPage, /#weekly-recap-template/);
  assert.match(reviewPage, /#final-winners-post-template/);
  assert.match(reviewOps, /^## Weekly recap template$/m);
  assert.match(reviewOps, /^## Final winners post template$/m);

  for (const required of [
    "public-safe",
    "do not include wallets",
    "manual review",
    "anti-farm checks",
    "Cred Bureau weekly checkpoint",
    "Cred Bureau Season [N] final standings",
  ]) {
    assert.match(reviewOps, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }

  for (const disallowed of [
    /automatic payout/i,
    /guaranteed payout/i,
    /claim contract/i,
    /escrow/i,
    /reviewer key:\s*[A-Za-z0-9_-]+/i,
  ]) {
    assert.doesNotMatch(reviewOps, disallowed);
  }
});

test("Cred Bureau rewards docs include required rules and workflow references", () => {
  // This test will fail initially until we create the required docs files
  // We'll check for the existence of the files first
  const files = [
    "docs/cred-bureau-rewards-rules.md",
    "docs/cred-bureau-rewards-review-rubric.md",
    "docs/cred-bureau-rewards-weekly-ops.md",
  ];
  
  for (const file of files) {
    assert.ok(fs.existsSync(file), `Required file ${file} should exist`);
  }
  
  // Now check content of each file
  const rulesContent = read("docs/cred-bureau-rewards-rules.md");
  const rubricContent = read("docs/cred-bureau-rewards-review-rubric.md");
  const weeklyOpsContent = read("docs/cred-bureau-rewards-weekly-ops.md");
  
  // Check for required terms in rules
  for (const required of [
    "1%",
    "6-week",
    "2 seasons",
    "3 weeks",
    "40/60",
    "weekly checkpoint",
    "manual review",
    "manual anti-farm review",
    "no guaranteed rewards",
  ]) {
    assert.match(rulesContent, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
  
  // Check for required terms in rubric
  for (const required of [
    "25-100",
    "10-40",
    "10-60",
    "10-50",
    "10-30",
    "50% allocation",
    "15% allocation",
    "10% allocation",
    "5% allocation",
    "social scoring",
    "original post",
    "quote post",
    "substantive reply",
    "emoji-only",
    "one-word",
    "simple reply",
    "quality multiplier",
    "max 2 scored social contributions",
    "max 15%",
    "duplicate",
    "spam",
    "evidence quality",
    "conflict notes",
    "payout eligible",
    "anti-farm review checklist",
  ]) {
    assert.match(rubricContent, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
  
  // Check for required terms in weekly ops
  for (const required of [
    "weekly checkpoint",
    "weekly recap",
    "final winners post",
  ]) {
    assert.match(weeklyOpsContent, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
});
