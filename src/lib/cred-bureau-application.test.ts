import assert from "node:assert/strict";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import test from "node:test";

const TEST_PROFILE_URL = "https://helixa.xyz/h/cred-bureau-test";
const TEST_OPTIONAL_PROFILE_TELEGRAM = "@credreviewer";

test("Cred Bureau application is linked from public Synagent entry points", () => {
  const homePage = fs.readFileSync("src/app/page.tsx", "utf8");
  const siteShell = fs.readFileSync("src/components/site-shell.tsx", "utf8");
  const credBureauForm = fs.readFileSync("src/app/cred-bureau/cred-bureau-application-form.tsx", "utf8");
  const credBureauPage = fs.readFileSync("src/app/cred-bureau/page.tsx", "utf8");

  assert.match(homePage, /href=\"\/cred-bureau\"/);
  assert.doesNotMatch(siteShell, /href=\"\/cred-bureau\"/);
  assert.doesNotMatch(`${credBureauForm}\n${credBureauPage}`, /source=cred-bureau/);
  assert.doesNotMatch(`${credBureauForm}\n${credBureauPage}`, /First create|do not create separate profiles|reviewer and operator bench/i);
});

test("Cred Bureau page has mobile stack rules for the application flow", () => {
  const css = fs.readFileSync("src/app/globals.css", "utf8");

  assert.match(css, /@media \(max-width: 768px\)[\s\S]*\.cred-bureau-hero\s*\{[\s\S]*grid-template-columns:\s*1fr !important;/);
  assert.match(css, /@media \(max-width: 768px\)[\s\S]*\.cred-bureau-flow\s*\{[\s\S]*grid-template-columns:\s*1fr !important;/);
  assert.match(css, /@media \(max-width: 768px\)[\s\S]*\.cred-bureau-form-grid\s*\{[\s\S]*grid-template-columns:\s*1fr !important;/);
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
    `${JSON.stringify(applications.filter((application) => application?.humanProfile?.url !== TEST_PROFILE_URL && application?.applicant?.telegram !== TEST_OPTIONAL_PROFILE_TELEGRAM), null, 2)}\n`,
  );
}

test("Cred Bureau application page, API, and review queue support optional profile applications", { timeout: 60_000 }, async () => {
  cleanupTestApplications();
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
    assert.match(html, /Helixa profile is optional/i);
    assert.match(html, /https:\/\/helixa\.xyz\/join\/human/i);
    assert.match(html, /https:\/\/helixa\.xyz\/manage\/human/i);
    assert.match(html, /manual review/i);
    assert.match(html, /manually added to the group chat/i);
    assert.doesNotMatch(html, /source=cred-bureau|First create|do not create separate profiles|Skills and Cred Signals/i);

    const submit = await fetch(`http://127.0.0.1:${port}/api/cred-bureau/applications`, {
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

    const applications = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "cred-bureau-applications.json"), "utf8")) as Array<Record<string, any>>;
    const stored = applications.find((application) => application?.applicant?.telegram === TEST_OPTIONAL_PROFILE_TELEGRAM);
    assert.ok(stored, "expected application to be persisted for the team review queue");
    assert.equal(stored.status, "pending-review");
    assert.equal(stored.applicant.name, "Cred Reviewer");
    assert.equal(stored.applicant.telegram, TEST_OPTIONAL_PROFILE_TELEGRAM);
    assert.equal(stored.applicant.email, "reviewer@example.com");
    assert.equal(stored.applicant.role, "Operator / reviewer");
    assert.equal(stored.humanProfile.url, null);
    assert.equal(stored.review.profileRequired, false);
    assert.equal(stored.review.profileMissing, true);
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
    assert.match(reviewHtml, /Profile missing/i);
    assert.match(reviewHtml, /manual group add/i);

    const update = await fetch(`http://127.0.0.1:${port}/api/cred-bureau/applications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer test-review-key" },
      body: JSON.stringify({ id: body.applicationId, status: "approved", reviewerNotes: "Add to TG after profile mint." }),
    });
    const updateBody = await update.json() as Record<string, any>;
    assert.equal(update.status, 200);
    assert.equal(updateBody.success, true);
    assert.equal(updateBody.application.status, "approved");
    assert.equal(updateBody.application.review.reviewerNotes, "Add to TG after profile mint.");
  } catch (error) {
    throw new Error(`${error instanceof Error ? error.message : String(error)}\nServer logs:\n${logs}`);
  } finally {
    server.kill("SIGTERM");
    await new Promise((resolve) => server.once("exit", resolve));
    cleanupTestApplications();
  }
});
