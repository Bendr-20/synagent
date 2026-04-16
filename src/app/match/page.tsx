import { MatchClient } from "./match-client";
import type { MatchHandoffPrefill, MatchSourceCandidate } from "@/lib/match-types";
import { resolveSynagentProvider } from "@/lib/provider-resolution";

function getSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function splitCsv(value: string | string[] | undefined) {
  const single = getSingle(value);
  if (!single) return [];
  return single.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 12);
}

function buildHandoffPrefill(params: Record<string, string | string[] | undefined>): MatchHandoffPrefill | null {
  const source = getSingle(params.source)?.trim() || null;
  const requestId = getSingle(params.requestId)?.trim() || null;
  const title = getSingle(params.title)?.trim() || null;
  const brief = getSingle(params.brief)?.trim() || null;
  const requester = getSingle(params.requester)?.trim() || null;
  const contact = getSingle(params.contact)?.trim() || null;
  const budget = getSingle(params.budget)?.trim() || null;
  const urgency = getSingle(params.urgency)?.trim() || null;
  const category = getSingle(params.category)?.trim() || null;
  const capability = getSingle(params.capability)?.trim() || null;
  const principalTypeValue = getSingle(params.principalType)?.trim();
  const principalType = principalTypeValue === "all" || principalTypeValue === "agent" || principalTypeValue === "human"
    ? principalTypeValue
    : null;
  const requiredSkills = splitCsv(params.requiredSkills);
  const candidateId = getSingle(params.candidateId)?.trim() || null;
  const candidateTypeValue = getSingle(params.candidateType)?.trim();
  const candidateType = candidateTypeValue === "agent" || candidateTypeValue === "human"
    ? candidateTypeValue
    : null;
  const candidateName = getSingle(params.candidateName)?.trim() || null;

  if (!source && !requestId && !title && !brief && !requester && !contact && !budget && !urgency && !category && !capability && !principalType && !requiredSkills.length && !candidateId && !candidateType && !candidateName) {
    return null;
  }

  const candidate: MatchSourceCandidate | null = candidateId || candidateType || candidateName
    ? {
        id: candidateId,
        type: candidateType,
        name: candidateName,
      }
    : null;

  const { resolution } = resolveSynagentProvider({
    providerSlug: getSingle(params.agent)?.trim() || null,
    candidate,
  });

  return {
    source,
    requestId,
    title,
    brief,
    requester,
    contact,
    budget,
    urgency,
    category,
    capability,
    principalType,
    requiredSkills,
    candidate,
    resolution,
  };
}

export default async function MatchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const handoff = buildHandoffPrefill(params);
  const { provider: selectedAgent } = resolveSynagentProvider({
    providerSlug: getSingle(params.agent)?.trim() || handoff?.resolution?.providerSlug || null,
    candidate: handoff?.candidate || null,
  });

  return <MatchClient selectedAgent={selectedAgent || undefined} handoff={handoff} />;
}
