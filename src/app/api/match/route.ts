import { NextResponse } from "next/server";
import { appendMatchRequest, appendNotifications } from "@/lib/match-store";
import { buildRequestRecord, normalizeMatchPayload } from "@/lib/match-engine";
import { getDispatchConfig } from "@/lib/notification-dispatch";
import { checkRateLimit } from "@/lib/rate-limit";
import type { MatchApiResponse } from "@/lib/match-types";

function getClientKey(req: Request) {
  // Soft-launch limiter: the hosting edge is expected to set x-forwarded-for.
  // Production should move this to an edge/shared limiter instead of this per-process Map.
  return req.headers.get("x-forwarded-for") || "unknown";
}

export async function POST(req: Request) {
  const rateLimit = checkRateLimit(getClientKey(req));
  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, error: "Too many requests. Try again shortly." } satisfies MatchApiResponse, { status: 429 });
  }

  try {
    const body = await req.json();
    const intake = normalizeMatchPayload(body);
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
