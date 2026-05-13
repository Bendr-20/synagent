import assert from "node:assert/strict";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import test from "node:test";

const TEST_PROFILE_URL = "https://helixa.xyz/h/cred-bureau-test";
const TEST_PRIVY_PROFILE_URL = "https://helixa.xyz/h/did%3Aprivy%3Acmogsl16503bq0ck09ck2f6dm";
const TEST_OPTIONAL_PROFILE_TELEGRAM = "@credreviewer";

test("Cred Bureau application is linked from public Synagent entry points", () => {
  const homePage = fs.readFileSync("src/app/page.tsx", "utf8");
  const siteShell = fs.readFileSync("src/components/site-shell.tsx", "utf8");
  const credBureauForm = fs.readFileSync("src/app/cred-bureau/cred-bureau-application-form.tsx", "utf8");
  const credBureauPage = fs.readFileSync("src/app/cred-bureau/page.tsx", "utf8");
  const reviewStatusControls = fs.readFileSync("src/app/review/cred-bureau/review-status-controls.tsx", "utf8");

  assert.match(homePage, /href=\"\/cred-bureau\"/);
  assert.doesNotMatch(siteShell, /href=\"\/cred-bureau\"/);
  assert.doesNotMatch(siteShell, />\s*CONNECT\s*</i);
  assert.match(siteShell, /Submit Request/i);
  assert.match(credBureauForm, /Load from Helixa Profile/i);
  assert.match(credBureauForm, /fetch\("https:\/\/api\.helixa\.xyz\/api\/v2\/human\//i);
  assert.doesNotMatch(credBureauPage, /View Synagent Beta/i);
  assert.doesNotMatch(credBureauPage, /href=\"\/match\?category=mvp-build\"/);
  assert.doesNotMatch(`${credBureauForm}\n${credBureauPage}`, /source=cred-bureau/);
  assert.doesNotMatch(`${credBureauForm}\n${credBureauPage}`, /First create|do not create separate profiles|reviewer and operator bench/i);
  assert.match(reviewStatusControls, /Close Review Box/i);
  assert.match(reviewStatusControls, /closeReviewBox/i);
});

test("public launch copy stays curated, manual, and modest", () => {
  const homePage = fs.readFileSync("src/app/page.tsx", "utf8");
  const credBureauPage = fs.readFileSync("src/app/cred-bureau/page.tsx", "utf8");
  const credBureauForm = fs.readFileSync("src/app/cred-bureau/cred-bureau-application-form.tsx", "utf8");
  const receivedPage = fs.readFileSync("src/app/cred-bureau/received/page.tsx", "utf8");
  const publicCopy = [homePage, credBureauPage, credBureauForm, receivedPage].join("\n");

  assert.match(homePage, /reviewed intake/i);
  assert.match(homePage, /Submit Reviewed Request/i);
  assert.doesNotMatch(homePage, /route it to trusted humans and agents/i);
  assert.match(credBureauPage, /Apply for Manual Review/i);
  assert.match(credBureauPage, /No instant access/i);
  assert.match(credBureauForm, /Manual review only/i);
  assert.match(receivedPage, /No automatic approval/i);
  assert.doesNotMatch(publicCopy, /instant approval|guaranteed routing|escrow|payment promise|open marketplace/i);
});

test("Cred Bureau page has mobile stack rules for the application flow", () => {
  const css = fs.readFileSync("src/app/globals.css", "utf8");

  assert.match(css, /@media \(max-width: 768px\)[\s\S]*\.cred-bureau-hero\s*\{[\s\S]*grid-template-columns:\s*1fr !important;/);
  assert.match(css, /@media \(max-width: 768px\)[\s\S]*\.cred-bureau-flow\s*\{[\s\S]*grid-template-columns:\s*1fr !important;/);
  assert.match(css, /@media \(max-width: 768px\)[\s\S]*\.cred-bureau-form-grid\s*\{[\s\S]*grid-template-columns:\s*1fr !important;/);
});

test("Cred Bureau mobile form uses a multiline conflict disclosure field", () => {
  const credBureauForm = fs.readFileSync("src/app/cred-bureau/cred-bureau-application-form.tsx", "utf8");

  assert.match(credBureauForm, /<textarea\s+name="disclosure"[\s\S]*rows=\{3\}/);
  assert.doesNotMatch(credBureauForm, /<input\s+name="disclosure"/);
  assert.match(credBureauForm, /className="cred-bureau-disclosure-field"/);
});

function getFreePort() {
  return new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Could not allocate test port")));
        return;
      }
      const port = address.port;
      server.close(() => resolve(port));
    });
  });
}

async function waitForServer(port: number, server: ChildProcessWithoutNullStreams) {
  const deadline = Date.now() + 30_000;
  let lastError: unknown = null;

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`next start exited early with code ${server.exitCode}`);
    }

    try {
      const response = await fetch(`http://127.0.0.1:${port}/`);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for test server: ${lastError instanceof Error ? lastError.message : "unknown error"}`);
}

function cleanupTestApplications() {
  const applicationsPath = path.join(process.cwd(), "data", "cred-bureau-applications.json");
  if (!fs.existsSync(applicationsPath)) return;

  const applications = JSON.parse(fs.readFileSync(applicationsPath, "utf8")) as Array<Record<string, any>>;
  fs.writeFileSync(
    applicationsPath,
    `${JSON.stringify(applications.filter((application) => ![TEST_PROFILE_URL, TEST_PRIVY_PROFILE_URL].includes(application?.humanProfile?.url) && ![TEST_OPTIONAL_PROFILE_TELEGRAM, "@privyreviewer"].includes(application?.applicant?.telegram)), null, 2)}\n`,
  );
}

function cleanupTestReviewLog() {
  const reviewLogPath = path.join(process.cwd(), "data", "cred-bureau-review-log.json");
  if (!fs.existsSync(reviewLogPath)) return;

  const logEntries = JSON.parse(fs.readFileSync(reviewLogPath, "utf8")) as Array<Record<string, any>>;
  fs.writeFileSync(
    reviewLogPath,
    `${JSON.stringify(logEntries.filter((entry) => ![TEST_PROFILE_URL, TEST_PRIVY_PROFILE_URL].includes(entry?.humanProfile?.url) && ![TEST_OPTIONAL_PROFILE_TELEGRAM, "@privyreviewer"].includes(entry?.applicant?.telegram)), null, 2)}\n`,
  );
}

test("Cred Bureau application page, API, and review queue require Helixa profile while supporting optional links", { timeout: 60_000 }, async () => {
  cleanupTestApplications();
  cleanupTestReviewLog();
  const port = await getFreePort();
  const server = spawn("./node_modules/.bin/next", ["start", "--port", String(port)], {
    cwd: process.cwd(),
    env: { ...process.env, SYNAGENT_REVIEW_API_KEY: "test-review-key" },
  });

  let logs = "";
  server.stdout.on("data", (chunk) => { logs += chunk.toString(); });
  server.stderr.on("data", (chunk) => { logs += chunk.toString(); });

  try {
    await waitForServer(port, server);

    const page = await fetch(`http://127.0.0.1:${port}/cred-bureau`);
    const html = await page.text();
    assert.equal(page.status, 200);
    assert.match(html, /Apply Now/i);
    assert.match(html, /Apply to Cred Bureau/i);
    assert.match(html, /Helixa human profile is required/i);
    assert.match(html, /LinkedIn/i);
    assert.match(html, /Website/i);
    assert.doesNotMatch(html, /optional for the first pass|Profile missing/i);
    assert.match(html, /https:\/\/helixa\.xyz\/join\/human/i);
    assert.match(html, /https:\/\/helixa\.xyz\/manage\/human/i);
    assert.match(html, /Load from Helixa Profile/i);
    assert.match(html, /manual review/i);
    assert.match(html, /manually added to the group chat/i);
    assert.doesNotMatch(html, /source=cred-bureau|First create|do not create separate profiles|Skills and Cred Signals/i);

    const missingProfileSubmit = await fetch(`http://127.0.0.1:${port}/api/cred-bureau/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicant: {
          name: "Cred Reviewer",
          telegram: TEST_OPTIONAL_PROFILE_TELEGRAM,
          email: "reviewer@example.com",
          role: "Operator / reviewer",
        },
        humanProfile: { url: "" },
        reviewAddendum: {
          whyJoin: "I want to help review early Synagent requests and test Cred-based routing.",
        },
      }),
    });
    const missingProfileBody = await missingProfileSubmit.json() as Record<string, any>;
    assert.equal(missingProfileSubmit.status, 400);
    assert.equal(missingProfileBody.success, false);
    assert.match(missingProfileBody.error, /Helixa human profile URL/i);

    const encodedPrivyProfileSubmit = await fetch(`http://127.0.0.1:${port}/api/cred-bureau/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicant: {
          name: "Privy Reviewer",
          telegram: "@privyreviewer",
          email: "privy-reviewer@example.com",
          role: "Operator / reviewer",
        },
        humanProfile: { url: TEST_PRIVY_PROFILE_URL },
        reviewAddendum: {
          whyJoin: "I want to test the encoded Privy profile URL path that Helixa shares.",
        },
      }),
    });
    const encodedPrivyProfileBody = await encodedPrivyProfileSubmit.json() as Record<string, any>;
    assert.equal(encodedPrivyProfileSubmit.status, 201);
    assert.equal(encodedPrivyProfileBody.success, true);

    const submit = await fetch(`http://127.0.0.1:${port}/api/cred-bureau/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicant: {
          name: "Cred Reviewer",
          telegram: TEST_OPTIONAL_PROFILE_TELEGRAM,
          email: "reviewer@example.com",
          role: "Operator / reviewer",
          linkedinUrl: "https://www.linkedin.com/in/credreviewer",
          websiteUrl: "https://credreviewer.example.com",
        },
        humanProfile: { url: TEST_PROFILE_URL },
        reviewAddendum: {
          whyJoin: "I want to help review early Synagent requests and test Cred-based routing.",
          availability: "A few hours per week during closed beta.",
          disclosure: "No conflicts to disclose.",
        },
      }),
    });
    const body = await submit.json() as Record<string, any>;

    assert.equal(submit.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.status, "pending-review");
    assert.equal(body.groupInviteUrl, null);
    assert.match(body.nextStep, /manual review/i);
    assert.match(body.nextStep, /manually contact approved applicants/i);

    const receivedPage = await fetch(`http://127.0.0.1:${port}/cred-bureau/received?applicationId=${encodeURIComponent(body.applicationId)}`);
    const receivedHtml = await receivedPage.text();
    assert.equal(receivedPage.status, 200);
    assert.match(receivedHtml, /Application Received/i);
    assert.match(receivedHtml, /under review/i);
    assert.match(receivedHtml, new RegExp(body.applicationId));
    assert.doesNotMatch(receivedHtml, /group invite/i);

    const applications = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "cred-bureau-applications.json"), "utf8")) as Array<Record<string, any>>;
    const storedPrivy = applications.find((application) => application?.applicant?.telegram === "@privyreviewer");
    assert.ok(storedPrivy, "expected encoded Privy profile URL application to be persisted");
    assert.equal(storedPrivy.humanProfile.url, TEST_PRIVY_PROFILE_URL);
    const stored = applications.find((application) => application?.applicant?.telegram === TEST_OPTIONAL_PROFILE_TELEGRAM);
    assert.ok(stored, "expected application to be persisted for the team review queue");
    assert.equal(stored.status, "pending-review");
    assert.equal(stored.applicant.name, "Cred Reviewer");
    assert.equal(stored.applicant.telegram, TEST_OPTIONAL_PROFILE_TELEGRAM);
    assert.equal(stored.applicant.email, "reviewer@example.com");
    assert.equal(stored.applicant.role, "Operator / reviewer");
    assert.equal(stored.applicant.linkedinUrl, "https://www.linkedin.com/in/credreviewer");
    assert.equal(stored.applicant.websiteUrl, "https://credreviewer.example.com");
    assert.equal(stored.humanProfile.url, TEST_PROFILE_URL);
    assert.equal(stored.review.profileRequired, true);
    assert.equal(stored.review.profileMissing, false);
    assert.equal(stored.review.manualGroupAddRequired, true);
    assert.equal(stored.review.autoInviteSent, false);
    assert.equal(stored.profileLinks, undefined);
    assert.equal(stored.skills, undefined);
    assert.equal(stored.contact, undefined);

    const unauthorizedReview = await fetch(`http://127.0.0.1:${port}/api/cred-bureau/applications`);
    assert.equal(unauthorizedReview.status, 401);

    const authorizedReview = await fetch(`http://127.0.0.1:${port}/api/cred-bureau/applications`, {
      headers: { Authorization: "Bearer test-review-key" },
    });
    const reviewBody = await authorizedReview.json() as Record<string, any>;
    assert.equal(authorizedReview.status, 200);
    assert.ok(Array.isArray(reviewBody.applications));
    assert.ok(reviewBody.applications.some((application: Record<string, any>) => application?.applicant?.telegram === TEST_OPTIONAL_PROFILE_TELEGRAM));

    const reviewPage = await fetch(`http://127.0.0.1:${port}/review/cred-bureau?key=test-review-key`);
    const reviewHtml = await reviewPage.text();
    assert.equal(reviewPage.status, 200);
    assert.match(reviewHtml, /Cred Bureau Review Queue/i);
    assert.match(reviewHtml, /Cred Reviewer/i);
    assert.match(reviewHtml, /@credreviewer/i);
    assert.match(reviewHtml, /linkedin\.com\/in\/credreviewer/i);
    assert.match(reviewHtml, /credreviewer\.example\.com/i);
    assert.doesNotMatch(reviewHtml, /Profile missing/i);
    assert.match(reviewHtml, /manual group add/i);

    const update = await fetch(`http://127.0.0.1:${port}/api/cred-bureau/applications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer test-review-key" },
      body: JSON.stringify({ id: body.applicationId, status: "approved", reviewerNotes: "Add to TG after profile review." }),
    });
    const updateBody = await update.json() as Record<string, any>;
    assert.equal(update.status, 200);
    assert.equal(updateBody.success, true);
    assert.equal(updateBody.application.status, "approved");
    assert.equal(updateBody.application.review.reviewerNotes, "Add to TG after profile review.");
    assert.equal(updateBody.reviewLogEntry.status, "approved");
    assert.equal(updateBody.reviewLogEntry.previousStatus, "pending-review");
    assert.equal(updateBody.reviewLogEntry.applicant.telegram, TEST_OPTIONAL_PROFILE_TELEGRAM);
    assert.equal(updateBody.reviewLogEntry.humanProfile.url, TEST_PROFILE_URL);
    assert.equal(updateBody.reviewLogEntry.reviewerNotes, "Add to TG after profile review.");

    const reviewLog = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "cred-bureau-review-log.json"), "utf8")) as Array<Record<string, any>>;
    const loggedDecision = reviewLog.find((entry) => entry?.applicationId === body.applicationId && entry?.status === "approved");
    assert.ok(loggedDecision, "expected approved application decision to be persisted in the review log");
    assert.equal(loggedDecision.previousStatus, "pending-review");
    assert.equal(loggedDecision.applicant.name, "Cred Reviewer");
    assert.equal(loggedDecision.applicant.telegram, TEST_OPTIONAL_PROFILE_TELEGRAM);
    assert.equal(loggedDecision.applicant.email, "reviewer@example.com");
    assert.equal(loggedDecision.humanProfile.url, TEST_PROFILE_URL);
    assert.equal(loggedDecision.reviewAddendum.whyJoin, "I want to help review early Synagent requests and test Cred-based routing.");
    assert.equal(loggedDecision.applicationSnapshot.review.manualGroupAddRequired, true);

    const updatedReviewPage = await fetch(`http://127.0.0.1:${port}/review/cred-bureau?key=test-review-key`);
    const updatedReviewHtml = await updatedReviewPage.text();
    assert.equal(updatedReviewPage.status, 200);
    assert.match(updatedReviewHtml, /Decision Log/i);
    assert.match(updatedReviewHtml, /Cred Reviewer/i);
    assert.match(updatedReviewHtml, /approved/i);
    assert.match(updatedReviewHtml, /Add to TG after profile review/i);
    assert.match(updatedReviewHtml, /Close Review Box/i);

    const closeBox = await fetch(`http://127.0.0.1:${port}/api/cred-bureau/applications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer test-review-key" },
      body: JSON.stringify({ id: body.applicationId, closeReviewBox: true }),
    });
    const closeBoxBody = await closeBox.json() as Record<string, any>;
    assert.equal(closeBox.status, 200);
    assert.equal(closeBoxBody.success, true);
    assert.equal(closeBoxBody.application.id, body.applicationId);
    assert.equal(closeBoxBody.application.status, "approved");
    assert.ok(closeBoxBody.application.review.closedAt, "expected closed approved review box to have a closedAt timestamp");
    assert.equal(closeBoxBody.reviewLogEntry, null);

    const closedReviewPage = await fetch(`http://127.0.0.1:${port}/review/cred-bureau?key=test-review-key`);
    const closedReviewHtml = await closedReviewPage.text();
    assert.equal(closedReviewPage.status, 200);
    assert.match(closedReviewHtml, /Closed review boxes hidden/i);
    assert.doesNotMatch(closedReviewHtml, /Close Review Box/i);
    assert.match(closedReviewHtml, /Decision Log/i);
    assert.match(closedReviewHtml, /Add to TG after profile review/i);

    const showClosedReviewPage = await fetch(`http://127.0.0.1:${port}/review/cred-bureau?key=test-review-key&showClosed=1`);
    const showClosedReviewHtml = await showClosedReviewPage.text();
    assert.equal(showClosedReviewPage.status, 200);
    assert.match(showClosedReviewHtml, /Closed Review Boxes/i);
    assert.match(showClosedReviewHtml, /Reopen Review Box/i);

    const reopenBox = await fetch(`http://127.0.0.1:${port}/api/cred-bureau/applications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer test-review-key" },
      body: JSON.stringify({ id: body.applicationId, closeReviewBox: false }),
    });
    const reopenBoxBody = await reopenBox.json() as Record<string, any>;
    assert.equal(reopenBox.status, 200);
    assert.equal(reopenBoxBody.success, true);
    assert.equal(reopenBoxBody.application.review.closedAt, null);
  } catch (error) {
    throw new Error(`${error instanceof Error ? error.message : String(error)}\nServer logs:\n${logs}`);
  } finally {
    server.kill("SIGTERM");
    await new Promise((resolve) => server.once("exit", resolve));
    cleanupTestApplications();
    cleanupTestReviewLog();
  }
});
