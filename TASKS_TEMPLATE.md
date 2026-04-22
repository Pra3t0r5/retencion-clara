# Tasks Template

Copy to `specs/NNN-your-feature/tasks.md`.

---

# Tasks: [Feature Title]

**Status**: Ready | In Progress | Complete  
**Priority**: P1 | P2  
**Effort**: N tasks over N days  

Execute in order. Mark `[x]` when done. `[P]` = can run parallel.

---

## Phase 1: Foundation

### Task 1.1: Create core service
- [ ] Create `src/services/thing.ts` with main interface
- [ ] Export types: `ThingConfig`, `Thing`, `ThingError`
- [ ] Add JSDoc comments to exported functions
- **Test**: `npm test -- services/thing` passes
- **Time**: 2h

### Task 1.2: Add unit tests
- [ ] Create `tests/services/thing.test.ts`
- [ ] Test happy path + 3 error cases
- [ ] Coverage ≥ 80% for service
- **Test**: `npm test` passes, coverage report shows ≥80%
- **Time**: 1h

### Task 1.3: Integrate with logger
- [ ] Import logger in service
- [ ] Add debug logs for function entry + important steps
- [ ] Add warn logs for recoverable errors
- [ ] Add error logs for failures
- **Test**: `npm test` passes, no new console errors
- **Time**: 30m

---

## Phase 2: Integration

### Task 2.1: Create API endpoint
- [ ] Create `src/routes/thing.ts` with `POST /api/thing` endpoint
- [ ] Add request validation (schema defined in spec.md)
- [ ] Add response serialization
- [ ] Wire into main app (`src/index.ts`)
- **Test**: Manual: `curl -X POST http://localhost:3000/api/thing -d '...'` works
- **Time**: 2h

### [P] Task 2.2: Add error handling
- [ ] Catch service errors, map to HTTP status codes
- [ ] Return error response in standard format
- [ ] Log errors with context
- **Test**: `curl ... | jq` shows error with 400/500 status
- **Time**: 1h

### [P] Task 2.3: Add request validation
- [ ] Define input schema
- [ ] Validate before passing to service
- [ ] Return 400 + validation errors on invalid input
- **Test**: `curl with invalid input` returns 400 with error details
- **Time**: 1h

### Task 2.4: Integration tests
- [ ] Create `tests/integration/api.test.ts`
- [ ] Test API endpoint with valid input
- [ ] Test 3 error cases (invalid input, service error, etc.)
- **Test**: `npm test -- integration` passes
- **Time**: 2h

---

## Phase 3: Polish & Docs

### Task 3.1: Increase test coverage
- [ ] Review coverage report: `npm run test:coverage`
- [ ] Add tests for uncovered branches
- [ ] Aim for ≥ 80% coverage
- **Test**: Coverage report shows ≥80%, all scenarios covered
- **Time**: 1h

### Task 3.2: Write documentation
- [ ] Create `specs/NNN-feature/quickstart.md` with code examples
- [ ] Add API documentation in code (JSDoc)
- [ ] Add example `.env` vars if needed
- **Test**: Someone can read quickstart + implement feature without asking questions
- **Time**: 1h

### Task 3.3: Performance validation
- [ ] Run load test: 100 requests/second
- [ ] Measure latency (p50, p95, p99)
- [ ] Verify < 200ms latency at p95
- **Test**: Load test passes, latencies meet threshold
- **Time**: 1h

### Task 3.4: Final review
- [ ] Run full test suite: `npm test`
- [ ] Run linting: `npm run lint`
- [ ] Check formatting: `npm run format:check`
- [ ] Manual smoke test in Docker Compose
- **Test**: All pass, feature works end-to-end
- **Time**: 30m

---

## Notes

- `[P]` tasks can run in parallel (they don't block each other)
- If any test fails, fix root cause before continuing
- Commit after each phase (3 commits total for this feature)
- PRs should have pass tests before review

---

## Sign-Off

- [ ] All tasks complete
- [ ] Tests pass: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] Coverage ≥ 80%
- [ ] Documentation complete
- [ ] Ready for PR review

**Next**: Open PR, wait for human review + approval
