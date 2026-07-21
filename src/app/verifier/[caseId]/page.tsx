import Link from "next/link";
import { notFound } from "next/navigation";
import { getCase } from "@/lib/cases";
import { resubmitCase } from "../../dao/actions";
import { EvidenceForm } from "./evidence-form";

export default async function VerifierCasePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const caseData = getCase(caseId);

  if (!caseData) {
    notFound();
  }

  return (
    <div className="flex-1 bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 sm:px-10">
        <Link href="/" className="font-heading text-2xl tracking-tight text-primary">
          GreenProof
        </Link>
        <Link
          href="/verifier"
          className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          Back to cases
        </Link>
      </header>

      <main className="mx-auto max-w-2xl border-t border-border px-6 sm:px-10">
        <section className="pt-6 pb-4">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {caseData.id}
          </p>
          <h1 className="mt-3 font-heading text-3xl text-primary">
            {caseData.company}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {caseData.actionType} &middot; {caseData.quantity}
          </p>
        </section>

        <section className="border-t border-border pt-6 pb-4">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Company&apos;s submission (for reference)
          </p>
          {caseData.companyEvidence.files?.length ? (
            <ul className="mt-3 grid grid-cols-4 gap-2">
              {caseData.companyEvidence.files.map((file, i) =>
                file.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={file.url}
                    alt={`Company evidence ${i + 1}`}
                    className="h-16 w-full border border-border object-cover"
                  />
                ) : (
                  <a
                    key={i}
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-16 items-center justify-center border border-border bg-secondary font-mono text-xs text-muted-foreground hover:text-foreground"
                  >
                    Doc {i + 1}
                  </a>
                ),
              )}
            </ul>
          ) : null}
          <p className="mt-3 text-sm text-foreground">
            {caseData.companyEvidence.caption}
          </p>
          {(caseData.companyEvidence.location || caseData.companyEvidence.capturedAt) && (
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              {[caseData.companyEvidence.location, caseData.companyEvidence.capturedAt]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </section>

        {caseData.status === "rejected" && (
          <section className="border-t border-border py-6">
            <p className="font-mono text-xs uppercase tracking-widest text-destructive">
              Rejected: jury feedback
            </p>
            <ul className="mt-3 space-y-2">
              {caseData.votes
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
            <p className="mt-3 text-sm text-muted-foreground">
              Attach better evidence below, then resubmit for a fresh jury
              review.
            </p>
            <form
              action={async () => {
                "use server";
                await resubmitCase(caseData.id);
              }}
            >
              <button
                type="submit"
                className="mt-3 border border-accent px-4 py-2 font-mono text-xs uppercase tracking-widest text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Resubmit for review
              </button>
            </form>
          </section>
        )}

        <section className="border-t border-border py-6">
          <EvidenceForm caseId={caseData.id} initialCase={caseData} />
        </section>
      </main>
    </div>
  );
}
