# Screenshot Workflow

Use this flow to refresh all showcase screenshots.

## Prerequisites

1. Start stack:

```bash
npm run compose:up
npm run prisma:seed
```

2. Ensure test users exist:

- customer@insureconnect.local / Password1!
- agent@insureconnect.local / Password1!
- underwriter@insureconnect.local / Password1!
- admin.test@insureconnect.local / Password1!

## Capture Command

```bash
node docs/capture-showcase-screenshots.cjs
```

## Output Location

- [docs/screenshots](../screenshots)

## Current Coverage

- Public: login, register, admin login
- Shared: role management
- Customer: dashboard, policies list
- Agent: dashboard, quotes (all + filtered), policies list, policy detail
- Partner: dashboard, quotes list, policies list, policy detail
- Admin: role management, audit log

## If A Page Changes

1. Update selector or route in [docs/capture-showcase-screenshots.cjs](../capture-showcase-screenshots.cjs)
2. Re-run capture command.
3. Update captions in [docs/showcase/screenshot-catalog.md](./screenshot-catalog.md)
