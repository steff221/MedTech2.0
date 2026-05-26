# TLS Setup — Let's Encrypt via Certbot

## First-time certificate issuance

1. Make sure your domain's DNS A record points to this server.
2. Start nginx with only HTTP (comment out the HTTPS server block temporarily):

```bash
docker compose up -d nginx
```

3. Issue the certificate:

```bash
docker compose --profile certbot run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d medtech.mk \
  -d www.medtech.mk
```

4. Uncomment the HTTPS server block, then reload nginx:

```bash
docker compose exec nginx nginx -s reload
```

## Renewal (run via cron on the host, e.g. monthly)

```bash
docker compose --profile certbot run --rm certbot renew
docker compose exec nginx nginx -s reload
```

## Local development (no real domain)

Keep `ports: - "8080:8080"` and `ports: - "3000:3000"` on the backend/frontend
services while developing locally, and skip the nginx service. The nginx config
is only needed on the production server.
