import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompany, listCompanies } from "@/lib/companies";
import { MintedSeal } from "../minted-seal";

export function generateStaticParams() {
  return listCompanies().map((c) => ({ slug: c.slug }));
}

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = getCompany(slug);
  if (!company) notFound();

  return (
    <div className="flex-1 bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 sm:px-10">
        <Link href="/" className="font-heading text-2xl tracking-tight text-primary">
          GreenProof
        </Link>
        <Link
          href="/companies"
          className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          &larr; All companies
        </Link>
      </header>

      <main className="mx-auto max-w-6xl border-t border-border px-6 sm:px-10">
        <section className="flex flex-col items-start gap-6 pt-10 pb-12 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-sage text-3xl font-heading text-forest">
            {company.name.slice(0, 1)}
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Public certification profile &middot; {company.country}
            </p>
            <h1 className="mt-2 font-heading text-3xl text-primary sm:text-4xl">
              {company.name}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {company.tagline}
            </p>
          </div>
        </section>

        <section className="border-t border-border py-12 sm:py-16">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Certifications
          </p>
          <h2 className="mt-3 font-heading text-2xl text-primary sm:text-3xl">
            Blockchain-backed achievements
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Each seal below represents a native Cardano token minted to{" "}
            {company.name}&apos;s custodial wallet after independent
            verification and a two-of-three DAO jury approval.
          </p>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground/80">
            Example profile, illustrative, not a live on-chain lookup.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-y-12 sm:grid-cols-3">
            {company.badges.map((badge, i) => (
              <MintedSeal key={i} badge={badge} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
