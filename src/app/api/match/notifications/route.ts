import { NextResponse } from "next/server";
import { getNotifications } from "@/lib/match-store";
import { assertReviewAuthorized } from "@/lib/review-auth";

function getLimit(req: Request) {
  const value = new URL(req.url).searchParams.get("limit");
  if (!value) return 50;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 50;

  return Math.min(100, Math.max(1, parsed));
}

export async function GET(req: Request) {
  try {
    assertReviewAuthorized(req.headers.get("authorization"));
    const limit = getLimit(req);
    return NextResponse.json({ success: true, notifications: getNotifications().slice(0, limit) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Review request failed";
    const status = message.includes("Unauthorized") ? 401 : message.includes("not configured") ? 503 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
