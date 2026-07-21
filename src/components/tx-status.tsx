// Reusable "where is this transaction right now" indicator, shared between
// the DAO vote flow and the mint flow -- same phases, same visual language
// (a pulsing dot while in flight, a solid one once confirmed), so a juror
// or company sees a consistent story regardless of which chain action
// they're looking at.
export type TxPhase =
  | "idle"
  | "building"
  | "signing"
  | "submitting"
  | "minting"
  | "confirming"
  | "confirmed"
  | "error";

const IN_FLIGHT_LABEL: Partial<Record<TxPhase, string>> = {
  building: "Building the transaction...",
  signing: "Waiting for signature...",
  submitting: "Submitting to the UZH Cardano network...",
  minting: "Minting certification token...",
  confirming: "Waiting for block confirmation...",
};

export function TxStatus({
  phase,
  txHash,
  blockHeight,
  address,
  errorMessage,
  confirmedLabel = "Confirmed on-chain",
}: {
  phase: TxPhase;
  txHash?: string | null;
  blockHeight?: number | null;
  address?: string | null;
  errorMessage?: string | null;
  confirmedLabel?: string;
}) {
  if (phase === "idle") return null;

  const inFlightLabel = IN_FLIGHT_LABEL[phase];

  return (
    <div className="mt-3 space-y-1.5">
      {inFlightLabel && (
        <p className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent" aria-hidden />
          {inFlightLabel}
        </p>
      )}

      {phase === "error" && (
        <p className="text-sm text-destructive">
          {errorMessage ?? "Something went wrong."}
        </p>
      )}

      {phase === "confirmed" && (
        <div className="space-y-1">
          <p className="inline-flex items-center gap-2 font-mono text-xs text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
            {confirmedLabel}
          </p>
          {txHash && (
            <p className="break-all font-mono text-xs text-muted-foreground">
              Tx hash: <span className="text-foreground">{txHash}</span>
            </p>
          )}
          {blockHeight != null && (
            <p className="font-mono text-xs text-muted-foreground">
              Block: <span className="text-foreground">{blockHeight}</span>
            </p>
          )}
          {address && (
            <p className="break-all font-mono text-xs text-muted-foreground">
              Signer: <span className="text-foreground">{address}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
