## What & why

<!-- Link the JIRA ticket. Describe the change and the reason for it. -->

## How to test

## Checklist

- [ ] Tests added/updated (unit + integration for API changes)
- [ ] `pnpm verify` passes locally
- [ ] Migration added for schema changes (never edit an applied migration)
- [ ] `pnpm api:generate` run and committed if endpoints changed
- [ ] No secrets, tokens or personal data in code, logs or fixtures
- [ ] Docs / ADR updated if architecture changed
