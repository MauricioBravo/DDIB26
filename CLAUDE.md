# GreenProof

Blockchain-verified proof of corporate environmental action (trees planted, PoC scope), certified by an independent verifier and a rotating DAO jury, minted as a Cardano native token. Full spec: `docs/project-brief.md`.

@AGENTS.md

## Hard rules for this repo

- `docs/status.md` tracks current project status and the frontend/backend TODO list. Update it in the same commit whenever you finish, start, or change the scope of something — it must never go stale. Check it at the start of a session to know what's actually done vs. still pending.
- No emojis anywhere: UI copy, code, comments, commit messages, docs.
- Never add yourself (Claude) as a commit author or co-author. No `Co-Authored-By` trailer, no session links in commit messages. Plain, human-style commit messages only.
- Do not leave shadcn/ui on its default gray/zinc theme. Always use the Palette A tokens below plus the chosen typography — see "Design" section.
- All application code is TypeScript end to end (frontend, backend routes, minting script). No Python.

## Stack

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS
- **UI**: shadcn/ui, customized (Palette A + typography), Tailark blocks for landing/marketing sections
- **Auth**: Firebase Authentication
- **Database**: Firestore
- **Evidence photos**: Cloudinary (unsigned preset, jpg/jpeg/png only, 5MB max)
- **Blockchain**: Cardano Preprod testnet via Lucid Evolution + Blockfrost
- **Deploy target**: Oracle Cloud free-tier instance (ARM/aarch64, Santiago), Docker + docker compose, Nginx reverse proxy, Let's Encrypt/Certbot once a domain exists — see `docs/deploy.md`
- **CI/CD**: GitHub Actions, auto-deploy on push to `main`

## Design

Do not default to the generic "AI-made" shadcn look (cream/terracotta, black/acid-green, or thin-line newspaper layouts). Commit to a distinctive aesthetic before writing UI code — the `frontend-design` skill is installed in this repo for that purpose, use it for any new page or component.

Palette A (natural/earthy — selected, see `docs/project-brief.md` §15):

| Token | Hex | Use |
|---|---|---|
| `forest` | `#2E5339` | primary, headers, key actions |
| `olive` | `#6B8E23` | secondary highlights, links |
| `sage` | `#E8EFE0` | backgrounds, table headers |
| `sand` | `#C9A76B` | contrast accent, badges, CTAs |
| `charcoal` | `#2B2B2B` | body text |

Defined as CSS variables / Tailwind theme tokens in `src/app/globals.css` — use those tokens, not raw hex values, in components.

## Branch strategy

- `main` — protected, auto-deploys to production on every push. Never push directly.
- `dev` — integration branch, merge personal branches here first.
- `mauricio` and `timileyin` — one persistent personal branch per person. **If you are Claude Code working in this repo, check `git branch --show-current` and keep working on whichever of these two is currently checked out — do not switch to the other person's branch, and do not push directly to `dev` or `main`.** Rebase/merge from `dev` periodically to stay current; open a PR into `dev` when a piece of work is ready for review.
- Short-lived `feature/<name>-<short-desc>` branches off a personal branch are fine for a specific chunk of work, e.g. `feature/timileyin-evidence-upload`.

## Commands

```
npm run dev      # local dev server
npm run build    # production build
npm run lint     # eslint
```

With Docker (see `docker-compose.yml`):

```
docker compose up --build     # full containerized dev environment, hot reload via volume mount
```

## Deploy

Push to `main` triggers `.github/workflows/deploy.yml`: GitHub Actions SSHes into the production server with a dedicated deploy key (repo secrets `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`), pulls latest, runs `docker compose -f docker-compose.prod.yml up --build -d` on the server. See `docs/deploy.md` for server-side setup (Nginx, Certbot, first-time key install).

## Not built yet (do not assume these exist)

Firebase project, Cloudinary preset, Blockfrost/Lucid Evolution wiring, Firestore data model, and the actual company/verifier/jury flows are not implemented yet — current state is a hola-mundo landing page verifying the deploy pipeline end to end. Check `git log` / the current `src/` tree before assuming a feature exists.
