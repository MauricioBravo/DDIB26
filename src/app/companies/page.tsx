import Link from "next/link";
import { listCompanies } from "@/lib/companies";

export default function CompaniesDirectoryPage() {
  const ranked = listCompanies();

  return (
    <div className="flex-1 bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 sm:px-10">
        <Link href="/" className="font-heading text-2xl tracking-tight text-primary">
          GreenProof
        </Link>
        <Link
          href="/login"
          className="border border-primary px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          Log in
        </Link>
      </header>

      <main className="mx-auto max-w-6xl border-t border-border px-6 sm:px-10">
        <section className="pt-6 pb-4">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Public directory
          </p>
          <h1 className="mt-3 font-heading text-3xl text-primary sm:text-4xl">
            Certified companies
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Every profile below is backed by a two-of-three DAO jury review
            and a Cardano native token minted to that company&apos;s wallet.
            No login required to browse.
          </p>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground/80">
            Example data -- not live certifications.
          </p>
          <p className="mt-5">
            <Link
              href="/companies/rankings"
              className="border border-primary px-4 py-2 font-mono text-xs uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              See the rankings &rarr;
            </Link>
          </p>
        </section>

        <section className="pt-2 pb-16">
          <ul className="mt-4 divide-y divide-border border border-border">
            {ranked.map((company, i) => (
              <li key={company.slug}>
                <Link
                  href={`/companies/${company.slug}`}
                  className="group flex items-center justify-between gap-4 px-5 py-5 transition-colors hover:bg-secondary"
                >
                  <div className="flex items-center gap-5">
                    <span className="font-mono text-sm text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage text-sm font-heading text-forest">
                      {company.name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="font-heading text-lg text-foreground">
                        {company.name}
                      </p>
                      <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        {company.country} &middot; {company.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="hidden text-right text-sm text-muted-foreground sm:block">
                      {company.headlineStat}
                    </p>
                    <span className="font-mono text-xs uppercase tracking-widest text-primary group-hover:text-accent">
                      View profile &rarr;
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
