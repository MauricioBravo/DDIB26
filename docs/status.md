# Status

Living document. Update it in the same commit as any change that finishes, starts, or changes the scope of an item below — see the rule in `CLAUDE.md`. Do not let this go stale.

## Current state (2026-07-18)

- Repo, branch strategy (`main`/`dev`/`mauricio`/`timileyin`), and `CLAUDE.md`/`AGENTS.md` context in place.
- Next.js (App Router) + TypeScript + Tailwind scaffolded, shadcn/ui initialized with Palette A and custom typography (Fraunces/Work Sans/JetBrains Mono) instead of the default theme.
- `frontend-design` skill installed at project scope.
- Hola-mundo landing page (`src/app/page.tsx`) live, verifying the deploy pipeline end to end.
- Second screen: `/login` (`src/app/login/page.tsx`) — simulated login with a role switch (Company / DAO Juror), hardcoded demo credentials, no real auth yet. Linked from the "Log in" nav item on the landing page. DAO Juror login now redirects to `/dao`; Company still gets the inline "not built yet" message.
- DAO Juror voting dashboard (`/dao`, `/dao/[caseId]`) — see "Just built" below for detail.
- Public companies directory (`/companies`) and per-company profile pages (`/companies/[slug]`) — no login required, linked from the landing page header. Static/illustrative data for now. See "Just built" below.
- Minting architecture resolved and a real backend "system signer" wallet generated (not yet funded, not yet wired to the app). See "Just built" below.
- Docker: full containerized dev environment (`docker-compose.yml`) and multi-stage production build (`Dockerfile`, `docker-compose.prod.yml`).
- CI/CD: GitHub Actions (`.github/workflows/deploy.yml`) deploys to the Oracle Cloud instance on every push to `main`. See `docs/deploy.md`.
- Still not wired up: Firebase, Firestore, Cloudinary, company/verifier upload flow, and the actual minting transaction (policy + signer exist, funding + trigger wiring don't). Everything below is still to do.

## Just built: DAO Juror voting dashboard (2026-07-18)

- **`src/lib/cases.ts`** — the shared in-memory case store described below, implemented: `listCases()`, `getCase(id)`, `addCase(input)`, `castVote(caseId, vote)`. Module-scope singleton, seeded with 6 mock cases (Patagonia, IKEA, Maersk, Siemens, Unilever, Nestle — company names only, no logos/trademarks, per the sanity-check note below). `castVote` now always appends all 3 votes (real + 2 simulated) and recomputes status from the full tally, rather than stopping early at 2-of-3 — needed so the quorum animation always has 3 seats to show.
- **`src/app/dao/actions.ts`** — one Server Action, `submitVote`, wraps `castVote` and revalidates `/dao` and `/dao/[caseId]`.
- **`/dao`** — docket list, pending cases newest-first with the newest featured, a "Resolved" section below once cases get certified/rejected. Forced to `dynamic = "force-dynamic"` — the store is a runtime singleton, not part of Next's data cache, so this route must not get statically prerendered at build time (caught this in the build output: it was silently going static and would have frozen at build-time data).
- **`/dao/[caseId]`** — case detail: company/verifier evidence side by side (placeholder tiles, no Cloudinary yet), then `VotePanel` (`vote-panel.tsx`, client component): wallet connect via Mesh SDK `BrowserWallet.enable("lace")`, then a quorum bar (`quorum-bar.tsx`) that fills toward DENIED/ACCEPTED as votes land.
- **Vote is now a real signed-and-submitted transaction on UZH Cardano (updated 2026-07-18).** Mauricio's Lace already has the "UZHCardano" network (magic 42) configured natively, so no bridge/backend proxy is needed -- `wallet.getUtxos()`, `signTx()`, and `submitTx()` all talk to that network directly through Lace. On vote click, `vote-panel.tsx` builds a metadata-only transaction with `MeshTxBuilder` (label 674, `msg` array describing the vote), using protocol parameters hardcoded in `src/lib/uzh-protocol-params.ts` (queried once via `cardano-cli query protocol-parameters --testnet-magic 42` against the node -- update that file if votes start failing fee/size checks after a protocol change). Lace signs and submits it, returning a real TxID, shown in the UI. This supersedes the earlier `signData`-only interim step.
- The 2-of-3 quorum stays simulated for the other two jurors: after the real vote's TxID comes back, two fictional juror votes stream in via `submitVote` at 3s intervals (`SIMULATED_VOTE_DELAY_MS` in `vote-panel.tsx`), weighted 70% to agree with the real vote. Resolution still uses the existing 2-of-3 rule inside `castVote`. Wiring the real Aiken 2-of-3 validator (see the results file referenced in memory) so all three votes are genuinely on-chain is still a deliberate follow-up, not done here.
- Verified: `npm run build` clean after this change (TypeScript compiles against Mesh SDK's `MeshTxBuilder`/`Protocol` types). The actual sign+submit round-trip against Lace still needs a manual browser pass -- can't be exercised in this environment.
- Independently confirmed on-chain (2026-07-18): after casting a real vote, its resulting TxID was checked directly against the UZH Cardano node with `cardano-cli query utxo --tx-in <hash>#0 --testnet-magic 42`, outside of and without trusting the app's frontend. The change output existed at the connected Lace wallet's address for the expected balance -- independent proof the transaction was genuinely accepted on-chain, not just displayed as if it were.

### On the blockchain validity of the current vote flow (for demo Q&A)

The connected juror's vote is a real Cardano transaction: signed by the user's own wallet (Lace), built by the app, and submitted to and accepted by a real node on the UZH Cardano testnet (magic 42). It is not a UI simulation -- it was independently verified against the node directly (see above), not just trusted from what the frontend displays. The other two jurors' votes, needed to complete the 2-of-3 quorum, are currently simulated at the application level with no cryptographic backing -- a deliberate, documented interim step (see the entries above), not a hidden shortcut.

This is valid at the blockchain level: blockchain validity does not require that 100% of a business process happen on-chain, only that whatever is submitted to the chain is genuine -- signed by the correct key, accepted under consensus rules, and recorded irreversibly. Hybrid architectures (part on-chain, part off-chain) are the standard design for real-world blockchain systems, not a limitation specific to this project; the chain is used for the part that needs its trust guarantee (irrefutable proof that this wallet, at this moment, cast this vote), while the rest of the orchestration lives in the application.

On the vote's metadata: even though there is currently no convenient way to re-query it (that would need an indexer such as Kupo or db-sync, not deployed here), it is permanently stored inside that transaction's body, as part of the chain, on every node that has synced that block. Not being able to conveniently redisplay it today is a tooling gap on our side, not a gap in whether the data actually reached the chain -- the on-chain fact already happened, the same way a bank transfer stays real even while you don't have your statement open to look at it.

## Just built: public companies directory + profile pages (2026-07-18)

- **`src/lib/companies.ts`** — static, illustrative directory of the same 6 mock companies used in `cases.ts` (Patagonia, IKEA, Maersk, Siemens, Unilever, Nestle — names only, no logos/trademarks). Deliberately separate from the live in-memory DAO docket so a juror rejecting a case mid-demo can't contradict a public "certified" badge — these are example public-profile achievements, not derived from live vote state. Each company has 3 badges: a trees-planted quantity, an estimated carbon offset, and a worldwide ranking.
- **`/companies`** — public, no-auth directory list. Same docket/ledger visual pattern as `/dao` (`divide-y divide-border border border-border` rows) for consistency across the app.
- **`/companies/[slug]`** — public profile page, static params pre-rendered at build time (`generateStaticParams`). Hero (initial-tile placeholder logo, no real logos/trademarks) + an achievements grid using the new **`MintedSeal`** component (`src/app/companies/minted-seal.tsx`): circular embossed medallion badges (sand fill, forest ring, radial-gradient "struck coin" effect) with an olive laurel sprig flanking ranking-type badges specifically — ties the Palette A "olive" token back to its literal namesake. Both pages carry an explicit "example/illustrative data" disclosure in the UI copy, not just in this doc.
- **Landing page (`src/app/page.tsx`)** — added a centered secondary nav row below the header with "How it works" (anchor to the existing section, now `id="how-it-works"`) and "Companies" (`/companies`).
- Verified: `npm run build` and `npm run lint` clean; visually checked all three pages with `agent-browser` (screenshots) — nav position, ledger list, and medallion badges (including the laurel sprigs) render as intended.

## Just built: minting architecture resolved, backend system signer generated (2026-07-18)

- Investigated (in a separate Claude Code session run directly on the UZH node server, `62.169.25.166`) whether our own backend (Oracle Cloud, Santiago) could submit a minting transaction without SSHing into that VM per mint. First finding: no usable HTTP endpoint on that specific node (only a P2P port and localhost-only metrics; no Ogmios/`cardano-submit-api`/Kupo running there).
- That finding was superseded by a better one, independently verified with direct `curl` from this environment (not just taken on trust): the UZH testnet exposes a public, unauthenticated, Blockfrost-compatible API called **Yaci Store** (Bloxbean's open-source indexer) at `http://130.60.24.200:8080`. Confirmed live: `/api/v1/blocks/latest`, `/api/v1/addresses/{addr}/utxos`, `/api/v1/epochs/latest/parameters` all return real data; `POST /api/v1/tx/submit` exists and responds (not a 404).
- Mesh SDK (`@meshsdk/core`, already a project dependency) ships a `YaciProvider` class built for exactly this API — `fetchAddressUTxOs`, `fetchProtocolParameters`, `submitTx`, etc., no custom HTTP client needed. **Conclusion: the backend can mint end-to-end (build, sign, submit) with zero SSH/VM dependency** — this replaces the SSH-based fallback from the first investigation, not just supplements it.
- Generated the real backend **system signer** wallet (the one that will sign every mint transaction going forward, per `project-brief.md`'s "the system, not the company, mints" design) via `MeshWallet.brew()`: address `addr_test1vrtm3vacksjfupfx6a0qqf4ujclvfpcjf9jettq45k5p2gcgcx7z8`. Mnemonic saved in `.env.local` (gitignored, `SYSTEM_SIGNER_MNEMONIC`) with a recovery copy outside the repo (see the local, non-git results file referenced in memory).
- **Not yet funded** — the address has 0 UTxOs, so no transaction (including a mint) can be built from it yet until Mauricio sends it some test UZHADA from his own wallet. `mint-poc.mjs` (repo root, untracked/not committed — throwaway validation script) is ready to build a time-locked single-sig native minting policy, mint one CIP-25-metadata token, and independently verify it lands in a test company address, once funded.
- Separately, in the earlier UZH-server session, a full mint was already validated end-to-end there via `cardano-cli` (policy ID `b86c3936ba0e4fef0818b3b4ac830bec981338ddccba5a635a44de0a`, TxID `6dc0f7605727d6c053d33bbe1bc57243753dc088df7de09d34a1cadd96757bf6`) — that proved the on-chain mechanics work at all; this session's work replaces *how* the production backend will do it (Mesh SDK + Yaci Store, no SSH) rather than repeating that proof.
- **Funded and proven end-to-end from this repo, no SSH (2026-07-18, later same day).** Mauricio funded the system signer with 50 test UZHADA; `scripts/mint-poc.mjs` then built a time-locked native policy, minted a CIP-25-metadata token, and submitted it — **TxID `52f5b2b45370e7d2196fd1b90a9bd71687d2a5ad08f204d6b2e3cb65a100fb8c`**, independently re-verified via direct `curl` (not just trusted from the script). Two real Mesh SDK gotchas were found and fixed along the way (custom `YaciProvider` base URLs need an explicit `/api/v1/`; `getUtxos()`/`getChangeAddress()` default to the *base* address, not `enterprise`) — full detail in **`docs/uzh-network.md`**, the new practical reference doc for this network (endpoints, known addresses, these gotchas, all TxIDs so far) so they don't get rediscovered.
- **Vote metadata fixed (2026-07-18):** the on-chain vote metadata (`vote-panel.tsx`, label 674) had `company` and `decision` but not the actual environmental action being voted on. Now also carries `actionType` and `quantity` from the case record. The case detail page already showed this in the UI before voting — only the on-chain metadata was missing it.
- **`contracts/dao-validator/`** — the Aiken 2-of-3 validator source (`aiken.toml` + `validators/greenproof_dao.ak`) is now committed to the repo, reproduced from the earlier validation session, with its deployed script hash/address/TxIDs in that folder's `README.md`. Still not wired into the app (see "Next up").
- **`scripts/`** now holds `mint-poc.mjs` (the mint proof above) and `greenproof_tx_lookup.py` (Mauricio's live-demo TxID lookup helper against the Yaci Store API) — a deliberate, disclosed exception to the "TypeScript end to end" rule since it's a standalone demo tool, not shipped application code.

## Frontend TODO

Routes/screens implied by the flow in `docs/project-brief.md` §3:

- [x] Login screen with a role switch (Company / DAO Juror) — simulated only (`src/app/login/page.tsx`), hardcoded credentials, no session/Firebase yet.
- [ ] Replace simulated login with real Firebase Authentication (email/password at minimum), for company, verifier, and juror roles.
- [ ] Company dashboard: submit new evidence (photo upload + GPS location), see status of submitted cases (pending / verified / rejected with jury comments), see own certified actions.
- [ ] Verifier view: see assigned case(s) (rotation-assigned, simulated by one team member for the PoC), upload their own evidence for a case.
- [x] Jury/DAO voting interface (`/dao`, `/dao/[caseId]`) — **scope decision (2026-07-18): more ambitious than the original PoC doc.** `docs/project-brief.md` §8 describes jury voting as fully simulated/off-chain (no wallet signing). We're instead building **real CIP-30 wallet voting** — done for this pass as a wallet-signed message (compatibility check), see "Just built" above. Still open: swap that for an actual signed testnet transaction once the real Aiken validator (see "Just built" above) is wired in — see "Next up" below.
- [x] Public dashboard: per-company public profile, verified achievements by category, badges, rankings (e.g. "Top 3 Carbon Reducers"). No auth required. **(2026-07-18, `/companies`, `/companies/[slug]` — see "Just built" above.) Static/illustrative data, not yet wired to live case data — see the Firestore item below.**
- [ ] Wire all of the above to real Firestore data (currently nothing reads/writes Firestore, and `src/lib/companies.ts` is a static illustrative dataset, not derived from `cases.ts` vote outcomes).
- [ ] Replace/extend the current landing page with real navigation into the above once they exist, keep Palette A + typography consistent (no default shadcn theme, see `CLAUDE.md`).

## Backend TODO

- [ ] Firebase project: create it, enable Authentication (email/password at minimum) and Firestore, generate a service account for server-side access.
- [ ] Firestore data model: `companies`, `verifiers`, `cases` (evidence + status + jury result), `jurors`/DAO pool, `certifications` (minted token records). Define rotation fields (last-assigned verifier/juror) to support the rotation rules in §5.
- [ ] Cloudinary: unsigned upload preset restricted to jpg/jpeg/png, 5MB max, no custom public IDs (per §16).
- [ ] Server-side logic: company registration triggers custodial Cardano wallet generation (invisible to the user).
- [ ] Verifier rotation logic: assign a verifier per new case, excluding whoever last inspected that same company.
- [ ] Jury rotation logic: assign three jurors per case from the DAO pool; two-of-three approval certifies, otherwise the case returns with comments and can be resubmitted.
- [~] Cardano integration — **superseded 2026-07-18**: not Blockfrost/Preprod/Lucid Evolution, see "Just built" above. Real UZH testnet, Mesh SDK (`@meshsdk/core`, already installed) + its `YaciProvider` against the public Yaci Store API. Time-locked single-sig minting policy design done, backend system signer generated. Still open: fund the signer, then write the actual `src/lib/mint.ts` module (metadata schema per §4: company ID, action type, quantity, date, evidence hashes, verifier ID, jury result).
- [ ] On 2-of-3 jury approval, trigger the minting script, then write the resulting transaction hash back to Firestore. Depends on the item above plus a real Firestore/case store (currently `castVote` in `src/lib/cases.ts` has no mint hook).
- [ ] Public dashboard reads: aggregate certified actions per company/category for badges and rankings.

## Next up

1. **Turn the mint proof into real product code**: `src/lib/mint.ts` (Mesh SDK `MeshTxBuilder` + `MeshWallet` + `YaciProvider`, pattern already proven in `scripts/mint-poc.mjs` — see `docs/uzh-network.md`), and a mint hook inside `castVote` (`src/lib/cases.ts`) that fires on 2-of-3 approval and records the resulting TxID on the case.
2. Company evidence-submission screen, wired to `addCase()` in `src/lib/cases.ts` (already built with this in mind — no store changes should be needed, just a form that calls it).
3. Verifier view (rotation-assigned case, upload their own evidence).
4. Real Firebase Authentication to replace the simulated `/login`.
5. Wire the public `/companies` pages to real case/Firestore data instead of the static illustrative dataset in `src/lib/companies.ts`, once Firestore and the mint hook above exist.
6. Wire the real Aiken 2-of-3 validator (`contracts/dao-validator/`) into `/dao` so all three jury votes are genuinely on-chain, replacing the current real-vote-plus-two-simulated-votes design.

## Explicitly out of scope for the PoC (see `docs/project-brief.md` §8-9)

- Non-transferable/soulbound tokens (would need a Plutus validator) — tokens are plain transferable native assets by design for now.
- Real satellite/geolocation verification, categories beyond trees planted, wallet claim/export for companies.

Note: the original assumption that DAO voting logic would stay fully off-chain (only the mint transaction going on-chain) has already been superseded in practice — a working on-chain 2-of-3 voting validator exists and was tested against the real UZH Cardano testnet (see "Just built" above). It just isn't wired into this app yet.
