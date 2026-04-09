import { MatchClient } from "./match-client";
import { getSynagentBySlug } from "@/app/synagents/data";

export default async function MatchPage({
  searchParams,
}: {
  searchParams: Promise<{ agent?: string }>;
}) {
  const { agent } = await searchParams;
  const selectedAgent = agent ? getSynagentBySlug(agent) : undefined;

  return <MatchClient selectedAgent={selectedAgent} />;
}
