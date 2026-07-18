# Status

Living document. Update it in the same commit as any change that finishes, starts, or changes the scope of an item below — see the rule in `CLAUDE.md`. Do not let this go stale.

## Current state (2026-07-18)

- Repo, branch strategy (`main`/`dev`/`mauricio`/`timileyin`), and `CLAUDE.md`/`AGENTS.md` context in place.
- Next.js (App Router) + TypeScript + Tailwind scaffolded, shadcn/ui initialized with Palette A and custom typography (Fraunces/Work Sans/JetBrains Mono) instead of the default theme.
- `frontend-design` skill installed at project scope.
- Hola-mundo landing page (`src/app/page.tsx`) live, verifying the deploy pipeline end to end.
- Second screen: `/login` (`src/app/login/page.tsx`) — simulated login with a role switch (Company / DAO Juror), hardcoded demo credentials, no real auth yet. Linked from the "Log in" nav item on the landing page. DAO Juror login now redirects to `/dao`; Company still gets the inline "not built yet" message.
- DAO Juror voting dashboard (`/dao`, `/dao/[caseId]`) — see "Just built" below for detail.
- Docker: full containerized dev environment (`docker-compose.yml`) and multi-stage production build (`Dockerfile`, `docker-compose.prod.yml`).
- CI/CD: GitHub Actions (`.github/workflows/deploy.yml`) deploys to the Oracle Cloud instance on every push to `main`. See `docs/deploy.md`.
- Nothing else is wired up yet: no Firebase, no Firestore, no Cloudinary, no real Cardano vote transaction, no company/verifier upload flow. Everything below is still to do.

## Just built: DAO Juror voting dashboard (2026-07-18)

- **`src/lib/cases.ts`** — the shared in-memory case store described below, implemented: `listCases()`, `getCase(id)`, `addCase(input)`, `castVote(caseId, vote)`. Module-scope singleton, seeded with 6 mock cases (Patagonia, IKEA, Maersk, Siemens, Unilever, Nestle — company names only, no logos/trademarks, per the sanity-check note below). `castVote` now always appends all 3 votes (real + 2 simulated) and recomputes status from the full tally, rather than stopping early at 2-of-3 — needed so the quorum animation always has 3 seats to show.
- **`src/app/dao/actions.ts`** — one Server Action, `submitVote`, wraps `castVote` and revalidates `/dao` and `/dao/[caseId]`.
- **`/dao`** — docket list, pending cases newest-first with the newest featured, a "Resolved" section below once cases get certified/rejected. Forced to `dynamic = "force-dynamic"` — the store is a runtime singleton, not part of Next's data cache, so this route must not get statically prerendered at build time (caught this in the build output: it was silently going static and would have frozen at build-time data).
- **`/dao/[caseId]`** — case detail: company/verifier evidence side by side (placeholder tiles, no Cloudinary yet), then `VotePanel` (`vote-panel.tsx`, client component): wallet connect via Mesh SDK `BrowserWallet.enable("lace")`, then a quorum bar (`quorum-bar.tsx`) that fills toward DENIED/ACCEPTED as votes land.
- **Vote is now a real signed-and-submitted transaction on UZH Cardano (updated 2026-07-18).** Mauricio's Lace already has the "UZHCardano" network (magic 42) configured natively, so no bridge/backend proxy is needed -- `wallet.getUtxos()`, `signTx()`, and `submitTx()` all talk to that network directly through Lace. On vote click, `vote-panel.tsx` builds a metadata-only transaction with `MeshTxBuilder` (label 674, `msg` array describing the vote), using protocol parameters hardcoded in `src/lib/uzh-protocol-params.ts` (queried once via `cardano-cli query protocol-parameters --testnet-magic 42` against the node -- update that file if votes start failing fee/size checks after a protocol change). Lace signs and submits it, returning a real TxID, shown in the UI. This supersedes the earlier `signData`-only interim step.
- The 2-of-3 quorum stays simulated for the other two jurors: after the real vote's TxID comes back, two fictional juror votes stream in via `submitVote` at 3s intervals (`SIMULATED_VOTE_DELAY_MS` in `vote-panel.tsx`), weighted 70% to agree with the real vote. Resolution still uses the existing 2-of-3 rule inside `castVote`. Wiring the real Aiken 2-of-3 validator (see the results file referenced in memory) so all three votes are genuinely on-chain is still a deliberate follow-up, not done here.
- Verified: `npm run build` clean after this change (TypeScript compiles against Mesh SDK's `MeshTxBuilder`/`Protocol` types). The actual sign+submit round-trip against Lace still needs a manual browser pass -- can't be exercised in this environment.

## Frontend TODO

Routes/screens implied by the flow in `docs/project-brief.md` §3:

- [x] Login screen with a role switch (Company / DAO Juror) — simulated only (`src/app/login/page.tsx`), hardcoded credentials, no session/Firebase yet.
- [ ] Replace simulated login with real Firebase Authentication (email/password at minimum), for company, verifier, and juror roles.
- [ ] Company dashboard: submit new evidence (photo upload + GPS location), see status of submitted cases (pending / verified / rejected with jury comments), see own certified actions.
- [ ] Verifier view: see assigned case(s) (rotation-assigned, simulated by one team member for the PoC), upload their own evidence for a case.
- [x] Jury/DAO voting interface (`/dao`, `/dao/[caseId]`) — **scope decision (2026-07-18): more ambitious than the original PoC doc.** `docs/project-brief.md` §8 describes jury voting as fully simulated/off-chain (no wallet signing). We're instead building **real CIP-30 wallet voting** — done for this pass as a wallet-signed message (compatibility check), see "Just built" above. Still open: swap that for an actual signed testnet transaction once the real Aiken validator (see "Just built" above) is wired in — see "Next up" below.
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

## Next up

1. **Wire the real on-chain vote transaction.** The network question is resolved (see "Just built" above: UZH Cardano, magic 42, and a tested Aiken 2-of-3 validator already exist). Remaining work: build the datum/redeemer from the Next.js backend, replace the validator's 3 test juror keys with real DAO juror keys, and call the UZH node (or Blockfrost if it fronts that network — check) to actually lock/vote/release on-chain instead of the current `signData` compatibility check. Start from the validator source and TxIDs already saved in the local (non-git) results file rather than re-deriving them from scratch.
2. Company evidence-submission screen, wired to `addCase()` in `src/lib/cases.ts` (already built with this in mind — no store changes should be needed, just a form that calls it).
3. Verifier view (rotation-assigned case, upload their own evidence).
4. Real Firebase Authentication to replace the simulated `/login`.

## Explicitly out of scope for the PoC (see `docs/project-brief.md` §8-9)

- Non-transferable/soulbound tokens (would need a Plutus validator) — tokens are plain transferable native assets by design for now.
- Real satellite/geolocation verification, categories beyond trees planted, wallet claim/export for companies.

Note: the original assumption that DAO voting logic would stay fully off-chain (only the mint transaction going on-chain) has already been superseded in practice — a working on-chain 2-of-3 voting validator exists and was tested against the real UZH Cardano testnet (see "Just built" above). It just isn't wired into this app yet.
