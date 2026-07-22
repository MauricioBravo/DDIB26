import { YACI_URL } from "./blockchain-provider";

// One endpoint's untouched answer: the URL we asked, the status we got, and
// the body exactly as the indexer returned it. Nothing is reshaped or
// summarised on the way to the screen -- the whole point of the "verify
// on-chain" control is that the viewer reads what the chain's indexer says,
// not our interpretation of it, and can paste the same URL into their own
// browser or curl to get the same bytes back.
export type RawChainQuery = {
  url: string;
  status: number;
  body: unknown;
};

export type RawOnChainRecord = {
  queriedAt: string;
  // Proves inclusion: block height, slot, fee, inputs and outputs.
  tx: RawChainQuery;
  // The actual payload: label 674 for a juror's vote (the `msg` array built
  // in vote-panel.tsx), label 721 for a CIP-25 certification mint.
  metadata: RawChainQuery;
};

async function queryRaw(url: string): Promise<RawChainQuery> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    // Some error responses on this indexer come back as plain text rather
    // than JSON, so fall back to the raw text instead of throwing on parse.
    const text = await res.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      // keep the text as-is
    }
    return { url, status: res.status, body };
  } catch (err) {
    return {
      url,
      status: 0,
      body: { error: err instanceof Error ? err.message : "Request failed" },
    };
  }
}

// Re-queries the UZH Cardano indexer for a transaction and hands back both
// responses verbatim. A 404 here is the ordinary "not indexed yet" state on
// this network (same as getTxConfirmation in blockchain-provider.ts), not a
// failure to hide: it gets surfaced with its real status and body rather
// than smoothed into something that looks like success.
export async function fetchRawOnChainRecord(
  txHash: string,
): Promise<RawOnChainRecord> {
  const txUrl = `${YACI_URL}txs/${txHash}`;
  const metadataUrl = `${YACI_URL}txs/${txHash}/metadata`;
  const [tx, metadata] = await Promise.all([
    queryRaw(txUrl),
    queryRaw(metadataUrl),
  ]);
  return { queriedAt: new Date().toISOString(), tx, metadata };
}

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
