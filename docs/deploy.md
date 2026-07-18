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
