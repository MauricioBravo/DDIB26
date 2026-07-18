"use client";

import { useState } from "react";
import { BrowserWallet, MeshTxBuilder } from "@meshsdk/core";
import type { Case, VoteDecision } from "@/lib/cases";
import { UZH_PROTOCOL_PARAMS } from "@/lib/uzh-protocol-params";
import { submitVote } from "../actions";
import { QuorumBar } from "./quorum-bar";

type WalletStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "unavailable"
  | "error";

type VoteStatus =
  | "idle"
  | "building"
  | "signing"
  | "submitting"
  | "done"
  | "error";

const SIMULATED_VOTE_DELAY_MS = 3000;

const SIMULATED_JUROR_POOL = ["Juror #14", "Juror #29", "Juror #07"];

function pickSimulatedDecision(realDecision: VoteDecision): VoteDecision {
  const agrees = Math.random() < 0.7;
  if (agrees) return realDecision;
  return realDecision === "approve" ? "reject" : "approve";
}

function shuffledSimulatedJurors(): string[] {
  const pool = [...SIMULATED_JUROR_POOL];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 2);
}

function describeNetwork(networkId: number | null): string {
  if (networkId === 1) return "Mainnet";
  if (networkId === 0) return "Testnet";
  return "Unknown network";
}

function truncateAddress(address: string): string {
  if (address.length <= 18) return address;
  return `${address.slice(0, 10)}...${address.slice(-6)}`;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function VotePanel({ initialCase }: { initialCase: Case }) {
  const [wallet, setWallet] = useState<BrowserWallet | null>(null);
  const [walletStatus, setWalletStatus] = useState<WalletStatus>("idle");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [networkId, setNetworkId] = useState<number | null>(null);
  const [voteStatus, setVoteStatus] = useState<VoteStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<Case>(initialCase);
  const [txHash, setTxHash] = useState<string | null>(null);

  const alreadyResolved = caseData.status !== "pending";

  async function connectWallet() {
    setWalletStatus("connecting");
    setErrorMessage(null);
    try {
      const installed = BrowserWallet.getInstalledWallets();
      const hasLace = installed.some((w) => w.name.toLowerCase() === "lace");
      if (!hasLace) {
        setWalletStatus("unavailable");
        setErrorMessage(
          "Lace extension not detected in this browser. Install it to vote.",
        );
        return;
      }
      const instance = await BrowserWallet.enable("lace");
      const [address, netId] = await Promise.all([
        instance.getChangeAddress(),
        instance.getNetworkId(),
      ]);
      setWallet(instance);
      setWalletAddress(address);
      setNetworkId(netId);
      setWalletStatus("connected");
    } catch (err) {
      setWalletStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Could not connect to Lace.",
      );
    }
  }

  async function castRealVote(decision: VoteDecision) {
    if (!wallet || !walletAddress || voteStatus !== "idle") return;

    setErrorMessage(null);
    setVoteStatus("building");

    let signedTx: string;
    try {
      const utxos = await wallet.getUtxos();
      if (utxos.length === 0) {
        throw new Error(
          "This wallet has no UTxOs on the UZH Cardano network to pay the vote's fee.",
        );
      }

      const unsignedTx = await new MeshTxBuilder({
        params: UZH_PROTOCOL_PARAMS,
      })
        .selectUtxosFrom(utxos)
        .changeAddress(walletAddress)
        .metadataValue(674, {
          msg: [
            "GreenProof DAO vote",
            `case:${caseData.id}`,
            `company:${caseData.company}`,
            `decision:${decision}`,
          ],
        })
        .complete();

      setVoteStatus("signing");
      signedTx = await wallet.signTx(unsignedTx, false);
    } catch (err) {
      setVoteStatus("error");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Could not build or sign the vote transaction.",
      );
      return;
    }

    setVoteStatus("submitting");
    try {
      const hash = await wallet.submitTx(signedTx);
      setTxHash(hash);

      const updated = await submitVote(
        caseData.id,
        walletAddress,
        "You (connected wallet)",
        decision,
        false,
      );
      setCaseData(updated);
      setVoteStatus("done");
      runSimulatedVotes(decision);
    } catch (err) {
      setVoteStatus("error");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Transaction was rejected by the network.",
      );
    }
  }

  async function runSimulatedVotes(realDecision: VoteDecision) {
    const [jurorA, jurorB] = shuffledSimulatedJurors();

    await delay(SIMULATED_VOTE_DELAY_MS);
    try {
      const afterA = await submitVote(
        caseData.id,
        `sim-${jurorA}`,
        jurorA,
        pickSimulatedDecision(realDecision),
        true,
      );
      setCaseData(afterA);
    } catch {
      return;
    }

    await delay(SIMULATED_VOTE_DELAY_MS);
    try {
      const afterB = await submitVote(
        caseData.id,
        `sim-${jurorB}`,
        jurorB,
        pickSimulatedDecision(realDecision),
        true,
      );
      setCaseData(afterB);
    } catch {
      // simulated vote failed silently, the real vote is still recorded
    }
  }

  return (
    <div className="border border-border p-6 sm:p-8">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Vote
      </p>

      {alreadyResolved && caseData.votes.length === 0 ? null : null}

      <div className="mt-6 space-y-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-foreground">
            1. Connect wallet
          </p>
          {walletStatus === "connected" && walletAddress ? (
            <div className="mt-3">
              <p className="inline-flex items-center gap-2 font-mono text-sm text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" />
                {truncateAddress(walletAddress)}
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {describeNetwork(networkId)} detected in Lace &middot; votes
                are signed and submitted as real transactions on the UZH
                Cardano testnet.
              </p>
            </div>
          ) : (
            <div className="mt-3">
              <button
                type="button"
                onClick={connectWallet}
                disabled={walletStatus === "connecting"}
                className="border border-primary px-4 py-2 font-mono text-xs uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-wait disabled:opacity-60"
              >
                {walletStatus === "connecting"
                  ? "Opening Lace..."
                  : "Connect Lace"}
              </button>
              {walletStatus === "unavailable" && (
                <p className="mt-3 text-sm text-destructive">{errorMessage}</p>
              )}
              {walletStatus === "error" && (
                <p className="mt-3 text-sm text-destructive">{errorMessage}</p>
              )}
            </div>
          )}
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-foreground">
            2. Cast your vote
          </p>

          {alreadyResolved && voteStatus === "idle" ? (
            <p className="mt-3 text-sm text-muted-foreground">
              This case is already resolved. No further votes are needed.
            </p>
          ) : voteStatus === "done" ? (
            <div className="mt-3">
              <p className="text-sm text-muted-foreground">
                Your vote was signed and submitted as a real transaction.
              </p>
              {txHash && (
                <p className="mt-2 break-all font-mono text-xs text-primary">
                  Tx hash: {txHash}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-3">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => castRealVote("approve")}
                  disabled={walletStatus !== "connected" || voteStatus !== "idle"}
                  className="border border-primary bg-primary px-4 py-2 font-mono text-xs uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Approve &middot; Certify
                </button>
                <button
                  type="button"
                  onClick={() => castRealVote("reject")}
                  disabled={walletStatus !== "connected" || voteStatus !== "idle"}
                  className="border border-destructive px-4 py-2 font-mono text-xs uppercase tracking-widest text-destructive transition-colors hover:bg-destructive hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Reject
                </button>
              </div>
              {walletStatus !== "connected" && (
                <p className="mt-3 font-mono text-xs text-muted-foreground">
                  Connect a wallet to vote.
                </p>
              )}
              {voteStatus === "building" && (
                <p className="mt-3 font-mono text-xs text-muted-foreground">
                  Building the vote transaction...
                </p>
              )}
              {voteStatus === "signing" && (
                <p className="mt-3 font-mono text-xs text-muted-foreground">
                  Waiting for signature in Lace...
                </p>
              )}
              {voteStatus === "submitting" && (
                <p className="mt-3 font-mono text-xs text-muted-foreground">
                  Submitting to the UZH Cardano network...
                </p>
              )}
              {voteStatus === "error" && (
                <p className="mt-3 text-sm text-destructive">{errorMessage}</p>
              )}
            </div>
          )}
        </div>

        {(caseData.votes.length > 0 || voteStatus === "done") && (
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-foreground">
              Quorum
            </p>
            <div className="mt-4">
              <QuorumBar votes={caseData.votes} />
            </div>

            {caseData.status !== "pending" && (
              <p
                className={`mt-6 font-mono text-sm uppercase tracking-widest ${
                  caseData.status === "certified"
                    ? "text-primary"
                    : "text-destructive"
                }`}
              >
                {caseData.status === "certified"
                  ? "Certified -- two of three jurors approved"
                  : "Rejected -- two of three jurors denied"}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
