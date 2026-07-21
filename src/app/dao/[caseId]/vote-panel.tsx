"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserWallet, MeshTxBuilder } from "@meshsdk/core";
import type { Case, VoteDecision } from "@/lib/cases";
import { UZH_PROTOCOL_PARAMS } from "@/lib/uzh-protocol-params";
import {
  submitVote,
  checkTxConfirmation,
  fetchCaseSnapshot,
  resubmitCase,
} from "../actions";
import { QuorumBar } from "./quorum-bar";
import { TxStatus, type TxPhase } from "@/components/tx-status";

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

// Paced deliberately slower than the network itself needs, so the
// simulated jurors read as a real sequence of independent people voting,
// not a single instant batch -- both the gap after the real vote and the
// gap between the two simulated votes use this.
const SIMULATED_VOTE_DELAY_MS = 6000;
const CONFIRMATION_POLL_MS = 4000;
const CONFIRMATION_MAX_ATTEMPTS = 15; // ~1 minute at the interval above
const MINT_STATUS_POLL_MS = 3000;
const MINT_STATUS_MAX_ATTEMPTS = 20; // ~1 minute at the interval above
// This testnet is lightly loaded and often confirms a tx within a few
// seconds (verified with real timing -- see docs/status.md), which reads
// as suspiciously instant rather than as a real confirmation. Enforcing a
// visible minimum keeps the "confirming" animation perceptible without
// changing the real block number once it's found.
const MIN_CONFIRMING_DISPLAY_MS = 5000;

const SIMULATED_JUROR_POOL = ["Juror #14", "Juror #29", "Juror #07"];

const CANNED_REJECT_REASONS = [
  "Evidence photos don't clearly show the reported planting area.",
  "Location coordinates in the two submissions don't line up closely enough.",
  "Quantity claimed seems inconsistent with the visible planting density.",
  "Independent verification notes are too thin to confirm the claim.",
];

function pickSimulatedDecision(realDecision: VoteDecision): VoteDecision {
  const agrees = Math.random() < 0.7;
  if (agrees) return realDecision;
  return realDecision === "approve" ? "reject" : "approve";
}

function pickCannedRejectReason(): string {
  return CANNED_REJECT_REASONS[
    Math.floor(Math.random() * CANNED_REJECT_REASONS.length)
  ];
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

// Polls until the tx shows up in a block or we give up -- Yaci Store 404s
// until it's indexed, that's the normal "not confirmed yet" state, not an
// error (see src/lib/blockchain-provider.ts). Enforces
// MIN_CONFIRMING_DISPLAY_MS so the loading state is always perceptible.
async function pollForBlock(
  txHash: string,
  onConfirmed: (blockHeight: number) => void,
) {
  const startedAt = Date.now();
  for (let attempt = 0; attempt < CONFIRMATION_MAX_ATTEMPTS; attempt += 1) {
    await delay(CONFIRMATION_POLL_MS);
    const result = await checkTxConfirmation(txHash);
    if (result.confirmed && result.blockHeight !== undefined) {
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_CONFIRMING_DISPLAY_MS) {
        await delay(MIN_CONFIRMING_DISPLAY_MS - elapsed);
      }
      onConfirmed(result.blockHeight);
      return;
    }
  }
}

// Polls until the case's background mint (fired from castVote without being
// awaited there, see src/lib/cases.ts) finishes -- either "minted" or
// "failed", never staying "pending" forever short of a real hang.
async function pollForMintResolution(
  caseId: string,
  onUpdate: (updated: Case) => void,
) {
  for (let attempt = 0; attempt < MINT_STATUS_MAX_ATTEMPTS; attempt += 1) {
    await delay(MINT_STATUS_POLL_MS);
    const updated = await fetchCaseSnapshot(caseId);
    if (!updated) return;
    onUpdate(updated);
    if (updated.mintStatus !== "pending") return;
  }
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
  const [voteBlockHeight, setVoteBlockHeight] = useState<number | null>(null);
  const [voteConfirming, setVoteConfirming] = useState(false);
  const [mintBlockHeight, setMintBlockHeight] = useState<number | null>(null);
  const [mintConfirming, setMintConfirming] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [resubmitting, setResubmitting] = useState(false);
  const polledMintTxRef = useRef<string | null>(null);
  const polledMintPendingRef = useRef(false);

  const alreadyResolved = caseData.status !== "pending";

  // The mint fires in the background the moment the case is certified (see
  // src/lib/cases.ts) -- submitVote's own response returns before it
  // resolves, so this is the only way the client learns it finished.
  useEffect(() => {
    if (caseData.mintStatus !== "pending" || polledMintPendingRef.current) return;
    polledMintPendingRef.current = true;
    pollForMintResolution(caseData.id, setCaseData).finally(() => {
      polledMintPendingRef.current = false;
    });
  }, [caseData.mintStatus, caseData.id]);

  // Once a mint tx hash appears on the case, start polling for its block
  // the same way the vote's own tx is confirmed -- same loading -> confirmed
  // story either way.
  useEffect(() => {
    const hash = caseData.mintTxHash;
    if (!hash || polledMintTxRef.current === hash) return;
    polledMintTxRef.current = hash;
    setMintConfirming(true);
    pollForBlock(hash, (blockHeight) => {
      setMintBlockHeight(blockHeight);
      setMintConfirming(false);
    }).then(() => setMintConfirming(false));
  }, [caseData.mintTxHash]);

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
    if (decision === "reject" && !rejectReason.trim()) return;

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
            `actionType:${caseData.actionType}`,
            `quantity:${caseData.quantity}`,
            `vote:${decision}`,
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
    let hash: string;
    try {
      hash = await wallet.submitTx(signedTx);
      setTxHash(hash);
    } catch (err) {
      setVoteStatus("error");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Transaction was rejected by the network.",
      );
      return;
    }

    try {
      const updated = await submitVote(
        caseData.id,
        walletAddress,
        "You (connected wallet)",
        decision,
        false,
        decision === "reject" ? rejectReason.trim() : undefined,
      );
      setCaseData(updated);
      setVoteStatus("done");
      setVoteConfirming(true);
      pollForBlock(hash, setVoteBlockHeight).then(() => setVoteConfirming(false));
      runSimulatedVotes(decision);
    } catch (err) {
      // The blockchain transaction above already succeeded (hash is real and
      // shown regardless of this branch) -- this failure is purely in our
      // own bookkeeping (the in-memory case store), not the network.
      setVoteStatus("error");
      setErrorMessage(
        `Your vote transaction was confirmed on-chain (hash above), but saving it to the case record failed: ${
          err instanceof Error ? err.message : "unknown error"
        }. Refresh the page, if the case still shows as pending, note this tx hash for support.`,
      );
    }
  }

  async function runSimulatedVotes(realDecision: VoteDecision) {
    const [jurorA, jurorB] = shuffledSimulatedJurors();

    await delay(SIMULATED_VOTE_DELAY_MS);
    try {
      const decisionA = pickSimulatedDecision(realDecision);
      const afterA = await submitVote(
        caseData.id,
        `sim-${jurorA}`,
        jurorA,
        decisionA,
        true,
        decisionA === "reject" ? pickCannedRejectReason() : undefined,
      );
      setCaseData(afterA);
    } catch {
      return;
    }

    await delay(SIMULATED_VOTE_DELAY_MS);
    try {
      const decisionB = pickSimulatedDecision(realDecision);
      const afterB = await submitVote(
        caseData.id,
        `sim-${jurorB}`,
        jurorB,
        decisionB,
        true,
        decisionB === "reject" ? pickCannedRejectReason() : undefined,
      );
      setCaseData(afterB);
    } catch {
      // simulated vote failed silently, the real vote is still recorded
    }
  }

  async function handleResubmit() {
    setResubmitting(true);
    try {
      const updated = await resubmitCase(caseData.id);
      setCaseData(updated);
      setVoteStatus("idle");
      setTxHash(null);
      setVoteBlockHeight(null);
      setVoteConfirming(false);
      setMintBlockHeight(null);
      setMintConfirming(false);
      setRejectReason("");
      setErrorMessage(null);
      polledMintTxRef.current = null;
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not restart this case.",
      );
    } finally {
      setResubmitting(false);
    }
  }

  const voteTxPhase: TxPhase =
    voteStatus === "done" ? (voteConfirming ? "confirming" : "confirmed") : "idle";

  const mintTxPhase: TxPhase =
    caseData.mintStatus === "pending"
      ? "minting"
      : caseData.mintStatus === "minted"
        ? mintConfirming
          ? "confirming"
          : "confirmed"
        : "idle";

  return (
    <div className="border border-border p-5 sm:p-6">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Vote
      </p>

      <div className="mt-5 space-y-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-foreground">
            1. Connect wallet
          </p>
          {walletStatus === "connected" && walletAddress ? (
            <div className="mt-2">
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
            <div className="mt-2">
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
              {(walletStatus === "unavailable" || walletStatus === "error") && (
                <p className="mt-2 text-sm text-destructive">{errorMessage}</p>
              )}
            </div>
          )}
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-foreground">
            2. Cast your vote
          </p>

          {alreadyResolved && voteStatus === "idle" && !txHash ? (
            <p className="mt-2 text-sm text-muted-foreground">
              This case is already resolved. No further votes are needed.
            </p>
          ) : voteStatus === "done" || (voteStatus === "error" && txHash) ? (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">
                {voteStatus === "done"
                  ? "Your vote was signed and submitted as a real transaction."
                  : "Your vote transaction was confirmed on-chain, but the app failed to record it, see below."}
              </p>
              <TxStatus
                phase={voteStatus === "done" ? voteTxPhase : "idle"}
                txHash={txHash}
                blockHeight={voteBlockHeight}
                address={walletAddress}
              />
              {voteStatus === "error" && errorMessage && (
                <p className="mt-2 text-sm text-destructive">{errorMessage}</p>
              )}
            </div>
          ) : (
            <div className="mt-2">
              <label
                htmlFor="reject-reason"
                className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground"
              >
                Reason (required to reject)
              </label>
              <textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={2}
                placeholder="Why would this evidence be rejected?"
                className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
              />
              <div className="mt-3 flex flex-wrap gap-3">
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
                  disabled={
                    walletStatus !== "connected" ||
                    voteStatus !== "idle" ||
                    !rejectReason.trim()
                  }
                  className="border border-destructive px-4 py-2 font-mono text-xs uppercase tracking-widest text-destructive transition-colors hover:bg-destructive hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Reject
                </button>
              </div>
              {walletStatus !== "connected" && (
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  Connect a wallet to vote.
                </p>
              )}
              <TxStatus
                phase={
                  voteStatus === "building" ||
                  voteStatus === "signing" ||
                  voteStatus === "submitting"
                    ? voteStatus
                    : "idle"
                }
              />
              {voteStatus === "error" && (
                <p className="mt-2 text-sm text-destructive">{errorMessage}</p>
              )}
            </div>
          )}
        </div>

        {(caseData.votes.length > 0 || voteStatus === "done") && (
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-foreground">
              Quorum
            </p>
            <div className="mt-3">
              <QuorumBar votes={caseData.votes} />
            </div>

            {caseData.status !== "pending" && (
              <p
                className={`mt-4 font-mono text-sm uppercase tracking-widest ${
                  caseData.status === "certified"
                    ? "text-primary"
                    : "text-destructive"
                }`}
              >
                {caseData.status === "certified"
                  ? "Certified: two of three jurors approved"
                  : "Rejected: two of three jurors denied"}
              </p>
            )}

            {caseData.status === "rejected" && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleResubmit}
                  disabled={resubmitting}
                  className="border border-accent px-4 py-2 font-mono text-xs uppercase tracking-widest text-accent transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-wait disabled:opacity-60"
                >
                  {resubmitting ? "Restarting..." : "Resubmit for review"}
                </button>
                <p className="mt-2 text-xs text-muted-foreground">
                  Restarts the assessment: votes are cleared and the case
                  goes back to the pending docket. Address the comments
                  above first (e.g. attach better evidence as the verifier)
                  before resubmitting.
                </p>
              </div>
            )}
          </div>
        )}

        {caseData.mintStatus && (
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-foreground">
              Certification token
            </p>
            {caseData.mintStatus === "failed" ? (
              <p className="mt-2 text-sm text-destructive">
                Minting failed: {caseData.mintError ?? "unknown error"}. The
                jury decision itself is unaffected, only the token issuance
                needs a retry.
              </p>
            ) : (
              <TxStatus
                phase={mintTxPhase}
                txHash={caseData.mintTxHash}
                blockHeight={mintBlockHeight}
                confirmedLabel="Minted, native token submitted to the company wallet"
              />
            )}
            {caseData.mintPolicyId && (
              <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                Policy ID:{" "}
                <span className="text-foreground">{caseData.mintPolicyId}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
