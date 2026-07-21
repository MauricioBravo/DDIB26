"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { OnChainMint } from "@/lib/verify-onchain";
import { checkOnChainMint } from "../actions";

type LoadState = "loading" | "found" | "not-found";
type ValidateState = "idle" | "checking" | "valid" | "invalid";

// A minimum visible duration so a fast response doesn't just flash --
// same reasoning as MIN_CONFIRMING_DISPLAY_MS in vote-panel.tsx: the
// network here really can respond in well under a second, but a state
// that appears and disappears instantly reads as broken, not fast.
const MIN_VALIDATE_DISPLAY_MS = 900;

function formatIssuedDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function OnChainTreeBadge({
  caseId,
  mintStatus,
  mintTxHash,
  mintPolicyId,
}: {
  caseId: string;
  mintStatus?: "pending" | "minted" | "failed";
  mintTxHash?: string;
  mintPolicyId?: string;
}) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [mint, setMint] = useState<OnChainMint | null>(null);
  const [validateState, setValidateState] = useState<ValidateState>("idle");

  const canQuery = mintStatus === "minted" && !!mintTxHash && !!mintPolicyId;

  useEffect(() => {
    if (!canQuery) return;
    let cancelled = false;
    checkOnChainMint(mintTxHash!, mintPolicyId!, caseId).then((result) => {
      if (cancelled) return;
      setMint(result);
      setLoadState(result.found ? "found" : "not-found");
    });
    return () => {
      cancelled = true;
    };
  }, [canQuery, mintTxHash, mintPolicyId, caseId]);

  async function handleValidate() {
    if (!canQuery) return;
    setValidateState("checking");
    const started = Date.now();
    const result = await checkOnChainMint(mintTxHash!, mintPolicyId!, caseId);
    const elapsed = Date.now() - started;
    if (elapsed < MIN_VALIDATE_DISPLAY_MS) {
      await new Promise((r) => setTimeout(r, MIN_VALIDATE_DISPLAY_MS - elapsed));
    }
    setMint(result);
    setValidateState(result.found ? "valid" : "invalid");
  }

  if (!canQuery) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border">
          <span className="px-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Not certified yet
          </span>
        </div>
        <p className="mt-4 max-w-[11rem] text-sm text-foreground">
          Trees certified to date
        </p>
        <Link
          href={`/dao/${caseId}`}
          className="mt-1 font-mono text-[10px] text-accent hover:text-foreground"
        >
          View case on the docket &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
        style={{
          background:
            loadState === "found"
              ? "radial-gradient(circle at 32% 28%, var(--sand) 0%, var(--sand) 55%, #b3894f 100%)"
              : undefined,
          boxShadow:
            loadState === "found"
              ? "inset 0 2px 4px rgba(255,255,255,0.55), inset 0 -6px 10px rgba(43,43,43,0.3), 0 1px 2px rgba(43,43,43,0.15)"
              : undefined,
        }}
      >
        {loadState === "loading" && (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-full border border-dashed border-border">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" aria-hidden />
            <span className="px-3 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              Loading from chain
            </span>
          </div>
        )}
        {loadState === "not-found" && (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-full border-2 border-dashed border-destructive/50">
            <span className="px-3 font-mono text-[9px] uppercase tracking-widest text-destructive">
              Could not verify
            </span>
          </div>
        )}
        {loadState === "found" && mint && (
          <>
            <div className="absolute inset-[6px] rounded-full border border-charcoal/15" />
            <div className="flex flex-col items-center">
              <span className="font-heading text-2xl leading-none text-forest">
                {/* mint.quantity is the real on-chain string, e.g. "6,750
                    trees" -- split so the number and unit get the same
                    two-line treatment as the static MintedSeal badges. */}
                {mint.quantity?.match(/^([\d,]+)/)?.[1] ?? mint.quantity}
              </span>
              <span className="mt-1 font-mono text-[9px] uppercase tracking-widest text-forest/80">
                {mint.quantity?.match(/^[\d,]+\s*(.*)$/)?.[1] || "trees"}
              </span>
            </div>
          </>
        )}
      </div>

      <p className="mt-4 max-w-[11rem] text-sm text-foreground">
        Trees certified to date
      </p>

      {loadState === "found" && mint?.issuedAt && (
        <p className="mt-1 font-mono text-[10px] text-muted-foreground">
          Issued {formatIssuedDate(mint.issuedAt)}
        </p>
      )}

      <button
        type="button"
        onClick={handleValidate}
        disabled={validateState === "checking"}
        className="mt-3 border border-primary px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        {validateState === "checking" ? "Validating..." : "Validate"}
      </button>

      {validateState === "valid" && (
        <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
          Valid, confirmed on-chain
        </p>
      )}
      {validateState === "invalid" && (
        <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-destructive">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive" aria-hidden />
          Could not confirm
        </p>
      )}
      {mint?.blockNumber != null && (
        <p className="mt-1 font-mono text-[9px] text-muted-foreground">
          Block {mint.blockNumber}
        </p>
      )}
    </div>
  );
}
