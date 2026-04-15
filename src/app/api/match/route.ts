import { NextResponse } from "next/server";
import { appendMatchRequest, appendNotifications } from "@/lib/match-store";
import { buildRequestRecord, normalizeMatchPayload } from "@/lib/match-engine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const intake = normalizeMatchPayload(body);
    const record = buildRequestRecord(intake);
    appendMatchRequest(record);
    appendNotifications(record.notifications);

    return NextResponse.json({
      success: true,
      requestId: record.id,
      status: record.status,
      matchedAgents: record.matchedAgents,
      notificationsQueued: record.notifications.length,
      notificationMode: "queue-only",
      nextActionAt: record.nextActionAt,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Match request failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
