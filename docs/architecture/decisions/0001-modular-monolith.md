# ADR 0001: Modular Monolith

- Status: Accepted
- Context: Product domain is not yet defined; solo developer needs low operational complexity.
- Decision: Start with a TypeScript monorepo and NestJS Modular Monolith.
- Consequences: In-process module communication; explicit boundaries; easier local development.
  Future extraction remains possible if module boundaries and data ownership are respected.
