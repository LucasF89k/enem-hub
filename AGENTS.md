# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

---

# Project Handoff

Read `PROJECT_STATE.md` before writing any code. It contains:
- Exact package versions and breaking API differences
- Prisma field names that differ from what you expect (e.g. `streak` not `streakDays`, `userSimulado` not `userAttempt`)
- All 18 implemented sessions and what each one built
- Pending sessions 19–22
- Security rules (never use Anthropic SDK, never commit .env)
- Known pitfalls and their solutions
