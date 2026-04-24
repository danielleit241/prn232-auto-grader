# Manual Deploy: EC2 + Docker Compose + Cloudflare

Deploy production manually to domain `prn232.verendar.vn` using:
- EC2 (Amazon Linux 2023)
- Docker Compose
- Cloudflare (DNS + proxy **or** [Zero Trust Tunnel](#22-cloudflare-zero-trust-tunnel))

## 1) Prepare EC2

### 1.1 Security Group inbound
- `22` (SSH) from your IP

**If traffic hits EC2 directly** (orange-cloud proxied `A` record to the instance public IP):
- `80` (HTTP) and `443` (HTTPS) from `0.0.0.0/0` (or from Cloudflare IP ranges only if you use DNS-only + firewall rules elsewhere).

**If you use a [Cloudflare Tunnel](#22-cloudflare-zero-trust-tunnel)** (Zero Trust): the edge talks to Cloudflare over **outbound** HTTPS; you do **not** need `80`/`443` open to the public internet on EC2. Keep outbound `443` allowed (default). Optionally open `80`/`443` only from your IP for local debugging.

Do not expose DB ports publicly in production unless you really need them.

### 1.2 Install Docker (Amazon Linux 2023)

AL2023 ships Docker in the default repos (`dnf`). The Compose v2 CLI plugin is **not** in those repos as `docker-compose-plugin`, so install the plugin binary once (matches the `docker compose` commands in this guide).

```bash
sudo dnf update -y
sudo dnf install -y docker
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
```

Install Docker Compose v2 plugin (required for `docker compose -f ...`):

```bash
sudo mkdir -p /usr/libexec/docker/cli-plugins
sudo curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" \
  -o /usr/libexec/docker/cli-plugins/docker-compose
sudo chmod +x /usr/libexec/docker/cli-plugins/docker-compose
```

On the stock Amazon Linux AMI the SSH user is usually `ec2-user`; if you use another account, replace `ec2-user` in `usermod` with that username.

Log out/in again (or open a new SSH session), then verify:

```bash
docker --version
docker compose version
```

## 2) Cloudflare setup

Pick **one** public path (classic proxy **or** Zero Trust Tunnel). Same hostname `prn232.verendar.vn` and same `.env` / `NEXT_PUBLIC_*` URLs either way.

### 2.1 Classic: DNS + orange cloud (no Zero Trust Tunnel)

In Cloudflare DNS for `verendar.vn`:
- Type: `A`
- Name: `prn232`
- IPv4: `<YOUR_EC2_PUBLIC_IP>`
- Proxy status: Proxied (orange cloud)

In SSL/TLS (zone):
- Set mode to `Full` or `Full (strict)` (recommended).

### 2.2 Cloudflare Zero Trust Tunnel

Recommended when you want a **private origin**: the app stays on your domain **without** opening inbound `80`/`443` on EC2 to the world. Traffic: Internet → Cloudflare edge → Tunnel → `cloudflared` on EC2 → your reverse proxy / containers on localhost.

**Prerequisites:** Cloudflare account with **Zero Trust** enabled (dashboard: [one.dash.cloudflare.com](https://one.dash.cloudflare.com/)), and the zone `verendar.vn` on Cloudflare.

**Install `cloudflared` on EC2 (Amazon Linux 2023)** — same for both paths below:

```bash
ARCH=$(uname -m)
case "$ARCH" in
  x86_64) CF_RPM=x86_64 ;;
  aarch64) CF_RPM=aarch64 ;;
  *) echo "Unsupported arch: $ARCH"; exit 1 ;;
esac
curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${CF_RPM}.rpm" -o /tmp/cloudflared.rpm
sudo dnf install -y /tmp/cloudflared.rpm
cloudflared --version
```

#### Path A — Dashboard + install token (quick)

1. **Zero Trust → Networks → Tunnels → Create a tunnel** — name it (e.g. `prn232-ec2`), copy the install command (contains the **token**, not the tunnel ID). Do not commit the token.

2. **Install the service:**

```bash
sudo cloudflared service install <PASTE_TUNNEL_TOKEN_HERE>
sudo systemctl enable --now cloudflared
sudo systemctl status cloudflared
```

3. In the dashboard: tunnel → **Public Hostname** — map `prn232.verendar.vn` to HTTP origin, e.g. `http://127.0.0.1:80` (same as your reverse proxy in section 6). Remove a conflicting old `A` record to the EC2 public IP if needed.

#### Path B — CLI only (named tunnel, no dashboard token)

You need **`cert.pem`** from `cloudflared tunnel login` (origin cert). `login` opens a browser, so on a **headless** EC2 run it **once on any machine with a browser** (same Cloudflare account), then copy the cert to EC2:

```bash
# on your laptop, after: cloudflared tunnel login
mkdir -p ~/.cloudflared   # on EC2 first, if needed
scp ~/.cloudflared/cert.pem ec2-user@13.212.116.78:~/.cloudflared/cert.pem
```

On EC2:

```bash
mkdir -p ~/.cloudflared
cloudflared tunnel create prn232-ec2
```

Note the **tunnel UUID** and credentials path from the output (typically `~/.cloudflared/<UUID>.json`).

Create the DNS **CNAME** via CLI (replaces the dashboard “Public hostname” DNS step):

```bash
cloudflared tunnel route dns prn232-ec2 prn232.verendar.vn
# if the hostname already exists and you must replace it:
# cloudflared tunnel route dns --overwrite-dns prn232-ec2 prn232.verendar.vn
```

Create `/etc/cloudflared/config.yml` with your real UUID and the same origin port as section 6 (example uses `80`):

```yaml
tunnel: 79e5046e-105b-4c07-9c98-370462e64906
credentials-file: /etc/cloudflared/79e5046e-105b-4c07-9c98-370462e64906.json
ingress:
  - hostname: prn232.verendar.vn
    service: http://127.0.0.1:80
  - service: http_status:404
```

```bash
sudo mkdir -p /etc/cloudflared
sudo cp "$HOME/.cloudflared/YOUR_TUNNEL_UUID.json" /etc/cloudflared/
sudo cp "$HOME/.cloudflared/cert.pem" /etc/cloudflared/
sudo nano /etc/cloudflared/config.yml
# paste the YAML above with YOUR_TUNNEL_UUID replaced; save
```

Install the Linux service from **config** (not the `service install <token>` flow from Path A):

```bash
sudo cloudflared --config /etc/cloudflared/config.yml service install
sudo systemctl enable --now cloudflared
sudo systemctl status cloudflared
```

If you previously used Path A and switch to Path B: `sudo cloudflared service uninstall`, then run `service install` with `--config` again.

**SSL:** HTTPS terminates at Cloudflare; HTTP to `127.0.0.1` on the instance is normal for Tunnel.

**Optional — Zero Trust Access:** mostly configured in the dashboard (**Access → Applications**); full policy-as-code would use the Cloudflare API or Terraform (out of scope here).

## 3) Prepare project on EC2

```bash
mkdir -p ~/apps/prn232
cd ~/apps/prn232
```

Copy project files to EC2 (git clone or scp). Required files:
- `docker-compose.prod.yml`
- `.env` (create from `.env.example`)

## 4) Configure `.env` for production

At minimum:

```env
DOCKER_REPO=<your-dockerhub-username>
IMAGE_TAG=latest

FE_PORT=3000
API_PORT=5049

POSTGRES_DB=grading_system
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<strong-password>

SA_PASSWORD=<strong-password>

RABBITMQ_USER=grading
RABBITMQ_PASSWORD=<strong-password>

ASPNETCORE_URLS=http://+:8080
CORS_ORIGIN_0=https://prn232.verendar.vn
```

The **frontend Docker image** bakes `NEXT_PUBLIC_*` at **`docker build` / `npm run build`**. Values in the EC2 `.env` used by Compose **do not** change that; if the image was built without them, the browser falls back to `http://localhost:5049/api/v1` (see `fe/grading-system/src/config/site.ts`) and you get CORS errors on `https://prn232.verendar.vn`.

CI (`.github/workflows/cd-deploy-docker.yml`) passes build-args; base URL must include **`/api/v1`** (same as the API route prefix). Optional overrides: GitHub **Settings → Environments → production → Environment variables** `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_APP_URL`.

After fixing CI, push a change under `fe/grading-system/` (or run workflow) so the FE image rebuilds, then on EC2: `docker compose ... pull && up -d`.

## 5) Login Docker Hub and pull images

```bash
docker login -u <your-dockerhub-username>
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Check status:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f --tail=200
```

## 6) Reverse proxy (manual choice)

Because domain traffic should go through 80/443, you need a reverse proxy on EC2
to route:
- `/` -> frontend container
- `/api` -> api container

You can choose one:
- Nginx
- Caddy
- Traefik

If you want, I can generate an exact Nginx or Caddy config file for your current compose.

## 7) Update deployment manually

When CI pushes new images:

```bash
cd ~/apps/prn232
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
docker image prune -f
```

## 8) Quick troubleshooting

- `Error: pull access denied`: wrong `DOCKER_REPO` or not logged in Docker Hub
- Domain not opening: DNS not propagated, or EC2 SG missing 80/443 (classic path only), or Tunnel DNS still pointing at an old `A` record
- Tunnel `502` / origin down: `sudo journalctl -u cloudflared -f` and confirm the **Public hostname** URL matches the reverse proxy listen address/port on EC2
- `cloudflared` fails to connect: ensure outbound TCP `443` from the instance is allowed (NAT gateway / corporate firewall)
- CORS issue: check `CORS_ORIGIN_0`
- Frontend calls wrong API: rebuild FE image with correct `NEXT_PUBLIC_API_URL`
