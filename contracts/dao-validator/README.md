# GreenProof DAO validator

Plutus V3 smart contract (Aiken), implementing the 2-of-3 DAO jury vote as an
on-chain state machine: each vote either re-locks the UTxO at the same script
address with an updated datum (still short of quorum), or -- once 2 of 3
jurors approve -- allows the UTxO to be spent freely (the trigger point for
minting, in the eventual full design).

**Status: validated on-chain, not yet wired into the app.** The current
`/dao` flow (see `docs/status.md`) casts each vote as a real, wallet-signed
metadata-only transaction, not a spend against this validator. Swapping in
the real 2-of-3 on-chain state machine is tracked in `docs/status.md`
"Next up".

**Provenance**: this contract was written and tested against the real UZH
Cardano testnet (magic 42) in an earlier session, run directly on the course
node server rather than in this repo's environment (Aiken's toolchain isn't
installed here). The source below is reproduced verbatim from that session's
results; `aiken.toml` is reconstructed to match the reported toolchain
versions (Aiken v1.1.23, stdlib v3.1.0) rather than copied byte-for-byte from
a file this repo's environment has seen directly.

## What was tested (real network, not simulated)

1. **Lock** -- 5 ADA + a datum with all 3 votes `Pending`, sent to the script address.
2. **Premature release attempt** -- 1 vote cast, then tried to send funds
   directly to a normal wallet instead of re-locking with the updated datum.
   Correctly **rejected** by the validator (`expect [continuing_output] = ...`
   fails when there's no continuing output at the script address).
3. **Valid vote** -- juror 1 votes `Approve`, re-locks with the updated datum,
   same value.
4. **Quorum reached** -- juror 2 votes `Approve` (2 of 3), funds released to
   a normal wallet -- the trigger point a real mint would hook into.

## Deployed addresses / hashes (public, non-secret)

- Script hash: `22709b35de1e59d44bc33d1e13d3cb8d3977d354f686e7593ee189b9`
- Script address: `addr_test1wq38pxe4mc09n4ztcv73uy7newxnja7n2nmgde6e8mscnwg9aj0sv`
- Test juror VKHs (test keys only, not real DAO jurors -- see "Next up" in `docs/status.md`):
  - Juror 1: `ebd650a8650613b4f69e8b0375b82ef2ccd6eccb2519463b42276fdc`
  - Juror 2: `16d9287219202c99ea8c59847d97ae53329785b7784c05f6c4f94dbc`
  - Juror 3: `248564b55cb5a1705e7c7ed31f8d19c077985bdc4488156505c2c838`

## Real transactions from the validation run

| Step | TxID |
|---|---|
| Lock | `ed31c91d9f7262e0b0ac642bfe6d6f5ef62a86201d051e12a1f1f55e0c5b1b00` |
| Premature release attempt (rejected, no valid TxID -- tx never landed) | -- |
| Valid vote (juror 1, Approve) | `a367878c69ead7706363a0813b2c4ddc644000e938f9d9ea7080a2030077c1b7` |
| Quorum reached (juror 2, Approve, funds released) | `531ef161ea339f94c4ef1628df08474c0ea1e4f42f1089bb8cc0d66e1a755af9` |

Look any of these up with `scripts/greenproof_tx_lookup.py <TXID>` or
`GET /api/v1/txs/{hash}` against the API documented in `docs/uzh-network.md`.

## Build

Requires the Aiken toolchain (not installed in this repo's environment):

```
cd contracts/dao-validator
aiken check
aiken build
aiken blueprint convert -m greenproof_dao -v greenproof_dao > script.plutus
cardano-cli address build --payment-script-file script.plutus --testnet-magic 42 --out-file script.addr
```
