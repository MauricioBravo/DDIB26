"use server";

import { revalidatePath } from "next/cache";
import { castVote, type Case, type VoteDecision } from "@/lib/cases";

export async function submitVote(
  caseId: string,
  jurorId: string,
  jurorLabel: string,
  decision: VoteDecision,
  simulated: boolean,
): Promise<Case> {
  const updated = castVote(caseId, { jurorId, jurorLabel, decision, simulated });
  revalidatePath("/dao");
  revalidatePath(`/dao/${caseId}`);
  return updated;
}
