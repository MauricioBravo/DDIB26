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
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 sm:px-10">
        <Link href="/" className="font-heading text-lg tracking-tight text-primary">
          GreenProof
        </Link>
        <Link
          href="/dao"
          className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          Back to docket
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 sm:px-10">
        <section className="border-t border-border py-10 sm:py-14">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {caseData.id}
          </p>
          <h1 className="mt-3 font-heading text-3xl text-primary sm:text-4xl">
            {caseData.company}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {caseData.actionType} &middot; {caseData.quantity}
          </p>
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            Submitted {formatDate(caseData.submittedAt)}
          </p>
        </section>

        <section className="border-t border-border py-10 sm:py-14">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Evidence
          </p>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="border border-dashed border-border p-6">
              <p className="font-mono text-xs uppercase tracking-widest text-accent">
                Exhibit A &middot; Company
              </p>
              <div className="mt-4 flex h-40 items-center justify-center border border-border bg-secondary">
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Photo pending Cloudinary
                </span>
              </div>
              <p className="mt-4 text-sm text-foreground">
                {caseData.companyEvidence.caption}
              </p>
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                {caseData.companyEvidence.location} &middot;{" "}
                {caseData.companyEvidence.capturedAt}
              </p>
            </div>

            <div className="border border-dashed border-border p-6">
              <p className="font-mono text-xs uppercase tracking-widest text-accent">
                Exhibit B &middot; Independent verifier
              </p>
              <div className="mt-4 flex h-40 items-center justify-center border border-border bg-secondary">
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Photo pending Cloudinary
                </span>
              </div>
              <p className="mt-4 text-sm text-foreground">
                {caseData.verifierEvidence.caption}
              </p>
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                {caseData.verifierEvidence.location} &middot;{" "}
                {caseData.verifierEvidence.capturedAt}
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                Inspected by {caseData.verifierEvidence.verifierId}
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-border py-10 sm:py-14">
          <VotePanel initialCase={caseData} />
        </section>
      </main>
    </div>
  );
}
