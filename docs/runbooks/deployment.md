# Deployment runbook (single Cloud VM, Docker Compose)

## One-time server setup

1. Install Docker Engine + Compose plugin. Open only 80/443 (and SSH from trusted IPs).
2. Put TLS in front of the `web` container (Caddy, Traefik, a cloud load balancer or Cloudflare).
3. Copy `docker-compose.prod.yml` and create `.env.production` from `.env.production.example`.
   Generate new secrets; prefer a secret manager. Never commit this file.

## Release

1. CI is green on the commit to release (tests, image builds).
2. Build and tag immutable images (CI or locally):
   `IMAGE_TAG=<git-sha> docker compose -f docker-compose.prod.yml build`
   Push to your registry, or build on the server for a first trial.
3. Verify a recent database backup exists and the migration is backwards compatible
   (expand → migrate → contract; never drop a column the running version still reads).
4. Deploy:

   ```bash
   IMAGE_TAG=<git-sha> docker compose -f docker-compose.prod.yml --env-file .env.production up -d
   ```

   The `migrate` service runs `prisma migrate deploy` first; `api` starts only if it succeeds.

5. Verify: `curl -fsS https://<host>/api/v1/health/ready`, sign in, check logs:
   `docker compose -f docker-compose.prod.yml logs -f api worker`
6. Watch error rate and latency for 15 minutes.

## Rollback

- Application: redeploy the previous `IMAGE_TAG`.
- Database: an image rollback does **not** revert migrations. Restore from backup or ship a
  forward-fix migration. This is why step 3 matters.

## Operations

- Backups: schedule `pg_dump` (or managed-DB snapshots) and test a restore every quarter.
- Logs are JSON on stdout; ship them to your log platform. Secrets are redacted by the logger.
- Rate limiting is per API instance (in-memory). Use a Redis store before running replicas.
