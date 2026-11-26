---
name: nestjs-module
description: Create or modify a business module in the NestJS + Fastify API. Use for controllers, use cases, domain rules, repositories and module tests.
---

# NestJS Module Engineering

1. Inspect neighboring modules and existing conventions.
2. Identify module owner and public interface.
3. Keep controller limited to HTTP mapping and boundary validation.
4. Put orchestration in application services/use cases.
5. Keep domain rules independent of NestJS and Prisma.
6. Implement persistence behind a repository interface where domain complexity warrants it.
7. Map domain/application results to stable API response DTOs.
8. Test success, invalid input, authorization and persistence failure.
9. Run lint, typecheck and focused tests; report unexecuted checks.
