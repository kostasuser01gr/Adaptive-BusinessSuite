# Hardening Lessons

- Start every hardening pass in a clean worktree when the primary checkout contains unrelated uncommitted changes.
- Match wrapper components to the installed third-party API surface before assuming type names or exports.
- Avoid iterator spread over `Map.values()` in code compiled under the repository's current TS target assumptions; prefer `Array.from(...)`.
- In this repository, production-like Playwright validation should use `PLAYWRIGHT_USE_PROD_SERVER=1` so server lifecycle, cookies, and CSRF state remain aligned with test expectations.
- When validating production-cookie behavior over plain HTTP, expect `SESSION_COOKIE_SECURE=true` to block session-backed CSRF flows; use `SESSION_COOKIE_SECURE=false` and `SESSION_COOKIE_SAME_SITE=lax` only for explicit local test probes.
- The Docker deployment surface depends on the local Colima runtime being active before `docker build` or `docker run` can serve as evidence.
- For mobile SBOM generation, prefer `npm exec --package=@cyclonedx/cyclonedx-npm -- cyclonedx-npm ...` over raw `npx` when the bootstrap path is unstable.
