# Deployment runbook (starter)

1. Build immutable Docker images in CI and publish to a registry.
2. Approve the target environment and deployment commit.
3. Verify backup freshness and migration compatibility.
4. Pull images on the Cloud VM.
5. Run Prisma `migrate deploy` as a release job.
6. Start/recreate API, web and worker containers.
7. Verify health/readiness and smoke-test critical endpoints.
8. Monitor logs, latency and error rate.
9. Keep the previous image tag for application rollback.

Database rollback is a separate recovery procedure; never assume reverting an image reverts data.
