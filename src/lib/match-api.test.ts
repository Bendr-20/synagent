import assert from "node:assert/strict";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import test from "node:test";

const TEST_CONTACTS = new Set([
  "synagent-api-mvp@example.com",
  "synagent-api-default@example.com",
  "synagent-api-urgent@example.com",
  "synagent-api-explicit-low@example.com",
]);

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

async function postMatch(port: number, body: Record<string, unknown>, clientKey: string) {
  const response = await fetch(`http://127.0.0.1:${port}/api/match`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": clientKey,
    },
    body: JSON.stringify(body),
  });

  return {
    status: response.status,
    body: await response.json() as Record<string, unknown>,
  };
}

function cleanupTestRecords() {
  const dataDir = path.join(process.cwd(), "data");
  const requestsPath = path.join(dataDir, "match-requests.json");
  const notificationsPath = path.join(dataDir, "match-notifications.json");

  if (!fs.existsSync(requestsPath)) return;

  const requests = JSON.parse(fs.readFileSync(requestsPath, "utf8")) as Array<Record<string, any>>;
  const removeIds = new Set(
    requests
      .filter((request) => TEST_CONTACTS.has(request?.intake?.contact?.email))
      .map((request) => request.id),
  );

  if (!removeIds.size) return;

  fs.writeFileSync(
    requestsPath,
    `${JSON.stringify(requests.filter((request) => !removeIds.has(request.id)), null, 2)}\n`,
  );

  if (fs.existsSync(notificationsPath)) {
    const notifications = JSON.parse(fs.readFileSync(notificationsPath, "utf8")) as Array<Record<string, any>>;
    fs.writeFileSync(
      notificationsPath,
      `${JSON.stringify(notifications.filter((notification) => !removeIds.has(notification.requestId)), null, 2)}\n`,
    );
  }
}

test("match API treats an API-provided MVP category as explicit user intent", { timeout: 60_000 }, async () => {
  cleanupTestRecords();
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

    const explicitMvp = await postMatch(port, {
      title: "Need an MVP for a curated routing beta",
      category: "mvp-build",
      budgetRange: "3k-10k",
      urgency: "this-week",
      deliveryType: "hybrid",
      communicationPreference: "email",
      confidentiality: "private",
      paymentPreference: "usdc",
      brief: "Need intake, matching, and review flow tightened for launch.",
      contact: { email: "synagent-api-mvp@example.com" },
      priorities: { cost: 5, time: 8, quality: 8, credibility: 8 },
    }, "203.0.113.101");

    assert.equal(explicitMvp.status, 201);
    assert.equal(explicitMvp.body.status, "matched");
    assert.equal((explicitMvp.body.matchedAgents as unknown[]).length, 1);
    assert.equal((explicitMvp.body.review as Record<string, unknown>).confidence, "high");
    assert.equal((explicitMvp.body.review as Record<string, unknown>).publicDecision, "recommended-match");
    assert.equal((explicitMvp.body.review as Record<string, unknown>).recommendedMatchSlug, "degeneer");
    assert.equal((explicitMvp.body.matchedAgents as Array<Record<string, unknown>>)[0].confidence, "high");

    const storedRequests = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "match-requests.json"), "utf8")) as Array<Record<string, any>>;
    const storedMvpRequest = storedRequests.find((request) => request?.intake?.contact?.email === "synagent-api-mvp@example.com");
    assert.ok(storedMvpRequest, "expected MVP request to be stored for internal review");
    assert.equal(storedMvpRequest.review.confidence, "high");
    assert.equal(storedMvpRequest.matchEvaluation?.rankedCandidates?.[0]?.slug, "degeneer");
    assert.equal(storedMvpRequest.matchEvaluation?.rankedCandidates?.[0]?.eligibleForRecommendation, true);
    assert.ok(storedMvpRequest.matchEvaluation?.rankedCandidates?.[0]?.scoreComponents?.some((component: Record<string, unknown>) => component.label === "Cred score"));

    const defaultCategory = await postMatch(port, {
      title: "Need tax accounting for a restaurant",
      category: "mvp-build",
      categorySource: "default",
      budgetRange: "under-1k",
      urgency: "flexible",
      deliveryType: "human-only",
      communicationPreference: "email",
      confidentiality: "private",
      paymentPreference: "usd",
      brief: "Need restaurant tax filing help.",
      contact: { email: "synagent-api-default@example.com" },
      priorities: { cost: 5, time: 2, quality: 5, credibility: 5 },
    }, "203.0.113.102");

    assert.equal(defaultCategory.status, 201);
    assert.equal(defaultCategory.body.status, "needs-review");
    assert.equal((defaultCategory.body.review as Record<string, unknown>).confidence, "review");
    assert.equal((defaultCategory.body.review as Record<string, unknown>).publicDecision, "manual-review");
    assert.equal((defaultCategory.body.matchedAgents as unknown[]).length, 0);

    const urgentUnrelated = await postMatch(port, {
      title: "Urgent restaurant staffing emergency",
      category: "other",
      budgetRange: "25k-plus",
      urgency: "asap",
      deliveryType: "hybrid",
      communicationPreference: "either",
      confidentiality: "private",
      paymentPreference: "open",
      brief: "Need restaurant shift coverage tonight, not AI product work.",
      contact: { email: "synagent-api-urgent@example.com" },
      priorities: { cost: 5, time: 10, quality: 5, credibility: 5 },
    }, "203.0.113.103");

    assert.equal(urgentUnrelated.status, 201);
    assert.equal(urgentUnrelated.body.status, "needs-review");
    assert.equal((urgentUnrelated.body.review as Record<string, unknown>).confidence, "review");
    assert.equal((urgentUnrelated.body.review as Record<string, unknown>).publicDecision, "manual-review");
    assert.equal((urgentUnrelated.body.matchedAgents as unknown[]).length, 0);

    const explicitButBelowThreshold = await postMatch(port, {
      title: "Need MVP build but prefer Telegram and USD",
      category: "mvp-build",
      categorySource: "user",
      budgetRange: "under-1k",
      urgency: "flexible",
      deliveryType: "human-only",
      communicationPreference: "telegram",
      confidentiality: "private",
      paymentPreference: "usd",
      brief: "Need a small MVP build request, but the fit should stay below high confidence.",
      contact: { email: "synagent-api-explicit-low@example.com" },
      priorities: { cost: 9, time: 2, quality: 4, credibility: 4 },
    }, "203.0.113.104");

    assert.equal(explicitButBelowThreshold.status, 201);
    assert.equal(explicitButBelowThreshold.body.status, "needs-review");
    assert.equal((explicitButBelowThreshold.body.review as Record<string, unknown>).confidence, "review");
    assert.equal((explicitButBelowThreshold.body.review as Record<string, unknown>).publicDecision, "manual-review");
    assert.equal((explicitButBelowThreshold.body.matchedAgents as unknown[]).length, 0);

    const storedRequestsAfterLowFit = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "match-requests.json"), "utf8")) as Array<Record<string, any>>;
    const storedLowFitRequest = storedRequestsAfterLowFit.find((request) => request?.intake?.contact?.email === "synagent-api-explicit-low@example.com");
    assert.ok(storedLowFitRequest, "expected explicit low-fit request to be stored");
    assert.equal(storedLowFitRequest.matchEvaluation?.rankedCandidates?.[0]?.eligibleForRecommendation, false);
    assert.ok(storedLowFitRequest.matchEvaluation?.rankedCandidates?.[0]?.scoreComponents?.length >= 3);
    assert.equal(typeof storedLowFitRequest.matchEvaluation?.rankedCandidates?.[0]?.scoreComponents?.[0]?.points, "number");
  } catch (error) {
    throw new Error(`${error instanceof Error ? error.message : String(error)}\nServer logs:\n${logs}`);
  } finally {
    server.kill("SIGTERM");
    await new Promise((resolve) => server.once("exit", resolve));
    cleanupTestRecords();
  }
});
