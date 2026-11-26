---
name: testing-strategy
description: Plan or implement unit, integration and end-to-end tests for a feature or bug.
---

# Testing Strategy

- Derive tests from acceptance criteria and failure modes.
- Unit-test pure domain and application behavior.
- Integration-test real PostgreSQL behavior and important adapters.
- Test auth and permission denial, not only success.
- Add regression coverage before or alongside bug fixes.
- Use Playwright for critical user journeys, not every implementation detail.
- Avoid brittle assertions and mocks that replace the behavior under test.
- Report exact commands and results; never claim tests passed without running them.
