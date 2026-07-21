import Link from "next/link";
import { notFound } from "next/navigation";
import { getCase } from "@/lib/cases";
import { VotePanel } from "./vote-panel";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function CasePage({
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
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/" className="font-heading text-xl tracking-tight text-primary">
          GreenProof
        </Link>
        <Link
          href="/dao"
          className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          Back to docket
        </Link>
      </header>

      <main className="mx-auto max-w-6xl border-t border-border px-6 sm:px-10">
        <section className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pt-4 pb-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {caseData.id}
            </p>
            <h1 className="mt-1 font-heading text-2xl text-primary sm:text-3xl">
              {caseData.company}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {caseData.actionType} &middot; {caseData.quantity}
            </p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              Submitted {formatDate(caseData.submittedAt)}
            </p>
          </div>
        </section>

        <section className="pt-3 pb-3">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Evidence
          </p>
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="border border-dashed border-border p-4">
              <p className="font-mono text-xs uppercase tracking-widest text-accent">
                Exhibit A &middot; Company
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
              ) : (
                <div className="mt-3 flex h-20 items-center justify-center border border-border bg-secondary">
                  <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Photo pending Cloudinary
                  </span>
                </div>
              )}
              <p className="mt-3 text-sm text-foreground">
                {caseData.companyEvidence.caption}
              </p>
              {(caseData.companyEvidence.location || caseData.companyEvidence.capturedAt) && (
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {[caseData.companyEvidence.location, caseData.companyEvidence.capturedAt]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>

            <div className="border border-dashed border-border p-4">
              <p className="font-mono text-xs uppercase tracking-widest text-accent">
                Exhibit B &middot; Independent verifier
              </p>
              {caseData.verifierEvidence.files?.length ? (
                <ul className="mt-3 grid grid-cols-4 gap-2">
                  {caseData.verifierEvidence.files.map((file, i) =>
                    file.type === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={file.url}
                        alt={`Verifier evidence ${i + 1}`}
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
              ) : (
                <div className="mt-3 flex h-20 items-center justify-center border border-border bg-secondary">
                  <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Awaiting site visit
                  </span>
                </div>
              )}
              <p className="mt-3 text-sm text-foreground">
                {caseData.verifierEvidence.caption}
              </p>
              {(caseData.verifierEvidence.location ||
                caseData.verifierEvidence.capturedAt ||
                caseData.verifierEvidence.verifierId) && (
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {[
                    caseData.verifierEvidence.location,
                    caseData.verifierEvidence.capturedAt,
                    caseData.verifierEvidence.verifierId,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="pt-2 pb-6">
          <VotePanel initialCase={caseData} />
        </section>
      </main>
    </div>
  );
}
