import assert from "node:assert/strict";
import test from "node:test";

const originalReviewApiKey = process.env.SYNAGENT_REVIEW_API_KEY;

test.afterEach(() => {
  if (originalReviewApiKey === undefined) {
    delete process.env.SYNAGENT_REVIEW_API_KEY;
  } else {
    process.env.SYNAGENT_REVIEW_API_KEY = originalReviewApiKey;
  }
});

async function loadReviewAuth() {
  return import(new URL("./review-auth.ts", import.meta.url).href);
}

test("getReviewApiKey trims configured review key and treats blanks as missing", async () => {
  const { getReviewApiKey } = await loadReviewAuth();

  process.env.SYNAGENT_REVIEW_API_KEY = "  test-review-key  ";
  assert.equal(getReviewApiKey(), "test-review-key");

  process.env.SYNAGENT_REVIEW_API_KEY = "   ";
  assert.equal(getReviewApiKey(), null);
});

test("assertReviewAuthorized requires a configured matching bearer token", async () => {
  const { assertReviewAuthorized } = await loadReviewAuth();

  delete process.env.SYNAGENT_REVIEW_API_KEY;
  assert.throws(
    () => assertReviewAuthorized("Bearer test-review-key"),
    /SYNAGENT_REVIEW_API_KEY is not configured/,
  );

  process.env.SYNAGENT_REVIEW_API_KEY = "test-review-key";
  assert.throws(
    () => assertReviewAuthorized(null),
    /Unauthorized review request/,
  );
  assert.throws(
    () => assertReviewAuthorized("Bearer wrong-key"),
    /Unauthorized review request/,
  );
  assert.doesNotThrow(() => assertReviewAuthorized("Bearer test-review-key"));
});


test("getMatchRequests backfills legacy records for review APIs", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const dataDir = path.join(process.cwd(), "data");
  const requestsPath = path.join(dataDir, "match-requests.json");
  const original = fs.existsSync(requestsPath) ? fs.readFileSync(requestsPath, "utf8") : null;

  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(requestsPath, JSON.stringify([
    {
      id: "legacy_req_1",
      createdAt: "2026-05-01T00:00:00.000Z",
      status: "matched",
      review: { needsManualReview: false, strongestScore: 75 },
      intake: { contact: { email: "legacy@example.com" } },
      matchedAgents: [{ slug: "degeneer", name: "Degeneer", score: 75, reasons: [], categoryFit: [] }],
      notifications: [],
      internalOwner: "bendr",
      nextActionAt: "2026-05-01T01:00:00.000Z",
    },
  ], null, 2));

  try {
    const store = await import(new URL("./match-store.ts", import.meta.url).href + `?legacy=${Date.now()}`);
    const [record] = store.getMatchRequests();
    assert.equal(record.review.confidence, "high");
    assert.equal(record.review.publicDecision, "recommended-match");
    assert.equal(record.matchedAgents[0].confidence, "high");
    assert.deepEqual(record.matchEvaluation.rankedCandidates, []);
  } finally {
    if (original === null) {
      fs.rmSync(requestsPath, { force: true });
    } else {
      fs.writeFileSync(requestsPath, original);
    }
  }
});
