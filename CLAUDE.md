# Vivacity Admin Test Suite

## Project Overview
Playwright E2E test suite for the Vivacity admin dashboard.

- **App URL**: https://app-staging.vivacityapp.com
- **Default credentials**: `kc@vivacityapp.com` / `PAOpaopao@9696`
- **Fusioneta credentials** (system-settings only): `pau.kie.chee@fusioneta.com` / `PAOpaopao@9696`

## Key Directories
- `tests/` — Playwright test files
- `tests/helpers/` — Shared helpers (auth, navigation)
- `tests/generated/` — Auto-generated tests from ADO bugs
- `scripts/` — Automation scripts

## Navigation
After login, the app URL pattern is `/{orgSlug}/{module}` (e.g. `/demo-student/attributes`).
**Always navigate by direct URL** — never use `getByText('Data Management').click()` as sidebar labels change.

Use the `navigateTo(page, slug)` helper from `tests/helpers/auth.helper.ts`.

## Key Scripts
- `node scripts/bug-to-test.mjs` — Generate tests for ADO bugs, verify closed bugs
- `node scripts/auto-bug-creator.mjs` — Detect merged PRs, generate tests, create bugs
- `./scripts/run-e2e-explore.sh` — Claude + Playwright MCP autonomous E2E exploration

## ADO Bug Creation
```
POST https://dev.azure.com/vivacityapp/Viva/_apis/wit/workitems/$Bug?api-version=7.0
Auth: Basic base64(":ADO_PAT")
Content-Type: application/json-patch+json
```

## Slack Channel
Bug reports go to `#admin-automation` (C0AH47MFEJV)
