import Link from "next/link";
import { notFound } from "next/navigation";
import { getCase } from "@/lib/cases";
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
          <p className="mt-3 text-sm text-foreground">
            {caseData.companyEvidence.caption}
          </p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {caseData.companyEvidence.location} &middot;{" "}
            {caseData.companyEvidence.capturedAt}
          </p>
        </section>

        <section className="border-t border-border py-6">
          <EvidenceForm caseId={caseData.id} initialCase={caseData} />
        </section>
      </main>
    </div>
  );
}
