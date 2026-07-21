import Link from "next/link";
import { listCases } from "@/lib/cases";
import { resubmitCase } from "@/app/dao/actions";
import { TxStatus } from "@/components/tx-status";

// The case store is an in-memory module singleton, not Next.js's data
// cache, so this route must render per-request rather than at build time
// (same reasoning as /dao and /verifier).
export const dynamic = "force-dynamic";

// No real per-company session exists yet (login is a simulated role
// switch, not an identity -- see docs/status.md). This mirrors the
// verifier dashboard's documented scope decision: rather than fake a
// company-to-case assignment, this view shows every case on the docket.
// Once real auth/Firestore exists, this naturally becomes "cases filed by
// the signed-in company".
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function CompanyCasesPage() {
  const cases = listCases();
  const pending = cases.filter((c) => c.status === "pending");
  const certified = cases.filter((c) => c.status === "certified");
  const rejected = cases.filter((c) => c.status === "rejected");

  return (
    <div className="flex-1 bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 sm:px-10">
        <Link href="/" className="font-heading text-2xl tracking-tight text-primary">
          GreenProof
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/company"
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            File a case
          </Link>
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Company
          </span>
          <Link
            href="/login"
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Sign out
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl border-t border-border px-6 sm:px-10">
        <section className="pt-6 pb-4">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Your docket
          </p>
          <h1 className="mt-3 font-heading text-3xl text-primary sm:text-4xl">
            {cases.length} case{cases.length === 1 ? "" : "s"} filed
          </h1>
        </section>

        {rejected.length > 0 && (
          <section className="pt-2 pb-4">
            <p className="font-mono text-xs uppercase tracking-widest text-destructive">
              Rejected, needs your attention
            </p>
            <ul className="mt-4 divide-y divide-border border border-border">
              {rejected.map((c) => (
                <li key={c.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        {c.id}
                      </p>
                      <p className="mt-1 font-heading text-lg text-foreground">
                        {c.company}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {c.actionType} &middot; {c.quantity}
                      </p>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">
                      Submitted {formatDate(c.submittedAt)}
                    </p>
                  </div>

                  <ul className="mt-3 space-y-2">
                    {c.votes
                      .filter((v) => v.decision === "reject" && v.comment)
                      .map((v, i) => (
                        <li key={i} className="text-sm text-foreground">
                          &ldquo;{v.comment}&rdquo;
                          <span className="ml-2 font-mono text-xs text-muted-foreground">
                            &mdash; {v.jurorLabel}
                          </span>
                        </li>
                      ))}
                  </ul>

                  <form
                    action={async () => {
                      "use server";
                      await resubmitCase(c.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="mt-4 border border-accent px-4 py-2 font-mono text-xs uppercase tracking-widest text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      Resubmit for review
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        )}

        {pending.length > 0 && (
          <section className="pt-2 pb-4">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Pending
            </p>
            <ul className="mt-4 divide-y divide-border border border-border">
              {pending.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                      {c.id}
                    </p>
                    <p className="mt-1 font-heading text-lg text-foreground">
                      {c.company}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {c.actionType} &middot; {c.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs text-muted-foreground">
                      Submitted {formatDate(c.submittedAt)}
                    </p>
                    <p className="mt-2 font-mono text-xs uppercase tracking-widest text-accent">
                      Awaiting jury vote
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {certified.length > 0 && (
          <section className="pt-2 pb-8">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Certified
            </p>
            <ul className="mt-4 divide-y divide-border border border-border">
              {certified.map((c) => (
                <li key={c.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        {c.id}
                      </p>
                      <p className="mt-1 font-heading text-lg text-foreground">
                        {c.company}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {c.actionType} &middot; {c.quantity}
                      </p>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">
                      Submitted {formatDate(c.submittedAt)}
                    </p>
                  </div>
                  {c.mintStatus === "minted" && c.mintTxHash ? (
                    <TxStatus
                      phase="confirmed"
                      txHash={c.mintTxHash}
                      confirmedLabel="Certification token minted"
                    />
                  ) : c.mintStatus === "failed" ? (
                    <TxStatus phase="error" errorMessage={c.mintError} />
                  ) : (
                    <TxStatus phase="minting" />
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {cases.length === 0 && (
          <section className="py-8 text-center">
            <p className="font-mono text-sm text-muted-foreground">
              No cases filed yet.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
