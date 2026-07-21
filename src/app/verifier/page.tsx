import Link from "next/link";
import { listCases } from "@/lib/cases";

// The case store is an in-memory module singleton, not Next.js's data
// cache, so this route must render per-request rather than at build time.
export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Real verifier/jury rotation (project-brief.md §5 -- a verifier can't
// repeatedly inspect the same company, jurors rotate from a DAO pool) is a
// deliberate non-goal for this PoC, not an unfinished stub (decision
// 2026-07-21, see docs/status.md Backend item 4). The algorithm itself
// (tracking last-assigned-per-company, a rotation pool, etc.) adds real
// complexity a live demo audience can't verify anyway -- what matters is
// that the concept reads clearly. If this ever needs to look more "real"
// for a demo, the cheap fix is presentational (e.g. copy that reads "this
// case is assigned to you"), not an actual selection algorithm behind it.
export default function VerifierDashboardPage() {
  const pending = listCases().filter((c) => c.status === "pending");

  return (
    <div className="flex-1 bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 sm:px-10">
        <Link href="/" className="font-heading text-2xl tracking-tight text-primary">
          GreenProof
        </Link>
        <div className="flex items-center gap-6">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Verifier
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
            Site visits
          </p>
          <h1 className="mt-3 font-heading text-3xl text-primary sm:text-4xl">
            {pending.length} case{pending.length === 1 ? "" : "s"} awaiting inspection
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Pick a case, visit the site, and attach your own photos or
            documents as independent evidence. No rotation assignment for
            now, any pending case can be inspected.
          </p>
        </section>

        {pending.length > 0 ? (
          <section className="pt-2 pb-16">
            <ul className="mt-4 divide-y divide-border border border-border">
              {pending.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/verifier/${c.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-secondary"
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
                      <span className="mt-2 inline-block font-mono text-xs uppercase tracking-widest text-primary">
                        {c.verifierEvidence.files?.length
                          ? `${c.verifierEvidence.files.length} file(s) attached →`
                          : "Inspect site →"}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section className="py-8 text-center">
            <p className="font-mono text-sm text-muted-foreground">
              No cases waiting on inspection right now.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
