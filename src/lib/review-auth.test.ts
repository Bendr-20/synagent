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
