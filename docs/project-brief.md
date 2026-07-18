# GreenProof

Blockchain-verified environmental proof, without the blockchain complexity.
Deep Dive into Blockchain 2026, Final Group Project.

> Source of truth: this file is a markdown copy of `GreenProof_Project_Document-2.docx`, versioned in the repo so any Claude Code / teammate has it without needing the original file.

## 1. Elevator Pitch

GreenProof is a platform that lets companies prove their environmental actions, starting with trees planted, using blockchain-backed, tamper-proof evidence, without the company or the on-site verifier ever needing to touch a wallet, understand crypto, or interact with the blockchain directly.

Two humans upload photos. A decentralized jury validates them. The blockchain does the rest, silently.

## 2. The Problem

- Companies increasingly claim environmental actions for PR, ESG reports, or to avoid regulatory penalties.
- These claims are usually unverifiable, self-reported, and easy to fake — greenwashing.
- Existing certification systems rely on centralized authorities that can be pressured or make mistakes, with no public audit trail.
- Databases can be deleted, edited, or lost. There is no permanent, independent record.

## 3. The Solution — How It Works

Step by step flow:

1. **Company registration.** A company signs up on the platform. The backend automatically generates a Cardano wallet tied to their account, fully custodial and invisible to the user.
2. **Evidence submission.** The company uploads evidence of an action, e.g. a photo of planted trees plus GPS location.
3. **Independent verification.** A rotating independent verifier is assigned, visits the site in person, and uploads their own evidence.
4. **DAO jury review.** Three rotating jurors from the GreenProof DAO review both pieces of evidence and vote. If two out of three approve, the action is certified. If not, the process restarts with comments explaining the rejection.
5. **On-chain certification.** Upon approval, the system (not the company) mints a native token on Cardano to the company's wallet. The transaction metadata contains: company ID, action type, quantity, date, evidence hashes, verifier ID, jury result.
6. **Public dashboard.** Companies get a public profile showing verified achievements by category, badges, and rankings (e.g. "Top 3 Carbon Reducers 2026"), creating indirect competition between companies.

### Who touches the blockchain

| Actor | Touches blockchain |
|---|---|
| Company | No — uploads a photo through a normal web form |
| Independent verifier | No — uploads a photo through a normal web form |
| DAO jurors | Yes — vote through their own wallets |
| System / backend | Yes — mints the token once 2 of 3 approvals are reached |

Core design principle: adoption friction is removed for the end user, while the trust guarantee of the blockchain is preserved.

## 4. Why Cardano

- **Native token metadata**: Cardano allows attaching structured JSON metadata directly to a minting transaction, up to 16KB total, individual string fields capped at 64 bytes (longer text split into concatenated strings). The proof itself, not just a hash pointer, can live entirely on chain — even if the off-chain database is lost, the essential record survives permanently on the ledger.
- **Time-locked minting policies**: a policy that expires after a set date means no one, not even the GreenProof team, can mint or burn tokens under that policy afterward — the certification cannot be altered or duplicated retroactively.
- Fits Cardano Foundation funding priorities: RWA tokenization and sustainability-aligned use cases, including Project Catalyst's Sustainability track, aligned with the UN SDGs.

## 5. Governance — The DAO Layer

- Three jurors assigned per case, drawn from a rotating pool of DAO participants (minimum consensus 66%, three is representative but could be more).
- Two out of three must agree for an action to be certified.
- Verifiers rotate after every review — the same verifier cannot repeatedly inspect the same company, reducing collusion risk.
- Rejected evidence returns with jury comments; company or verifier can resubmit.

## 6. Legal and Regulatory Angle

- Research on greenwashing regulation in Nigeria, the EU, and international frameworks.
- Legal analysis of whether blockchain-based environmental certificates hold evidentiary value in audits, disputes, or regulatory filings (Blockchain Federal Argentina case, Hangzhou Internet Court case in China).
- Legal responsibilities/liability of jurors and verifiers.
- Comparative view: Nigeria, Switzerland, Argentina.

## 7. Funding and Sustainability Model

Non-profit oversight body, not a for-profit certifier:

- **Subscription-as-donation**: recurring membership fee structured as a donation to a registered non-profit, keeping certification neutral.
- **Volunteer verifiers**: on-site verifiers are volunteers from environmental orgs / ecology students.
- **Government grants**: for verifier travel/operational costs, as a non-partisan control body. Open question: whether government funding compromises perceived independence.

## 8. Scope of the Proof of Concept (2-week timeline)

- Single category only: trees planted.
- Simulated verifier role, played by one team member.
- Simulated DAO with three test wallets acting as jurors, simple approve/reject interface. Voting logic lives in the backend; only the final minting transaction goes on chain.
- Transferable tokens — deliberate, disclosed simplification (see §9).
- Testnet deployment: Cardano Preprod or similar.
- End-to-end demo: evidence upload → verifier upload → jury vote → token minted with metadata → dashboard updates live.

## 9. The Soulbound Token Decision

Cardano native tokens have no attached contract logic (simple ledger assets) — unlike ERC-721, transfers can't be blocked without a Plutus validator.

**Decision for the PoC**: build the token as a normal, transferable native asset. Faster to implement, doesn't compromise the core proof — the mint transaction itself (timestamp, metadata, destination wallet) is permanent and immutable regardless of what happens to the token afterward.

**Presentation note**: don't raise this during the main explanation — mention it briefly and confidently in strengths/limitations at the end. Suggested phrasing is in the full document; frame it as a deliberate, understood trade-off with a clear production path (Plutus validator), not a flaw.

## 10. Roadmap After the PoC

- Plutus validator to lock tokens at the recipient's address (true non-transferability).
- Expand beyond trees planted: emissions reduction, water usage, renewable energy installations.
- Formalize the DAO with an on-chain voting smart contract (currently simulated off-chain).
- Wallet claim feature for companies wanting direct blockchain access.
- Real satellite/geolocation verification tools.
- Partnerships with sustainability auditors / NGOs as an official verifier network.
- Apply for Cardano Project Catalyst (Sustainability track) / Cardano Accelerator Program.

## 11. Suggested Presentation Structure (10–12 min)

1. Hook (1 min) — the greenwashing problem.
2. Solution overview (2 min) — live walkthrough: upload → verify → vote → mint → dashboard.
3. Technical architecture (3 min) — Cardano metadata, time-locked minting, permanence guarantee.
4. Governance (2 min) — DAO jury model, rotation, corruption resistance.
5. Legal analysis (2 min, Ayanfeoluwa) — greenwashing regulation, evidentiary value, liability.
6. Strengths and limitations (1–2 min) — transferable token trade-off.
7. Roadmap and closing (1 min) — Catalyst, Accelerator Program.

## 12. One-Line Summary

GreenProof lets companies prove their environmental actions with blockchain-backed evidence, without needing to know anything about blockchain, verified by rotating independent inspectors and a decentralized jury, permanently recorded on Cardano.

## 13. Legal Comparative Analysis: Argentina, Nigeria, Switzerland

### Is blockchain evidence already accepted?

- **Argentina**: yes, with limits. Feb 2024, Court of Appeals in Civil and Commercial Matters of Morón accepted a timestamped document on Blockchain Federal Argentina as evidence — only the hash is on-chain, sufficient to prove the document wasn't altered after the hash was generated.
- **Nigeria**: yes, in principle. Evidence Act 2011 (amended 2023), Section 258, expanded definitions of "document" and "computer" to explicitly include blockchain/decentralized systems. No ruling yet on a case using blockchain evidence specifically, but the statutory basis exists.
- **Switzerland**: yes, under general principles — technology-neutral approach, free evaluation of evidence. DLT Act of 2021 regulates transfer of tokenized rights but doesn't directly address evidentiary admissibility of on-chain hashes.

### Greenwashing regulation — the most relevant finding

**Switzerland is the strongest case.** Since 1 Jan 2025, Article 3(1)(x) of the Federal Act against Unfair Competition (UWG, SR 241) makes it unlawful to make climate impact claims that cannot be substantiated with objective and verifiable evidence — burden of proof on the company. FOEN published an Enforcement Aid (March 2026) on what counts as objective/verifiable. **GreenProof is essentially a mechanism for generating exactly that evidence.**

- **Argentina**: no dedicated greenwashing law. Claims addressed via Consumer Protection Law (24.240), Fair Trading Law (22.802), constitutional right to a healthy environment (Art. 41).
- **Nigeria**: no dedicated greenwashing law. Open research question: whether the Federal Competition and Consumer Protection Commission has an applicable rule against misleading environmental claims.

### Further legal research needed

- Structuring a non-profit per jurisdiction (Verein / Asociación Civil or Fundación / Incorporated Trustees) — relevant to subscription-as-donation model.
- Data protection: NDPA 2023 (Nigeria), Law 25.326 (Argentina), FADP (Switzerland).
- Legal liability of volunteer verifiers approving evidence incorrectly / in bad faith.
- Conditions for accepting government funding without compromising independence.

## 14. Project Name Options

GreenProof, ProofRoot, Verdant, ChainCanopy, TrueGreen, Rootcert, EcoWitness.

## 15. Color Palette — **Palette A (selected), Natural and Earthy**

| Hex | Use |
|---|---|
| `#2E5339` | Deep forest green — primary color, headers and key actions |
| `#6B8E23` | Olive accent — secondary highlights and links |
| `#E8EFE0` | Pale sage — backgrounds and table headers |
| `#C9A76B` | Warm sand — contrast accent for badges and calls to action |
| `#2B2B2B` | Charcoal — body text |

(Palette B "Modern Tech Green" was the alternative — dark-mode-first, more "blockchain native" — not selected.)

## 16. Stack and Deployment Plan

Simple, lightweight, all TypeScript end-to-end (no Python) — scalable if the project continues after the course.

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS
- **UI components**: shadcn/ui as the base, with the Palette A colors and deliberately chosen typography — not the default gray/zinc theme (see design note below). Tailark for marketing/landing blocks, plain shadcn/ui for functional parts (forms, voting tables).
- **Auth**: Firebase Authentication
- **Database**: Firestore
- **Photos/evidence**: Cloudinary (Firebase Storage now requires a card, hence Cloudinary)
- **Blockchain**: Cardano Preprod testnet, Lucid Evolution (TS transaction/minting library) + Blockfrost (node provider)
- **Server process**: PM2 + Nginx reverse proxy + Let's Encrypt (HTTPS) — *in this repo, containerized instead: Docker + docker compose + Nginx + Certbot, same guarantees, easier for two people to run identically.*
- **CI/CD**: GitHub Actions, automatic deploy on push to `main`

### Design note (why not default shadcn)

Most AI tools (v0, Cursor, Bolt, Lovable) generate interfaces using shadcn/ui without customizing it — three visual styles repeat so often they're recognizable as "AI-made": cream background + terracotta accent, black background + acid green/red, or newspaper-style thin-line layouts. The fix isn't avoiding shadcn/ui (still the strongest accessible base) — it's not leaving it on the default theme. Palette A + intentional typography breaks away from the generic look.

### Step by step

1. Server setup (separate from any PoS validator machine): Node via nvm, Docker, Nginx, Certbot.
2. Repo/branch strategy: protected `main` (triggers deploy), `dev` integration branch, `feature/*` per person, peer-reviewed PRs before merging to `main`.
3. Create the project: `create-next-app` (TS, Tailwind, App Router), then init shadcn/ui.
4. Firebase: create project, enable Firestore + Authentication, service account credentials for backend.
5. Cloudinary: unsigned preset restricted to jpg/jpeg/png, 5MB max, disallowed custom public IDs.
6. Cardano: Blockfrost account (Preprod), install Lucid Evolution, custodial GreenProof wallet, minting script with JSON metadata.
7. End-to-end flow: company/verifier upload photo (Cloudinary) → case document in Firestore → juror dashboard simulates votes → 2/3 approval triggers Cardano minting script → tx hash saved back to Firestore → public dashboard reads from Firestore.
8. Nginx + domain + SSL: reverse proxy config + Certbot.
9. Automatic deploy (GitHub Actions): secrets for host/user/SSH key; workflow pulls, builds, restarts on every push to `main`.
10. Test full flow on testnet, prepare demo script.

## Proposed Title and Abstract

**Title**: GreenProof: Blockchain-Verified Certification of Corporate Environmental Action Without End-User Blockchain Interaction

**Abstract**: Corporate environmental claims are self-reported and rarely audited independently, which makes greenwashing cheap to commit and expensive to detect. Certification schemes meant to address this depend on a central certifier, which can be pressured or captured, and hold evidence in private databases that can be edited or lost. Neither leaves a permanent public audit trail. Swiss law now demands better. Article 3(1)(x) of the Federal Act against Unfair Competition (UWG, SR 241), in force since 1 January 2025, makes it an act of unfair competition for a company to make claims about the climate impact it causes that cannot be substantiated by objective and verifiable evidence. The onus of substantiation falls on the company making the claim. We propose GreenProof, a platform for generating exactly that evidence. A company uploads geotagged photographic evidence of an environmental action — trees planted, in this proof of concept — through an ordinary web form. An independent verifier, assigned by rotation, inspects the site and uploads separate evidence. Three jurors drawn from a rotating DAO pool review both submissions, and a two-of-three majority certifies the action. Only then does the backend mint a Cardano native token to a custodial wallet held for the company, which never handles a wallet or signs a transaction. The proof itself is carried in the transaction metadata: company identifier, action type, quantity, date, evidence hashes, verifier identifier, jury outcome. The minting policy is time-locked, so once it expires no party — the GreenProof team included — can mint under it, and the certification cannot be altered or duplicated retroactively. The record therefore survives loss of the off-chain database. Rotating verifiers and jurors removes the single point of corruption of a centralized certifier. The design keeps the trust guarantee on-chain while removing the adoption friction for the users whose claims it certifies.

**Potential platforms**: UZH Cardano / Cardano Preprod testnet, native tokens with on-chain JSON metadata and time-locked minting policies (Lucid Evolution + Blockfrost), with Next.js, Firestore, and Cloudinary off-chain.

## References

- Bundesgesetz gegen den unlauteren Wettbewerb (UWG) vom 19. Dezember 1986, SR 241, Art. 3 Abs. 1 lit. x — https://www.fedlex.admin.ch/eli/cc/1988/223_223_223/de
- Bundesamt für Umwelt (BAFU/FOEN), Vollzugshilfe zur Beurteilung von klimabezogenen Angaben im Sinne des UWG, UV-2561, published 2 March 2026 — https://www.bafu.admin.ch/de/vollzugshilfe-uwg
