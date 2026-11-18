# Playwright E2E

- **Run:** from repo root, `npm run test:e2e`, or here: `npx playwright test`.
- **Config:** `../playwright.config.ts` — Chromium, Vite on **5174** unless `PLAYWRIGHT_WEB_ORIGIN` is set.
- **CI:** `CI=true` starts a **fresh** dev server (no stale port). Locally, an existing server on 5174 is reused when `CI` is unset.
- **Docs:** [`../../docs/context/testing.md`](../../docs/context/testing.md) (Playwright vs Cursor browser).

Add new specs as `*.spec.ts` in this folder.
