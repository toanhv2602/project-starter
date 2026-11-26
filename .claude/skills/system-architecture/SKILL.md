---
name: system-architecture
description: Design or review the Modular Monolith, module boundaries, dependencies, data ownership and architecture decisions.
---

# System Architecture

- Read `CLAUDE.md` and existing ADRs first.
- Identify bounded contexts and module ownership.
- Keep domain independent of NestJS, Prisma and transport.
- Define public application interfaces between modules.
- Avoid cross-module table/repository access and circular dependencies.
- Prefer synchronous in-process calls until asynchronous processing is justified.
- Produce module map, dependency rules, data ownership, failure modes and ADRs.
- Do not introduce microservices or Kubernetes without a concrete operational reason.
