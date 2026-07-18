# Status

Living document. Update it in the same commit as any change that finishes, starts, or changes the scope of an item below — see the rule in `CLAUDE.md`. Do not let this go stale.

## Current state (2026-07-18)

- Repo, branch strategy (`main`/`dev`/`mauricio`/`timileyin`), and `CLAUDE.md`/`AGENTS.md` context in place.
- Next.js (App Router) + TypeScript + Tailwind scaffolded, shadcn/ui initialized with Palette A and custom typography (Fraunces/Work Sans/JetBrains Mono) instead of the default theme.
- `frontend-design` skill installed at project scope.
- Hola-mundo landing page (`src/app/page.tsx`) live, verifying the deploy pipeline end to end.
- Second screen: `/login` (`src/app/login/page.tsx`) — simulated login with a role switch (Company / DAO Juror), hardcoded demo credentials, no real auth yet. Linked from the "Log in" nav item on the landing page.
- Docker: full containerized dev environment (`docker-compose.yml`) and multi-stage production build (`Dockerfile`, `docker-compose.prod.yml`).
- CI/CD: GitHub Actions (`.github/workflows/deploy.yml`) deploys to the Oracle Cloud instance on every push to `main`. See `docs/deploy.md`.
- Nothing else is wired up yet: no Firebase, no Firestore, no Cloudinary, no Cardano/Lucid Evolution, no real app routes or data model. Everything below is still to do.

## Frontend TODO

Routes/screens implied by the flow in `docs/project-brief.md` §3:

- [x] Login screen with a role switch (Company / DAO Juror) — simulated only (`src/app/login/page.tsx`), hardcoded credentials, no session/Firebase yet.
- [ ] Replace simulated login with real Firebase Authentication (email/password at minimum), for company, verifier, and juror roles.
- [ ] Company dashboard: submit new evidence (photo upload + GPS location), see status of submitted cases (pending / verified / rejected with jury comments), see own certified actions.
- [ ] Verifier view: see assigned case(s) (rotation-assigned, simulated by one team member for the PoC), upload their own evidence for a case.
- [ ] Jury/DAO voting interface — **scope decision (2026-07-18): more ambitious than the original PoC doc.** `docs/project-brief.md` §8 describes jury voting as fully simulated/off-chain (no wallet signing). We're instead building **real CIP-30 wallet voting** (connect Lace via Mesh SDK, cast a vote as an actual signed testnet transaction that spends a small amount of tokens) — see "Next up" below for the full plan. Only the requirement to have a live wallet-signed vote changed; the 2-of-3 majority rule and rotation logic are unchanged.
- [ ] Public dashboard: per-company public profile, verified achievements by category, badges, rankings (e.g. "Top 3 Carbon Reducers"). No auth required.
- [ ] Wire all of the above to real Firestore data (currently nothing reads/writes Firestore).
- [ ] Replace/extend the current landing page with real navigation into the above once they exist, keep Palette A + typography consistent (no default shadcn theme, see `CLAUDE.md`).

## Backend TODO

- [ ] Firebase project: create it, enable Authentication (email/password at minimum) and Firestore, generate a service account for server-side access.
- [ ] Firestore data model: `companies`, `verifiers`, `cases` (evidence + status + jury result), `jurors`/DAO pool, `certifications` (minted token records). Define rotation fields (last-assigned verifier/juror) to support the rotation rules in §5.
- [ ] Cloudinary: unsigned upload preset restricted to jpg/jpeg/png, 5MB max, no custom public IDs (per §16).
- [ ] Server-side logic: company registration triggers custodial Cardano wallet generation (invisible to the user).
- [ ] Verifier rotation logic: assign a verifier per new case, excluding whoever last inspected that same company.
- [ ] Jury rotation logic: assign three jurors per case from the DAO pool; two-of-three approval certifies, otherwise the case returns with comments and can be resubmitted.
- [ ] Cardano integration: Blockfrost account + Preprod project, install Lucid Evolution, write the minting script — metadata schema per §4 (company ID, action type, quantity, date, evidence hashes, verifier ID, jury result), time-locked minting policy.
- [ ] On 2-of-3 jury approval, trigger the minting script, then write the resulting transaction hash back to Firestore.
- [ ] Public dashboard reads: aggregate certified actions per company/category for badges and rankings.

## Next up: DAO Juror voting dashboard

This is the current focus — the core interactive loop of the PoC (company evidence -> juror review -> wallet-signed vote -> simulated quorum). Step by step:

1. **Shared in-memory data layer** (`src/lib/cases.ts` or similar): a server-side module-scope store (not client `localStorage`, not per-request state) holding the list of evidence "cases", so a future company upload and the juror's list both read/write the same data within the running server process. This is a deliberate stepping stone before Firestore exists — keep the read/write surface small and swappable (e.g. a couple of functions like `listCases()`, `addCase()`, `castVote()`) so replacing the backing store later doesn't touch the UI.
2. **Seed data**: 5-6 mock cases, company field using well-known multinational names for a recognizable demo (sanity-check this is fine for an academic/internal demo before using real logos/trademarks anywhere, plain company names in text are fine). Evidence is placeholder (no Cloudinary yet) — mock photo placeholders + captions/GPS text is enough.
3. **`/login` change**: on successful simulated login as DAO Juror, redirect to a new `/dao` route instead of the current inline "signed in" message (that inline behavior stays for Company until its own dashboard exists).
4. **`/dao` list view**: all pending cases, newest first/highlighted. "Newest" should genuinely be whatever was last added to the shared store (so once a company upload screen exists, it shows up here automatically, no wiring changes needed).
5. **`/dao/[caseId]` (or similar) detail + vote view**: company evidence and verifier evidence shown side by side, a "connect wallet" step (Mesh SDK `BrowserWallet`, targets Lace via CIP-30), then a vote action once connected.
6. **Vote = a real signed testnet transaction** — needs a decision before writing this: is "UZH Cardano" (mentioned in `docs/project-brief.md`'s "Potential platforms" line) a distinct network UZH runs, or just their course-provided access to the public Cardano Preprod testnet via Blockfrost? Validate this (check course materials, ask course staff if unclear) before deciding where the vote transaction actually lands. Whichever network, the transaction should be minimal (small ADA amount, covers just the fee) with vote metadata attached.
7. **Post-vote simulated quorum animation**: a horizontal progress bar, "DENIED" label on the left end, "ACCEPTED" label on the right end (English, per the brief's DAO framing), that fills toward one side. After the real vote registers, simulate 2 more votes trickling in from fictional juror identities over a couple of seconds (staggered, not instant) so it reads as a live 3-person quorum even though only one vote is real for now. Resolve to certified/rejected using the existing 2-of-3 rule once all 3 (1 real + 2 simulated) are in.

## Explicitly out of scope for the PoC (see `docs/project-brief.md` §8-9)

- Non-transferable/soulbound tokens (would need a Plutus validator) — tokens are plain transferable native assets by design for now.
- On-chain DAO voting smart contract — jury voting logic lives off-chain/in Firestore; only the mint transaction goes on chain.
- Real satellite/geolocation verification, categories beyond trees planted, wallet claim/export for companies.
