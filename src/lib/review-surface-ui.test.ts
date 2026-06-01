import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function read(path: string) {
  return fs.readFileSync(path, "utf8");
}

test("reviewer console gives reviewers one browser entry point for every private queue", () => {
  const reviewHome = read("src/app/review/page.tsx");
  const keyConsole = read("src/app/review/review-key-console.tsx");
  const css = read("src/app/globals.css");

  for (const required of [
    "Reviewer Console",
    "Paste reviewer key once",
    "Task requests",
    "Access applications",
    "Reward reports",
    "href: \"/review/matches\"",
    "href: \"/review/cred-bureau\"",
    "href: \"/review/cred-bureau/rewards\"",
  ]) {
    assert.match(`${reviewHome}\n${keyConsole}`, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }

  assert.match(keyConsole, /localStorage\.setItem\("synagent-review-key", trimmed\)/);
  assert.match(keyConsole, /encodeURIComponent\(trimmed\)/);
  assert.match(keyConsole, /router\.push\(`\$\{route\}\?key=\$\{encodeURIComponent\(trimmed\)\}`\)/);
  assert.match(css, /review-console-grid/);
  assert.doesNotMatch(`${reviewHome}\n${keyConsole}`, /SYNAGENT_REVIEW_API_KEY/);
});

test("existing protected Cred Bureau queues point blocked reviewers back to the console", () => {
  const applicantPage = read("src/app/review/cred-bureau/page.tsx");
  const rewardsPage = read("src/app/review/cred-bureau/rewards/page.tsx");

  assert.match(applicantPage, /href="\/review"/);
  assert.match(rewardsPage, /href="\/review"/);
  assert.match(`${applicantPage}\n${rewardsPage}`, /Reviewer Home/);
});

test("Synagent task requests have a keyed browser review queue", () => {
  const matchesPage = read("src/app/review/matches/page.tsx");
  const reviewHome = read("src/app/review/page.tsx");
  const css = read("src/app/globals.css");

  for (const required of [
    "Synagent Task Review Queue",
    "Reviewer key required",
    "getMatchRequests",
    "getNotifications",
    "getReviewApiKey",
    "Ranked candidates",
    "Queued notifications",
    "Contact",
    "Brief",
    "Recommended match",
    "Reviewer Home",
  ]) {
    assert.match(`${matchesPage}\n${reviewHome}`, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }

  assert.match(matchesPage, /const authorized = Boolean\(configuredKey && reviewKey === configuredKey\);/);
  assert.match(matchesPage, /const requests = authorized \? getMatchRequests\(\) : \[\];/);
  assert.match(matchesPage, /const notifications = authorized \? getNotifications\(\) : \[\];/);
  assert.match(matchesPage, /intake\.contact\.email/);
  assert.match(matchesPage, /intake\.contact\.telegram/);
  assert.match(css, /review-match-grid/);
});

test("public redacted view exists for bug reports and product feedback", () => {
  const publicPage = read("src/app/cred-bureau/rewards/public/page.tsx");
  const css = read("src/app/globals.css");

  assert.match(publicPage, /Bug reports/);
  assert.match(publicPage, /Product feedback/);
  assert.match(publicPage, /href="\/cred-bureau\/leaderboard"/);
  assert.doesNotMatch(publicPage, /href="\/cred-bureau\/rewards\/leaderboard"/);
  assert.match(publicPage, /assignedPoints/);
  assert.doesNotMatch(publicPage, /contact/);
  assert.doesNotMatch(publicPage, /wallet/);
  assert.doesNotMatch(publicPage, /evidence/);
  assert.doesNotMatch(publicPage, /payout/);
  assert.match(css, /public-rewards-grid/);
});
