import { getSynagentBySlug, synagents, type Synagent } from "@/app/synagents/data";
import type { MatchSourceCandidate, MatchSourceResolution } from "@/lib/match-types";

type ExplicitHelixaProviderMapping = {
  providerSlug: string;
  candidateIds?: string[];
  candidateNames?: string[];
  candidateTypes?: Array<"agent" | "human">;
};

const EXPLICIT_HELIXA_PROVIDER_MAPPINGS: ExplicitHelixaProviderMapping[] = [
  // Populate with curated Helixa principal -> Synagent provider links as they become real.
  // Example:
  // {
  //   providerSlug: "builder-core",
  //   candidateIds: ["1"],
  //   candidateNames: ["Bendr 2.0"],
  //   candidateTypes: ["agent"],
  // },
];

function normalizeText(value?: string | null) {
  return (value || "").trim().toLowerCase();
}

function normalizeId(value?: string | null) {
  return (value || "").trim();
}

function normalizeSlug(value?: string | null) {
  return normalizeText(value).replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
}

export function resolveSynagentProvider(options: {
  providerSlug?: string | null;
  candidate?: MatchSourceCandidate | null;
}): { provider: Synagent | null; resolution: MatchSourceResolution | null } {
  const requestedProviderSlug = normalizeSlug(options.providerSlug || null);
  if (requestedProviderSlug) {
    const provider = getSynagentBySlug(requestedProviderSlug);
    if (provider) {
      return {
        provider,
        resolution: {
          providerSlug: provider.slug,
          providerName: provider.name,
          confidence: "manual-query",
        },
      };
    }
  }

  const candidateId = normalizeId(options.candidate?.id || null);
  const candidateName = normalizeText(options.candidate?.name || null);
  const candidateType = options.candidate?.type || null;

  if (!candidateId && !candidateName) {
    return { provider: null, resolution: null };
  }

  for (const mapping of EXPLICIT_HELIXA_PROVIDER_MAPPINGS) {
    const provider = getSynagentBySlug(mapping.providerSlug);
    if (!provider) continue;

    const typeAllowed = !mapping.candidateTypes?.length || (candidateType ? mapping.candidateTypes.includes(candidateType) : true);
    if (!typeAllowed) continue;

    if (candidateId && mapping.candidateIds?.includes(candidateId)) {
      return {
        provider,
        resolution: {
          providerSlug: provider.slug,
          providerName: provider.name,
          confidence: "explicit-map",
        },
      };
    }

    if (candidateName && mapping.candidateNames?.some((value) => normalizeText(value) === candidateName)) {
      return {
        provider,
        resolution: {
          providerSlug: provider.slug,
          providerName: provider.name,
          confidence: "explicit-map",
        },
      };
    }
  }

  if (candidateName) {
    const exactNameMatch = synagents.find((provider) => normalizeText(provider.name) === candidateName || normalizeSlug(provider.slug) === normalizeSlug(candidateName));
    if (exactNameMatch) {
      return {
        provider: exactNameMatch,
        resolution: {
          providerSlug: exactNameMatch.slug,
          providerName: exactNameMatch.name,
          confidence: "name-match",
        },
      };
    }
  }

  return { provider: null, resolution: null };
}
