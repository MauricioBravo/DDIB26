import { YACI_URL } from "./blockchain-provider";

export type OnChainMint = {
  found: boolean;
  blockNumber?: number;
  // Real timestamp, derived from the metadata entry's block_time (Unix
  // seconds) -- not our own case store's "date" field, which is only the
  // server's wall-clock time when the mint tx was built, not when it
  // actually landed on-chain. See mint.ts's `date` field for that other one.
  issuedAt?: string;
  company?: string;
  actionType?: string;
  quantity?: string;
  verifierId?: string;
  juryResult?: string;
};

type MetadataEntry = {
  label: string;
  block_number: number;
  block_time: number;
  body: Record<string, Record<string, Record<string, string>>>;
};

// Independently re-queries the chain for a mint's real CIP-25 metadata
// (label 721) -- this is the raw on-chain record, not whatever our own
// in-memory case store remembers about it. Used both for a company
// profile's live badge and its "Validate" button's fresh re-check, per
// docs/status.md's "verify on-chain" TODO item: the point is proving the
// certification independently rather than trusting our own frontend.
export async function verifyMintOnChain(
  txHash: string,
  policyId: string,
  caseId: string,
): Promise<OnChainMint> {
  try {
    const res = await fetch(`${YACI_URL}txs/${txHash}/metadata`);
    if (!res.ok) return { found: false };

    const entries = (await res.json()) as MetadataEntry[];
    const entry = entries.find((m) => m.label === "721");
    const assetBody = entry?.body?.[policyId]?.[`GreenProof${caseId}`];
    if (!entry || !assetBody) return { found: false };

    return {
      found: true,
      blockNumber: entry.block_number,
      issuedAt: new Date(entry.block_time * 1000).toISOString(),
      company: assetBody.company,
      actionType: assetBody.actionType,
      quantity: assetBody.quantity,
      verifierId: assetBody.verifierId,
      juryResult: assetBody.juryResult,
    };
  } catch {
    return { found: false };
  }
}
