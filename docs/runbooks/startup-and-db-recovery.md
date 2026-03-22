# Startup and Database Recovery Runbook

## Symptoms

- `npm run dev`, `npm run start`, or `npm run start:e2e` exits during boot.
- `/health` returns `503` or reports `"database":"down"`.
- GitHub Actions fails on schema push or integration tests.

## Immediate checks

1. Confirm required runtime variables are present:
   - `DATABASE_URL`
   - `SESSION_SECRET`
2. Verify the database is reachable:

```bash
curl -s http://127.0.0.1:5000/health
```

3. Re-run schema sync against the intended database:

```bash
npx drizzle-kit push
```

4. If the app is already running, inspect the structured startup log for:
   - `message:"server failed to boot"`
   - `message:"request failed"`
   - `message:"database pool close failed"`

## Local recovery

1. Re-create local dependencies cleanly:

```bash
npm ci
npm --prefix mobile ci
```

2. Start the production-like server with explicit safe local settings:

```bash
DATABASE_URL='postgresql://user@localhost:5432/abs_prefstudio_test' \
DATABASE_SSL_MODE=disable \
SESSION_SECRET='replace-with-a-local-test-secret-of-at-least-32-chars' \
AI_PROVIDER=none \
npm run start:e2e
```

3. Re-run the stateful validation path:

```bash
npm run test:integration
```

## Railway recovery

1. Confirm Railway environment variables match `.env.example`.
2. Validate the deployed service health endpoint:

```bash
curl https://<railway-domain>/health
```

3. If health is degraded after a deployment, roll back to the previous successful deployment from Railway.
4. Re-apply the database schema only after confirming the target environment is correct.

## Rollback guidance

- Application rollback: deploy the previous successful Git revision and verify `/health`.
- Schema rollback: only run a down migration if one exists and was tested. This repository primarily uses `drizzle-kit push`, so the safe fallback is restoring the last known-good database snapshot before re-deploying the older app revision.

## Evidence to collect during an incident

- Last structured startup log line
- `/health` response body
- Output of `npx drizzle-kit push`
- Exact commit SHA and deployment ID
