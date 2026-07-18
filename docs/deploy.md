# Deploy

Production target: self-hosted server, public IP, `ubuntu` user. GitHub Actions (`.github/workflows/deploy.yml`) syncs the repo and rebuilds the Docker container on every push to `main`.

## One-time server bootstrap

1. **SSH access for the deploy pipeline.** Two public keys go in `~/.ssh/authorized_keys` on the server: your own (so you can log in without a password) and a dedicated key generated for GitHub Actions (never reused elsewhere). Password auth stays enabled until this is confirmed working, then gets disabled.

2. **Install Docker + Compose plugin, rsync**:
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

Password authentication for `ubuntu` should be disabled (`PasswordAuthentication no` in `/etc/ssh/sshd_config`, then `sudo systemctl restart sshd`) once both public keys above are confirmed working — do this only after verifying `ssh ubuntu@<host>` works with a key, to avoid getting locked out.
