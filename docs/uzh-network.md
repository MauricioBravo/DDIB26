# UZH Cardano testnet -- reference

Practical, non-secret reference for the dedicated Cardano testnet the course
runs ("UZH Cardano"). Everything here is safe to have in the public repo --
no private keys, no SSH credentials. For those, see the local (non-git)
results file referenced in project memory.

## Network

- **Testnet magic**: `42`
- **Era**: Conway (protocol version 10.x)
- **Native currency**: UZHADA
- **Address network tag**: 0 (testnet), same as Preprod/Preview -- `addr_test1...`

## Public API -- Yaci Store (Blockfrost-compatible)

The course network exposes a public, **unauthenticated** indexer API,
Bloxbean's open-source "Yaci Store", at:

```
http://130.60.24.200:8080/api/v1/
```

Confirmed working endpoints (Blockfrost-shaped paths and responses):

- `GET /blocks/latest` -- current tip (slot, height, hash, era)
- `GET /addresses/{address}/utxos` -- UTxOs at an address (supports `?page=`)
- `GET /epochs/latest/parameters` -- protocol parameters (fees, cost models, etc.)
- `GET /txs/{hash}` -- tx detail (inputs, outputs, fees, slot)
- `GET /txs/{hash}/metadata` -- on-chain metadata for a tx (CIP-25/CIP-20 etc.)
- `POST /tx/submit` -- submit a signed tx (raw CBOR bytes as the body)

No project ID / API key header needed, unlike public Blockfrost.

**Not implemented** on this instance: `fetchCostModels` (Mesh SDK's
`YaciProvider.fetchCostModels` throws "Method not implemented", caught by
`MeshTxBuilder` which silently falls back to default cost models -- harmless
for native-script-only transactions like minting/metadata txs, since those
never touch Plutus cost models anyway).

### Using it from Mesh SDK (`@meshsdk/core`, already a project dependency)

```ts
import { YaciProvider } from "@meshsdk/core";

// IMPORTANT: YaciProvider's default baseUrl already bakes in a trailing
// "/api/v1/". Passing a custom host WITHOUT that suffix makes every request
// 404 -- and YaciProvider's own fetchAddressUTxOs/etc. swallow that into a
// silent empty array `[]`, not an error, which reads as "empty wallet" or
// "no protocol params" instead of "wrong URL". Always include the /api/v1/:
const provider = new YaciProvider("http://130.60.24.200:8080/api/v1/");
```

```ts
import { MeshWallet } from "@meshsdk/core";

const wallet = new MeshWallet({
  networkId: 0,
  fetcher: provider,
  submitter: provider,
  key: { type: "mnemonic", words: [...] },
});
await wallet.init();

// IMPORTANT: wallet.getUtxos() / getChangeAddress() with NO explicit
// addressType default to the *base* address (payment + stake credential),
// which is a DIFFERENT address from the enterprise (payment-only) one most
// setups actually generate/fund/print. Always pass "enterprise" explicitly
// unless you specifically want the base address:
const utxos = await wallet.getUtxos("enterprise");
const address = wallet.getAddresses().enterpriseAddressBech32;
```

Both of the above cost real debugging time (2026-07-18) -- see
`scripts/mint-poc.mjs` for the full working pattern (build a time-locked
native minting policy, mint with CIP-25 metadata, submit, verify
independently against the API).

## Read fallback -- course-provided Blockfrost instance

A teaching assistant (Guangyao Li) separately shared a real, self-hosted
Blockfrost instance for this same network at:

```
http://130.60.24.200:3000
```

Confirmed (2026-07-18) to be **the same chain** as the Yaci Store instance
above -- both returned the identical slot and block height at the same
moment, and the same UTxO for our system signer. Two gotchas versus a
normal public Blockfrost:

- **No `/api/v0/` prefix** on this instance -- routes are mounted at root
  (`GET /blocks/latest`, not `GET /api/v0/blocks/latest`, which 400s with
  `"Invalid path"`). No `project_id` header needed either.
- **No working `/tx/submit`** -- every path variant tried (`/tx/submit`,
  `/tx/submit/cbor`, `/txs/submit`) returns the same `"Invalid path"` error.
  This looks like a deliberate read-only mirror. **Use it only as a fallback
  for reads, never for submission** -- Yaci Store (`:8080`) remains the only
  way to actually submit a transaction.

Mesh SDK's `BlockfrostProvider` supports a custom URL directly and works
against this instance with no changes:

```ts
import { BlockfrostProvider } from "@meshsdk/core";
const blockfrostFallback = new BlockfrostProvider("http://130.60.24.200:3000");
```

`scripts/mint-poc.mjs` wires this in as a read fallback: `fetchAddressUTxOs`,
`fetchProtocolParameters`, and the tip lookup all try Yaci Store first and
retry against this Blockfrost instance if that fails; `submitTx` always goes
through Yaci Store. Re-ran the full mint end-to-end with this wrapper in
place to confirm it doesn't break anything -- see the third row in the table
below.

## Known addresses (public, non-secret)

| Role | Address | Notes |
|---|---|---|
| GreenProof backend system signer | `addr_test1vrtm3vacksjfupfx6a0qqf4ujclvfpcjf9jettq45k5p2gcgcx7z8` | Signs every real mint transaction. Mnemonic in `.env.local` (gitignored), never here. |
| Test company wallet (mock recipient) | `addr_test1vr7g3m8njs2fh40fxqc2s2vlvckcclt45ygjxats5xcampcyt2cs2` | Used as the mint destination in test runs. Not a real company, no skey needed by us (we only ever send *to* it). |
| Mauricio's H07 hands-on wallet | `addr_test1qrfjtwgwhu5ljg0v03hgrvfvsd7vrhvn3tspm2u4pu7es9g0cnhdy36t4apxpxj4c590gtn2s88cmyn3mvhl2arl7m0q645f9k` | Pre-existing course wallet, ~4,496 UZHADA as of 2026-07-18. Funded the DAO validator tests and (indirectly) the system signer above. |

## Real transactions minted/tested so far

| What | Policy ID | TxID | Notes |
|---|---|---|---|
| First mint test (cardano-cli, on the UZH node VM directly) | `b86c3936ba0e4fef0818b3b4ac830bec981338ddccba5a635a44de0a` | `6dc0f7605727d6c053d33bbe1bc57243753dc088df7de09d34a1cadd96757bf6` | Proved the on-chain mechanics work at all. Signer lived only on that VM. |
| Second mint test (Mesh SDK + YaciProvider, from this repo, no SSH) | `ae7e85b4907f8162f7acd4eda27f72dcb1e2d4777c8a635d6dbfb756` | `52f5b2b45370e7d2196fd1b90a9bd71687d2a5ad08f204d6b2e3cb65a100fb8c` | Proves the real production path: backend builds+signs+submits directly over the internet. Both independently re-verified via direct `curl` against the API (not just trusted from script output). |
| Third mint test (with the Blockfrost read-fallback wrapper wired in) | `bb45ef5c73372ee3330fdf2bb9714302c8b4642a937e9be64f5185b8` | `c3bab0164bc28b921b3a5be563e628926384cae14b7e55487b38a004141bea5c` | Confirms the fallback wrapper doesn't break the mint pipeline. |

To inspect any of the above yourself: `GET /txs/{hash}` and
`GET /txs/{hash}/metadata` against the API URL, or use
`scripts/greenproof_tx_lookup.py <TX_HASH>` (demo helper, prints a
human-readable summary including CIP-25/CIP-20 metadata).

## DAO voting validator (separate feature, for reference)

A working Aiken (Plutus V3) 2-of-3 jury voting validator was also tested
end-to-end on this same network in an earlier session -- script hash
`22709b35de1e59d44bc33d1e13d3cb8d3977d354f686e7593ee189b9`, script address
`addr_test1wq38pxe4mc09n4ztcv73uy7newxnja7n2nmgde6e8mscnwg9aj0sv`. Not yet
wired into the app (the current `/dao` flow uses a real signed metadata-only
transaction per vote, not this validator -- see `docs/status.md`). Full
source and TxIDs are in the local, non-git results file referenced in
project memory.
