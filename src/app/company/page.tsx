import Link from "next/link";
import { CompanyEvidenceForm } from "./evidence-form";

export default function CompanyEvidencePage() {
  return (
    <div className="flex-1 bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 sm:px-10">
        <Link href="/" className="font-heading text-2xl tracking-tight text-primary">
          GreenProof
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/company/cases"
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Your cases
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
        <section className="pt-6 pb-8">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            New submission
          </p>
          <h1 className="mt-3 font-heading text-3xl text-primary sm:text-4xl">
            File a case for certification
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Attach photos of the planting, and a document if you have one.
            An independent verifier will visit the site, then the DAO jury
            votes to certify or reject.
          </p>
        </section>

        <section className="pt-2 pb-16">
          <CompanyEvidenceForm />
        </section>
      </main>
    </div>
  );
}
