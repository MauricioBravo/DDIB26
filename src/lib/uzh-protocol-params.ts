import type { Protocol } from "@meshsdk/core";

// Snapshot from `cardano-cli query protocol-parameters --testnet-magic 42`
// against the UZH Cardano testnet node, 2026-07-18. Course-run devnet, these
// don't change often -- if a vote transaction starts failing on fee/size
// checks, re-query and update this.
export const UZH_PROTOCOL_PARAMS: Partial<Protocol> = {
  minFeeA: 44,
  minFeeB: 155381,
  maxBlockSize: 90112,
  maxTxSize: 16384,
  maxBlockHeaderSize: 1100,
  keyDeposit: 2000000,
  poolDeposit: 500000000,
  minPoolCost: "170000000",
  priceMem: 0.0577,
  priceStep: 0.0000721,
  maxTxExMem: "14000000",
  maxTxExSteps: "10000000000",
  maxBlockExMem: "62000000",
  maxBlockExSteps: "20000000000",
  maxValSize: 5000,
  collateralPercent: 150,
  maxCollateralInputs: 3,
  coinsPerUtxoSize: 4310,
  minFeeRefScriptCostPerByte: 15,
};
