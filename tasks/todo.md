# Hardening Todo

## Active Plan

- [x] Refresh topology, dependency graph, and workflow inventory for the isolated worktree.
- [x] Re-score remaining operational and supply-chain risks before editing.
- [x] Apply the smallest safe hardening changes that reduce the highest remaining risks.
- [x] Re-run the local live matrix, adversarial probes, and Docker deployment validation.
- [x] Push the V6 hardening head and verify the exact remote workflows again.
- [x] Update evidence, lessons, runbooks, and final review notes.

## Topology Summary

- Repo shape: integrated web + API + mobile application repo with shared schema and Playwright coverage.
- Runnable entry points:
  - `npm run dev`
  - `npm run start:e2e`
  - `npm --prefix mobile run start`
  - `docker build` via `Dockerfile`
- Stateful boundaries:
  - PostgreSQL via Drizzle
  - session cookies
  - CSRF-protected writes
- CI/CD surfaces:
  - `.github/workflows/ci.yml`
  - `.github/workflows/security.yml`
  - `.github/workflows/codeql.yml`

## Validation Map

- `npm run lint`
- `npm test`
- `npm run test:integration`
- `npm run build`
- `npm run validate`
- `npm run security:scan`
- `npx playwright test`
- repeated critical-path Playwright runs on auth and shell
- built artifact cold starts and restart probes
- Docker build plus two cold container starts
- CSRF / malformed JSON / hostile CORS adversarial probes

## Current Phase

- Phase 16: final reporting

## Risk Ledger

- `R-01` Auth/session + CSRF lifecycle across web/API/DB. Score `70` `CRITICAL`. Status: mitigated by repeated live browser runs and adversarial CSRF probes.
- `R-02` Production startup and DB readiness. Score `61` `CRITICAL`. Status: mitigated by built artifact cold starts, fail-fast env probe, and Docker runtime health checks.
- `R-03` CI/CD supply-chain drift from floating action tags. Score `48` `HIGH`. Status: mitigated by immutable SHA pinning and timeout hardening.
- `R-04` Operational observability gaps. Score `44` `HIGH`. Status: mitigated by structured JSON logs, request IDs, and runbooks.
- `R-05` Coverage depth in persistence/model internals. Score `27` `MEDIUM`. Status: classified, not blocking, still worth future targeted tests.

## Blockers

- None.

## Review / Results

- Baseline failure reproduced in `npm run lint` on the clean branch:
  - `client/src/components/ui/field.tsx` used iterator spread over `Map.values()` under the current TS target semantics.
  - `client/src/components/ui/resizable.tsx` referenced stale `react-resizable-panels` exports and types.
- Applied the smallest semantic fixes:
  - replaced the iterator spread with `Array.from(...)`
  - aligned the resizable wrapper with the installed panel component API
  - tightened local and remote validation coverage by adding integration tests to `validate` and CI
- Applied the V6 hardening slice:
  - pinned GitHub Actions to immutable SHAs
  - pinned the Trivy image to a digest
  - added workflow timeouts
  - upgraded the server to structured JSON logs with request correlation IDs
  - added operational runbooks for startup/DB recovery and CI recovery
- Local validation completed:
  - `DATABASE_URL='postgresql://user@localhost:5432/abs_prefstudio_test' DATABASE_SSL_MODE=disable SESSION_SECRET='validate-local-session-secret-not-for-production-0002' npm run validate`
  - `DATABASE_URL='postgresql://user@localhost:5432/abs_prefstudio_test' DATABASE_SSL_MODE=disable SESSION_SECRET='playwright-local-session-secret-not-for-production-0001' SESSION_COOKIE_SECURE=false SESSION_COOKIE_SAME_SITE=lax AI_PROVIDER=none PLAYWRIGHT_USE_PROD_SERVER=1 npx playwright test`
  - `DATABASE_URL='postgresql://user@localhost:5432/abs_prefstudio_test' DATABASE_SSL_MODE=disable SESSION_SECRET='playwright-local-session-secret-not-for-production-0001' SESSION_COOKIE_SECURE=false SESSION_COOKIE_SAME_SITE=lax AI_PROVIDER=none PLAYWRIGHT_USE_PROD_SERVER=1 npx playwright test e2e/auth.spec.ts e2e/shell.spec.ts --project=chromium --repeat-each=3`
  - `npm run security:scan`
  - `npm run coverage`
  - built artifact fail-fast env probe without `SESSION_SECRET`
  - built artifact hostile CORS, malformed JSON, request ID, and CSRF probes
  - two cold Docker container starts with `/health` verification
  - SBOM generation and license summaries for root and mobile
- Coverage remains moderate and is classified, not ignored:
  - statements 64.69%
  - main gaps: `server/storage.ts`, `server/model/rag.ts`, `server/db.ts`
- Failure classification:
  - `FAIL-001` Lint/type defect. Root cause: stale third-party wrapper types and iterator spread mismatch. Fixed locally and revalidated.
  - `FAIL-002` Environment misuse during Playwright orchestration. Root cause: manual prod server run without `PLAYWRIGHT_USE_PROD_SERVER=1`, causing CSRF/session mismatch. Reclassified as operator error, corrected by using the repository's intended test orchestration.
- `FAIL-003` Local Docker validation blocker. Root cause: Colima was installed but not running. Reclassified as environment blocker, resolved by starting Colima and re-running Docker validation.
- `FAIL-004` Mobile SBOM generation failed under `npx` bootstrap. Reclassified as tooling bootstrap defect, resolved by switching to `npm exec --package=@cyclonedx/cyclonedx-npm -- ...`.
- Latest remote workflow result: the exact V6 hardening head was verified green in `CI`, `Security`, and `CodeQL`.
