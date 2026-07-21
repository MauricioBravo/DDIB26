import Link from "next/link";
import type { CSSProperties } from "react";

const steps = [
  {
    n: "01",
    title: "Company registration",
    body: "A company signs up. The backend generates a custodial Cardano wallet behind the scenes, no wallet or crypto knowledge required.",
  },
  {
    n: "02",
    title: "Evidence submission",
    body: "The company uploads a photo of the action, trees planted for now, plus GPS location, through an ordinary web form.",
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
    body: "Verified achievements, badges, and rankings, permanent, independent, and impossible to quietly edit.",
  },
];

function StepText({
  step,
  align,
}: {
  step: (typeof steps)[number];
  align: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <h3 className="font-heading text-lg text-foreground">{step.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {step.body}
      </p>
    </div>
  );
}

const shippedItems = [
  {
    title: "DAO jury voting",
    detail: "Real, wallet-signed Cardano transactions on our testnet, not a simulation.",
  },
  {
    title: "Public company profiles",
    detail: "Certification badges and rankings, browsable with no login.",
  },
  {
    title: "Minting proven on-chain",
    detail: "Backend builds, signs, and submits a real native-token mint end to end.",
  },
  {
    title: "CI/CD",
    detail: "Every push to main rebuilds and redeploys automatically.",
  },
];

const plannedItems = [
  {
    title: "Auto-mint on jury approval",
    detail: "Wire the proven mint pipeline to fire the moment a case hits 2 of 3.",
  },
  {
    title: "Firebase authentication",
    detail: "Replaces the simulated login for company, verifier, and juror roles.",
  },
  {
    title: "Evidence submission",
    detail: "Company photo + GPS upload, feeding real cases into the docket.",
  },
  {
    title: "Verifier workflow",
    detail: "Rotation-assigned independent site inspection.",
  },
];

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

        <div className="flex items-center gap-3 justify-self-end">
          <button
            type="button"
            disabled
            title="Company and inspector sign up, with automatic wallet setup and a one-time key download, is coming soon"
            className="cursor-not-allowed border border-accent bg-accent px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-accent-foreground opacity-70"
          >
            Sign up
          </button>
          <Link
            href="/login"
            className="border border-primary px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Log in
          </Link>
        </div>
      </header>

      <nav className="mx-auto flex max-w-6xl items-center justify-center gap-8 px-6 pb-8 sm:px-10">
        <a
          href="#how-it-works"
          className="font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
        >
          How it works
        </a>
        <Link
          href="/companies"
          className="font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
        >
          Companies
        </Link>
        <Link
          href="/companies/rankings"
          className="font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
        >
          Rankings
        </Link>
      </nav>

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
              The blockchain does the rest, silently, companies and
              verifiers never touch a wallet.
            </p>
          </div>

          <div className="flex flex-col gap-8 border-l border-border pl-6 sm:pl-10">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                The gap
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                We verify. We don&apos;t reward.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Minting a token for a green action is easy, plenty of
                projects do it. Proving the action actually happened,
                independently, and keeping that proof tamper-proof, is the
                part everyone skips. GreenProof is built to be that layer:
                any rewards program, badge, or token scheme can sit on top
                of our verification instead of inventing its own.
              </p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Status
              </p>
              <p className="mt-2 inline-flex items-center gap-2 font-mono text-sm text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Real votes and mints on Cardano
              </p>
              <a
                href="#progress"
                className="mt-1 inline-block font-mono text-xs text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground"
              >
                See what&apos;s shipped and what&apos;s next &darr;
              </a>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-t border-border py-10 sm:py-14">
          <h2 className="font-heading text-3xl text-primary sm:text-4xl">
            How it works
          </h2>

          {/* Mobile: simple stacked list, no room for the connector below. */}
          <div className="mt-8 grid grid-cols-1 gap-y-10 sm:hidden">
            {steps.map((step) => (
              <div key={step.n} className="flex gap-5">
                <span className="font-mono text-sm text-accent">{step.n}</span>
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

          {/* Desktop: a single spine down the center, steps alternating
              left/right off of it, so the reading order (01 -> 06) is
              exactly the line -- there's no other path to follow. */}
          <div className="relative mt-10 hidden sm:block">
            <div
              aria-hidden
              className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border"
            />
            <div className="grid grid-cols-[1fr_auto_1fr] gap-x-6">
              {steps.map((step, i) => {
                const onLeft = i % 2 === 0;
                return (
                  <div key={step.n} className="contents">
                    <div className={onLeft ? "pb-4 text-right" : "pb-4"}>
                      {onLeft && <StepText step={step} align="right" />}
                    </div>
                    <div className="flex justify-center">
                      <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-forest bg-background font-mono text-xs text-forest">
                        {step.n}
                      </span>
                    </div>
                    <div className="pb-4">
                      {!onLeft && <StepText step={step} align="left" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="progress" className="border-t border-border py-10 sm:py-14">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Build docket
          </p>
          <h2 className="mt-2 font-heading text-3xl text-primary sm:text-4xl">
            Nothing here counts until it&apos;s verified, including our own
            progress.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Same standard we hold companies to: a claim only counts once it
            is shown, not just stated.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-primary">
                Shipped
              </p>
              <ul className="mt-4 divide-y divide-border border-t border-border">
                {shippedItems.map((item) => (
                  <li key={item.title} className="flex gap-3 border-l-2 border-l-primary py-4 pl-4">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                    <div>
                      <p className="text-sm text-foreground">{item.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Next up
              </p>
              <ul className="mt-4 divide-y divide-border border-t border-border">
                {plannedItems.map((item) => (
                  <li key={item.title} className="flex gap-3 border-l-2 border-dashed border-l-border py-4 pl-4">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full border border-muted-foreground" aria-hidden />
                    <div>
                      <p className="text-sm text-foreground">{item.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
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
            GreenProof, independent, on-chain proof of environmental action.
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              disabled
              title="Public donations page is coming soon. Donations help fund the system wallet that pays every certification's transaction fees."
              className="cursor-not-allowed border border-sand bg-sand px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-forest opacity-70"
            >
              Donate
            </button>
            <span className="font-mono">UZH Cardano testnet · Mesh SDK</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
