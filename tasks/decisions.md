# CODEX V7 — Decisions Log

## D-001: npm audit moderate vulnerabilities accepted
- **Decision**: Do not force-fix the 4 moderate esbuild vulnerabilities
- **Rationale**: All 4 are in `drizzle-kit` (dev dependency only), fix requires breaking change to drizzle-kit@0.18.1. Dev-only, not shipped to production.
- **Alternatives rejected**: `npm audit fix --force` — would break drizzle-kit
- **Risk**: LOW — dev dependency only, not in production bundle

## D-002: .env must be added to .gitignore
- **Decision**: Add `.env` to `.gitignore` immediately
- **Rationale**: Contains SESSION_SECRET (64-char hex key). Would be committed to public repo.
- **Risk if not done**: CRITICAL — credential exposure in git history
