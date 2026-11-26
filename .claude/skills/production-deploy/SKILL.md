---
name: production-deploy
description: Prepare a release or deployment to a Cloud VM using Docker Compose.
---

# Production Deployment

- Confirm target environment, commit and immutable image tags.
- Verify CI, tests, image scan and required approvals.
- Check environment variables and secret manager references without printing secret values.
- Confirm database backup and migration compatibility.
- Run migrations as a separate release step.
- Deploy application containers and verify readiness/health.
- Smoke-test critical flows and inspect error rate/logs.
- Keep the previous image available for application rollback.
- Never assume application rollback reverses database migrations.
- Do not deploy production without explicit user authorization.
