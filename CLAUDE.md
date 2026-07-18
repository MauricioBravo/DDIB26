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

Do not default to the generic "AI-made" shadcn look (cream/terracotta, black/acid-green, or thin-line newspaper layouts). Before writing UI code for any new page or non-trivial component, explicitly invoke the `frontend-design` skill (it's enabled for this project via `.claude/settings.json` — do not skip it or rely on it auto-triggering, invoke it directly) and follow its process: commit to a distinctive aesthetic on top of the Palette A tokens and typography below, don't just settle for the first idea.

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

- `main` — protected, auto-deploys to production on every push. Only ever updated by merging from `dev` (PR or fast-forward after review), never a direct push of new work.
- `dev` — integration branch, personal branches merge here first.
- `mauricio` and `timileyin` — one persistent personal branch per person. **If you are Claude Code working in this repo, check `git branch --show-current` and keep working on whichever of these two is currently checked out — do not switch to the other person's branch.** Rebase/merge from `dev` periodically to stay current; open a PR into `dev` when a piece of work is ready for review.
- Short-lived `feature/<name>-<short-desc>` branches off a personal branch are fine for a specific chunk of work, e.g. `feature/timileyin-evidence-upload`.

### Sync safety — before pushing or merging anywhere other than your own branch

The two of you work in parallel and must not clobber each other's in-progress work, and a clean git merge is not the same thing as a safe one — evaluate every merge, don't rubber-stamp it just because git didn't report a conflict.

1. `git fetch origin` first — never assume your local view of another branch is current.
2. Check divergence before touching anything: `git log --oneline <target>..HEAD` (your new work) and `git log --oneline HEAD..origin/<target>` (anything already there that you don't have). If the second one is non-empty, there's independent work you haven't seen — don't fast-forward/force through it.
3. Actually read the diff of what you're about to bring in (`git diff <target>...<source>`), especially for shared files that both of you touch: `CLAUDE.md`, `docs/status.md`, `package.json`/`package-lock.json`, shared components/lib code. A textually clean merge can still be a *semantic* collision — e.g. both of you edited different sections of `docs/status.md` and it merges fine but now has contradictory or duplicate entries, or someone changed a shared component's props while the other added a new call site elsewhere. If something looks off, stop and ask rather than merging through it.
4. After merging, run `npm run build` and `npm run lint` on the result before pushing — a merge that compiles for each side separately can still break once combined.
5. Only fast-forward/merge into `dev` or the other person's branch when it's a clean fast-forward *and* the diff review above didn't raise anything. If it isn't clean, do **not** force it through — leave that branch alone and let its owner merge/rebase it themselves, or resolve it together.
6. Never force-push (`--force`/`--force-with-lease`) to `dev`, `main`, or either personal branch, under any circumstance.

Concretely: if Timileyin has unrelated work in progress on `timileyin` that doesn't overlap with what you just built, push your own branch and `dev` as usual, but leave `timileyin` untouched until he's ready to merge `dev` into it himself.

### Promoting `dev` to `main`

This triggers a production deploy, so treat it deliberately, not as a rubber-stamp of "no conflicts":

1. Run the sync-safety checklist above first — no unseen divergence, diff reviewed, build/lint clean on `dev`.
2. Confirm `docs/status.md` already reflects whatever is being promoted (it should have been updated in the commit that made the change, per the hard rule above).
3. If all of that checks out, fast-forwarding `main` to `dev` and pushing is fine without asking permission for every single promotion — but say clearly what's being promoted and why it's safe (e.g. "no divergence, build/lint clean, status doc up to date").
4. If anything is uncertain — a failing build, an unreviewed diff, unclear scope of what changed — stop and flag it instead of pushing to `main`.

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
