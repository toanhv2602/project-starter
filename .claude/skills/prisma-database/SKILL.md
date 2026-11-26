---
name: prisma-database
description: Design Prisma models, migrations, indexes, transactions or database queries.
---

# Prisma Database Engineering

- Read the existing schema and migration history first.
- Model constraints and relations in the database, not only application code.
- Add indexes based on access patterns; avoid speculative indexing.
- Use migrations for all schema changes.
- Never edit migrations already applied to shared environments.
- Use `migrate dev` locally and `migrate deploy` in deployed environments.
- Review transaction boundaries, N+1 risks and pagination.
- Use raw SQL only with a written reason and parameterized inputs.
- Test migration and repository behavior against PostgreSQL.
