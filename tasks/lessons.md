# CODEX V7 — Lessons Learned

## L-001: Always verify .gitignore covers .env before any commit
- **Context**: .env with SESSION_SECRET was not in .gitignore
- **Prevention**: Check .gitignore for .env coverage as first step in any hardening pass
