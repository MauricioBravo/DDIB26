import { YaciProvider, BlockfrostProvider } from "@meshsdk/core";
import type { IFetcher, ISubmitter } from "@meshsdk/common";

// Shared connection to the UZH Cardano testnet. Same two-endpoint pattern
// proven in scripts/mint-poc.mjs -- see docs/uzh-network.md for how these
// were found and why each exists.
//
// NOTE: YaciProvider's default baseUrl bakes in a trailing "/api/v1/" -- a
// custom host must include that path segment too, or every request 404s
// (silently swallowed to an empty array by the provider's own try/catch).
const YACI_URL = "http://130.60.24.200:8080/api/v1/";
// Read-only fallback: a course-provided self-hosted Blockfrost instance on
// the SAME chain (confirmed by identical slot/height at the same moment).
// It has no working /tx/submit, so it's read-only -- submission always
// goes through Yaci Store.
const BLOCKFROST_FALLBACK_URL = "http://130.60.24.200:3000";

const yaci = new YaciProvider(YACI_URL);
const blockfrostFallback = new BlockfrostProvider(BLOCKFROST_FALLBACK_URL);

async function withReadFallback<T>(
  label: string,
  primaryCall: () => Promise<T>,
  fallbackCall: () => Promise<T>,
): Promise<T> {
  try {
    return await primaryCall();
  } catch (err) {
    console.warn(
      `[fallback] ${label} failed on Yaci Store (${err instanceof Error ? err.message : err}), retrying via the Blockfrost fallback...`,
    );
    return await fallbackCall();
  }
}

// Duck-typed fetcher covering only the methods this app actually calls
// (fetchAddressUTxOs, fetchProtocolParameters, submitTx) -- the same shape
// already proven working at runtime in scripts/mint-poc.mjs (plain JS,
// no static interface check there). IFetcher/ISubmitter have several more
// methods (fetchAccountInfo, fetchAssetMetadata, etc.) that MeshWallet and
// MeshTxBuilder never invoke for a simple mint/metadata transaction, so
// this cast is safe for how it's used here -- it would NOT be safe to pass
// this to code that calls those other methods.
export const chainProvider = {
  fetchAddressUTxOs: (addr: string) =>
    withReadFallback(
      "fetchAddressUTxOs",
      () => yaci.fetchAddressUTxOs(addr),
      () => blockfrostFallback.fetchAddressUTxOs(addr),
    ),
  fetchProtocolParameters: () =>
    withReadFallback(
      "fetchProtocolParameters",
      () => yaci.fetchProtocolParameters(),
      () => blockfrostFallback.fetchProtocolParameters(),
    ),
  submitTx: (tx: string) => yaci.submitTx(tx),
  getTip: () =>
    withReadFallback(
      "getTip",
      () => yaci.get("/blocks/latest"),
      async () => {
        const res = await fetch(`${BLOCKFROST_FALLBACK_URL}/blocks/latest`);
        return res.json();
      },
    ),
} as unknown as IFetcher & ISubmitter & { getTip: () => Promise<{ slot: string | number }> };

export type TxConfirmation = {
  confirmed: boolean;
  blockHeight?: number;
  slot?: number;
};

// Cheap status check for a tx hash -- used to poll "did this land in a
// block yet" from both the vote flow and the mint flow, without pulling in
// a full UTxO fetch. Yaci Store 404s until the tx is indexed; that's the
// normal "not confirmed yet" case, not an error.
export async function getTxConfirmation(txHash: string): Promise<TxConfirmation> {
  try {
    const res = await fetch(`${YACI_URL}txs/${txHash}`);
    if (!res.ok) return { confirmed: false };
    const data = await res.json();
    if (typeof data.block_height !== "number") return { confirmed: false };
    return { confirmed: true, blockHeight: data.block_height, slot: data.slot };
  } catch {
    return { confirmed: false };
  }
}
