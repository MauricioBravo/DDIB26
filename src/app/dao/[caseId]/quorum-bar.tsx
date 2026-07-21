"use client";

import type { VoteDecision } from "@/lib/cases";

type SeatVote = {
  jurorLabel: string;
  decision: VoteDecision;
  comment?: string;
};

const SEATS = 3;

export function QuorumBar({ votes }: { votes: SeatVote[] }) {
  const approvals = votes.filter((v) => v.decision === "approve").length;
  const rejections = votes.filter((v) => v.decision === "reject").length;
  const net = approvals - rejections;
  const fillPercent = Math.min(Math.abs(net) / 2, 1) * 50;
  const fillsRight = net >= 0;

  return (
    <div>
      <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest">
        <span className="text-destructive">Denied</span>
        <span className="text-primary">Accepted</span>
      </div>

      <div className="relative mt-3 h-3 border border-border bg-card">
        <div className="absolute inset-y-0 left-1/2 w-px bg-border" aria-hidden />
        <div
          className={`absolute inset-y-0 transition-all duration-700 ease-out ${
            fillsRight ? "left-1/2 bg-primary" : "right-1/2 bg-destructive"
          }`}
          style={{ width: `${fillPercent}%` }}
        />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {Array.from({ length: SEATS }).map((_, i) => {
          const vote = votes[i];
          return (
            <div
              key={i}
              className={`border px-3 py-3 text-center transition-colors duration-500 ${
                vote
                  ? vote.decision === "approve"
                    ? "border-primary bg-primary/5"
                    : "border-destructive bg-destructive/5"
                  : "border-dashed border-border"
              }`}
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Seat {i + 1}
              </p>
              {vote ? (
                <>
                  <p className="mt-1 truncate text-sm text-foreground">{vote.jurorLabel}</p>
                  <p
                    className={`mt-1 font-mono text-[10px] uppercase tracking-widest ${
                      vote.decision === "approve" ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {vote.decision === "approve" ? "Approve" : "Reject"}
                  </p>
                  {vote.comment && (
                    <p className="mt-2 text-xs leading-snug text-muted-foreground">
                      &ldquo;{vote.comment}&rdquo;
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-1 font-mono text-sm text-muted-foreground">&mdash;</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
