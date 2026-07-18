// Throwaway validation script -- proves the Next.js backend can mint a real
// native token on the UZH Cardano testnet directly via the public Yaci Store
// API (http://130.60.24.200:8080), with NO SSH to any UZH server. Deleted
// after the proof runs; not part of the shipped app.
import {
  MeshWallet,
  YaciProvider,
  resolvePaymentKeyHash,
  resolveNativeScriptHash,
  resolveNativeScriptHex,
  stringToHex,
} from "@meshsdk/core";

// NOTE: YaciProvider's default baseUrl bakes in a trailing "/api/v1/" -- a
// custom host must include that path segment too, or every request 404s
// (silently swallowed to an empty array by the provider's own try/catch).
const YACI_URL = "http://130.60.24.200:8080/api/v1/";
const COMPANY_TEST_ADDRESS =
  "addr_test1vr7g3m8njs2fh40fxqc2s2vlvckcclt45ygjxats5xcampcyt2cs2";

async function main() {
  const provider = new YaciProvider(YACI_URL);

  const mnemonicEnv = process.env.SYSTEM_SIGNER_MNEMONIC;
  const mnemonic = mnemonicEnv ? mnemonicEnv.split(" ") : MeshWallet.brew();

  const wallet = new MeshWallet({
    networkId: 0,
    fetcher: provider,
    submitter: provider,
    key: { type: "mnemonic", words: mnemonic },
  });
  await wallet.init();

  // Use the enterprise (payment-only, no stake credential) address
  // consistently -- MeshWallet's default getUtxos()/getChangeAddress() with
  // no explicit addressType resolve to the *base* address (payment + stake)
  // instead, which is a DIFFERENT address than the one printed/funded below.
  const address = wallet.getAddresses().enterpriseAddressBech32;
  console.log("System signer address:", address);
  if (!mnemonicEnv) {
    console.log(
      "NEW mnemonic generated (save as SYSTEM_SIGNER_MNEMONIC, do not commit):",
    );
    console.log(mnemonic.join(" "));
  }

  const utxos = await wallet.getUtxos("enterprise");
  const lovelace = utxos.reduce(
    (sum, u) =>
      sum +
      BigInt(
        u.output.amount.find((a) => a.unit === "lovelace")?.quantity ?? "0",
      ),
    0n,
  );
  console.log("Balance:", lovelace.toString(), "lovelace,", utxos.length, "utxo(s)");

  if (lovelace < 3_000_000n) {
    console.log("\nFund this address with test ADA, then re-run with:");
    console.log(`SYSTEM_SIGNER_MNEMONIC="${mnemonic.join(" ")}" node mint-poc.mjs`);
    return;
  }

  const tip = await provider.get("/blocks/latest");
  const expirySlot = Number(tip.slot) + 259200; // ~3 days at slotLength=1s
  const keyHash = resolvePaymentKeyHash(address);

  const nativeScript = {
    type: "all",
    scripts: [
      { type: "sig", keyHash },
      { type: "before", slot: expirySlot.toString() },
    ],
  };
  const policyId = resolveNativeScriptHash(nativeScript);
  const scriptHex = resolveNativeScriptHex(nativeScript);
  console.log("Policy ID:", policyId);
  console.log("Expiry slot:", expirySlot, "(tip", tip.slot, ")");

  const assetNameHex = stringToHex("GreenProofBackendPoC01");
  const metadata = {
    [policyId]: {
      GreenProofBackendPoC01: {
        name: "GreenProofBackendPoC01",
        companyId: "acme-reforestation-001",
        actionType: "Trees planted",
        quantity: "150",
        date: "2026-07-18",
        evidenceHash:
          "0xTESTEVID00000000000000000000000000000000000000000000000000000",
        verifierId: "verifier-007",
        juryResult: "approved-2of3",
      },
    },
  };

  const { MeshTxBuilder } = await import("@meshsdk/core");
  const params = await provider.fetchProtocolParameters();

  const unsignedTx = await new MeshTxBuilder({ fetcher: provider, params })
    .mint("1", policyId, assetNameHex)
    .mintingScript(scriptHex)
    .metadataValue(721, metadata)
    .txOut(COMPANY_TEST_ADDRESS, [
      { unit: policyId + assetNameHex, quantity: "1" },
    ])
    .changeAddress(address)
    .invalidHereafter(expirySlot)
    .selectUtxosFrom(utxos)
    .complete();

  const signedTx = await wallet.signTx(unsignedTx, true);
  const txHash = await provider.submitTx(signedTx);
  console.log("\nSubmitted. TxID:", txHash);

  console.log("\nWaiting 15s, then verifying independently against the node...");
  await new Promise((r) => setTimeout(r, 15000));
  const companyUtxos = await provider.fetchAddressUTxOs(COMPANY_TEST_ADDRESS);
  const got = companyUtxos.find((u) =>
    u.output.amount.some((a) => a.unit === policyId + assetNameHex),
  );
  console.log(
    got
      ? `CONFIRMED on-chain: asset ${policyId + assetNameHex} present at ${COMPANY_TEST_ADDRESS}`
      : "NOT YET VISIBLE -- re-check in a few seconds (indexer lag) before assuming failure.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
