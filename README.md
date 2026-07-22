# GreenProof

Blockchain-verified proof of corporate environmental action, starting with
trees planted. A company uploads a photo, an independent verifier confirms
it in person, a rotating DAO jury reviews both, and once two of three
jurors approve, the system mints a Cardano native token to the company's
wallet, silently, without the company ever touching a wallet or a private
key. Deep Dive into Blockchain 2026, final group project.

Full original concept (problem statement, governance model, legal
research, funding model): `docs/project-brief.md`. This file is the
practical entry point: what the idea is, what's actually built and proven
today, and where to look next.

## The problem

Companies claim environmental actions for PR or ESG reporting, and those
claims are usually self-reported and unverifiable. Since 1 January 2025,
Swiss law (UWG Art. 3(1)(x)) puts the burden of proof on the company
making the claim. GreenProof is a mechanism for generating exactly that
evidence: independently verified, tamper-proof, and permanently recorded.

## How it's meant to work

1. **Company registration** — backend generates a custodial Cardano wallet
   behind the scenes, invisible to the company.
2. **Evidence submission** — company uploads a photo (and, going forward,
   more than one file plus a document) of the action, plus GPS location.
3. **Independent verification** — a rotating verifier visits the site in
   person and uploads separate evidence.
4. **DAO jury review** — three rotating jurors vote; two of three
   approvals certify the action, otherwise it returns with comments.
5. **On-chain certification** — the system (not the company) mints a
   Cardano native token to the company's wallet, with metadata carrying
   the proof: action, quantity, date, evidence, jury result.
6. **Public dashboard** — verified achievements, badges, and rankings,
   creating indirect competition between companies.

Only the DAO jurors and the backend ever touch the blockchain directly.
Companies and verifiers just use ordinary web forms.

## What's real today vs. still pending (2026-07-22)

This is a working proof of concept in progress, not a finished product.
For the live, line-by-line status and the full priority-ordered TODO (with
exactly which files each remaining task touches), see `docs/status.md` —
this section is just the summary.

**Proven real, on a dedicated Cardano testnet (not simulated):**
- DAO jury voting: a connected wallet signs and submits a real, fee-paying
  transaction (`/dao`, `/dao/[caseId]`), independently verified against the
  chain, not just displayed by the app.
- Native token minting: the backend builds, signs, and submits a real mint
  transaction automatically the moment a case crosses 2 of 3 approvals, no
  manual step — see `docs/uzh-network.md` for the endpoints and TxIDs.
- Evidence uploads: companies and verifiers attach real photos and PDFs
  through Cloudinary (`/company`, `/verifier`), visible on the juror's case
  view and independently on a company's public profile.
- A "verify on-chain" control re-queries the chain's own indexer directly
  and renders its untouched response, on both the vote and the mint.
- Public company profiles and rankings (`/companies`, `/companies/[slug]`,
  `/companies/rankings`), including one company whose certification badge
  is fetched live from the chain rather than shown as static data.

**Still simulated or missing (see `docs/status.md` for the ordered plan):**
- The 2-of-3 quorum today is one real vote plus two simulated votes; a
  tested Aiken smart-contract validator exists (`contracts/dao-validator/`)
  but isn't wired in yet.
- Login is a simulated role switch with hardcoded credentials, no real
  Firebase Authentication yet — deliberately deprioritized for now.
- Verifier/jury rotation is a deliberate non-goal for this proof of
  concept, not an oversight — see `docs/status.md` for the reasoning.

## Stack

Next.js (App Router) + TypeScript + Tailwind, shadcn/ui with a custom
palette and typography (never the default theme, see `CLAUDE.md`), Mesh
SDK for all Cardano interaction against a dedicated UZH Cardano testnet
(not Blockfrost/Preprod as originally planned — see `docs/uzh-network.md`
for why and how), Cloudinary for evidence uploads. Firebase/Firestore
planned but not yet wired up, see `docs/status.md`.

## Running this locally

```
npm run dev      # local dev server
npm run build     # production build
npm run lint      # eslint
```

With Docker (see `docker-compose.yml`):

```
docker compose up --build
```

Both work out of the box with no setup: browsing, login, the voting UI,
and rankings all run. Only real blockchain minting and evidence file
uploads need credentials — without them, those two features show a clear
"not connected" message instead of failing, and the running server prints
a visible reminder of the same thing on startup.

To see every feature working: copy `.env.example` to `.env.local` and ask
a maintainer for real values, or just visit the live deployment at
`http://161.153.217.84/`.

## Docs map

- `docs/project-brief.md` — full original concept: problem, solution,
  governance, legal research, funding model.
- `docs/status.md` — living status doc and priority-ordered TODO, updated
  every time something finishes, starts, or changes scope. Read this
  first when picking up work.
- `docs/uzh-network.md` — practical Cardano testnet reference: API
  endpoints, known addresses, TxIDs, Mesh SDK gotchas.
- `docs/deploy.md` — production server setup (Oracle Cloud, Docker, Nginx,
  CI/CD).
- `contracts/dao-validator/` — the Aiken 2-of-3 DAO voting smart contract
  source, tested on-chain, not yet wired into the app.
