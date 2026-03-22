# Hardening Lessons

- Never trust prior hardening artifacts as current proof when the worktree is still dirty; rerun validation for the present revision before making release-grade claims.
- Treat ignored local environment files as operational risk if they contain secret-shaped values, even when they are not tracked in git.
- Compose or deployment examples with literal credentials are still security debt because they normalize unsafe copy-paste behavior and can leak into real environments.
- When `drizzle-kit push` requires a TTY, do not keep retrying the same non-interactive command; fall back to the checked-in SQL migration if the goal is runtime validation rather than migration authoring.
- Separate contaminated browser evidence from clean reruns. A later green rerun can prove the real state, but the original mixed run must still be kept and explained.
- Start every session with the required environment snapshot and preserve user-owned uncommitted work before branching or editing.
- Wrapper components around third-party UI libraries must track the actual exported API names from the installed package, not older upstream examples.
- Avoid iterator spread on `Map.values()` when the repository compiler target is effectively ES5; use `Array.from(...)` for compatibility instead of changing compiler semantics blindly.
- Never add dependencies without verifying they are actually imported somewhere in the codebase. Unused deps expand attack surface for zero benefit.
- Entity ownership must be enforced at the storage/DB layer (WHERE clause), not just the route layer, to eliminate TOCTOU race conditions.
- CSV export endpoints must escape formula-starting characters (`=`, `+`, `-`, `@`, `\t`) to prevent CSV injection when users open exports in spreadsheet software.
- CI actions should always be pinned to exact SHA commits, not floating version tags, to prevent supply chain attacks via tag mutation.
- When adding security headers, avoid CSP initially — it requires a full audit of inline scripts/styles and can break the UI if misconfigured.
