import assert from "node:assert/strict";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import test from "node:test";
import { tmpdir } from "node:os";



const TEST_CONTRIBUTIONS = new Set([
  "test-contribution-1",
  "test-contribution-2",
  "test-contribution-3",
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

async function postParticipant(port: number, body: Record<string, unknown>, clientKey: string) {
  const response = await fetch(`http://127.0.0.1:${port}/api/cred-bureau/rewards/participants`, {
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

async function getParticipants(port: number, authHeader: string) {
  const response = await fetch(`http://127.0.0.1:${port}/api/cred-bureau/rewards/participants`, {
    method: "GET",
    headers: {
      "Authorization": authHeader,
    },
  });

  return {
    status: response.status,
    body: await response.json() as Record<string, unknown>,
  };
}

async function postContribution(port: number, body: Record<string, unknown>, clientKey: string) {
  const response = await fetch(`http://127.0.0.1:${port}/api/cred-bureau/rewards/contributions`, {
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

async function getContributions(port: number, authHeader: string) {
  const response = await fetch(`http://127.0.0.1:${port}/api/cred-bureau/rewards/contributions`, {
    method: "GET",
    headers: {
      "Authorization": authHeader,
    },
  });

  return {
    status: response.status,
    body: await response.json() as Record<string, unknown>,
  };
}

async function patchContribution(port: number, id: string, body: Record<string, unknown>, authHeader: string) {
  const response = await fetch(`http://127.0.0.1:${port}/api/cred-bureau/rewards/contributions`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader,
    },
    body: JSON.stringify({ ...body, id }),
  });

  return {
    status: response.status,
    body: await response.json() as Record<string, unknown>,
  };
}

async function postPayoutExport(port: number, body: Record<string, unknown>, authHeader: string) {
  const response = await fetch(`http://127.0.0.1:${port}/api/cred-bureau/rewards/payout-export`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader,
    },
    body: JSON.stringify(body),
  });

  return {
    status: response.status,
    body: await response.json() as Record<string, unknown>,
  };
}

async function getPayoutExports(port: number, authHeader: string) {
  const response = await fetch(`http://127.0.0.1:${port}/api/cred-bureau/rewards/payout-export`, {
    method: "GET",
    headers: {
      "Authorization": authHeader,
    },
  });

  return {
    status: response.status,
    body: await response.json() as Record<string, unknown>,
  };
}

async function getPayoutExportCsv(port: number, exportId: string, authHeader: string) {
  const response = await fetch(`http://127.0.0.1:${port}/api/cred-bureau/rewards/payout-export?exportId=${exportId}&format=csv`, {
    method: "GET",
    headers: {
      "Authorization": authHeader,
    },
  });

  return {
    status: response.status,
    body: await response.text(),
  };
}

function cleanupTestRecords(dataDir: string) {
  const participantsPath = path.join(dataDir, "cred-bureau-rewards-participants.json");
  const contributionsPath = path.join(dataDir, "cred-bureau-rewards-contributions.json");
  const reviewLogPath = path.join(dataDir, "cred-bureau-rewards-review-log.json");
  const payoutExportsPath = path.join(dataDir, "cred-bureau-payout-exports.json");

  // Clean up test participants
  if (fs.existsSync(participantsPath)) {
    const participants = JSON.parse(fs.readFileSync(participantsPath, "utf8")) as Array<Record<string, any>>;
    const filtered = participants.filter((p) => !p?.email?.includes("test-participant-"));
    fs.writeFileSync(participantsPath, `${JSON.stringify(filtered, null, 2)}\n`);
  }

  // Clean up test contributions
  if (fs.existsSync(contributionsPath)) {
    const contributions = JSON.parse(fs.readFileSync(contributionsPath, "utf8")) as Array<Record<string, any>>;
    const filtered = contributions.filter((c) => !TEST_CONTRIBUTIONS.has(c?.id));
    fs.writeFileSync(contributionsPath, `${JSON.stringify(filtered, null, 2)}\n`);
  }

  // Clean up test review log entries
  if (fs.existsSync(reviewLogPath)) {
    const reviewLog = JSON.parse(fs.readFileSync(reviewLogPath, "utf8")) as Array<Record<string, any>>;
    const filtered = reviewLog.filter((entry) => !TEST_CONTRIBUTIONS.has(entry?.contributionId));
    fs.writeFileSync(reviewLogPath, `${JSON.stringify(filtered, null, 2)}\n`);
  }

  // Clean up test payout exports (all test exports)
  if (fs.existsSync(payoutExportsPath)) {
    const payoutExports = JSON.parse(fs.readFileSync(payoutExportsPath, "utf8")) as Array<Record<string, any>>;
    const filtered = payoutExports.filter((exportRecord) => !exportRecord.createdBy?.includes("test-"));
    fs.writeFileSync(payoutExportsPath, `${JSON.stringify(filtered, null, 2)}\n`);
  }
}

test("Cred Bureau rewards API integration tests", { timeout: 60_000 }, async () => {
  const dataDir = fs.mkdtempSync(path.join(tmpdir(), "synagent-rewards-api-test-"));
  cleanupTestRecords(dataDir);
  const port = await getFreePort();
  const server = spawn("./node_modules/.bin/next", ["start", "--port", String(port)], {
    cwd: process.cwd(),
    env: { ...process.env, SYNAGENT_REVIEW_API_KEY: "test-review-key", SYNAGENT_DATA_DIR: dataDir },
  });

  let logs = "";
  server.stdout.on("data", (chunk) => { logs += chunk.toString(); });
  server.stderr.on("data", (chunk) => { logs += chunk.toString(); });

  try {
    await waitForServer(port, server);

    // Test 1: POST /api/cred-bureau/rewards/participants creates or updates a participant
    const participant1 = await postParticipant(port, {
      displayName: "Test Participant 1",
      wallet: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      telegram: "@testuser1",
      email: "test-participant-1@example.com",
      helixaProfileUrl: "https://bankr.bot/agents/test1",
      applicationId: "test-app-1",
    }, "203.0.113.1");

    assert.equal(participant1.status, 201);
    assert.equal(participant1.body.success, true);
    assert.ok(typeof participant1.body.participantId === "string");
    assert.ok((participant1.body.participantId as string).length > 0);

    // Test 2: participant POST is rate‑limited
    const participant2 = await postParticipant(port, {
      displayName: "Test Participant 2",
      wallet: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      email: "test-participant-2@example.com",
    }, "203.0.113.1"); // Same IP

    // Should update existing participant (same wallet)
    assert.equal(participant2.status, 200);

    // Try 5 more times quickly (exceeding default limit of 5 per 10 minutes)
    let rateLimited = false;
    let rateLimitedRequest = -1;
    for (let i = 0; i < 5; i++) {
      const result = await postParticipant(port, {
        displayName: `Test Participant ${i + 3}`,
        wallet: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        email: `test-participant-${i + 3}@example.com`,
      }, "203.0.113.1");
      
      if (result.status === 429) {
        rateLimited = true;
        rateLimitedRequest = i + 3;
        break;
      }
    }

    assert.ok(rateLimited, `Expected rate limiting to trigger after multiple requests; last request ${rateLimitedRequest}`);

    // Test 3: POST /api/cred-bureau/rewards/contributions creates a submitted contribution
    const contribution1 = await postContribution(port, {
      participantId: (participant1.body.participantId as string),
      seasonId: "season-1",
      categoryId: "matched-task",
      title: "Test Contribution 1",
      description: "This is a test contribution for matched tasks",
      evidenceUrl: "https://example.com/evidence1",
    }, "203.0.113.2");

    assert.equal(contribution1.status, 201);
    assert.equal(contribution1.body.success, true);
    assert.ok(typeof contribution1.body.contributionId === "string");
    assert.equal(contribution1.body.status, "submitted");
    assert.equal(contribution1.body.assignedPoints, 0);
    assert.equal(contribution1.body.payoutEligible, false);

    // Test 4: contribution POST is rate‑limited
    const contribution2 = await postContribution(port, {
      participantId: (participant1.body.participantId as string),
      seasonId: "season-1",
      categoryId: "task-creation",
      title: "Test Contribution 2",
      description: "Another test contribution",
    }, "203.0.113.2"); // Same IP

    assert.equal(contribution2.status, 201);

    // Try to exceed rate limit
    let contributionRateLimited = false;
    for (let i = 0; i < 5; i++) {
      const result = await postContribution(port, {
        participantId: (participant1.body.participantId as string),
        seasonId: "season-1",
        categoryId: "bug-friction-log",
        title: `Test Contribution ${i + 3}`,
        description: `Description ${i + 3}`,
      }, "203.0.113.2");
      
      if (result.status === 429) {
        contributionRateLimited = true;
        break;
      }
    }

    assert.ok(contributionRateLimited, "Expected contribution rate limiting to trigger");

    // Test 5: protected GET /api/cred-bureau/rewards/contributions returns 401 without key
    const unauthorizedGet = await getContributions(port, "Bearer wrong-key");
    assert.equal(unauthorizedGet.status, 401);

    // Test 6: protected GET with valid key returns contributions
    const authorizedGet = await getContributions(port, "Bearer test-review-key");
    assert.equal(authorizedGet.status, 200);
    assert.equal(authorizedGet.body.success, true);
    assert.ok(Array.isArray(authorizedGet.body.contributions));

    // Test 7: protected PATCH approves a contribution and assigns points
    const patchResult = await patchContribution(port, 
      contribution1.body.contributionId as string,
      {
        status: "approved",
        assignedPoints: 50,
        reviewerNotes: "Good work on this test contribution",
        reviewedBy: "test-reviewer",
      },
      "Bearer test-review-key"
    );

    assert.equal(patchResult.status, 200, "PATCH contribution failed");
    assert.equal(patchResult.body.success, true, "PATCH contribution reported success: false");

    // Verify state by fetching it again
    const getResult = await getContributions(port, "Bearer test-review-key");
    const updatedContrib = (getResult.body.contributions as any[]).find(c => c.id === contribution1.body.contributionId);

    assert.equal(updatedContrib.status, "approved");
    assert.equal(updatedContrib.assignedPoints, 50);
    assert.equal(updatedContrib.payoutEligible, true);
    assert.equal(updatedContrib.reviewedBy, "test-reviewer");
    assert.ok(patchResult.body.reviewLogEntry);
    assert.equal((patchResult.body.reviewLogEntry as any).reviewedBy, "test-reviewer");

    // Test 7b: protected PATCH can approve with the server-side suggested score even if a stale client sends another number
    const suggestedPatchResult = await patchContribution(
      port,
      contribution2.body.contributionId as string,
      {
        status: "approved",
        useSuggestedPoints: true,
        assignedPoints: 1,
        reviewerNotes: "Approve suggested score",
        reviewedBy: "test-reviewer",
      },
      "Bearer test-review-key"
    );

    assert.equal(suggestedPatchResult.status, 200, "PATCH approve suggested failed");
    assert.equal(suggestedPatchResult.body.success, true);

    const getSuggestedResult = await getContributions(port, "Bearer test-review-key");
    const suggestedContrib = (getSuggestedResult.body.contributions as any[]).find(c => c.id === contribution2.body.contributionId);

    assert.equal(suggestedContrib.status, "approved");
    assert.equal(suggestedContrib.assignedPoints, 10);
    assert.equal(suggestedContrib.payoutEligible, true);

    // Test 8: protected payout export refuses to generate without explicit anti‑farm review confirmation
    const payoutExportNoConfirm = await postPayoutExport(port, {
      seasonId: "season-1",
      seasonTokenPool: "1000.0",
      createdBy: "test-reviewer",
      antiFarmReviewComplete: false,
      antiFarmReviewNotes: "Incomplete review",
    }, "Bearer test-review-key");

    assert.equal(payoutExportNoConfirm.status, 400);
    assert.equal(payoutExportNoConfirm.body.success, false);
    assert.ok((payoutExportNoConfirm.body.error as string).includes("anti-farm"));

    // Test 9: protected payout export stores an export record after anti‑farm confirmation
    const payoutExportWithConfirm = await postPayoutExport(port, {
      seasonId: "season-1",
      seasonTokenPool: "1000.0",
      createdBy: "test-reviewer",
      antiFarmReviewComplete: true,
      antiFarmReviewNotes: "Anti-farm review completed with detailed notes exceeding 20 characters minimum.",
    }, "Bearer test-review-key");

    assert.equal(payoutExportWithConfirm.status, 201);
    assert.equal(payoutExportWithConfirm.body.success, true);
    assert.ok(typeof payoutExportWithConfirm.body.exportId === "string");
    assert.equal(payoutExportWithConfirm.body.exportRecord.antiFarmReviewComplete, true);
    assert.equal(payoutExportWithConfirm.body.exportRecord.createdBy, "test-reviewer");

    // Test 10: protected CSV download returns a CSV from a stored export id
    const exportId = payoutExportWithConfirm.body.exportId as string;
    
    const csvDownload = await getPayoutExportCsv(port, exportId, "Bearer test-review-key");

    assert.equal(csvDownload.status, 200);
    assert.ok(csvDownload.body.includes("wallet,amount"));
    assert.ok(csvDownload.body.includes("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"));

  } catch (error) {
    throw new Error(`${error instanceof Error ? error.message : String(error)}\nServer logs:\n${logs}`);
  } finally {
    server.kill("SIGTERM");
    await new Promise((resolve) => server.once("exit", resolve));
    cleanupTestRecords(dataDir);
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});