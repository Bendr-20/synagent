import type { CredBureauRewardCategoryId, CredBureauRewardSeasonId } from "./cred-bureau-rewards-types";

type RewardSeasonConfig = {
  id: CredBureauRewardSeasonId;
  label: string;
  durationWeeks: number;
  allocationShare: number;
};

type RewardCategoryConfig = {
  id: CredBureauRewardCategoryId;
  label: string;
  allocationShare: number;
  defaultPointGuidance: string;
  description: string;
};

export const CRED_BUREAU_REWARD_CONFIG = {
  totalPoolPercent: 1,
  betaDurationWeeks: 6,
  weeklyCheckpointCadence: "weekly",
  socialContributionSeasonPayoutCapShare: 0.15,
  socialContribution: {
    role: "supporting-signal-only",
    maxScoredPerUtcDay: 2,
    seasonPayoutCapShare: 0.15,
    basePoints: {
      originalPostOrThread: 10,
      quotePostWithRealCommentary: 6,
      substantiveReply: 3,
      simpleReplyOrEmojiOnly: 0,
    },
    qualityMultipliers: [0, 1, 1.5, 2],
  },
  seasons: [
    { id: "season-1", label: "Season 1", durationWeeks: 3, allocationShare: 0.4 },
    { id: "season-2", label: "Season 2", durationWeeks: 3, allocationShare: 0.6 },
  ] satisfies RewardSeasonConfig[],
  categories: [
    {
      id: "matched-task",
      label: "Matched-task rewards",
      allocationShare: 0.5,
      defaultPointGuidance: "25-100 points",
      description: "Posted task, accepted, completed, and rated.",
    },
    {
      id: "task-creation",
      label: "High-quality task creation",
      allocationShare: 0.15,
      defaultPointGuidance: "10-40 points",
      description: "Tasks other testers actually want to take.",
    },
    {
      id: "bug-friction-log",
      label: "Bug reports and friction logs",
      allocationShare: 0.15,
      defaultPointGuidance: "10-60 points",
      description: "Clear bug reports, friction logs, repro steps, and user experience blockers.",
    },
    {
      id: "product-feedback",
      label: "Product-changing feedback",
      allocationShare: 0.1,
      defaultPointGuidance: "10-50 points",
      description: "Feedback that directly changes product, copy, workflow, scoring, or review operations.",
    },
    {
      id: "referral",
      label: "Active referrals",
      allocationShare: 0.05,
      defaultPointGuidance: "10-30 points",
      description: "Referrals that become active matched users.",
    },
    {
      id: "wildcard",
      label: "Wildcard grants",
      allocationShare: 0.05,
      defaultPointGuidance: "Manual",
      description: "Manual grants for unusually valuable work that does not fit another category.",
    },
  ] satisfies RewardCategoryConfig[],
} as const;
