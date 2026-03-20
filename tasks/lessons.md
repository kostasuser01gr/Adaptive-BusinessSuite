# Hardening Lessons

- Start every hardening pass in a clean worktree when the primary checkout contains unrelated uncommitted changes.
- Match wrapper components to the installed third-party API surface before assuming type names or exports.
- Avoid iterator spread over `Map.values()` in code compiled under the repository's current TS target assumptions; prefer `Array.from(...)`.
- In this repository, production-like Playwright validation should use `PLAYWRIGHT_USE_PROD_SERVER=1` so server lifecycle, cookies, and CSRF state remain aligned with test expectations.
