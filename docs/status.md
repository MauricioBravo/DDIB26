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
- [ ] Jury/DAO voting interface: simulated with three test wallets, simple approve/reject + comment form per case, shows both pieces of evidence side by side.
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

## Explicitly out of scope for the PoC (see `docs/project-brief.md` §8-9)

- Non-transferable/soulbound tokens (would need a Plutus validator) — tokens are plain transferable native assets by design for now.
- On-chain DAO voting smart contract — jury voting logic lives off-chain/in Firestore; only the mint transaction goes on chain.
- Real satellite/geolocation verification, categories beyond trees planted, wallet claim/export for companies.
<!-- test -->
