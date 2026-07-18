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

export default function DaoDocketPage() {
  const cases = listCases();
  const pending = cases.filter((c) => c.status === "pending");
  const resolved = cases.filter((c) => c.status !== "pending");
  const [featured, ...rest] = pending;

  return (
    <div className="flex-1 bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 sm:px-10">
        <Link href="/" className="font-heading text-2xl tracking-tight text-primary">
          GreenProof
        </Link>
        <div className="flex items-center gap-6">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            DAO Juror
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
            The docket
          </p>
          <h1 className="mt-3 font-heading text-3xl text-primary sm:text-4xl">
            {pending.length} case{pending.length === 1 ? "" : "s"} awaiting a vote
          </h1>
        </section>

        {featured && (
          <section className="pt-2 pb-4">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              Newest submission
            </p>
            <Link
              href={`/dao/${featured.id}`}
              className="group mt-4 grid grid-cols-1 gap-6 border border-border p-6 transition-colors hover:border-primary sm:grid-cols-[1fr_auto] sm:items-center sm:p-8"
            >
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  {featured.id}
                </p>
                <h2 className="mt-2 font-heading text-2xl text-foreground sm:text-3xl">
                  {featured.company}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {featured.actionType} &middot; {featured.quantity}
                </p>
                <p className="mt-4 font-mono text-xs text-muted-foreground">
                  Submitted {formatDate(featured.submittedAt)}
                </p>
              </div>
              <span className="font-mono text-xs uppercase tracking-widest text-primary group-hover:text-accent">
                Review &amp; vote &rarr;
              </span>
            </Link>
          </section>
        )}

        {rest.length > 0 && (
          <section className="pt-2 pb-4">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Also pending
            </p>
            <ul className="mt-4 divide-y divide-border border border-border">
              {rest.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/dao/${c.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-secondary"
                  >
                    <div>
                      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        {c.id}
                      </p>
                      <p className="mt-1 font-heading text-lg text-foreground">
                        {c.company}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{c.quantity}</p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {formatDate(c.submittedAt)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {pending.length === 0 && (
          <section className="py-8 text-center">
            <p className="font-mono text-sm text-muted-foreground">
              No cases waiting on a vote right now.
            </p>
          </section>
        )}

        {resolved.length > 0 && (
          <section className="pt-4 pb-8">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Resolved
            </p>
            <ul className="mt-4 divide-y divide-border border border-border">
              {resolved.map((c) => (
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
                  </div>
                  <span
                    className={`font-mono text-xs uppercase tracking-widest ${
                      c.status === "certified" ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {c.status === "certified" ? "Certified" : "Rejected"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
