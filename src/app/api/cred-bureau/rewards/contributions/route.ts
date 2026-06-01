import { NextResponse } from "next/server";
import { getRewardContributions, buildRewardContribution, appendRewardContribution, updateRewardContributionReview, getRewardParticipants, buildRewardParticipant, appendRewardParticipant } from "@/lib/cred-bureau-rewards-store";
import { assertReviewAuthorized } from "@/lib/review-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { notifyRewardSubmission } from "@/lib/cred-bureau-rewards-notifications";

export const runtime = "nodejs";

function getLimit(req: Request) {
  const value = new URL(req.url).searchParams.get("limit");
  if (!value) return 50;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(100, Math.max(1, parsed));
}

function isValidStatus(status: unknown): status is "approved" | "rejected" | "needs-info" {
  return status === "approved" || status === "rejected" || status === "needs-info";
}

export async function POST(req: Request) {
  try {
    const clientKey = req.headers.get("x-forwarded-for") || "";
    const rateLimitResult = checkRateLimit(clientKey, { limit: 5, windowMs: 10 * 60 * 1000 });
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded", resetAt: rateLimitResult.resetAt },
        { status: 429 }
      );
    }

    const payload = await req.json();

    // Check if participant exists
    let participantId = "";

    if (payload.participantId) {
      participantId = String(payload.participantId).trim();
      if (!participantId) throw new Error("Participant ID is required");
    } else if (payload.participant) {
      // Create participant from payload
      const participantPayload = payload.participant;
      const displayName = String(participantPayload.displayName).trim();
      if (!displayName) throw new Error("Participant display name is required");

      const wallet = String(participantPayload.wallet).trim();
      const walletRegex = /^0x[0-9a-f]{40}$/i;
      if (!walletRegex.test(wallet)) {
        throw new Error("Wallet must be an EVM address: 0x followed by 40 hex characters");
      }

      const participants = getRewardParticipants();
      const existingParticipant = participants.find(p => p.wallet.toLowerCase() === wallet.toLowerCase());

      if (existingParticipant) {
        participantId = existingParticipant.id;
      } else {
        const newParticipant = buildRewardParticipant({
          displayName,
          wallet,
          telegram: participantPayload.telegram,
          email: participantPayload.email,
          helixaProfileUrl: participantPayload.helixaProfileUrl,
          applicationId: participantPayload.applicationId,
        });
        appendRewardParticipant(newParticipant);
        participantId = newParticipant.id;
      }
    } else {
      throw new Error("Either participantId or participant payload is required");
    }

    const seasonId = payload.seasonId;
    if (!["season-1", "season-2"].includes(seasonId)) {
      throw new Error("Season ID must be 'season-1' or 'season-2'");
    }

    const categoryId = payload.categoryId;
    const validCategories = ["matched-task", "task-creation", "bug-friction-log", "product-feedback", "referral", "wildcard"];
    if (!validCategories.includes(categoryId)) {
      throw new Error(`Category must be one of: ${validCategories.join(", ")}`);
    }

    const title = String(payload.title).trim();
    if (!title) throw new Error("Title is required");

    const description = String(payload.description).trim();
    if (!description) throw new Error("Description is required");

    const evidenceUrl = payload.evidenceUrl ? String(payload.evidenceUrl).trim() : null;
    if (evidenceUrl && !/^https?:\/\//i.test(evidenceUrl)) {
      throw new Error("Evidence URL must start with http:// or https://.");
    }

    const socialEvidence = payload.socialEvidence === true;
    const requestedPoints = typeof payload.requestedPoints === "number" && payload.requestedPoints > 0 ? payload.requestedPoints : null;

    const contribution = buildRewardContribution({
      participantId,
      seasonId,
      categoryId,
      title,
      description,
      evidenceUrl,
      socialEvidence,
      requestedPoints,
    });

    appendRewardContribution(contribution);

    // Create notification for Telegram group
    console.log(`Creating notification for contribution ${contribution.id}`);
    try {
      notifyRewardSubmission(contribution.id);
      console.log(`Notification function called for ${contribution.id}`);
    } catch (error) {
      // Don't fail the submission if notification fails
      console.error("Failed to create notification:", error);
    }

    return NextResponse.json({
      success: true,
      contributionId: contribution.id,
      status: contribution.status,
      assignedPoints: contribution.assignedPoints,
      payoutEligible: contribution.payoutEligible,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Contribution submission failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    assertReviewAuthorized(req.headers.get("authorization"));

    const limit = getLimit(req);
    const contributions = getRewardContributions();

    // Filter by status if provided
    const statusFilter = new URL(req.url).searchParams.get("status");
    let filteredContributions = contributions;

    if (statusFilter && ["submitted", "needs-info", "approved", "rejected"].includes(statusFilter)) {
      filteredContributions = contributions.filter(c => c.status === statusFilter);
    }

    return NextResponse.json({
      success: true,
      contributions: filteredContributions.slice(0, limit),
    });
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
    if (!id) throw new Error("Contribution ID is required");

    const status = payload.status;
    if (!isValidStatus(status)) throw new Error("Status must be 'approved', 'rejected', or 'needs-info'");

    const reviewedBy = typeof payload.reviewedBy === "string" && payload.reviewedBy.trim()
      ? payload.reviewedBy.trim()
      : "reviewer";

    const assignedPoints = typeof payload.assignedPoints === "number" ? payload.assignedPoints : undefined;
    const reviewerNotes = typeof payload.reviewerNotes === "string" ? payload.reviewerNotes : undefined;
    const antiFarmNotes = typeof payload.antiFarmNotes === "string" ? payload.antiFarmNotes : undefined;

    // Validate points
    if (assignedPoints !== undefined) {
      if (assignedPoints < 0) {
        throw new Error("Points cannot be negative");
      }

      // Get the contribution to check its category
      const contributions = getRewardContributions();
      const contribution = contributions.find(c => c.id === id);
      if (!contribution) throw new Error("Contribution not found");

      if (assignedPoints > 250 && contribution.categoryId !== "wildcard") {
        throw new Error("Points cannot exceed 250 unless category is 'wildcard'");
      }
    }

    const { contribution: updatedContribution, reviewLogEntry } = updateRewardContributionReview(
      id,
      status,
      reviewedBy,
      reviewerNotes,
      antiFarmNotes,
      assignedPoints
    );

    return NextResponse.json({
      success: true,
      contribution: updatedContribution,
      reviewLogEntry,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Review update failed";
    const status = message.includes("Unauthorized") ? 401 : message.includes("not configured") ? 503 : message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
