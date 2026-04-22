# Constitution — Technical Principles

Core principles guiding development in this project.

## Philosophy

**Spec-driven development**: Write WHAT + WHY before HOW. Clear specs prevent implementation waste.

**Ship fast, break nothing**: Automate testing & deployment. Catch regressions early. Fail safely.

**Data ownership**: If handling user data, keep it local when possible. Minimize SaaS dependencies.

## Technical Principles

### 1. Explicit > Implicit
- Prefer clear function signatures over hidden behavior
- Validate inputs at system boundaries (user input, external APIs)
- Don't validate internal code — trust types

### 2. Tests First (for new code)
- Unit tests for business logic (`src/`) — vitest
- Integration tests for APIs
- Coverage gates CI (can be lowered, not removed)
- `npm test` must pass before commit

### 3. TypeScript Strict Mode
- No `any` — use `unknown` + type narrowing
- All functions have explicit return types
- All parameters have explicit types
- Enable `strictNullChecks` — null/undefined must be handled

### 4. Single Responsibility
- One file = one concept
- Functions ≤30 lines (smaller is better)
- Classes ≤100 lines (smaller is better)
- Move related code together, not just by pattern

### 5. Code is Communication
- Names matter: `getUserId` not `get_id`
- 1-line comments only for WHY, not WHAT
- Delete old comments — they rot
- PR description > code comments

### 6. No Half-Finished Work
- Feature flags only if needed for gradual rollout
- Don't add abstractions for hypothetical future use
- Three similar lines is better than premature refactor
- Delete dead code — don't leave "for future use"

### 7. Errors Should Be Loud
- Throw on invalid input (at boundaries)
- Log warnings for recoverable issues
- Let errors bubble up rather than swallowing silently
- Test error paths, not just happy path

## Deployment Principles

### 1. Automation Over Manual
- All deployments scripted (no manual SSH commands in production)
- CI/CD gates: lint → test → build → deploy
- Rollback script always ready
- Health checks after deploy

### 2. Environment Parity
- Development environment ≈ production
- Docker Compose for local, Docker for production
- `.env` same structure everywhere (not `.env.dev`, `.env.prod`)

### 3. Secrets Management
- All secrets in `.env` (never in code)
- `.env` is gitignored
- `.env.example` documents required vars
- GitHub Secrets for CI/CD only

### 4. Zero-Downtime Preferred
- Backwards compatibility when possible
- Rolling deploys if infrastructure allows
- Feature flags for risky changes
- Database migrations non-blocking

## Git Workflow

### Branching
- `main` = production-ready
- Feature branches: `feature/short-description` or `NNN-feature-name` (spec number)
- Hotfix branches: `hotfix/bug-description`

### Commits
- Conventional format: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Atomic commits: one logical change per commit
- Messages ≤50 chars (subject), details in body
- Example: `feat: add date injection to agent context`

### PRs
- Link to spec/issue if applicable
- Include test results
- Auto-merge enabled for dependabot patches
- Manual approval required for main merge

## Code Quality Gates

| Check | Tool | Gate |
|-------|------|------|
| Lint | ESLint | Must pass |
| Format | Prettier | Auto-fix on commit |
| Types | TypeScript | Strict mode, no errors |
| Tests | Vitest | Coverage ≥60% |
| Build | tsc | Must succeed |

All must pass before merge to main.

## Decision Log

### Why TypeScript?
Type safety + IDE support > dynamic typing speed. Prevents runtime errors. Worth the build step.

### Why Vitest?
Fast, modern, Vite-native. Better than Jest for this stack.

### Why Docker?
Environment consistency. Easy local dev, easy production deploy. Worth learning curve.

### Why Conventional Commits?
Machine-readable changelog. Enables semantic versioning. Auto-release + changelog generation.

### Why GitHub Actions?
Free, native to GitHub, zero setup. No self-hosted runners needed.

## When to Break These Rules

1. **Security** — always prioritize. Break any rule for security.
2. **Performance** — if profiled + measured, trade clarity for speed
3. **Pragmatism** — if rule prevents shipping, discuss breaking it
4. **Learning** — if breaking rule teaches something, OK once

Always document WHY when breaking a rule (commit message or code comment).

## Feedback Loop

These principles are not dogma. If you find them limiting:
1. Document the issue
2. Propose alternative
3. Discuss with team
4. Update constitution if agreed

---

**Core Goal**: Code that's easy to understand, test, deploy, and maintain. Fast shipping + high confidence.
