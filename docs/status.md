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
- **Minting is now wired into the live app, not just a standalone script.** `castVote` (`src/lib/cases.ts`) calls a real `src/lib/mint.ts` module the moment a case crosses 2-of-3, building/signing/submitting a genuine transaction on the UZH testnet -- proven with a real TxID, see "Just built" below. Backend "system signer" wallet funded, no SSH to any UZH server. See `docs/uzh-network.md` for the network reference.
- Aiken 2-of-3 DAO voting contract source committed at `contracts/dao-validator/` (previously only existed outside the repo). Not yet wired into `/dao`.
- Landing page (`src/app/page.tsx`) has a "Build docket" section showing shipped vs. next-up work, and "How it works" was redesigned with a center spine connecting steps 01-06 in reading order. Company rankings (`/companies/rankings`) shipped by Timi, see "Just built" below.
- Vote and mint confirmations now show real block confirmation and a loading state in between, not just an immediate hash -- see "Just built" below.
- Docker: full containerized dev environment (`docker-compose.yml`) and multi-stage production build (`Dockerfile`, `docker-compose.prod.yml`).
- CI/CD: GitHub Actions (`.github/workflows/deploy.yml`) deploys to the Oracle Cloud instance on every push to `main`. See `docs/deploy.md`.
- Still not wired up: Firebase, Firestore, Cloudinary, company/verifier upload flow. Everything below is still to do.

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

## Who's doing what right now (2026-07-20)

To avoid two people (or their Claude Code sessions) building the same thing in parallel:

- **Mauricio, done today:** mint hook (backend items 1-2) and transaction-status/block-confirmation work (Frontend — transaction status, items 1-4) — see "Just built: mint hook" above. **Now starting:** the company evidence-submission form (Frontend — company, item 1 below) and the verifier dashboard + evidence upload (Frontend — verifier, items 1-2 below). **Don't start these from another branch without checking in first** — touches `src/lib/cases.ts`, new `src/app/company/`, new `src/app/verifier/`.
- **Timi:** company ranking/leaderboard — **done and merged** (PR #2, 2026-07-20), see "Just built: company rankings" below. Scope call: the CO2/recycled-material categories (beyond `project-brief.md` §8's "trees planted only") are being kept, not trimmed — confirmed by Mauricio 2026-07-20.
- **Timi, next task:** not yet assigned — the "verify on-chain" button (Frontend — transaction status, item 5) is the smallest remaining isolated item, or pick up the Cloudinary `auto` preset setup (Backend item 3) which unblocks Mauricio's evidence-upload work above.

Update this note (or delete it) once either piece lands, so it doesn't go stale.

## Just built: company rankings (2026-07-20, Timi)

- **`src/lib/companies.ts`** — the display strings were unsortable (`value: "12,000"`), so each company now carries `contributions: Record<ContributionTypeId, number>` (`trees`, `co2`, `recycled`) plus `employees`. Size is derived from `employees` via `sizeBracketOf()` against fixed `SIZE_BRACKET_THRESHOLDS` rather than stored, so the number and the bracket can't drift apart. Employee counts are approximate real-world figures, same illustrative-data basis as the rest of the file.
- **The three contribution types carry genuinely independent values**, not figures derived from one another — otherwise a CO2 board would just be the trees board in different units. Maersk leads on CO2 (shipping decarbonisation) while sitting last on trees; Unilever leads on recycled material; Patagonia leads both per-staff boards. All three raw boards have different winners, which is the point of having them.
- **Two orthogonal axes, not a flat list of leaderboards**: `CONTRIBUTION_TYPES` (what was certified) and `RANKING_BASES` (raw total vs per 1,000 staff). Three types times two bases gives six boards from two small registries, and it keeps the size-adjusted view sitting *alongside* the raw one rather than replacing it, as the task requires. A new action category is an append to `CONTRIBUTION_TYPES` plus a key on `contributions` — nothing in the page enumerates them by hand.
- **`rankCompanies(typeId, basis, filters)`** — filters by category/country/size, then sorts. Uses standard competition ranking (1, 2, 2, 4) so a future data change that produces a genuine tie can't silently render as 1, 2, 3, 4. Nothing ties in today's data.
- **`/companies/rankings`** (`src/app/companies/rankings/page.tsx` + `rank-seal.tsx`) — podium for the top 3 using the same struck-seal medallion language as the profile badges, olive laurel on the leader only; ledger-style rows for the rest, matching `/dao` and `/companies`. Ran through the `frontend-design` skill per `CLAUDE.md`.
- **Design thesis: rank is a function of the question asked.** The boards genuinely disagree — Patagonia is 4th on raw trees and 1st per 1,000 employees (3,000 staff vs IKEA's 231,000); Maersk is last on trees and 1st on CO2. Each row in the lower list shows its shift against the other basis, so the disagreement is visible rather than buried. This is the `project-brief.md` §3/§6 "indirect competition" deliverable, with the size-fairness caveat built into the UI instead of a footnote.
- **State lives in the URL** (`?type=&basis=&category=&country=&size=`), so the page stays a server component, boards are shareable/linkable, and it works with JavaScript disabled. Unrecognised values are dropped rather than trusted, so a hand-edited query string can't reach `getContributionType` (which throws) or blank the board.
- `searchParams` is a **Promise** in Next 16 and is awaited — the Next 14 synchronous form silently breaks. Confirmed against `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md` per `AGENTS.md`.
- **Item 5 resolved: the rankings live alongside `/companies`, not replacing it.** The directory stays the plain A-Z-style list of who is certified; the rankings answer a different question (who leads, on which measure). `/companies` now links out to it and the rankings link back. Deliberately **not** linked from the landing page (`src/app/page.tsx`) — that file is outside this task's file scope and Mauricio has just redesigned it, so adding the nav entry there is left to him to avoid a collision.
- Verified: `npx tsc --noEmit` and `npm run lint` clean. Against the running dev server: all six type/basis boards return distinct orderings, all three filters, the empty-result state, and malformed query strings (`?type=NONSENSE`, `?basis=zzz`, `?country=Atlantis`) — all 200, falling back to defaults rather than throwing.
- Not yet verified visually beyond the rendered HTML: podium layout on desktop/mobile has not been screenshotted.
- **Scope note:** adding CO2 and recycled-material categories goes beyond `project-brief.md` §8 ("single category only: trees planted"). Done deliberately because the assigned task text asks for per-type rankings explicitly, so the task supersedes the older brief here. Flagging it rather than burying it — if the group wants §8 held to strictly, the extra two types can be dropped by deleting their entries from `CONTRIBUTION_TYPES` and the matching `contributions` keys, with no other code change.

## Just built: mint hook, block confirmation, loading states (2026-07-20)

- **`src/lib/blockchain-provider.ts`** (new) — the Yaci Store + Blockfrost-fallback duck-typed provider, extracted from `scripts/mint-poc.mjs` into a shared module so both minting and tx-status polling use the same connection. Also exports `getTxConfirmation(txHash)`, a cheap check against `GET /txs/{hash}` used to poll "has this landed in a block yet." Cast to `IFetcher & ISubmitter` with a comment explaining why — the object only implements the handful of methods this app actually calls (matching what already worked at runtime in the untyped `.mjs` script), not the full interface.
- **`src/lib/mint.ts`** (new) — `mintCertificationToken(input)`, the real product code extracted from `scripts/mint-poc.mjs`: builds a time-locked native policy, mints one token with CIP-25 metadata for the given case, submits it, returns `{ txHash, policyId }`. Recipient is still the shared test company address (`docs/uzh-network.md`) — real per-company custodial wallets are backend item 7 below, still deprioritized.
- **`castVote` (`src/lib/cases.ts`) now triggers a real mint automatically** the moment a case first crosses 2-of-3 (guarded so it only fires once, not on every subsequent vote call). Wrapped in try/catch: a mint failure sets `mintStatus: "failed"` with `mintError` but does **not** undo the certification or throw out of `castVote` — same lesson as the earlier vote-panel bug (a downstream failure must never hide an upstream success). `Case` gained `mintStatus`/`mintTxHash`/`mintPolicyId`/`mintError` fields. `castVote` and `submitVote` (`src/app/dao/actions.ts`) are now `async` to accommodate the real network call.
- **Verified with a real transaction, not just a passing build**: a throwaway script called `castVote` directly (bypassing the need for a real Lace wallet to drive two votes through the browser) on the seeded `case-001` (Nestle) — TxID `1745cc3d08b8f36506d8b69e424de639419069bd0b377a47aa13b9ea3ac9a0e9`, policy `b5a9d49d4c0b55c2b18c850834918e4706d09ff36041aa0499402fe4`. Independently re-checked with direct `curl` against the Yaci Store API (not trusted from the script's own output): the metadata matches the case exactly (company, action, quantity, verifier, jury result) and the token appears at the destination address. Script deleted after the check, not part of the repo.
- **`src/components/tx-status.tsx`** (new) — reusable phase indicator (building → signing → submitting → confirming → confirmed/error) with a pulsing dot for in-flight phases, shared between the vote and mint flows so both tell a consistent story.
- **Vote confirmation upgraded** (`vote-panel.tsx`): after `wallet.submitTx` returns a hash, the UI now polls `checkTxConfirmation` (a new Server Action wrapping `getTxConfirmation`) every 4s for up to ~1 minute, showing a "waiting for block confirmation" loading state, then the actual block height once found — previously the hash appeared immediately with no confirmation step at all. The signer's wallet address is now shown alongside the hash and block once confirmed.
- **Mint confirmation surfaced in the same panel**: once `caseData.mintStatus` appears (from any vote call — the real one or one of the two simulated ones, whichever happens to be the certifying vote), a "Certification token" block renders using the same `TxStatus` component and the same block-confirmation polling, showing policy ID, TxID, and block once confirmed. A failed mint shows the error without implying the jury decision itself was affected.
- Verified: `npm run build` and `npm run lint` clean; case detail pages (`/dao`, `/dao/[caseId]`) load and render correctly with no regressions to the existing pending-case view.

### Bug found and fixed same day: mint was blocking the certifying vote's response

Mauricio caught this from real usage, not a code review: the vote after his own appeared with no visible delay and no loading bar, then an error (or the mint result) just "popped in" all at once. Root cause: the first version of the mint hook above had `castVote` **await** the entire real mint (`await mintCertificationToken(...)`) before returning. Since a real mint takes several seconds (network round-trips to build/sign/submit), that made the certifying vote's `submitVote` Server Action call itself take just as long, with **zero client-visible state in between** — the vote and the full mint outcome (success or failure) landed in the UI at the same instant, regardless of `SIMULATED_VOTE_DELAY_MS`.

Fixed: the mint call in `castVote` is now a fire-and-forget `.then()/.catch()` instead of `await` — it updates the shared in-memory `Case` object once it resolves, but `castVote` itself returns almost immediately (measured: ~6ms, down from however long the real mint took). A new Server Action, `fetchCaseSnapshot` (`src/app/dao/actions.ts`), lets `vote-panel.tsx` poll every 3s while `mintStatus === "pending"`, now rendering a genuine "Minting certification token..." loading state (`TxStatus`'s new `"minting"` phase) for the whole real duration instead of nothing. This is safe because the app runs as a persistent Node process (Docker on Oracle Cloud, not a serverless function that could be torn down mid-background-task) — see the comment in `src/lib/cases.ts`.

Also fixed a related render bug introduced by the same original code: the "Certification token" block checked `mintStatus === "minted" ? <TxStatus/> : <p>Minting failed...</p>` — meaning while `mintStatus` was genuinely `"pending"` (the normal, expected in-between state), it would have incorrectly rendered "Minting failed: unknown error" instead of a loading state. Fixed to branch on `"failed"` explicitly instead.

Verified with fresh timing measurements (not just re-reading the diff): a direct `castVote` call on `case-002` (Unilever) resolved in 6ms even though it triggered certification; the background mint completed in ~4 seconds (TxID `797af7d7fe66f9595f1776977499870e09496b0f6f8c1da552ec322ec1447038`), independently confirmed against the chain with `scripts/greenproof_tx_lookup.py` and a direct metadata query.

On the "block appears instantly" question Mauricio raised (worried it might be read from somewhere suspect): checked with real numbers -- the vote tx above landed in a block only ~4-5 seconds after submission (submit ~00:12:24, block\_time 00:12:29). This testnet is lightly loaded with a 1-second `slotLength`, so fast confirmation is a genuine property of this specific network, not a sign the app is faking or reading stale data -- the `pollForBlock`/`pollForMintResolution` loops in `vote-panel.tsx` only start counting after the real submit, and the first poll fires 3-4s later, which is often enough time for this network to have already produced the confirming block.

## TODO, in priority order (2026-07-20)

Reordered from a flat list to reflect what actually blocks a working end-to-end PoC demo vs. what's nice-to-have. Login/auth and company registration are explicitly deprioritized (Mauricio's call, 2026-07-20) — the existing simulated `/login` is good enough to keep demoing with for now. Within each group, most important first.

### Backend

1. [x] **Hook the proven mint into `castVote` on 2-of-3 approval.** Done — real TxID, see "Just built: mint hook" above.
   Files: `src/lib/mint.ts`, `src/lib/blockchain-provider.ts`, `src/lib/cases.ts` (`castVote`), `src/app/dao/actions.ts`.
2. [x] Record the resulting mint TxID on the case. Done — `mintStatus`/`mintTxHash`/`mintPolicyId`/`mintError` on `Case`.
   Files: `src/lib/cases.ts`.
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

1. [x] Mint confirmation, with policy ID, TxID, and block — done, surfaced inline in `vote-panel.tsx`'s "Certification token" section (not a separate screen under `/company`, since that route doesn't exist yet; will move there once the company cases view is built).
   Files: `src/app/dao/[caseId]/vote-panel.tsx`.
2. [x] Reusable transaction-status component, done.
   Files: `src/components/tx-status.tsx`.
3. [x] Vote: confirms block inclusion via polling (`checkTxConfirmation` Server Action, `src/lib/blockchain-provider.ts`), done.
   Files: `src/app/dao/[caseId]/vote-panel.tsx`, `src/app/dao/actions.ts`.
4. [x] Vote: signer's wallet address shown in the confirmation block, done.
   Files: same file as above.
5. "Verify on-chain" button that re-queries the API directly and shows the raw response — reinforces the "don't just trust our frontend" story, but not required for a working demo. Still open.
   Files: new `src/lib/verify-onchain.ts` (endpoints documented in `docs/uzh-network.md`), used in `vote-panel.tsx` and the mint confirmation above.

### Frontend — company ranking

Assigned to Timi (see "Who's doing what" above). First pass landed 2026-07-20 — see "Just built: company rankings" above for detail.

1. [x] Add real numeric fields to `src/lib/companies.ts` — done: `treesPlanted`, `carbonOffsetTonnes`, `employees`, plus `sizeBracketOf()` deriving small/medium/large from the employee count rather than storing it separately.
   Files: `src/lib/companies.ts`.
2. [x] Ranking view with a podium treatment for top 1-3 and a plain list for the rest — done at `/companies/rankings`, struck-seal podium plus ledger rows, run through the `frontend-design` skill.
   Files: `src/app/companies/rankings/page.tsx`, `src/app/companies/rankings/rank-seal.tsx`.
3. [x] Multiple ways to sort/rank, not just one overall leaderboard:
   - [x] By total contribution (raw total for the selected action).
   - [x] By contribution type as separate rankings — trees planted, CO2 reduced, and recycled material each get their own board (`CONTRIBUTION_TYPES`), with genuinely independent values so the three raw boards have three different winners (IKEA / Maersk / Unilever). Not a filter on one combined score.
   - [x] By company size, normalized — per 1,000 employees, available for every type, sitting alongside the raw board rather than replacing it (`RANKING_BASES`). The two genuinely disagree (Patagonia 4th on raw trees, 1st per-capita), and each row shows its shift against the other basis.
   Files: same files as item 2, plus the size field from item 1.
4. [x] Filters by category and country — done, plus a size-bracket filter. All three are URL params, so filtered boards are shareable and the page needs no client JS.
   Files: same files as above.
5. [x] Decide whether this replaces `/companies` or lives alongside it. **Alongside** — the directory stays the certified-companies list, the rankings answer the separate "who leads" question; `/companies` links out to the rankings and back. Landing-page nav entry deliberately left to Mauricio (his file, just redesigned) rather than edited from this branch.
   Files: `src/app/companies/page.tsx`.

### Cross-cutting, not yet placed above

- [ ] Wire `/companies` (whichever form it ends up in) to real case/Firestore data instead of the static illustrative dataset — depends on Firestore existing, which is now deprioritized, so this naturally comes later too.
- [ ] Replace/extend the current landing page with real navigation into the above as they land, keeping Palette A + typography consistent (`CLAUDE.md`).

## Explicitly out of scope for the PoC (see `docs/project-brief.md` §8-9)

- Non-transferable/soulbound tokens (would need a Plutus validator) — tokens are plain transferable native assets by design for now.
- Real satellite/geolocation verification, categories beyond trees planted, wallet claim/export for companies.

Note: the original assumption that DAO voting logic would stay fully off-chain (only the mint transaction going on-chain) has already been superseded in practice — a working on-chain 2-of-3 voting validator exists and was tested against the real UZH Cardano testnet (see "Just built" above). It just isn't wired into this app yet.
