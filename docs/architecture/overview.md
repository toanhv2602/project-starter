# Architecture Overview

## Initial topology

Vue SPA -> REST API (NestJS + Fastify) -> Modular Monolith modules -> PostgreSQL.
API/worker may use Redis + BullMQ for asynchronous jobs.

## Boundaries

- `apps/web`: presentation and client state.
- `apps/api`: HTTP transport and business modules.
- `apps/worker`: background job entrypoint; shares application modules through packages or API-owned worker adapters.
- `packages/contracts`: transport-level schemas shared across apps.
- `prisma/`: database schema and migrations.

## Rules

One deployable API initially; worker is a separately deployable process when needed.
No direct cross-module repository access.
No microservices until scale, isolation or team ownership justifies the operational cost.
