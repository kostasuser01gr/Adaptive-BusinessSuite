# Hardening Todo

## Active Plan

- [x] Capture topology and baseline validation state in the clean worktree.
- [x] Reproduce the highest-priority failure on the clean branch before editing.
- [x] Apply the smallest verified hardening fixes.
- [x] Run full local live validation for web, backend, mobile, security, and browser flows.
- [ ] Push the isolated hardening branch and inspect remote workflow results.
- [x] Record evidence, lessons, and final review.

## Validation Map

- `npm run lint`
- `npm test`
- `npm run test:integration`
- `npm run build`
- `npm run validate`
- `npm run security:scan`
- `npx playwright test`
- repeated critical-path Playwright runs on auth and shell

## Current Phase

- Phase 12: remote CI evidence gate

## Blockers

- No remote workflow has run yet for `codex/ultra-hardening-v4-live`.

## Review / Results

- Baseline failure reproduced in `npm run lint` on the clean branch:
  - `client/src/components/ui/field.tsx` used iterator spread over `Map.values()` under the current TS target semantics.
  - `client/src/components/ui/resizable.tsx` referenced stale `react-resizable-panels` exports and types.
- Applied the smallest semantic fixes:
  - replaced the iterator spread with `Array.from(...)`
  - aligned the resizable wrapper with the installed panel component API
  - tightened local and remote validation coverage by adding integration tests to `validate` and CI
- Local validation completed:
  - `DATABASE_URL='postgresql://user@localhost:5432/abs_prefstudio_test' DATABASE_SSL_MODE=disable SESSION_SECRET='validate-local-session-secret-not-for-production-0002' npm run validate`
  - `DATABASE_URL='postgresql://user@localhost:5432/abs_prefstudio_test' DATABASE_SSL_MODE=disable SESSION_SECRET='built-server-session-secret-not-for-production-0003' AI_PROVIDER=none PORT=5000 npm run start:e2e`
  - `curl -s http://127.0.0.1:5000/health`
  - `curl -i -s -c /tmp/abs-ultra-cookies.txt http://127.0.0.1:5000/api/auth/csrf`
  - `DATABASE_URL='postgresql://user@localhost:5432/abs_prefstudio_test' DATABASE_SSL_MODE=disable SESSION_SECRET='playwright-local-session-secret-not-for-production-0001' SESSION_COOKIE_SECURE=false SESSION_COOKIE_SAME_SITE=lax AI_PROVIDER=none PLAYWRIGHT_USE_PROD_SERVER=1 npx playwright test`
  - `DATABASE_URL='postgresql://user@localhost:5432/abs_prefstudio_test' DATABASE_SSL_MODE=disable SESSION_SECRET='playwright-local-session-secret-not-for-production-0001' SESSION_COOKIE_SECURE=false SESSION_COOKIE_SAME_SITE=lax AI_PROVIDER=none PLAYWRIGHT_USE_PROD_SERVER=1 npx playwright test e2e/auth.spec.ts e2e/shell.spec.ts --project=chromium --repeat-each=3`
  - `npm run security:scan`
  - `npm run coverage`
- Coverage remains moderate and is classified, not ignored:
  - statements 64.69%
  - main gaps: `server/storage.ts`, `server/model/rag.ts`, `server/db.ts`
- Failure classification:
  - `FAIL-001` Lint/type defect. Root cause: stale third-party wrapper types and iterator spread mismatch. Fixed locally and revalidated.
  - `FAIL-002` Environment misuse during Playwright orchestration. Root cause: manual prod server run without `PLAYWRIGHT_USE_PROD_SERVER=1`, causing CSRF/session mismatch. Reclassified as operator error, corrected by using the repository's intended test orchestration.
