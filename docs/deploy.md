# Deploy

Production target: Oracle Cloud (OCI) Always Free compute instance, `sa-santiago-1` region, `VM.Standard.A1.Flex` shape (**aarch64/ARM**, not x86 — matters for any base image you pin manually, though official Docker images like `node:*-alpine` are multi-arch and just work). Public IP: see GitHub secret `SSH_HOST`. `ubuntu` user. GitHub Actions (`.github/workflows/deploy.yml`) syncs the repo and rebuilds the Docker container on every push to `main`.

## One-time server bootstrap

1. **SSH access for the deploy pipeline.** Two public keys go in `~/.ssh/authorized_keys` on the server: your own (so you can log in without a password) and a dedicated key generated for GitHub Actions (never reused elsewhere).

2. **Install Docker + Compose plugin, rsync** (the Ubuntu Minimal image OCI ships does *not* include `rsync` — install it explicitly or the "Sync source to server" workflow step fails with `rsync: command not found`):
   ```
   sudo apt update
   sudo apt install -y ca-certificates curl rsync
   sudo install -m 0755 -d /etc/apt/keyrings
   sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
   sudo chmod a+r /etc/apt/keyrings/docker.asc
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   sudo apt update
   sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
   sudo usermod -aG docker ubuntu
   ```

3. **Create the deploy directory** that GitHub Actions will rsync into:
   ```
   mkdir -p ~/greenproof
   ```

4. **Install Nginx** as the reverse proxy in front of the container:
   ```
   sudo apt install -y nginx
   ```
   `/etc/nginx/sites-available/greenproof`:
   ```
   server {
       listen 80;
       server_name _;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
   ```
   sudo ln -s /etc/nginx/sites-available/greenproof /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

5. **HTTPS (Certbot)** requires a domain name pointed at the server's IP — Let's Encrypt does not issue certificates for bare IPs. Skipped for the hola-mundo phase (served over plain HTTP on port 80). Once a domain exists:
   ```
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.example
   ```

6. **Open the OCI Security List** (VCN -> the VCN actually attached to the instance, check on the instance's Details page -> Security Lists -> Default Security List): Add Ingress Rules for `0.0.0.0/0`, TCP, destination port `80`, and again for `443`. This is a *network*-level firewall separate from anything on the instance itself.

7. **Open the instance's local `iptables`** — this is the step that's easy to miss. OCI's Ubuntu images ship an `iptables` ruleset that explicitly `ACCEPT`s only `NEW` TCP on port 22 and `REJECT`s everything else (`icmp-host-prohibited`), *independent of the Security List above* — both layers must allow the port, or you'll see `Connection refused` from outside even though the Security List looks correct and Nginx is listening fine locally. Fix:
   ```
   sudo iptables -I INPUT 5 -p tcp -m state --state NEW -m tcp --dport 80 -j ACCEPT
   sudo iptables -I INPUT 6 -p tcp -m state --state NEW -m tcp --dport 443 -j ACCEPT
   sudo iptables -L INPUT -n -v --line-numbers   # confirm the new rules sit before the REJECT line
   sudo netfilter-persistent save                 # persist across reboots (iptables-persistent is preinstalled)
   ```

## Server-side secrets and build args (`.env` on the server)

Two separate mechanisms both read from one `${DEPLOY_PATH}/.env` file on the server (not committed, same treatment as `.env.local`):

- **Build args** — `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` / `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` are `NEXT_PUBLIC_*` vars, which Next.js inlines into the client bundle at `next build` time, not at container runtime. `docker-compose.prod.yml`'s `build.args` sources them via `${...}` substitution, which Docker Compose auto-loads from a `.env` file next to the compose file.
- **Runtime env** — `SYSTEM_SIGNER_MNEMONIC` is read at request time by `src/lib/mint.ts` via `process.env`, so it needs to reach the *running container*, not just the build. `docker-compose.prod.yml`'s `env_file: [{path: .env, required: false}]` injects everything in the same `.env` file into the container at startup. `required: false` so a server that hasn't created this file yet still deploys (mint just keeps failing with a clear error) instead of the whole `docker compose up` command erroring out and blocking every future deploy.

Contents of `${DEPLOY_PATH}/.env` on the server:

```
SYSTEM_SIGNER_MNEMONIC=the real 24-word mnemonic
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-unsigned-preset-name
```

**Real incident, 2026-07-21/22**: this file was created once via `scp`, but the very next push to `main` silently deleted it — the "Sync source to server" step below runs `rsync --delete`, which removes anything on the server not present in the git checkout, and `.env` is intentionally gitignored so it never exists in that checkout. Fixed by adding `--exclude '.env'` to that rsync command in `.github/workflows/deploy.yml`. **Any file placed directly on the server outside of git must be added to that exclude list, or it gets wiped on the next deploy** — this bit real production minting on the first end-to-end test through the actual live app, not just a theoretical risk.

Once `.env` exists (and survives deploys, per the fix above), redeploy: push to `main`, or manually re-run `docker compose -f docker-compose.prod.yml up --build -d` on the server. Verified locally (2026-07-21) that the build-arg plumbing itself works: building with dummy values and grepping the resulting image's `.next/static/chunks/` confirmed the dummy string lands in the compiled client JS, not just that the build succeeds.

## GitHub repository secrets

Set these under `Settings -> Secrets and variables -> Actions` on `MauricioBravo/DDIB26`:

| Secret | Value |
|---|---|
| `SSH_HOST` | server public IP |
| `SSH_USER` | `ubuntu` |
| `SSH_PRIVATE_KEY` | private half of the dedicated deploy keypair (never the personal one) |
| `DEPLOY_PATH` | `/home/ubuntu/greenproof` |

## What happens on push to main

1. GitHub Actions checks out the repo.
2. `rsync`s the working tree (excluding `.git`, `node_modules`, `.next`) to `DEPLOY_PATH` on the server.
3. SSHes in and runs `docker compose -f docker-compose.prod.yml up --build -d --remove-orphans`, which rebuilds the production image (multi-stage `Dockerfile`, Next.js standalone output) and restarts the container on port 3000 behind Nginx.

## Security note

The OCI instance is key-only from creation (no password authentication configured for `ubuntu`), so there's nothing to disable here. If this ever moves to a server that does have password auth enabled, disable it (`PasswordAuthentication no` in `/etc/ssh/sshd_config`, then `sudo systemctl restart ssh`) only after confirming key-based login works, to avoid getting locked out.
