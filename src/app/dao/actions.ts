"use server";

import { revalidatePath } from "next/cache";
import {
  castVote,
  getCase,
  resubmitCase as resubmitCaseInStore,
  type Case,
  type VoteDecision,
} from "@/lib/cases";
import { getTxConfirmation, type TxConfirmation } from "@/lib/blockchain-provider";
import {
  fetchRawOnChainRecord,
  type RawOnChainRecord,
} from "@/lib/verify-onchain";

export async function submitVote(
  caseId: string,
  jurorId: string,
  jurorLabel: string,
  decision: VoteDecision,
  simulated: boolean,
  comment?: string,
): Promise<Case> {
  const updated = await castVote(caseId, {
    jurorId,
    jurorLabel,
    decision,
    simulated,
    comment,
  });
  revalidatePath("/dao");
  revalidatePath(`/dao/${caseId}`);
  return updated;
}

// Restarts a rejected case's assessment -- see resubmitCase in
// src/lib/cases.ts. Reachable from both the jury case view and the
// verifier's own view, since neither role has real distinct permissions in
// this PoC.
export async function resubmitCase(caseId: string): Promise<Case> {
  const updated = resubmitCaseInStore(caseId);
  revalidatePath("/dao");
  revalidatePath(`/dao/${caseId}`);
  revalidatePath("/verifier");
  revalidatePath(`/verifier/${caseId}`);
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

// Backs the "verify on-chain" control: goes back to the UZH Cardano indexer
// and returns its untouched answer for a transaction. Server-side for the
// same reason as checkTxConfirmation above, plus one specific to this call:
// the indexer is plain HTTP, so a browser fetch would be blocked as mixed
// content the moment this app is served over HTTPS.
export async function fetchRawChainRecord(
  txHash: string,
): Promise<RawOnChainRecord> {
  return fetchRawOnChainRecord(txHash);
}
