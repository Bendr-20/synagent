import { NextResponse } from "next/server";
import { appendCredBureauApplication, buildCredBureauApplicationRecord, getCredBureauApplications, updateCredBureauApplicationStatus } from "@/lib/cred-bureau-store";
import { assertReviewAuthorized } from "@/lib/review-auth";
import type { CredBureauApplicationResponse, CredBureauApplicationStatus, CredBureauStatusUpdateResponse } from "@/lib/cred-bureau-types";

export const runtime = "nodejs";

function getLimit(req: Request) {
  const value = new URL(req.url).searchParams.get("limit");
  if (!value) return 50;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(100, Math.max(1, parsed));
}

function isValidStatus(status: unknown): status is CredBureauApplicationStatus {
  return status === "pending-review" || status === "approved" || status === "rejected";
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const record = buildCredBureauApplicationRecord(payload);
    appendCredBureauApplication(record);

    return NextResponse.json({
      success: true,
      applicationId: record.id,
      status: record.status,
      nextStep: record.review.profileMissing
        ? "Application received for manual review. A Helixa human profile was not linked yet, so the Synagent team may ask you to mint or link one before approval, then manually contact approved applicants before anyone is added to the group chat."
        : "Application received for manual review. The Synagent team will review the attached Helixa human profile and Cred context, then manually contact approved applicants before anyone is added to the group chat.",
      groupInviteUrl: null,
    } satisfies CredBureauApplicationResponse, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cred Bureau application failed";
    return NextResponse.json({ success: false, error: message } satisfies CredBureauApplicationResponse, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    assertReviewAuthorized(req.headers.get("authorization"));
    const limit = getLimit(req);
    return NextResponse.json({ success: true, applications: getCredBureauApplications().slice(0, limit) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Review request failed";
    const status = message.includes("Unauthorized") ? 401 : message.includes("not configured") ? 503 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    assertReviewAuthorized(req.headers.get("authorization"));
    const payload = await req.json();
    const id = typeof payload.id === "string" ? payload.id.trim() : "";
    const status = payload.status;
    if (!id) throw new Error("Application ID is required");
    if (!isValidStatus(status)) throw new Error("Status must be pending-review, approved, or rejected");

    const application = updateCredBureauApplicationStatus(id, status, typeof payload.reviewerNotes === "string" ? payload.reviewerNotes : null);
    return NextResponse.json({ success: true, application } satisfies CredBureauStatusUpdateResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Review update failed";
    const status = message.includes("Unauthorized") ? 401 : message.includes("not configured") ? 503 : message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message } satisfies CredBureauStatusUpdateResponse, { status });
  }
}
