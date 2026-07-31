# MedTech 2.0 — Production Deployment Runbook

Everything runs from `docker/docker-compose.yml`, which defaults to **production
posture**: nginx terminates TLS for `medtech.mk`, cookies are `Secure`, Swagger
is disabled, and demo/mock data never reaches the database.

## 1. Prerequisites

- A Linux server with Docker Engine + Compose v2 and ports **80/443** open.
- DNS `A` records for `medtech.mk` and `www.medtech.mk` pointing at the server.
- The repository cloned on the server (`git clone … && cd MedTech2.0`).

> **No server yet?** [`DEPLOYMENT-FREE.md`](./DEPLOYMENT-FREE.md) covers hosting
> the whole stack on a free tier (Oracle Cloud Always Free + a DuckDNS
> subdomain), including the sizing and firewall gotchas. Rejoin this runbook at
> §3.

## 2. Configure secrets

```bash
cd docker
cp .env.example .env
chmod 600 .env
```

Fill in every value. Generate the two cryptographic secrets:

```bash
openssl rand -hex 32     # -> MEDTECH_SECURITY_JWT_SECRET
openssl rand -base64 32  # -> MEDTECH_PHI_ENCRYPTION_KEY
```

> **MEDTECH_PHI_ENCRYPTION_KEY is unrecoverable.** It encrypts clinical PHI
> (diagnoses, notes, allergies…) with AES-256-GCM. Store a copy in a password
> manager or offline vault *before* first boot. Losing it means losing the data.

Set the first-run admin (created only if the database has no ADMIN yet):

```
MEDTECH_BOOTSTRAP_ADMIN_EMAIL=you@example.com
MEDTECH_BOOTSTRAP_ADMIN_PASSWORD=<min 12 chars>
```

Leave the two dev override lines (`NGINX_CONF`, `MEDTECH_SECURITY_COOKIE_SECURE`)
**commented out** — they exist only for local HTTP runs.

## 3. Obtain TLS certificates (first boot only)

nginx's prod config expects Let's Encrypt certs. Bootstrap them once:

```bash
# 1. Start with the HTTP-only config so the ACME challenge can be served
NGINX_CONF=conf.d/medtech-dev.conf docker compose up -d --build nginx

# 2. Issue the certificate
docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
  -d medtech.mk -d www.medtech.mk --email you@example.com --agree-tos --no-eff-email

# 3. Rebuild nginx with the TLS config (the default)
docker compose up -d --build nginx
```

Renewal (add to the server's crontab, e.g. weekly):

```bash
docker compose run --rm certbot renew && docker compose exec nginx nginx -s reload
```

## 4. Start the stack

```bash
docker compose up -d --build
```

Order is handled by health checks: postgres → redis → backend → frontend → nginx.

**Verify:**

```bash
docker compose ps                          # all services healthy
curl -fsSI https://medtech.mk              # 200 from the frontend via nginx
# Actuator is not exposed through nginx — check it from inside the network:
docker compose exec backend wget -qO- http://localhost:8080/actuator/health
```

Log in with the bootstrap admin, **change its password**, then remove the two
`MEDTECH_BOOTSTRAP_ADMIN_*` lines from `.env`.

## 5. Data safety

- **Automated backups**: the `postgres-backup` service runs a daily `pg_dump`
  into the `postgres_backups` volume with tiered retention (7 daily, 4 weekly,
  6 monthly). Copy them off-host regularly:

  ```bash
  docker run --rm -v docker_postgres_backups:/backups -v "$PWD":/out alpine \
    sh -c 'cp -r /backups /out/medtech-backups'
  ```

- **Restore**:

  ```bash
  gunzip -c <backup>.sql.gz | docker compose exec -T postgres psql -U postgres -d medtech
  ```

- **Migrations**: Flyway runs automatically at backend startup as the DB
  superuser. Production uses only `classpath:database`; the mock seed and demo
  users live in `classpath:database/dev` and are applied exclusively by the
  dev profile.

## 6. Updating a running deployment

```bash
git pull
docker compose build backend frontend
docker compose up -d backend frontend
```

Flyway applies any new migrations on backend startup. Roll back by checking out
the previous git tag and rebuilding — never edit an applied migration.

## 7. Local development stack

For a plain-HTTP local run, uncomment in `docker/.env`:

```
NGINX_CONF=conf.d/medtech-dev.conf
MEDTECH_SECURITY_COOKIE_SECURE=false
```

and start with the `dev` profile to get pgAdmin at `http://localhost:5050`:

```bash
docker compose --profile dev up -d --build
```
