export const CRED_BUREAU_REWARD_CONFIG = {
  totalPoolPercent: 1,
  betaDurationWeeks: 6,
  weeklyCheckpointCadence: "weekly",
  socialContributionSeasonPayoutCapShare: 0.15,
  seasons: [
    { id: "season-1", label: "Season 1", durationWeeks: 3, allocationShare: 0.4 },
    { id: "season-2", label: "Season 2", durationWeeks: 3, allocationShare: 0.6 },
  ],
  categories: [
    { id: "cred-review", label: "Useful Cred reviews", defaultPointGuidance: "10-40 points" },
    { id: "human-ai-task", label: "Completed human-AI work tasks", defaultPointGuidance: "25-100 points" },
    { id: "agent-qa", label: "QA reports on agents/tools", defaultPointGuidance: "10-60 points" },
    { id: "ecosystem-intel", label: "High-signal ecosystem intel", defaultPointGuidance: "10-50 points" },
    { id: "partner-community", label: "Partner/community tasks", defaultPointGuidance: "10-75 points" },
    { id: "social-contribution", label: "Original posts, quote posts, and substantive replies", defaultPointGuidance: "0-20 points, max 2 scored per day" },
    { id: "task-creation", label: "High-quality task creation", defaultPointGuidance: "10-40 points" },
    { id: "referral", label: "Referrals that become active members", defaultPointGuidance: "10-30 points" },
    { id: "wildcard", label: "Wildcard grants", defaultPointGuidance: "Manual" },
  ],
} as const;
