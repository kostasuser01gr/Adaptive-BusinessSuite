# Hardening Todo

## V7 Repository Audit Cycle (2026-03-22)

### Modes

1. `hardening`
2. `audit`
3. `release`

### Plan

1. Capture required environment baseline and current git/repo state.
2. Discover topology, critical surfaces, workflows, and authoritative commands.
3. Record inventories, blockers, and evidence paths before major claims.
4. Run repository-native validation that is feasible in the current environment.
5. Classify failures and apply only the smallest safe fixes needed for reproducibility or safety.
6. Assess GitHub remote validation feasibility and execute it only if credentials and policy permit.
7. Produce a scorecard with exact blockers rather than over-claiming success.

### Current Phase

Evidence consolidation and blocker classification.

### Checklist

- [x] Required environment baseline captured.
- [x] Git branch, remote, and dirty-worktree state captured.
- [x] Repo topology expanded beyond web/backend to include `mobile/`, `nexus-os/`, workflows, and deployment config.
- [x] Initial critical risks identified.
- [x] Fresh local validation run captured for the current state.
- [x] Remote GitHub read-only state inspected for the current branch.
- [ ] GitHub push/remote validation completed for a new hardened commit.
- [x] Evidence manifest refreshed for this cycle.

### Blockers

- Dirty worktree contains many user-owned changes outside the current Spec Kit documents, so broad hardening edits have high merge-risk unless a specific target is chosen.
- `.env.enterprise` exists locally with secret-shaped values; it is ignored by git, but any live rotation/revocation action depends on whether those credentials are real and still active.
- GitHub push and remote workflow execution for a new hardened commit are blocked by a heavily dirty worktree with many user-owned staged and unstaged changes; pushing safely requires an explicit branch/commit strategy that does not capture unrelated work.

### Blast Radius Notes

- Root `package.json`, GitHub workflows, and deployment config affect web, backend, CI, and release surfaces together.
- `server/config.ts`, `server/index.ts`, and `server/routes.ts` are auth/session/config hubs with cross-cutting impact.
- `shared/schema.ts` and storage paths are stateful dependency hubs.
- `playwright.config.ts` gates browser validation for protected and stateful web flows.
- `mobile/` and `nexus-os/` are separate app surfaces with their own dependency and build risks.

### Validation Map

1. Static: `npm run lint`
2. Unit: `npm test`
3. Integration/stateful: `npm run test:integration`
4. Build: `npm run build`
5. E2E/live UI: `npm run test:e2e`
6. Mobile validation: `npm --prefix mobile run typecheck`
7. Security baseline: `npm run security:audit`
8. Optional deeper security if tooling exists: `npm run security:scan`
9. Runtime health checks per repo policy: `curl -s http://127.0.0.1:11434/api/version`, `ollama list`, `ollama-health`, `ollama-logs`, `claude-ultra -h | head`

### Time Budget And Actual

- Discovery budget: 20m, actual: 15m
- Validation budget: 35m, actual: 45m
- Failure analysis/fix budget: 25m, actual: 20m
- Remote validation budget: 20m, actual: 5m read-only inspection

### Results Summary

- Local validation results:
  `npm run lint` passed after a type-only repair in `client/src/components/ui/chart.tsx`.
  `npm test` passed outside the sandbox; the original failure was a sandbox IPC restriction in `tsx`.
  `npm run build` passed outside the sandbox.
  `npm --prefix mobile run typecheck` passed.
  `npm run security:audit` passed.
  `npm run test:integration` passed against a disposable local PostgreSQL database after applying the checked-in SQL migration directly with `psql`.
  Clean Chromium Playwright rerun passed with `35 passed, 1 skipped`; the earlier full-browser run was contaminated by an empty database at startup and cannot be treated as a clean all-browser proof.
- Known risks remain: hardcoded credentials in `docker-compose.enterprise.yml`, a local secret-bearing `.env.enterprise`, noisy `NO_COLOR`/`FORCE_COLOR` warnings during Playwright runs, and no safe GitHub push/remote CI execution for a new commit in this cycle.

## V7 Hardening Cycle (2026-03-20)

- [x] Topology discovery and repository census
- [x] Baseline validation (type check, tests, build, security audit)
- [x] Remove 8 unused dependencies (supply chain risk reduction)
- [x] Pin all CI actions to SHA hashes across 3 workflow files
- [x] Fix CRITICAL: Entity ownership enforcement on all PATCH/DELETE routes (storage-layer WHERE clause)
- [x] Fix CRITICAL: CSV injection prevention in audit export
- [x] Add security response headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- [x] Validate pre-existing changes (http.ts AbortError, field.tsx ES5 compat, resizable.tsx API update)
- [x] Full re-validation (type check + tests + build + audit) — all green
- [x] Evidence artifacts created

## Prior Hardening (completed)

- [x] Capture repository snapshot, branch constraints, and local diff context.
- [x] Audit scripts, workflows, docs, and security posture for the web, backend, and mobile surfaces.
- [x] Run baseline validation layers and classify every failure or weakness.
- [x] Implement the smallest high-value fixes with tests and documentation updates.
- [x] Re-run direct, adjacent, and full validation after each material repair.
- [x] Inspect GitHub workflow health for the active branch and classify any remote blockers.
- [x] Record results, remaining risks, and final verdict.

## Remaining Items (for future cycles)

- [ ] Fix DB SSL `rejectUnauthorized: false` in production (Risk: 45 — needs Railway PG testing)
- [ ] Review rate limiting `skipSuccessfulRequests` policy (Risk: 30 — needs product decision)
- [ ] Remove unused `framer-motion` dependency from main (Risk: 15)
- [ ] Add Content-Security-Policy header (Risk: 25 — needs inline script audit)
- [ ] Clean up `as any` type casting in routes/storage (Risk: 15)
- [ ] Add input length limits on text fields (Risk: 10)
