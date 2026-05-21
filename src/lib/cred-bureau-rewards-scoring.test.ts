import assert from "node:assert/strict";
import test from "node:test";

async function loadScoring() {
  return import(new URL("./cred-bureau-rewards-scoring.ts", import.meta.url).href);
}

test("Cred Bureau scoring leaderboard excludes private fields", async () => {
  const scoring = await loadScoring();
  const participants = [
    {
      id: "p1",
      displayName: "Alice",
      wallet: "0xaaa",
      telegram: "@alice",
      email: "alice@example.com",
      createdAt: "2026-05-21T00:00:00Z",
      updatedAt: "2026-05-21T00:00:00Z",
      status: "active",
      helixaProfileUrl: null,
      applicationId: null,
    },
  ];
  const contributions = [
    {
      id: "c1",
      participantId: "p1",
      seasonId: "season-1",
      categoryId: "matched-task",
      title: "Task",
      description: "Description",
      evidenceUrl: null,
      socialEvidence: false,
      requestedPoints: null,
      assignedPoints: 80,
      status: "approved",
      reviewerNotes: "good",
      antiFarmNotes: null,
      reviewedAt: "2026-05-21T12:00:00Z",
      reviewedBy: "reviewer",
      approvedAt: "2026-05-21T12:00:00Z",
      rejectedAt: null,
      needsInfoAt: null,
      payoutEligible: true,
      createdAt: "2026-05-21T11:00:00Z",
      updatedAt: "2026-05-21T12:00:00Z",
    },
  ];
  const leaderboard = scoring.buildCredBureauLeaderboard(participants, contributions);
  assert.equal(leaderboard.length, 1);
  const row = leaderboard[0];
  // ensure private fields are absent
  assert(!("wallet" in row));
  assert(!("email" in row));
  assert(!("reviewerNotes" in row));
  assert(!("antiFarmNotes" in row));
  assert(!("reviewedBy" in row));
});

test("Cred Bureau scoring only counts approved contributions", async () => {
  const scoring = await loadScoring();
  const participants = [
    {
      id: "p1",
      displayName: "Bob",
      wallet: "0xbbb",
      telegram: null,
      email: null,
      createdAt: "",
      updatedAt: "",
      status: "active",
      helixaProfileUrl: null,
      applicationId: null,
    },
  ];
  const contributions = [
    {
      id: "c1",
      participantId: "p1",
      seasonId: "season-1",
      categoryId: "matched-task",
      title: "Approved",
      description: "Desc",
      evidenceUrl: null,
      socialEvidence: false,
      requestedPoints: null,
      assignedPoints: 30,
      status: "approved",
      reviewerNotes: null,
      antiFarmNotes: null,
      reviewedAt: "2026-05-21T12:00:00Z",
      reviewedBy: "reviewer",
      approvedAt: "2026-05-21T12:00:00Z",
      rejectedAt: null,
      needsInfoAt: null,
      payoutEligible: true,
      createdAt: "2026-05-21T11:00:00Z",
      updatedAt: "2026-05-21T12:00:00Z",
    },
    {
      id: "c2",
      participantId: "p1",
      seasonId: "season-1",
      categoryId: "matched-task",
      title: "Rejected",
      description: "Desc",
      evidenceUrl: null,
      socialEvidence: false,
      requestedPoints: null,
      assignedPoints: 20,
      status: "rejected",
      reviewerNotes: null,
      antiFarmNotes: null,
      reviewedAt: "2026-05-21T12:00:00Z",
      reviewedBy: "reviewer",
      approvedAt: null,
      rejectedAt: "2026-05-21T12:00:00Z",
      needsInfoAt: null,
      payoutEligible: false,
      createdAt: "2026-05-21T11:00:00Z",
      updatedAt: "2026-05-21T12:00:00Z",
    },
    {
      id: "c3",
      participantId: "p1",
      seasonId: "season-1",
      categoryId: "matched-task",
      title: "Submitted",
      description: "Desc",
      evidenceUrl: null,
      socialEvidence: false,
      requestedPoints: null,
      assignedPoints: 10,
      status: "submitted",
      reviewerNotes: null,
      antiFarmNotes: null,
      reviewedAt: null,
      reviewedBy: null,
      approvedAt: null,
      rejectedAt: null,
      needsInfoAt: null,
      payoutEligible: false,
      createdAt: "2026-05-21T11:00:00Z",
      updatedAt: "2026-05-21T11:00:00Z",
    },
  ];
  const leaderboard = scoring.buildCredBureauLeaderboard(participants, contributions);
  assert.equal(leaderboard.length, 1);
  assert.equal(leaderboard[0].points, 30); // only approved counted
});

test("Cred Bureau scoring respects payoutEligible flag", async () => {
  const scoring = await loadScoring();
  const participants = [
    {
      id: "p1",
      displayName: "Charlie",
      wallet: "0xccc",
      telegram: null,
      email: null,
      createdAt: "",
      updatedAt: "",
      status: "active",
      helixaProfileUrl: null,
      applicationId: null,
    },
  ];
  const contributions = [
    {
      id: "c1",
      participantId: "p1",
      seasonId: "season-1",
      categoryId: "matched-task",
      title: "Approved eligible",
      description: "Desc",
      evidenceUrl: null,
      socialEvidence: false,
      requestedPoints: null,
      assignedPoints: 50,
      status: "approved",
      reviewerNotes: null,
      antiFarmNotes: null,
      reviewedAt: "2026-05-21T12:00:00Z",
      reviewedBy: "reviewer",
      approvedAt: "2026-05-21T12:00:00Z",
      rejectedAt: null,
      needsInfoAt: null,
      payoutEligible: true,
      createdAt: "2026-05-21T11:00:00Z",
      updatedAt: "2026-05-21T12:00:00Z",
    },
    {
      id: "c2",
      participantId: "p1",
      seasonId: "season-1",
      categoryId: "matched-task",
      title: "Approved non-eligible",
      description: "Desc",
      evidenceUrl: null,
      socialEvidence: false,
      requestedPoints: null,
      assignedPoints: 30,
      status: "approved",
      reviewerNotes: null,
      antiFarmNotes: null,
      reviewedAt: "2026-05-21T12:00:00Z",
      reviewedBy: "reviewer",
      approvedAt: "2026-05-21T12:00:00Z",
      rejectedAt: null,
      needsInfoAt: null,
      payoutEligible: false,
      createdAt: "2026-05-21T11:00:00Z",
      updatedAt: "2026-05-21T12:00:00Z",
    },
  ];
  const payoutRows = scoring.calculateSeasonPayoutRows(
    participants,
    contributions,
    "season-1",
    "1000000",
  );
  assert.equal(payoutRows.length, 1);
  assert.equal(payoutRows[0].points, 50); // only payout‑eligible contributions counted
});

test("Cred Bureau scoring uses approvedAt for lastApprovedAt", async () => {
  const scoring = await loadScoring();
  const participants = [
    {
      id: "p1",
      displayName: "Dana",
      wallet: "0xddd",
      telegram: null,
      email: null,
      createdAt: "",
      updatedAt: "",
      status: "active",
      helixaProfileUrl: null,
      applicationId: null,
    },
  ];
  const contributions = [
    {
      id: "c1",
      participantId: "p1",
      seasonId: "season-1",
      categoryId: "matched-task",
      title: "Task",
      description: "Desc",
      evidenceUrl: null,
      socialEvidence: false,
      requestedPoints: null,
      assignedPoints: 40,
      status: "approved",
      reviewerNotes: null,
      antiFarmNotes: null,
      reviewedAt: "2026-05-21T13:00:00Z",
      reviewedBy: "reviewer",
      approvedAt: "2026-05-21T13:00:00Z",
      rejectedAt: null,
      needsInfoAt: null,
      payoutEligible: true,
      createdAt: "2026-05-21T12:00:00Z", // earlier than approvedAt
      updatedAt: "2026-05-21T13:00:00Z",
    },
  ];
  const leaderboard = scoring.buildCredBureauLeaderboard(participants, contributions);
  assert.equal(leaderboard[0].lastApprovedAt, "2026-05-21T13:00:00Z");
});

test("Cred Bureau scoring allocates token pool by points", async () => {
  const scoring = await loadScoring();
  const participants = [
    {
      id: "alice",
      displayName: "Alice",
      wallet: "0xa",
      telegram: null,
      email: null,
      createdAt: "",
      updatedAt: "",
      status: "active",
      helixaProfileUrl: null,
      applicationId: null,
    },
    {
      id: "bob",
      displayName: "Bob",
      wallet: "0xb",
      telegram: null,
      email: null,
      createdAt: "",
      updatedAt: "",
      status: "active",
      helixaProfileUrl: null,
      applicationId: null,
    },
  ];
  const contributions = [
    {
      id: "c1",
      participantId: "alice",
      seasonId: "season-1",
      categoryId: "matched-task",
      title: "Task",
      description: "Desc",
      evidenceUrl: null,
      socialEvidence: false,
      requestedPoints: null,
      assignedPoints: 80,
      status: "approved",
      reviewerNotes: null,
      antiFarmNotes: null,
      reviewedAt: "2026-05-21T12:00:00Z",
      reviewedBy: "reviewer",
      approvedAt: "2026-05-21T12:00:00Z",
      rejectedAt: null,
      needsInfoAt: null,
      payoutEligible: true,
      createdAt: "2026-05-21T11:00:00Z",
      updatedAt: "2026-05-21T12:00:00Z",
    },
    {
      id: "c2",
      participantId: "bob",
      seasonId: "season-1",
      categoryId: "matched-task",
      title: "Task",
      description: "Desc",
      evidenceUrl: null,
      socialEvidence: false,
      requestedPoints: null,
      assignedPoints: 20,
      status: "approved",
      reviewerNotes: null,
      antiFarmNotes: null,
      reviewedAt: "2026-05-21T12:00:00Z",
      reviewedBy: "reviewer",
      approvedAt: "2026-05-21T12:00:00Z",
      rejectedAt: null,
      needsInfoAt: null,
      payoutEligible: true,
      createdAt: "2026-05-21T11:00:00Z",
      updatedAt: "2026-05-21T12:00:00Z",
    },
  ];
  const payoutRows = scoring.calculateSeasonPayoutRows(
    participants,
    contributions,
    "season-1",
    "400000",
  );
  assert.equal(payoutRows.length, 2);
  // Alice 80%, Bob 20% of 400000 = 320000 and 80000
  assert.equal(payoutRows[0].amount, "320000");
  assert.equal(payoutRows[1].amount, "80000");
});

test("Cred Bureau scoring distributes remainder units deterministically", async () => {
  const scoring = await loadScoring();
  const participants = [
    { id: "p1", displayName: "A", wallet: "0x1", telegram: null, email: null, createdAt: "", updatedAt: "", status: "active", helixaProfileUrl: null, applicationId: null },
    { id: "p2", displayName: "B", wallet: "0x2", telegram: null, email: null, createdAt: "", updatedAt: "", status: "active", helixaProfileUrl: null, applicationId: null },
    { id: "p3", displayName: "C", wallet: "0x3", telegram: null, email: null, createdAt: "", updatedAt: "", status: "active", helixaProfileUrl: null, applicationId: null },
  ];
  const contributions = participants.map((p, idx) => ({
    id: `c${idx}`,
    participantId: p.id,
    seasonId: "season-1",
    categoryId: "matched-task",
    title: "Task",
    description: "Desc",
    evidenceUrl: null,
    socialEvidence: false,
    requestedPoints: null,
    assignedPoints: 1,
    status: "approved",
    reviewerNotes: null,
    antiFarmNotes: null,
    reviewedAt: "2026-05-21T12:00:00Z",
    reviewedBy: "reviewer",
    approvedAt: "2026-05-21T12:00:00Z",
    rejectedAt: null,
    needsInfoAt: null,
    payoutEligible: true,
    createdAt: "2026-05-21T11:00:00Z",
    updatedAt: "2026-05-21T12:00:00Z",
  }));
  const payoutRows = scoring.calculateSeasonPayoutRows(
    participants,
    contributions,
    "season-1",
    "1", // 1 token, 18 decimals = 1 000 000 000 000 000 000 units
  );
  assert.equal(payoutRows.length, 3);
  // each gets floor 333 333 333 333 333 333 units, remainder 1 unit goes to highest‑ranked
  const units = payoutRows.map(r => BigInt(r.amountUnits));
  const total = units.reduce((a, b) => a + b, 0n);
  assert.equal(total, 1000000000000000000n);
  // first row gets extra unit
  assert.equal(units[0] - units[1], 1n);
  assert.equal(units[1], units[2]);
});

test("Cred Bureau scoring handles low-effort social replies (score 0)", async () => {
  // This is a placeholder – low‑effort detection is not yet implemented in scoring
  // We'll just verify that scoring doesn't crash
  const scoring = await loadScoring();
  const participants = [
    {
      id: "p1",
      displayName: "Eve",
      wallet: "0xeee",
      telegram: null,
      email: null,
      createdAt: "",
      updatedAt: "",
      status: "active",
      helixaProfileUrl: null,
      applicationId: null,
    },
  ];
  const contributions = [
    {
      id: "c1",
      participantId: "p1",
      seasonId: "season-1",
      categoryId: "wildcard",
      title: "gm",
      description: "gm",
      evidenceUrl: null,
      socialEvidence: true,
      requestedPoints: null,
      assignedPoints: 0,
      status: "approved",
      reviewerNotes: null,
      antiFarmNotes: null,
      reviewedAt: "2026-05-21T12:00:00Z",
      reviewedBy: "reviewer",
      approvedAt: "2026-05-21T12:00:00Z",
      rejectedAt: null,
      needsInfoAt: null,
      payoutEligible: false,
      createdAt: "2026-05-21T11:00:00Z",
      updatedAt: "2026-05-21T12:00:00Z",
    },
  ];
  const leaderboard = scoring.buildCredBureauLeaderboard(participants, contributions);
  assert.equal(leaderboard.length, 1);
  assert.equal(leaderboard[0].points, 0);
});
