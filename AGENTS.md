# AGENTS.md — AI Agent Configuration

Permissions, memory rules, and operational guidelines for AI agents working in this repo.

## When This Applies

If this project will be worked on by Claude Code, Copilot, or other AI agents — fill this out. If manual development only, leave as template.

## Agent Permissions

### Read-Only (Always Safe)
- Read any file in `specs/`, `docs/`, `tests/`
- Read configuration files (`package.json`, `tsconfig.json`, etc.)
- Grep/search for context

### Allowed (With Guardrails)
- **Edit code in `src/`** — follow TypeScript strict mode + tests required
- **Create/edit tests** — must follow vitest patterns
- **Update specs** — only if clarifying, not changing scope
- **Edit `Makefile`** — only if adding developer convenience targets
- **Edit CI/CD workflows** — only with explicit approval

### Forbidden
- **Delete files** — always ask first
- **Force-push** — never
- **Modify secrets/`.env`** — only provide instructions
- **Change Node.js version** — only if justified in `constitution.md`
- **Modify `constitution.md`** — only technical decisions, rationale required

## AI-Friendly Code Practices

When writing code in `src/`:
- Use descriptive variable names (avoid single letters outside loops)
- Add 1-line comments only for WHY, not WHAT
- Keep functions ≤30 lines (split if longer)
- Export clear interfaces/types for AI introspection

## Memory & Context

### What Agents Should Know
- Project structure is spec-driven (read `specs/*/plan.md` before implementing)
- All feature work = spec first (WHAT + WHY), then plan (HOW), then code
- Tests are not optional (coverage gates CI)
- Environment setup: copy `.env.example` → `.env`

### What Agents Should Remember Across Sessions
- **Technology stack**: TypeScript 5.8, Node.js 22, Hono/Express framework
- **Code style**: Prettier config enforced, no `any` in TypeScript
- **Deployment**: Docker Compose locally, SSH/SCP to production VM
- **CI/CD**: GitHub Actions auto-runs lint/test/build on push

## Communication Protocol

### Asking for Help
Agent should ask human if:
1. Spec is ambiguous → request clarification
2. Task would break existing tests → discuss before proceeding
3. Large refactor needed → confirm scope first
4. New dependency required → explain why
5. Need to delete code/files → ask first

### Confirming Completion
Before marking task done:
- `npm test` passes
- `npm run lint` passes
- `npm run format:check` passes
- No console warnings/errors
- Tests cover new code

## Secrets & Credentials

**NEVER** in code:
- API keys
- Database passwords
- Auth tokens
- Private URLs

**Instead**:
- Reference `.env` variables via `process.env.API_KEY`
- Document required vars in `.env.example`
- Use GitHub Secrets for CI/CD

## Example Agent Workflow

```
1. Agent reads feature spec in specs/NNN-feature/spec.md
2. Agent reviews plan in specs/NNN-feature/plan.md
3. Agent breaks down specs/NNN-feature/tasks.md
4. Agent implements per plan:
   - Create files in src/
   - Write tests in tests/
   - Run `make test` + `make lint`
   - Commit with conventional message
5. Agent asks human to review PR
6. Human merges → CI runs, auto-deploy on main
```

## Tools & Integrations

### Allowed
- `npm` — install/run scripts
- `git` — commit (atomic, conventional messages)
- `make` — run tasks from Makefile
- `docker` — build/run containers
- GitHub API (`gh` CLI) — read-only operations

### Not Allowed
- `sudo` — never needed
- Database shell access — use APIs
- Direct SSH — only scripted deploys

## When Stuck

If agent encounters error:
1. **Check error message** — full context, don't guess
2. **Search tests** — how similar problems solved before
3. **Ask human** — don't force through without understanding
4. **Revert gracefully** — if change broke something, undo it

## Feedback Loop

After completing work:
1. Run full CI locally (`make ci`)
2. Commit with conventional message
3. Push to feature branch
4. Open PR (auto-templated)
5. Wait for human approval before merge

---

**Agent Golden Rule**: Code quality > shipping speed. Tests must pass. Specs must match implementation.
