export type CredBureauApplicationStatus = "pending-review" | "approved" | "rejected";

export type CredBureauHumanProfileRef = {
  id?: string | null;
  url?: string | null;
  wallet?: string | null;
  handle?: string | null;
};

export type CredBureauApplicant = {
  name: string;
  telegram: string;
  email?: string | null;
  role?: string | null;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
};

export type CredBureauApplicationPayload = {
  applicant?: Partial<CredBureauApplicant> | null;
  humanProfile?: CredBureauHumanProfileRef | null;
  reviewAddendum?: {
    whyJoin?: string | null;
    availability?: string | null;
    disclosure?: string | null;
  } | null;
};

export type CredBureauApplicationRecord = {
  id: string;
  createdAt: string;
  status: CredBureauApplicationStatus;
  applicant: CredBureauApplicant;
  humanProfile: CredBureauHumanProfileRef;
  reviewAddendum: {
    whyJoin: string;
    availability?: string | null;
    disclosure?: string | null;
  };
  review: {
    profileRequired: boolean;
    profileMissing: boolean;
    profileMustBeUpdated: true;
    manualReviewRequired: true;
    manualGroupAddRequired: true;
    autoInviteSent: false;
    reviewerNotes?: string | null;
  };
};

export type CredBureauApplicationResponse =
  | {
      success: true;
      applicationId: string;
      status: CredBureauApplicationStatus;
      nextStep: string;
      groupInviteUrl: null;
    }
  | {
      success: false;
      error: string;
    };

export type CredBureauStatusUpdateResponse =
  | {
      success: true;
      application: CredBureauApplicationRecord;
    }
  | {
      success: false;
      error: string;
    };
