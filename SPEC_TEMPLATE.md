# Feature Specification Template

Copy this to `specs/NNN-your-feature/spec.md` and fill in sections.

---

# Feature Specification: [Title]

**Feature Branch**: `feature/[kebab-name]`  
**Created**: YYYY-MM-DD  
**Status**: Draft | In Review | Approved | Implemented  
**Spec dir**: `specs/NNN-your-feature`

---

## Overview

One-paragraph summary of what this feature is and why it matters.

---

## User Scenarios & Acceptance Criteria _(mandatory)_

List user journeys. For each:
- **Priority**: P1 (blocks shipping) | P2 (nice-to-have) | P3 (future)
- **Given/When/Then** format (BDD style)
- **Why**: Why this priority?
- **Independent test**: Can this be tested in isolation?

### Scenario 1: [Title]

**Priority**: P1

**Why**: Explain why this is blocking/important.

**Independent Test**: How to verify this works without other features.

**Acceptance Criteria**:

1. **Given** [state], **When** [action], **Then** [result]
2. **Given** [state], **When** [action], **Then** [result]
3. **Given** [state], **When** [action], **Then** [result]

### Scenario 2: [Title]

[Same format as Scenario 1]

---

## Out of Scope

List what is intentionally NOT included (prevents scope creep).

- ❌ Example: Multi-language support
- ❌ Example: Offline mode
- ❌ Example: Admin dashboard

---

## Technical Requirements

### Data Flow

ASCII diagram or text description of how data moves through the system.

```
User Input → Validation → Processing → Storage → Response
```

### API Contract

If this feature exposes APIs, define them here (or link to contracts/ folder).

```
POST /api/thing
{
  "id": "string (UUID)",
  "name": "string (required, 1-255 chars)",
  "type": "enum: ['A', 'B', 'C']"
}

Response 201:
{
  "id": "string",
  "createdAt": "ISO8601"
}
```

### Dependencies

List external services, libraries, or systems this feature depends on.

- Service: example-api (v2.0+)
- Library: date-fns (v3.0+)
- Internal: `src/services/vault.ts`

### Constraints & Assumptions

- Assumes daily tasks < 100 items
- Requires local disk access
- Cannot block on external API > 5s timeout
- User timezone = fixed (Argentina)

---

## Success Metrics

How do we know this feature is working?

- Scenario 1 acceptance criteria all pass
- Scenario 2 acceptance criteria all pass
- Performance: queries complete in < 200ms
- Coverage: unit tests ≥ 80% for feature code

---

## Questions & Unknowns

List clarifications needed before planning. Use `[NEEDS CLARIFICATION]` markers.

- [NEEDS CLARIFICATION] Should date calculations account for DST?
- [NEEDS CLARIFICATION] What if vault is offline?
- Question: How often does this run (frequency)?

---

## Notes

Additional context, research, references, or gotchas.

- Related to WF-XX feature (link to vault note)
- Similar feature shipped in [other project] (link + lessons learned)
- Gotcha: Date parsing libraries have timezone bugs (see research.md)
