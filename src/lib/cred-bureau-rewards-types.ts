export type CredBureauRewardSeasonId = "season-1" | "season-2";

export type CredBureauRewardCategoryId =
  | "matched-task"
  | "task-creation"
  | "bug-friction-log"
  | "product-feedback"
  | "referral"
  | "wildcard";

export type CredBureauRewardParticipant = {
  id: string;
  createdAt: string;
  updatedAt: string;
  displayName: string;
  telegram?: string | null;
  email?: string | null;
  wallet: string;
  helixaProfileUrl?: string | null;
  applicationId?: string | null;
  status: "active" | "suspended";
};

export type CredBureauRewardContributionStatus = "submitted" | "needs-info" | "approved" | "rejected";

export type CredBureauRewardContribution = {
  id: string;
  createdAt: string;
  updatedAt: string;
  participantId: string;
  seasonId: CredBureauRewardSeasonId;
  categoryId: CredBureauRewardCategoryId;
  title: string;
  description: string;
  evidenceUrl?: string | null;
  socialEvidence?: boolean;
  requestedPoints?: number | null;
  assignedPoints: number;
  status: CredBureauRewardContributionStatus;
  reviewerNotes?: string | null;
  antiFarmNotes?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  needsInfoAt?: string | null;
  payoutEligible: boolean;
};

export type CredBureauRewardReviewLogEntry = {
  id: string;
  contributionId: string;
  participantId: string;
  loggedAt: string;
  previousStatus: CredBureauRewardContributionStatus;
  status: CredBureauRewardContributionStatus;
  assignedPoints: number;
  payoutEligible: boolean;
  reviewedBy: string;
  reviewerNotes?: string | null;
  antiFarmNotes?: string | null;
};

export type CredBureauPayoutExportRecord = {
  id: string;
  createdAt: string;
  seasonId: CredBureauRewardSeasonId;
  seasonTokenPool: string;
  totalPoints: number;
  rowCount: number;
  createdBy: string;
  antiFarmReviewComplete: true;
  antiFarmReviewNotes: string;
  rows: CredBureauPayoutExportRow[];
};

export type CredBureauPayoutExportRow = {
  participantId: string;
  displayName: string;
  wallet: string;
  seasonId: CredBureauRewardSeasonId;
  points: number;
  amount: string;
  amountUnits: string;
  reason: string;
};
