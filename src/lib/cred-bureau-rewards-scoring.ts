import type {
  CredBureauRewardParticipant,
  CredBureauRewardContribution,
  CredBureauRewardSeasonId,
  CredBureauPayoutExportRow,
} from "./cred-bureau-rewards-types";

type LeaderboardRow = {
  participantId: string;
  displayName: string;
  points: number;
  lastApprovedAt: string;
  seasonId: CredBureauRewardSeasonId;
};

type PublicLeaderboardRow = Omit<LeaderboardRow, "participantId">;

export function buildCredBureauLeaderboard(
  participants: CredBureauRewardParticipant[],
  contributions: CredBureauRewardContribution[],
  seasonId?: CredBureauRewardSeasonId,
): LeaderboardRow[] {
  const filtered = seasonId
    ? contributions.filter(c => c.seasonId === seasonId && c.status === "approved")
    : contributions.filter(c => c.status === "approved");

  // group by participant
  const map = new Map<string, { points: number; lastApprovedAt: string }>();
  for (const c of filtered) {
    const existing = map.get(c.participantId);
    const points = existing ? existing.points + c.assignedPoints : c.assignedPoints;
    const lastApprovedAt = existing
      ? new Date(existing.lastApprovedAt) > new Date(c.approvedAt ?? c.createdAt)
        ? existing.lastApprovedAt
        : (c.approvedAt ?? c.createdAt)
      : (c.approvedAt ?? c.createdAt);
    map.set(c.participantId, { points, lastApprovedAt });
  }

  // apply social season cap (15% of payout‑eligible points)
  const seasonPayoutCapShare = 0.15;
  for (const [pid, data] of map.entries()) {
    const socialContributions = filtered.filter(
      c => c.participantId === pid && c.socialEvidence === true && c.payoutEligible === true,
    );
    const socialPoints = socialContributions.reduce((sum, c) => sum + c.assignedPoints, 0);
    const maxAllowedSocial = data.points * seasonPayoutCapShare;
    if (socialPoints > maxAllowedSocial) {
      // reduce total points by excess social points
      const excess = socialPoints - maxAllowedSocial;
      data.points = Math.max(0, data.points - excess);
    }
  }

  // build rows
  const rows: LeaderboardRow[] = [];
  for (const [participantId, data] of map.entries()) {
    const participant = participants.find(p => p.id === participantId);
    if (!participant) continue;
    rows.push({
      participantId,
      displayName: participant.displayName,
      points: data.points,
      lastApprovedAt: data.lastApprovedAt,
      seasonId: seasonId ?? (filtered.find(c => c.participantId === participantId)?.seasonId ?? "season-1"),
    });
  }

  // sort by points desc, then earliest approvedAt, then display name
  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const aDate = new Date(a.lastApprovedAt).getTime();
    const bDate = new Date(b.lastApprovedAt).getTime();
    if (aDate !== bDate) return aDate - bDate;
    return a.displayName.localeCompare(b.displayName);
  });
  return rows;
}

export function calculateSeasonPayoutRows(
  participants: CredBureauRewardParticipant[],
  contributions: CredBureauRewardContribution[],
  seasonId: CredBureauRewardSeasonId,
  seasonTokenPool: string,
): CredBureauPayoutExportRow[] {
  const participantIds = new Set(participants.map(p => p.id));

  // only approved, payout‑eligible contributions for active known participants
  const eligible = contributions.filter(
    c => c.seasonId === seasonId && c.status === "approved" && c.payoutEligible === true && participantIds.has(c.participantId),
  );

  // group points by participant
  const pointsMap = new Map<string, number>();
  for (const c of eligible) {
    pointsMap.set(c.participantId, (pointsMap.get(c.participantId) ?? 0) + c.assignedPoints);
  }

  // apply social season cap (again, for consistency)
  const seasonPayoutCapShare = 0.15;
  for (const [pid, totalPoints] of pointsMap.entries()) {
    const socialContributions = eligible.filter(
      c => c.participantId === pid && c.socialEvidence === true,
    );
    const socialPoints = socialContributions.reduce((sum, c) => sum + c.assignedPoints, 0);
    const maxAllowedSocial = totalPoints * seasonPayoutCapShare;
    if (socialPoints > maxAllowedSocial) {
      const excess = socialPoints - maxAllowedSocial;
      pointsMap.set(pid, Math.max(0, totalPoints - excess));
    }
  }

  const totalPoints = [...pointsMap.values()].reduce((sum, p) => sum + p, 0);
  if (totalPoints === 0) {
    return [];
  }

  const poolUnits = parseTokenAmountToUnits(seasonTokenPool, 18);
  const rows: CredBureauPayoutExportRow[] = [];

  // allocate floor units proportional to points
  let remainingUnits = poolUnits;
  const sortedParticipants = [...pointsMap.entries()]
    .map(([participantId, points]) => ({ participantId, points }))
    .sort((a, b) => b.points - a.points);

  for (const { participantId, points } of sortedParticipants) {
    const share = points / totalPoints;
    const units = BigInt(Math.floor(Number(poolUnits) * share));
    const participant = participants.find(p => p.id === participantId);
    if (!participant) continue;
    rows.push({
      participantId,
      displayName: participant.displayName,
      wallet: participant.wallet,
      seasonId,
      points,
      amount: formatTokenUnits(units, 18),
      amountUnits: units.toString(),
      reason: `Season ${seasonId} reward`,
    });
    remainingUnits -= units;
  }

  // distribute remaining units to highest‑ranked rows (deterministic)
  let i = 0;
  while (remainingUnits > BigInt(0) && rows.length > 0) {
    const row = rows[i % rows.length];
    row.amountUnits = (BigInt(row.amountUnits) + BigInt(1)).toString();
    row.amount = formatTokenUnits(BigInt(row.amountUnits), 18);
    remainingUnits -= BigInt(1);
    i++;
  }

  return rows;
}

export function buildPayoutCsv(rows: CredBureauPayoutExportRow[]): string {
  const header = "wallet,amount,participantId,displayName,seasonId,points,reason";
  const lines = rows.map(r =>
    `${r.wallet},${r.amount},${r.participantId},${r.displayName},${r.seasonId},${r.points},${r.reason}`
  );
  return [header, ...lines].join("\n");
}

export function buildPublicLeaderboardRows(rows: LeaderboardRow[]): PublicLeaderboardRow[] {
  return rows.map(({ participantId, ...rest }) => rest);
}

export function parseTokenAmountToUnits(amount: string, decimals = 18): bigint {
  const [integer, fractional = ""] = amount.split(".");
  const padded = fractional.padEnd(decimals, "0").slice(0, decimals);
  const units = BigInt(integer + padded);
  return units;
}

export function formatTokenUnits(units: bigint, decimals = 18): string {
  const unitsStr = units.toString().padStart(decimals + 1, "0");
  const integer = unitsStr.slice(0, -decimals) || "0";
  const fractional = unitsStr.slice(-decimals).replace(/0+$/, "");
  return fractional ? `${integer}.${fractional}` : integer;
}
