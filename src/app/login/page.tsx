"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type Role = "company" | "juror";

const ROLE_COPY: Record<Role, { label: string; description: string; email: string }> = {
  company: {
    label: "Company",
    description:
      "Submit evidence of environmental action and track certification status.",
    email: "enterprise@example.com",
  },
  juror: {
    label: "DAO Juror",
    description:
      "Review evidence from companies and verifiers, vote to certify or reject.",
    email: "admin@example.com",
  },
};

const VALID_PASSWORD = "1234";

export default function LoginPage() {
  const [role, setRole] = useState<Role>("company");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [signedInAs, setSignedInAs] = useState<Role | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const expected = ROLE_COPY[role].email;
    if (email.trim().toLowerCase() === expected && password === VALID_PASSWORD) {
      setError(null);
      setSignedInAs(role);
    } else {
      setError("Those credentials don't match this role. Check the demo credentials below.");
    }
  }

  function switchRole(next: Role) {
    setRole(next);
    setError(null);
    setSignedInAs(null);
  }

  return (
    <div className="flex-1 bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 sm:px-10">
        <Link href="/" className="font-heading text-lg tracking-tight text-primary">
          GreenProof
        </Link>
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          Back to home
        </Link>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-10 border-t border-border px-6 py-16 sm:px-10 sm:py-24 md:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Sign in as
          </p>
          <div
            role="tablist"
            aria-label="Choose account type"
            className="mt-4 inline-flex rounded-md border border-border p-1"
          >
            {(Object.keys(ROLE_COPY) as Role[]).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={role === key}
                onClick={() => switchRole(key)}
                className={`rounded px-4 py-2 text-sm transition-colors ${
                  role === key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {ROLE_COPY[key].label}
              </button>
            ))}
          </div>

          <h1 className="mt-8 font-heading text-3xl leading-tight text-primary sm:text-4xl">
            {ROLE_COPY[role].label}
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {ROLE_COPY[role].description}
          </p>
        </div>

        <div className="border-l border-border pl-6 sm:pl-10">
          {signedInAs ? (
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Status
              </p>
              <p className="mt-2 inline-flex items-center gap-2 font-mono text-sm text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Signed in as {ROLE_COPY[signedInAs].label}
              </p>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                This is a simulated login for the proof of concept — no real
                account or session was created. The {ROLE_COPY[signedInAs].label.toLowerCase()}{" "}
                dashboard isn&apos;t built yet.
              </p>
              <button
                type="button"
                onClick={() => setSignedInAs(null)}
                className="mt-6 font-mono text-xs uppercase tracking-widest text-accent hover:text-foreground"
              >
                Sign out
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-sm">
              <div>
                <label
                  htmlFor="email"
                  className="font-mono text-xs uppercase tracking-widest text-muted-foreground"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={ROLE_COPY[role].email}
                  className="mt-2 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                  autoComplete="email"
                />
              </div>

              <div className="mt-5">
                <label
                  htmlFor="password"
                  className="font-mono text-xs uppercase tracking-widest text-muted-foreground"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="****"
                  className="mt-2 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p className="mt-4 text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="mt-7 w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
              >
                Sign in as {ROLE_COPY[role].label}
              </button>

              <p className="mt-6 font-mono text-xs leading-relaxed text-muted-foreground">
                Demo credentials — Company: enterprise@example.com / 1234 · DAO
                Juror: admin@example.com / 1234
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
