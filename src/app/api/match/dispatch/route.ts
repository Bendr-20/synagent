import { NextResponse } from "next/server";
import { assertDispatchAuthorized, dispatchQueuedNotifications, getNotificationSummary } from "@/lib/notification-dispatch";

export async function GET() {
  const summary = getNotificationSummary();
  return NextResponse.json({ success: true, ...summary });
}

export async function POST(req: Request) {
  try {
    assertDispatchAuthorized(req.headers.get("authorization"));
    const body = await req.json();
    const requestId = typeof body?.requestId === "string" ? body.requestId.trim() : "";
    if (!requestId) {
      throw new Error("requestId is required");
    }

    const notificationIds = Array.isArray(body?.notificationIds)
      ? body.notificationIds.filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0)
      : undefined;

    const actorLabel = typeof body?.reviewedBy === "string" && body.reviewedBy.trim()
      ? body.reviewedBy.trim().slice(0, 80)
      : "synagent-review";

    const result = await dispatchQueuedNotifications({
      requestId,
      notificationIds,
      actor: { type: "reviewer", label: actorLabel },
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dispatch failed";
    const status = message.includes("Unauthorized") ? 401 : message.includes("not configured") ? 503 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
