# CI Validation Recovery Runbook

## Symptoms

- `CI`, `Security`, or `CodeQL` is red for a branch that is green locally.
- E2E or integration jobs fail after a workflow change.

## Immediate checks

1. Confirm the branch head being tested remotely matches the local commit:

```bash
git rev-parse HEAD
gh run list --branch "$(git rev-parse --abbrev-ref HEAD)" -L 5
```

2. Inspect the failing run logs:

```bash
gh run view <run-id> --log
```

3. Re-run the matching local validation path:

```bash
npm run validate
DATABASE_URL='postgresql://user@localhost:5432/abs_prefstudio_test' \
DATABASE_SSL_MODE=disable \
SESSION_SECRET='playwright-local-session-secret-not-for-production-0001' \
SESSION_COOKIE_SECURE=false \
SESSION_COOKIE_SAME_SITE=lax \
AI_PROVIDER=none \
PLAYWRIGHT_USE_PROD_SERVER=1 \
npx playwright test
```

## Known workflow invariants

- GitHub Actions are pinned to immutable SHAs.
- The CI database service requires `DATABASE_SSL_MODE=disable`.
- Playwright production-like orchestration must use `PLAYWRIGHT_USE_PROD_SERVER=1`.
- Security scanning must remain free of HIGH/CRITICAL findings and secret leaks.

## Recovery actions

1. If local and remote both fail, fix the root cause locally first.
2. If only remote fails, compare:
   - Node version from `.nvmrc`
   - missing environment variables
   - workflow permission or timeout changes
   - artifact upload or Playwright browser install failures
3. Push the smallest safe fix and watch the exact new run to completion:

```bash
gh run watch <run-id> --exit-status
```

## Rollback guidance

- If the failure came from a workflow-only change, revert the workflow commit and push.
- If the failure came from code plus workflow drift, restore the last fully green commit and re-apply changes in a clean branch.
