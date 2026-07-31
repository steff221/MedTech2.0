# Deploying MedTech 2.0 on free infrastructure

`DEPLOYMENT.md` is the full production runbook, and it assumes you already have
"a Linux server with Docker and ports 80/443". This document only fills that
gap: **which free host, and what changes.** Everything after §4 here hands back
to the main runbook.

---

## 1. What the stack actually needs

Measured from `docker/docker-compose.yml`:

| service       | memory |
|---------------|--------|
| backend (JVM) | 768 MB (declared limit) |
| frontend      | 512 MB (declared limit) |
| postgres      | ~200–300 MB |
| redis + nginx + backup | ~100 MB |
| **total**     | **~2 GB minimum, 4 GB comfortable** |

This rules out the common 1 GB free instances — AWS `t2.micro` and GCP
`e2-micro` will OOM the JVM. It also rules out platforms that only run a single
web process, because this is nine services.

All base images (`eclipse-temurin:21`, `postgres:16-alpine`, `redis:7-alpine`,
`node:20-alpine`, `nginx:1.27-alpine`) publish **arm64**, so an ARM host is fine
— which is what makes the recommendation below work.

---

## 2. Recommended: Oracle Cloud "Always Free"

The only major free tier that fits this stack, and it is *always free* rather
than a 12-month trial:

- 4 ARM Ampere cores + **24 GB RAM**, 200 GB block storage
- Runs `docker compose up -d --build` exactly as written — no rearchitecting

Signup needs a card for identity verification (it is not charged).

> **Known annoyance:** ARM capacity is frequently exhausted in popular regions.
> If you get *"Out of capacity for shape VM.Standard.A1.Flex"*, either retry
> later or pick a less busy home region **at signup** — the home region cannot
> be changed afterwards.

### Provisioning

1. Create instance → shape **VM.Standard.A1.Flex**, 4 OCPU / 24 GB, image
   **Ubuntu 22.04**. Upload your SSH public key.
2. **Open the firewall.** Two layers, and forgetting the second is the single
   most common reason a fresh Oracle box appears dead:

   ```bash
   # a) VCN security list (in the console):
   #    Networking → VCN → Security Lists → add ingress rules
   #    0.0.0.0/0 TCP 80 and 0.0.0.0/0 TCP 443
   #
   # b) the instance's own iptables (Oracle images ship with it locked down):
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80  -j ACCEPT
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
   sudo netfilter-persistent save
   ```

3. Install Docker:

   ```bash
   curl -fsSL https://get.docker.com | sudo sh
   sudo usermod -aG docker $USER && newgrp docker
   ```

---

## 3. A free domain (needed for TLS)

`docker/nginx/conf.d/medtech.conf` expects Let's Encrypt certificates, which
require a real hostname. If you do not own a domain, register a free subdomain
at **duckdns.org** and point it at the instance's public IP.

Do **not** use `nip.io` or similar wildcard-DNS services — Let's Encrypt
rate-limits them aggressively and issuance will fail.

The nginx config is **baked into the image at build time** (see
`docker/nginx/Dockerfile` — it is copied, not mounted, to dodge a macOS
bind-mount bug). So swap the domain in the file, then rebuild nginx:

```bash
cd MedTech2.0
sed -i 's/medtech\.mk/YOURNAME.duckdns.org/g; s/www\.YOURNAME\.duckdns\.org//g' \
  docker/nginx/conf.d/medtech.conf
```

Then check it — you want `server_name` and both `ssl_certificate` paths on your
new host, and no leftover `www.` entry:

```bash
grep -nE "server_name|ssl_certificate" docker/nginx/conf.d/medtech.conf
```

---

## 4. Secrets

Copy `docker/.env.production` (generated for you, already `chmod 600` and
gitignored) to the server as `docker/.env`, then replace every `CHANGE-ME`:

- `MEDTECH_FRONTEND_URL` and `MEDTECH_SECURITY_CORS_ALLOWEDORIGINS_0` → your https URL
- `MEDTECH_BOOTSTRAP_ADMIN_EMAIL` / `_PASSWORD` → your first admin
- `MEDTECH_MAIL_*` → a **new** Gmail app password, not the local one

> **Back up `MEDTECH_PHI_ENCRYPTION_KEY` offline before first boot.** It
> encrypts clinical PHI with AES-256-GCM and is unrecoverable. Losing it means
> losing that data permanently.

Transfer it without going through git:

```bash
scp docker/.env.production ubuntu@YOUR_IP:~/MedTech2.0/docker/.env
ssh ubuntu@YOUR_IP 'chmod 600 ~/MedTech2.0/docker/.env'
```

---

## 5. From here, follow the main runbook

Everything else is unchanged — continue at
[`DEPLOYMENT.md` §3 (TLS certificates)](./DEPLOYMENT.md), substituting your
DuckDNS hostname for `medtech.mk` in the `certbot` command.

Expect the **first build to be slow** (10–20 min): Maven downloads the
dependency tree and Next.js compiles 51 routes on 4 ARM cores.

---

## 6. Free alternative, if Oracle will not give you capacity

Split across managed free tiers:

| piece    | host    |
|----------|---------|
| Frontend | Vercel  |
| Postgres | Neon    |
| Redis    | Upstash |
| Backend  | Render / Koyeb |

Honest trade-offs: free backend tiers **sleep when idle**, and a cold JVM start
is 30–60 seconds — poor for a live demo. You also drop nginx and certbot
entirely (each platform terminates its own TLS), so the reverse-proxy config
here stops applying, and you manage four dashboards instead of one compose file.

Two settings must change if you go this route:

- `NEXT_PUBLIC_API_URL` must become the backend's absolute URL, since the
  frontend and backend are no longer same-origin. That also means the refresh
  cookie is cross-site: `SameSite=None` is required, and the current
  same-origin rewrite in `next.config.mjs` no longer applies.
- `MEDTECH_DB_SSLMODE=require` — Neon rejects unencrypted connections.

---

## 7. Before you expose it publicly

- [ ] `MEDTECH_PHI_ENCRYPTION_KEY` backed up offline
- [ ] All `CHANGE-ME` values replaced
- [ ] Local dev secrets **not** reused (JWT, DB password, Gmail app password)
- [ ] `NGINX_CONF` and `MEDTECH_SECURITY_COOKIE_SECURE` left commented out
      (the prod defaults are TLS + `Secure` cookies)
- [ ] `MEDTECH_SECURITY_RATELIMIT_CAPACITY` back to `10` — the local box uses
      100 for demo convenience, which is too loose to expose
- [ ] Bootstrap admin password changed after first login, then the two
      `MEDTECH_BOOTSTRAP_ADMIN_*` lines removed
- [ ] Swagger confirmed disabled (it is, under the `prod` profile)
- [ ] **No demo data.** The `prod` profile excludes `classpath:database/dev`, and
      `demo_zoran_urology.sql` / `demo_refresh_today.sql` are applied by hand —
      so simply do not run them on the server.
- [ ] Only synthetic data. Real patient records on free infrastructure is a GDPR
      problem: no DPA, and no control over jurisdiction.
