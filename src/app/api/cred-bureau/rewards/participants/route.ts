import { NextResponse } from "next/server";
import { getRewardParticipants, buildRewardParticipant, appendRewardParticipant, updateRewardParticipant } from "@/lib/cred-bureau-rewards-store";
import { assertReviewAuthorized } from "@/lib/review-auth";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanOptionalString(value: unknown) {
  const cleaned = cleanString(value);
  return cleaned || null;
}

function cleanOptionalUrl(value: unknown, label: string) {
  const cleaned = cleanOptionalString(value);
  if (!cleaned) return null;
  if (!/^https?:\/\//i.test(cleaned)) {
    throw new Error(`${label} must start with http:// or https://.`);
  }
  return cleaned;
}

function validateWallet(wallet: string): string {
  const trimmed = wallet.trim();
  const regex = /^0x[0-9a-f]{40}$/i;
  if (!regex.test(trimmed)) {
    throw new Error("Wallet must be an EVM address: 0x followed by 40 hex characters");
  }
  return trimmed;
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
    
    const displayName = cleanString(payload.displayName);
    if (!displayName) throw new Error("Display name is required");
    
    const wallet = validateWallet(payload.wallet);
    
    const telegram = cleanOptionalString(payload.telegram);
    const email = cleanOptionalString(payload.email);
    const helixaProfileUrl = cleanOptionalUrl(payload.helixaProfileUrl, "Helixa profile URL");
    const applicationId = cleanOptionalString(payload.applicationId);
    
    const participants = getRewardParticipants();
    
    // Check if participant already exists with same wallet
    const existingParticipant = participants.find(p => p.wallet.toLowerCase() === wallet.toLowerCase());
    
    if (existingParticipant) {
      // Update existing participant
      const updatedParticipant = updateRewardParticipant(existingParticipant.id, {
        displayName,
        telegram,
        email,
        helixaProfileUrl,
        applicationId,
      });
      
      return NextResponse.json({
        success: true,
        participantId: updatedParticipant.id,
        status: updatedParticipant.status,
      }, { status: 200 });
    } else {
      // Create new participant
      const newParticipant = {
        id: `cbrp_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        displayName,
        telegram,
        email,
        wallet,
        helixaProfileUrl,
        applicationId,
        status: "active",
      };
      
      const builtParticipant = buildRewardParticipant({
        displayName,
        wallet,
        telegram,
        email,
        helixaProfileUrl,
        applicationId,
      });
      
      appendRewardParticipant(builtParticipant);
      
      return NextResponse.json({
        success: true,
        participantId: builtParticipant.id,
        status: builtParticipant.status,
      }, { status: 201 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Participant registration failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    assertReviewAuthorized(req.headers.get("authorization"));
    
    const participants = getRewardParticipants();
    return NextResponse.json({
      success: true,
      participants,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Review request failed";
    const status = message.includes("Unauthorized") ? 401 : message.includes("not configured") ? 503 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}