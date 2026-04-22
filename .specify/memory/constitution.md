<!--
SYNC IMPACT REPORT
==================
Version change: [unversioned template] → 1.0.0
Modified principles: All — initial fill from template placeholders
Added sections: Core Principles (I–V), Tax Domain Constraints, Development Workflow, Governance
Removed sections: None
Templates requiring updates:
  ✅ plan-template.md — Constitution Check section references principles by name; no structural change needed
  ✅ spec-template.md — No constitution-specific sections; compatible as-is
  ✅ tasks-template.md — No constitution-specific sections; compatible as-is
  ✅ commands/ — Directory does not exist; no commands templates to update
Follow-up TODOs:
  - TODO(INDUMENTARIA_CAP): Clarify whether indumentaria cap is cumulative per fiscal year or per semester (open question in spec.md)
  - TODO(ARCA_H2): Add 2026-H2 tables to src/tablas/ when ARCA publishes (expected July 2026)
  - TODO(SAC): Specify SAC handling rule for June/December before implementing month projection
-->

# RetenciónClara Constitution

## Core Principles

### I. Zero Backend — Privacy-First (NON-NEGOTIABLE)

All tax computation MUST run client-side in the browser. Salary data and deduction figures MUST
never be transmitted to any server. No backend endpoints, no telemetry pipeline, no user
accounts, no cloud storage of payslip data. The AI extraction path (Claude API) is strictly
optional and opt-in; the calculator MUST function fully without it. Any feature that would
require transmitting payslip data off-device is out of scope.

**Rationale**: Users enter sensitive employment and income data. The zero-backend constraint is
the primary privacy guarantee and MUST not be relaxed for convenience.

### II. Tax Math is Authoritative

The calculator engine (`src/engine/`) MUST produce results that match ARCA's official retention
computation within ±$100 per acceptance criterion. ARCA table values in `src/tablas/` are the
single source of truth for brackets, deduction caps, and annual limits. Tables MUST be updated
when ARCA publishes new semester values; stale tables are a correctness bug, not a tech-debt
item. Every bracket, cap, and deduction rule applied by the engine MUST be traceable to a
specific ARCA publication or a verified real payslip.

**Rationale**: The app's sole value proposition is accurate tax preview. A calculator that
disagrees with the employer's system destroys user trust.

### III. Test-First for Engine

Unit tests for `src/engine/` MUST be written before implementation. Tests MUST fail before the
implementation is written (Red), then be made to pass (Green). The standard test fixture is
Fernando Albertengo's verified March 2026 payslip data (defined in `specs/001-tax-calculator/
spec.md`). Engine code MUST reach ≥60% line coverage before any UI work for a given feature is
merged. React imports MUST NOT appear in `src/engine/`.

**Rationale**: The engine is pure math; it is fully testable without a browser. Untested engine
code that ships can silently compute wrong retentions with no visible error.

### IV. Spec-Driven Workflow

Every feature starts from a spec. The implementation sequence is:
`specs/NNN/spec.md` → `specs/NNN/plan.md` → `specs/NNN/tasks.md` → implement → test → commit → PR.
No code change for a new feature is permitted without a corresponding spec entry. Out-of-scope
items listed in a spec MUST NOT be implemented unless the spec is amended.

**Rationale**: Prevents scope creep and ensures each increment is independently testable and
deliverable.

### V. Simplicity — YAGNI

No CSS framework. Styling uses inline styles only (matches current `src/components/` convention).
No abstractions beyond what the current spec requires. Three similar lines are preferable to a
premature helper. No half-finished implementations. No backwards-compatibility shims for removed
code. Complexity MUST be justified in `plan.md`'s Complexity Tracking table before it is
introduced.

**Rationale**: The app is a single-user tax preview tool with a narrow scope. Unnecessary
complexity increases maintenance burden without delivering user value.

## Tax Domain Constraints

These rules reflect Argentine tax law (Art. 94, 4ta categoría) and MUST be respected by any
engine implementation:

- Calculation is CUMULATIVE from January of the fiscal year. Monthly retention = cumulative
  impuesto determinado − prior accumulated retentions.
- Deduction caps (ARCA 2026 H1):
  - Cuota médica: 5% of Resultado Neto before this deduction
  - Indumentaria: up to annual GNI ($5.151.802,50) — TODO(INDUMENTARIA_CAP): confirm
    per-fiscal-year vs. per-semester
  - GNI: $429.317,08/month ($5.151.802,50/year)
  - Deducción especial: $2.060.721/month ($24.728.652/year)
  - Cónyuge: $4.851.964,66/year
  - Hijo/a: $2.446.863,48/year each
- F.572 rectificativas: employer applies declared deductions in the NEXT payslip, retroactively
  covering prior months. The gap between declared and applied deductions is the primary insight
  the app surfaces.
- Only 4ta categoría (dependency employment) is supported. Other categories are out of scope.
- Only the current fiscal year (2026) is supported. Historical years are out of scope.

## Development Workflow

- Branch naming: `feature/NNN-short-description` (spec number prefix required)
- Engine (`src/engine/`): pure TypeScript, zero React/DOM imports, fully unit-testable
- Tables (`src/tablas/`): one file per semester (e.g., `2026-H1.ts`); update when ARCA publishes
- Components (`src/components/`): React + TypeScript, inline styles
- Tests (`tests/`): Vitest, run with `npm test`
- Deployment: Vercel static site — no server-side rendering, no API routes
- Before merging any engine change: run `npm test`, verify all acceptance criteria pass
- Before merging any UI change: manually verify the primary user flow in a browser

## Governance

This constitution supersedes all other practices documented in this repository. When a practice
described elsewhere conflicts with a principle here, this constitution takes precedence.

Amendment procedure:
1. Update `.specify/memory/constitution.md` (increment version per SemVer rules below)
2. Add a Sync Impact Report comment at the top of the file
3. Propagate changes to dependent templates and `CLAUDE.md` as needed
4. Commit with message: `docs: amend constitution to vX.Y.Z (<reason>)`

Versioning policy:
- MAJOR: backward-incompatible governance change or principle removal/redefinition
- MINOR: new principle or section added, or materially expanded guidance
- PATCH: clarifications, wording fixes, non-semantic refinements

All PRs MUST verify compliance with the five Core Principles. Complexity violations MUST be
justified in `plan.md`. Runtime development guidance lives in `CLAUDE.md`.

**Version**: 1.0.0 | **Ratified**: 2026-04-22 | **Last Amended**: 2026-04-22
