"use server";

import { revalidatePath } from "next/cache";
import { castVote, getCase, type Case, type VoteDecision } from "@/lib/cases";
import { getTxConfirmation, type TxConfirmation } from "@/lib/blockchain-provider";

export async function submitVote(
  caseId: string,
  jurorId: string,
  jurorLabel: string,
  decision: VoteDecision,
  simulated: boolean,
): Promise<Case> {
  const updated = await castVote(caseId, { jurorId, jurorLabel, decision, simulated });
  revalidatePath("/dao");
  revalidatePath(`/dao/${caseId}`);
  return updated;
}

// Lets a client component poll "has this tx landed in a block yet" without
// bundling any Cardano libraries into the client -- all chain access stays
// server-side. Used for both the connected juror's real vote tx and the
// mint tx.
export async function checkTxConfirmation(txHash: string): Promise<TxConfirmation> {
  return getTxConfirmation(txHash);
}

// Lets a client component poll a case's current state -- used to detect
// when the background mint (fired from castVote, not awaited there) has
// finished, since the vote's own submitVote response returns before the
// mint does. See the comment on the mint call in src/lib/cases.ts.
export async function fetchCaseSnapshot(caseId: string): Promise<Case | null> {
  return getCase(caseId) ?? null;
}
