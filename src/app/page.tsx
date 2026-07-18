import Link from "next/link";
import type { CSSProperties } from "react";

const steps = [
  {
    n: "01",
    title: "Company registration",
    body: "A company signs up. The backend generates a custodial Cardano wallet behind the scenes — no wallet, no crypto knowledge required.",
  },
  {
    n: "02",
    title: "Evidence submission",
    body: "The company uploads a photo of the action, trees planted in this proof of concept, plus GPS location, through an ordinary web form.",
  },
  {
    n: "03",
    title: "Independent verification",
    body: "A rotating independent verifier visits the site in person and uploads separate evidence.",
  },
  {
    n: "04",
    title: "DAO jury review",
    body: "Three rotating jurors review both submissions. Two of three approvals certify the action; otherwise it returns with comments.",
  },
  {
    n: "05",
    title: "On-chain certification",
    body: "The system mints a Cardano native token to the company wallet. Metadata carries the proof: action, quantity, date, evidence hashes, jury result.",
  },
  {
    n: "06",
    title: "Public dashboard",
    body: "Verified achievements, badges, and rankings — permanent, independent, and impossible to quietly edit.",
  },
];

const deployedAt = new Date().toISOString();

export default function Home() {
  return (
    <div className="flex-1 bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--sage)_0%,_transparent_55%)] opacity-70 dark:opacity-20"
      />

      <header className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-8 sm:px-10">
        <span className="hidden font-mono text-[10px] uppercase leading-snug tracking-widest text-muted-foreground sm:block">
          DDIB26
        </span>

        <span className="font-heading text-2xl tracking-tight text-primary sm:text-3xl">
          GreenProof
        </span>

        <Link
          href="/login"
          className="justify-self-end border border-primary px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          Log in
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 sm:px-10">
        <section className="grid grid-cols-1 gap-10 border-t border-border py-16 sm:py-24 md:grid-cols-[1.4fr_1fr]">
          <div>
            <h1 className="font-heading text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] tracking-tight text-primary">
              Proof of environmental
              <br />
              action, <em className="not-italic text-accent">without</em>
              <br />
              the blockchain complexity.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Two humans upload photos. A decentralized jury validates them.
              The blockchain does the rest, silently — companies and
              verifiers never touch a wallet.
            </p>
          </div>

          <div className="flex flex-col justify-between gap-6 border-l border-border pl-6 sm:pl-10">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Status
              </p>
              <p className="mt-2 inline-flex items-center gap-2 font-mono text-sm text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Deploy pipeline live
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {deployedAt}
              </p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Scope
              </p>
              <p className="mt-2 text-sm text-foreground">
                Single category proof of concept: trees planted. Cardano
                Preprod testnet.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-border py-16 sm:py-24">
          <h2 className="font-heading text-2xl text-primary sm:text-3xl">
            How it works
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2">
            {steps.map((step) => (
              <div key={step.n} className="flex gap-5">
                <span className="font-mono text-sm text-accent">
                  {step.n}
                </span>
                <div>
                  <h3 className="font-heading text-lg text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-10 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden
              className="mark-icon h-4 w-4 shrink-0 text-forest"
              style={{ "--mark-icon-src": "url(/shield-mark.png)" } as CSSProperties}
            />
            GreenProof — independent, on-chain proof of environmental action.
          </span>
          <span className="font-mono">Cardano Preprod · Lucid Evolution · Blockfrost</span>
        </div>
      </footer>
    </div>
  );
}
