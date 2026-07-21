"use server";

import { verifyMintOnChain, type OnChainMint } from "@/lib/verify-onchain";

export async function checkOnChainMint(
  txHash: string,
  policyId: string,
  caseId: string,
): Promise<OnChainMint> {
  return verifyMintOnChain(txHash, policyId, caseId);
}
