import { NextResponse } from "next/server";
import { appendMatchRequest, appendNotifications } from "@/lib/match-store";
import { buildRequestRecord, normalizeMatchPayload } from "@/lib/match-engine";
import { getDispatchConfig } from "@/lib/notification-dispatch";
import { checkRateLimit } from "@/lib/rate-limit";
import type { MatchApiResponse } from "@/lib/match-types";

const MATCH_RATE_LIMIT = {
  limit: 5,
  windowMs: 60 * 1000,
};

function getClientKey(req: Request) {
  // Soft-launch limiter: the hosting edge is expected to set x-forwarded-for.
  // Production should move this to an edge/shared limiter instead of this per-process Map.
  return req.headers.get("x-forwarded-for") || "unknown";
}

function secondsUntil(resetAt: string) {
  const resetMs = Date.parse(resetAt);
  if (!Number.isFinite(resetMs)) return 60;
  return Math.max(1, Math.ceil((resetMs - Date.now()) / 1000));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const intake = normalizeMatchPayload(body);

    const rateLimit = checkRateLimit(getClientKey(req), MATCH_RATE_LIMIT);
    if (!rateLimit.allowed) {
      const retryAfterSeconds = secondsUntil(rateLimit.resetAt);
      return NextResponse.json(
        {
          success: false,
          error: "Too many requests. Try again shortly.",
          resetAt: rateLimit.resetAt,
          retryAfterSeconds,
        } satisfies MatchApiResponse,
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSeconds) },
        },
      );
    }

    const record = buildRequestRecord(intake);
    appendMatchRequest(record);
    appendNotifications(record.notifications);
    const dispatchConfig = getDispatchConfig();

    return NextResponse.json({
      success: true,
      requestId: record.id,
      status: record.status,
      review: record.review,
      matchedAgents: record.matchedAgents,
      notificationsQueued: record.notifications.length,
      notificationMode: dispatchConfig.mode,
      dispatchEndpoint: "/api/match/dispatch",
      nextActionAt: record.nextActionAt,
    } satisfies MatchApiResponse, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Match request failed";
    return NextResponse.json({ success: false, error: message } satisfies MatchApiResponse, { status: 400 });
  }
}
