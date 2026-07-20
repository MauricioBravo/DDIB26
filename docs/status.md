# Status

Living document. Update it in the same commit as any change that finishes, starts, or changes the scope of an item below — see the rule in `CLAUDE.md`. Do not let this go stale.

## Current state (2026-07-20)

- Repo, branch strategy (`main`/`dev`/`mauricio`/`timileyin`), and `CLAUDE.md`/`AGENTS.md` context in place.
- Next.js (App Router) + TypeScript + Tailwind scaffolded, shadcn/ui initialized with Palette A and custom typography (Fraunces/Work Sans/JetBrains Mono) instead of the default theme.
- `frontend-design` skill installed at project scope.
- Hola-mundo landing page (`src/app/page.tsx`) live, verifying the deploy pipeline end to end.
- Second screen: `/login` (`src/app/login/page.tsx`) — simulated login with a role switch (Company / DAO Juror), hardcoded demo credentials, no real auth yet. Linked from the "Log in" nav item on the landing page. DAO Juror login now redirects to `/dao`; Company still gets the inline "not built yet" message.
- DAO Juror voting dashboard (`/dao`, `/dao/[caseId]`) — see "Just built" below for detail.
- Public companies directory (`/companies`) and per-company profile pages (`/companies/[slug]`) — no login required, linked from the landing page header. Static/illustrative data for now. See "Just built" below.
- Minting architecture resolved, backend "system signer" wallet generated and funded, a real mint proven end-to-end from this repo with no SSH to any UZH server. See `docs/uzh-network.md` for the practical reference (endpoints, addresses, TxIDs, gotchas) and "Just built" below for the narrative.
- Aiken 2-of-3 DAO voting contract source committed at `contracts/dao-validator/` (previously only existed outside the repo). Not yet wired into `/dao`.
- Landing page (`src/app/page.tsx`) now has a "Build docket" section showing shipped vs. next-up work, and "How it works" was redesigned with a center spine connecting steps 01-06 in reading order (was an ambiguous 2-column grid before). See "Just built" below.
- Docker: full containerized dev environment (`docker-compose.yml`) and multi-stage production build (`Dockerfile`, `docker-compose.prod.yml`).
- CI/CD: GitHub Actions (`.github/workflows/deploy.yml`) deploys to the Oracle Cloud instance on every push to `main`. See `docs/deploy.md`.
- Still not wired up: Firebase, Firestore, Cloudinary, company/verifier upload flow, and the actual mint-on-approval trigger (the mint pipeline itself is proven and working, it's just not called automatically from `castVote` yet). Everything below is still to do.

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
- **Not yet funded (at the time this paragraph was written)** — see the funded/proven entry below; this was resolved later the same day. `scripts/mint-poc.mjs` (committed) builds a time-locked single-sig native minting policy, mints one CIP-25-metadata token, and independently verifies it lands in a test company address.
- Separately, in the earlier UZH-server session, a full mint was already validated end-to-end there via `cardano-cli` (policy ID `b86c3936ba0e4fef0818b3b4ac830bec981338ddccba5a635a44de0a`, TxID `6dc0f7605727d6c053d33bbe1bc57243753dc088df7de09d34a1cadd96757bf6`) — that proved the on-chain mechanics work at all; this session's work replaces *how* the production backend will do it (Mesh SDK + Yaci Store, no SSH) rather than repeating that proof.
- **Funded and proven end-to-end from this repo, no SSH (2026-07-18, later same day).** Mauricio funded the system signer with 50 test UZHADA; `scripts/mint-poc.mjs` then built a time-locked native policy, minted a CIP-25-metadata token, and submitted it — **TxID `52f5b2b45370e7d2196fd1b90a9bd71687d2a5ad08f204d6b2e3cb65a100fb8c`**, independently re-verified via direct `curl` (not just trusted from the script). Two real Mesh SDK gotchas were found and fixed along the way (custom `YaciProvider` base URLs need an explicit `/api/v1/`; `getUtxos()`/`getChangeAddress()` default to the *base* address, not `enterprise`) — full detail in **`docs/uzh-network.md`**, the new practical reference doc for this network (endpoints, known addresses, these gotchas, all TxIDs so far) so they don't get rediscovered.
- **Vote metadata fixed (2026-07-18):** the on-chain vote metadata (`vote-panel.tsx`, label 674) had `company` and `decision` but not the actual environmental action being voted on. Now also carries `actionType` and `quantity` from the case record. The case detail page already showed this in the UI before voting — only the on-chain metadata was missing it.
- **`contracts/dao-validator/`** — the Aiken 2-of-3 validator source (`aiken.toml` + `validators/greenproof_dao.ak`) is now committed to the repo, reproduced from the earlier validation session, with its deployed script hash/address/TxIDs in that folder's `README.md`. Still not wired into the app (see "Next up").
- **`scripts/`** now holds `mint-poc.mjs` (the mint proof above) and `greenproof_tx_lookup.py` (Mauricio's live-demo TxID lookup helper against the Yaci Store API) — a deliberate, disclosed exception to the "TypeScript end to end" rule since it's a standalone demo tool, not shipped application code.

## Just built: vote-flow bug fixes, Blockfrost fallback, landing page redesign (2026-07-19/20)

- **Two logic bugs fixed in the real vote flow** (`src/app/dao/[caseId]/vote-panel.tsx`, `src/lib/cases.ts`), found by a targeted code review of the DAO voting path:
  - If the on-chain vote transaction succeeded (real tx hash obtained) but the follow-up call to save it in the in-memory case store then threw (e.g. `Unknown case` after a redeploy resets that store, which happens on every push to `main`), the UI used to discard the real hash and tell the juror the transaction was rejected by the network — false, since the chain had already accepted it. Fixed: the hash is now always shown once obtained, and the error message correctly distinguishes a real network rejection from a bookkeeping failure after a successful submission.
  - `castVote` had no duplicate-vote guard: the same `jurorId` could be recorded twice toward the 2-of-3 quorum (e.g. by reloading the case page and voting again). Fixed: `castVote` now throws if that juror already voted on that case.
- **Blockfrost read fallback added for minting** (`scripts/mint-poc.mjs`): a teaching assistant separately shared a self-hosted Blockfrost instance at `130.60.24.200:3000`, confirmed to be the exact same chain as the Yaci Store API already in use (matching slot/height at the same moment — see `docs/uzh-network.md`). Reads (`fetchAddressUTxOs`, `fetchProtocolParameters`, tip lookup) now try Yaci Store first and fall back to this Blockfrost instance on failure. Submission always goes through Yaci Store — the Blockfrost instance has no working `/tx/submit`. Re-ran the mint end-to-end with the fallback wrapper in place to confirm nothing broke (third TxID in the table in `docs/uzh-network.md`).
- **Stale default favicon removed.** `src/app/favicon.ico` was still the Next.js scaffold default (a triangle icon) and browsers prioritize it over the Metadata API's `icon.png`, so the tab kept showing the placeholder regardless of what `icon.png` contained. Deleted `favicon.ico` so `icon.png` is the only icon source.
- **`icon.png` replaced** with a tighter-cropped version of the shield mark (less surrounding whitespace/border than the previous export). The footer mark (`public/shield-mark.png`) is untouched, on purpose — only the tab icon changed.
- **Landing page (`src/app/page.tsx`) redesign, two changes:**
  - New **"Build docket"** section (`#progress`, linked from the hero's Status box) replacing the old static "Deploy pipeline live" timestamp, which didn't reflect real progress. Two columns, "Shipped" vs. "Next up", styled as a ledger consistent with the `/dao` and `/companies` list patterns (dividers, mono labels, filled vs. hollow bullet markers). Content is a manually curated summary of this doc, not generated from it — keep both in sync by hand when scope changes.
  - **"How it works" (01-06) redesigned**: was a plain 2-column CSS grid that read ambiguously (readers followed column 1 top-to-bottom — 01, 03, 05 — and mistook 03 for what comes right after 01, missing that 02 in column 2 was actually next). Replaced with a single center spine on desktop: steps alternate left/right of a vertical line with numbered circular markers sitting on the line itself, so the reading order 01→02→03→04→05→06 is the line, not two independently-read columns. Falls back to a simple stacked list on mobile (no room for the spine treatment at that width).
  - Footer and hero "Scope" copy also corrected: no longer say "Cardano Preprod · Lucid Evolution · Blockfrost" (never true for this project's actual network) — now says "UZH Cardano testnet · Mesh SDK".
- Verified: `npm run build` and `npm run lint` clean; visually checked with `agent-browser` at both desktop and mobile viewports.

## Scope decision: no evidence file hashing for the PoC (2026-07-20)

Deliberately **not** computing a real hash (e.g. SHA-256) of uploaded evidence files for this PoC — extra complexity not worth it at this stage, per Mauricio's call. `evidenceHash` in mint/vote metadata stays a placeholder value, same as in `scripts/mint-poc.mjs` today. Multiple evidence files per case (several photos plus a document) are still in scope and are NOT considered complex: Cloudinary's `auto` resource type accepts images and non-images (e.g. PDF) through the same unsigned upload endpoint with no branching logic needed, so "multiple files, mixed types" only means looping over a file list and collecting the returned URLs into an array — see the evidence-upload TODO item below for the concrete shape.

## TODO, in priority order (2026-07-20)

Reordered from a flat list to reflect what actually blocks a working end-to-end PoC demo vs. what's nice-to-have. Login/auth and company registration are explicitly deprioritized (Mauricio's call, 2026-07-20) — the existing simulated `/login` is good enough to keep demoing with for now. Within each group, most important first.

### Backend

1. **Hook the proven mint into `castVote` on 2-of-3 approval.** The single biggest gap between "isolated proof" and "actual demo flow" — everything else (`scripts/mint-poc.mjs`, the funded system signer, the Yaci Store + Blockfrost-fallback pipeline) is already proven working, this just wires it in.
   Files: new `src/lib/mint.ts` (extracted from `scripts/mint-poc.mjs`, kept as-is for reference), `src/lib/cases.ts` (`castVote`), `src/app/dao/actions.ts`.
2. Record the resulting mint TxID on the case.
   Files: `src/lib/cases.ts` (new `mintTxHash` field on `Case`).
3. Cloudinary preset using `auto` resource type, so both images and PDFs upload through the same unsigned endpoint (see the scope decision above — no hashing, no per-type branching needed).
   Files: none in-repo (Cloudinary console setting), new env var for the preset name/cloud name.
4. Verifier and jury rotation logic — can start simple (pick from a fixed pool) for the PoC.
   Files: new `src/lib/rotation.ts`.
5. Jury rejection comment field + a `resubmitCase` action, so a rejected case can actually be sent back per `project-brief.md` §5 ("returns with comments... can be resubmitted") instead of just dead-ending.
   Files: `src/lib/cases.ts` (`JurorVote.comment`, new `resubmitCase` function, likely a new case status), `src/app/dao/[caseId]/vote-panel.tsx`, `src/app/dao/actions.ts`.
6. Wire the real Aiken 2-of-3 validator (`contracts/dao-validator/`) into `/dao`, replacing the current real-vote-plus-two-simulated-votes design. Bigger technical lift than the rest above, and we already have something demoable without it, so it ranks lower.
   Files: `src/app/dao/[caseId]/vote-panel.tsx`, `contracts/dao-validator/` (compile, get script CBOR), new `src/lib/dao-contract.ts`.
7. **Deprioritized per Mauricio (2026-07-20):** Firebase project + service account, Firestore data model, real company registration, wallet-on-registration, real Firebase Authentication replacing `/login`.
   Files (when picked up): new `src/lib/firebase.ts`, `src/lib/firebase-admin.ts`, `src/app/login/page.tsx`, new `src/app/register/page.tsx`, new `src/lib/wallet-provisioning.ts`, new `firebase-service-account.json` (never commit — already covered by `.gitignore`'s `*serviceAccount*.json` pattern).

### Frontend — company

1. Evidence-submission form: multiple photos plus an optional document (PDF), all through the Cloudinary `auto` preset above, no hashing (see scope decision). This is the missing link in the brief's flow (§3 step 2) — nothing today lets a company submit real evidence at all.
   Files: new `src/app/company/page.tsx`, new `src/app/company/actions.ts` (calls the existing `addCase()` in `src/lib/cases.ts`), `src/lib/cases.ts` (`Evidence` changes from a single field to an array of `{url, type}`).
2. View of own cases and their status (pending/certified/rejected + jury comment), closing the loop visually for the company side.
   Files: new `src/app/company/cases/page.tsx`.
3. Resubmit action from that view, once the backend item above exists.
   Files: same file as above.

### Frontend — verifier

This entire role is currently a hard blocker — there is no verifier login, dashboard, or evidence upload of any kind today.

1. Dashboard showing the case assigned by rotation. Without this, no verifier flow exists at all.
   Files: new `src/app/verifier/page.tsx`.
2. Evidence upload for that case (their own photos/document, same `auto`-preset pattern as the company side) — this is what actually completes the "independent verification" step in the brief.
   Files: new `src/app/verifier/[caseId]/page.tsx`.
3. Show that evidence next to the company's in `/dao/[caseId]` so the jury can actually review it (today those are hardcoded "Photo pending Cloudinary" placeholder tiles).
   Files: `src/app/dao/[caseId]/page.tsx`.
4. Mobile-friendly pass — verifiers are realistically on a phone, standing at the site. Polish, not a blocker.
   Files: same as items 1-2, styling only.
5. **Deprioritized along with login/auth generally:** add a third "Verifier" role to the login role switch. A direct link to `/verifier` without full auth gating is good enough for the PoC in the meantime.
   Files: `src/app/login/page.tsx`.

### Frontend — transaction status (vote and mint)

1. Mint confirmation screen with policy ID, TxID, block, and destination address. Once the backend mint hook (above) lands, this is the single strongest moment of the demo, so it's worth building well first.
   Files: new component inside `src/app/company/cases/page.tsx` (or its own file), depends on `src/lib/mint.ts`.
2. Reusable transaction-status component (building → signing → submitting → confirmed/error, with a loading animation on the in-progress states), shared between vote and mint.
   Files: new `src/components/tx-status.tsx`.
3. Vote: actually confirm the transaction landed in a block (today we only show the hash right after submit, we never confirm inclusion), and show that block once confirmed.
   Files: `src/app/dao/[caseId]/vote-panel.tsx`.
4. Vote: show the signer's wallet address in the confirmation block (already held in state, just not displayed there).
   Files: same file as above.
5. "Verify on-chain" button that re-queries the API directly and shows the raw response — reinforces the "don't just trust our frontend" story, but not required for a working demo.
   Files: new `src/lib/verify-onchain.ts` (endpoints documented in `docs/uzh-network.md`), used in `vote-panel.tsx` and the mint screen above.

### Frontend — company ranking

Today `/companies` is a flat, unordered, unfiltered list — despite the "Public dashboard" TODO item historically being marked done, an actual ranking/leaderboard does not exist yet.

1. Add real numeric fields to `src/lib/companies.ts` (e.g. a numeric carbon-offset value, not just the display string "252 t CO2 / yr") — nothing can be sorted without this.
   Files: `src/lib/companies.ts`.
2. Ranking view with a podium treatment for top 1-3 and a plain list for the rest — the actual "indirect competition" deliverable from `project-brief.md` §3/§6.
   Files: new `src/app/companies/rankings/page.tsx`, run through the `frontend-design` skill per `CLAUDE.md`.
3. Filters by category (trees planted, carbon offset, etc.) and country.
   Files: same file as above.
4. Decide whether this replaces `/companies` or lives alongside it.
   Files: `src/app/companies/page.tsx`.

### Cross-cutting, not yet placed above

- [ ] Wire `/companies` (whichever form it ends up in) to real case/Firestore data instead of the static illustrative dataset — depends on Firestore existing, which is now deprioritized, so this naturally comes later too.
- [ ] Replace/extend the current landing page with real navigation into the above as they land, keeping Palette A + typography consistent (`CLAUDE.md`).

## Explicitly out of scope for the PoC (see `docs/project-brief.md` §8-9)

- Non-transferable/soulbound tokens (would need a Plutus validator) — tokens are plain transferable native assets by design for now.
- Real satellite/geolocation verification, categories beyond trees planted, wallet claim/export for companies.

Note: the original assumption that DAO voting logic would stay fully off-chain (only the mint transaction going on-chain) has already been superseded in practice — a working on-chain 2-of-3 voting validator exists and was tested against the real UZH Cardano testnet (see "Just built" above). It just isn't wired into this app yet.
