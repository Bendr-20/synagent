export function getReviewApiKey() {
  const value = process.env.SYNAGENT_REVIEW_API_KEY;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function assertReviewAuthorized(authHeader: string | null) {
  const reviewApiKey = getReviewApiKey();
  if (!reviewApiKey) {
    throw new Error("SYNAGENT_REVIEW_API_KEY is not configured");
  }
  if (authHeader !== `Bearer ${reviewApiKey}`) {
    throw new Error("Unauthorized review request");
  }
}
