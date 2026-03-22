# Decisions Log

## 2026-03-22 - Current Audit Scope

### Decision

Run a fresh audit and validation cycle against the current dirty worktree instead of claiming success from earlier hardening artifacts.

### Rationale

The repository contains substantial uncommitted changes across workflows, client, server, tests, and Spec Kit files. Prior evidence does not prove the safety or correctness of the current state.

### Alternatives Rejected

- Reuse prior `.codex-evidence/` outputs as current proof.
  Rejected because the evidence predates the present worktree state.
- Normalize the worktree before validating.
  Rejected because those changes appear user-owned and reverting them would be destructive.

### Assumptions

- Existing dirty changes outside the new Spec Kit files are intentional until proven otherwise.
- Local validation can still provide meaningful risk classification without mutating unrelated work.

## 2026-03-22 - Minimal Edit Policy

### Decision

Restrict edits to task/evidence artifacts and only the smallest hardening changes that address present blockers or reproducibility failures.

### Rationale

The branch already contains broad modifications. Adding wide-scope code changes without a narrow failure target would increase merge risk and reduce confidence in causality.

### Alternatives Rejected

- Perform repo-wide cleanup and hardening edits immediately.
  Rejected because the blast radius is too large for the current dirty state.

## 2026-03-22 - Secret Exposure Handling

### Decision

Classify hardcoded credentials in deployment examples and secret-shaped local env content as security findings even when live rotation is not yet possible from local evidence alone.

### Rationale

Unsafe secret patterns are meaningful risk regardless of whether the specific values are placeholders, because they encourage insecure operational behavior and can become real by copy-paste.

### Alternatives Rejected

- Ignore ignored files and untracked deployment examples.
  Rejected because the user requested full-scale hardening and release-gate discipline.

## 2026-03-22 - Recharts Type Repair

### Decision

Apply a minimal type-only fix in `client/src/components/ui/chart.tsx` to align the tooltip and legend helper props with the installed Recharts type surface.

### Rationale

The root `npm run lint` failure was isolated to this single file and blocked the entire static safety layer. The repair changes typings and React keys only, without changing chart behavior.

### Alternatives Rejected

- Downgrade TypeScript strictness or suppress the errors.
  Rejected because it would hide a concrete incompatibility instead of fixing it.
- Leave the lint layer red and classify it as unrelated.
  Rejected because the file is in the active application path and the failure is deterministic.

## 2026-03-22 - Schema Provisioning Workaround

### Decision

Provision the disposable audit database with the checked-in SQL migration through `psql` instead of relying on `drizzle-kit push`.

### Rationale

`drizzle-kit push` entered an interactive prompt in the non-interactive shell, leaving the database empty and contaminating the integration/E2E results. Applying the checked-in migration directly is deterministic and auditable.

### Alternatives Rejected

- Treat the database layer as blocked and stop after unit/build checks.
  Rejected because a reachable local PostgreSQL instance was available.
- Keep retrying `drizzle-kit push` without changing approach.
  Rejected because the failure mode was clearly interactive rather than transient.
