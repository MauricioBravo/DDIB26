import {
  MeshWallet,
  MeshTxBuilder,
  resolvePaymentKeyHash,
  resolveNativeScriptHash,
  resolveNativeScriptHex,
  stringToHex,
} from "@meshsdk/core";
import { chainProvider } from "@/lib/blockchain-provider";

// Stand-in recipient until real per-company custodial wallets exist
// (backend TODO item deprioritized, see docs/status.md). Same address
// used throughout the earlier mint proofs -- see docs/uzh-network.md.
const COMPANY_TEST_ADDRESS =
  "addr_test1vr7g3m8njs2fh40fxqc2s2vlvckcclt45ygjxats5xcampcyt2cs2";

export type MintInput = {
  caseId: string;
  company: string;
  actionType: string;
  quantity: string;
  verifierId: string;
};

export type MintResult = {
  txHash: string;
  policyId: string;
};

let walletPromise: Promise<MeshWallet> | null = null;

function getSystemWallet(): Promise<MeshWallet> {
  if (!walletPromise) {
    const mnemonic = process.env.SYSTEM_SIGNER_MNEMONIC;
    if (!mnemonic) {
      throw new Error(
        "SYSTEM_SIGNER_MNEMONIC is not set -- see .env.local and docs/uzh-network.md",
      );
    }
    walletPromise = (async () => {
      const wallet = new MeshWallet({
        networkId: 0,
        fetcher: chainProvider,
        submitter: chainProvider,
        key: { type: "mnemonic", words: mnemonic.split(" ") },
      });
      await wallet.init();
      return wallet;
    })();
  }
  return walletPromise;
}

// Builds, signs, and submits a real mint transaction on the UZH Cardano
// testnet -- same pattern proven in scripts/mint-poc.mjs, extracted here so
// the app can call it directly instead of only a standalone script. See
// docs/uzh-network.md for the network reference and prior TxIDs.
export async function mintCertificationToken(input: MintInput): Promise<MintResult> {
  const wallet = await getSystemWallet();
  const address = wallet.getAddresses().enterpriseAddressBech32;
  if (!address) {
    throw new Error("System signer has no enterprise address");
  }

  const utxos = await wallet.getUtxos("enterprise");
  if (utxos.length === 0) {
    throw new Error("System signer wallet has no UTxOs to pay the mint fee");
  }

  const tip = await chainProvider.getTip();
  const expirySlot = Number(tip.slot) + 259200; // ~3 days at slotLength=1s
  const keyHash = resolvePaymentKeyHash(address);

  const nativeScript = {
    type: "all" as const,
    scripts: [
      { type: "sig" as const, keyHash },
      { type: "before" as const, slot: expirySlot.toString() },
    ],
  };
  const policyId = resolveNativeScriptHash(nativeScript);
  const scriptHex = resolveNativeScriptHex(nativeScript);

  const assetNameHex = stringToHex(`GreenProof${input.caseId.replace(/-/g, "")}`);
  const metadata = {
    [policyId]: {
      [`GreenProof${input.caseId}`]: {
        name: `GreenProof${input.caseId}`,
        company: input.company,
        actionType: input.actionType,
        quantity: input.quantity,
        date: new Date().toISOString().slice(0, 10),
        // Placeholder -- real evidence-file hashing is out of scope for
        // this PoC, see docs/status.md scope decision (2026-07-20).
        evidenceHash:
          "0xPLACEHOLDER00000000000000000000000000000000000000000000000000",
        verifierId: input.verifierId,
        juryResult: "approved-2of3",
      },
    },
  };

  // The concrete Yaci/Blockfrost providers treat epoch as optional and
  // ignore it when omitted; IFetcher's type just requires an argument here.
  const params = await chainProvider.fetchProtocolParameters(0);
  const unsignedTx = await new MeshTxBuilder({ fetcher: chainProvider, params })
    .mint("1", policyId, assetNameHex)
    .mintingScript(scriptHex)
    .metadataValue(721, metadata)
    .txOut(COMPANY_TEST_ADDRESS, [{ unit: policyId + assetNameHex, quantity: "1" }])
    .changeAddress(address)
    .invalidHereafter(expirySlot)
    .selectUtxosFrom(utxos)
    .complete();

  const signedTx = await wallet.signTx(unsignedTx, true);
  const txHash = await chainProvider.submitTx(signedTx);

  return { txHash, policyId };
}
