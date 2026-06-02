import { NextResponse } from "next/server";
import { assertReviewAuthorized } from "@/lib/review-auth";
import { calculateSeasonPayoutRows, buildPayoutCsv } from "@/lib/cred-bureau-rewards-scoring";
import { getRewardParticipants, getRewardContributions } from "@/lib/cred-bureau-rewards-store";
import fs from "node:fs";
import path from "node:path";
import { writeJsonFileWithBackup } from "@/lib/json-file-backups.js";

export const runtime = "nodejs";

function getDataDir() {
  return process.env.SYNAGENT_DATA_DIR || path.join(process.cwd(), "data");
}

function getPayoutExportsPath() {
  return path.join(getDataDir(), "cred-bureau-payout-exports.json");
}

function ensureDataDir() {
  fs.mkdirSync(getDataDir(), { recursive: true });
}

function readPayoutExports() {
  try {
    return JSON.parse(fs.readFileSync(getPayoutExportsPath(), "utf8")) as Array<any>;
  } catch {
    return [];
  }
}

function writePayoutExports(exports: Array<any>) {
  ensureDataDir();
  fs.writeFileSync(getPayoutExportsPath(), `${JSON.stringify(exports, null, 2)}\n`);
}

function getLimit(req: Request) {
  const value = new URL(req.url).searchParams.get("limit");
  if (!value) return 50;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(100, Math.max(1, parsed));
}

export async function POST(req: Request) {
  try {
    assertReviewAuthorized(req.headers.get("authorization"));
    
    const payload = await req.json();
    
    const seasonId = payload.seasonId;
    if (!["season-1", "season-2"].includes(seasonId)) {
      throw new Error("Season ID must be 'season-1' or 'season-2'");
    }
    
    const seasonTokenPool = payload.seasonTokenPool;
    if (!seasonTokenPool || typeof seasonTokenPool !== "string" || seasonTokenPool.trim() === "") {
      throw new Error("Season token pool is required and must be a string");
    }
    
    // Validate token pool amount (positive number)
    const tokenPoolRegex = /^\d+(\.\d+)?$/;
    if (!tokenPoolRegex.test(seasonTokenPool)) {
      throw new Error("Season token pool must be a positive number");
    }
    
    const createdBy = payload.createdBy;
    if (!createdBy || typeof createdBy !== "string" || createdBy.trim() === "") {
      throw new Error("Created by is required");
    }
    
    const antiFarmReviewComplete = payload.antiFarmReviewComplete;
    if (antiFarmReviewComplete !== true) {
      throw new Error("anti-farm review confirmation must be complete");
    }
    
    const antiFarmReviewNotes = payload.antiFarmReviewNotes;
    if (!antiFarmReviewNotes || typeof antiFarmReviewNotes !== "string") {
      throw new Error("antiFarmReviewNotes is required");
    }
    
    const trimmedNotes = antiFarmReviewNotes.trim();
    if (trimmedNotes.length < 20) {
      throw new Error("antiFarmReviewNotes must contain at least 20 non-whitespace characters");
    }
    
    const participants = getRewardParticipants();
    const contributions = getRewardContributions();
    
    // Calculate payout rows
    const payoutRows = calculateSeasonPayoutRows(participants, contributions, seasonId, seasonTokenPool);
    
    if (payoutRows.length === 0) {
      throw new Error("No eligible approved points for payout");
    }
    
    // Create export record
    const exportRecord = {
      id: `payout_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      seasonId,
      seasonTokenPool,
      totalPoints: payoutRows.reduce((sum, row) => sum + row.points, 0),
      rowCount: payoutRows.length,
      createdBy,
      antiFarmReviewComplete: true,
      antiFarmReviewNotes: trimmedNotes,
      rows: payoutRows,
    };
    
    // Store export
    const exports = readPayoutExports();
    exports.push(exportRecord);
    writePayoutExports(exports);
    
    return NextResponse.json({
      success: true,
      exportId: exportRecord.id,
      exportRecord,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payout export creation failed";
    const status = message.includes("Unauthorized") ? 401 : message.includes("not configured") ? 503 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function GET(req: Request) {
  try {
    assertReviewAuthorized(req.headers.get("authorization"));
    
    const exports = readPayoutExports();
    const limit = getLimit(req);
    
    const exportId = new URL(req.url).searchParams.get("exportId");
    const format = new URL(req.url).searchParams.get("format");
    
    if (exportId && format === "csv") {
      const exportRecord = exports.find(e => e.id === exportId);
      if (!exportRecord) {
        return NextResponse.json({ success: false, error: "Export not found" }, { status: 404 });
      }
      
      const csv = buildPayoutCsv(exportRecord.rows);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="payout-export-${exportRecord.id}.csv"`,
        },
      });
    }
    
    // List exports without rows unless includeRows=1
    const includeRows = new URL(req.url).searchParams.get("includeRows") === "1";
    const exportList = exports.map(e => ({
      id: e.id,
      createdAt: e.createdAt,
      seasonId: e.seasonId,
      seasonTokenPool: e.seasonTokenPool,
      totalPoints: e.totalPoints,
      rowCount: e.rowCount,
      createdBy: e.createdBy,
      antiFarmReviewComplete: e.antiFarmReviewComplete,
      antiFarmReviewNotes: e.antiFarmReviewNotes,
      rows: includeRows ? e.rows : undefined,
    })).slice(0, limit);
    
    return NextResponse.json({
      success: true,
      exports: exportList,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payout export request failed";
    const status = message.includes("Unauthorized") ? 401 : message.includes("not configured") ? 503 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}