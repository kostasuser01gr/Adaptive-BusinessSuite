# CODEX V7 — Task Tracker

## Modes
- **hardening** (primary)
- **audit**
- **release**

## Plan
1. Discovery & topology mapping
2. Fix CRITICAL secret exposure (.env not in .gitignore)
3. Static analysis — fix all TS errors, lint issues
4. Security hardening — auth/session/RBAC completion
5. Test coverage — add missing critical path tests
6. Live validation — start services, validate all flows
7. Adversarial hardening probes
8. Evidence collection — SBOM, manifests, checksums
9. Git commit, push, remote CI validation
10. Final report — all 22 required sections

## Current Phase
Phase 1: Discovery (COMPLETE)
Phase 2: Secret exposure fix (IN PROGRESS)

## Checklist
- [x] TypeScript check baseline: 0 errors
- [x] Production build baseline: SUCCESS (5.75s)
- [x] Test suite baseline: 39 pass, 0 fail, 7 skipped
- [x] npm audit: 4 moderate (esbuild via drizzle-kit dev dep — acceptable)
- [x] Secret scan: .env NOT in .gitignore — CRITICAL
- [x] Repository topology mapped
- [x] CI workflows identified (CI, CodeQL, Security)
- [ ] .env added to .gitignore
- [ ] Security hardening complete
- [ ] Test coverage expanded
- [ ] Live validation 3-pass
- [ ] GitHub push + remote CI green
- [ ] Evidence manifest complete

## Blockers
- None currently

## Blast-Radius Notes
- .env secret exposure affects entire auth surface
- Phase 4 (Security/Auth) from prior work was incomplete — needs completion

## Validation Map
| Layer | Status | Evidence |
|-------|--------|----------|
| A. Dependency Integrity | PARTIAL — 4 moderate (dev dep) | npm audit output |
| B. Static Hygiene | PASS | tsc --noEmit clean |
| C. Type Safety | PASS | tsc --noEmit clean |
| D. Build Integrity | PASS | vite build + esbuild |
| E. Unit Validation | PASS — 39/39 | npm test output |
| F. Integration | SKIPPED — 7 (no DB) | needs live DB |
| G. Contract | PENDING | |
| H. Stateful Safety | PENDING | |
| I. Backend Live | PENDING | |
| J. Worker/Realtime | PENDING | |
| K. Frontend/UI Live | PENDING | |
| L. Visual/Regression | N/A | |
| M. Security | CRITICAL — .env exposure | |
| N. Performance | PENDING | |
| O. Install/Package | PENDING | |
| P. Backward Compat | PENDING | |
| Q. Post-Deploy | N/A — no deploy target | |

## Time Budget
| Phase | Budget | Actual |
|-------|--------|--------|
| Discovery | 10min | ~5min |
| Secret fix | 5min | — |
| Static fixes | 15min | — |
| Security | 30min | — |
| Tests | 20min | — |
| Live validation | 20min | — |
| Adversarial | 15min | — |
| Evidence | 10min | — |
| Push/CI | 10min | — |
| Report | 10min | — |
