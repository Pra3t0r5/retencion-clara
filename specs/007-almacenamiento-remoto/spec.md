# Feature Specification: Almacenamiento Remoto con Cuenta

**Feature Branch**: `feature/007-almacenamiento-remoto`
**Created**: 2026-04-24
**Status**: Draft

## Overview

Users can create an account and have their payslip data, F.572 declarations, and settings
automatically synced to a secure remote backend. Data is accessible from any device. This
spec covers the storage and sync layer — authentication foundations are defined in spec 004.
Privacy is paramount: data is encrypted end-to-end and no third party can read salary figures.

---

## User Scenarios & Testing

### User Story 1 — Automatic Sync on Data Entry (Priority: P1)

When an authenticated user adds or updates a payslip or F.572 declaration, the data is
automatically synced to the backend within seconds. No explicit "save" button required.

**Why this priority**: Friction-free sync is the core value proposition of remote storage.
Users who have to remember to save will lose data.

**Independent Test**: Add March payslip on Device A → open app on Device B → March payslip
visible without any manual action.

**Acceptance Scenarios**:
1. **Given** authenticated user adds a payslip, **When** saved locally, **Then** data synced
   to backend within 5 seconds if online
2. **Given** user is offline when adding data, **When** connection restored, **Then** data
   syncs automatically (offline-first queue)
3. **Given** same user on two devices, **When** data added on Device A, **Then** Device B
   shows updated data within 10 seconds

---

### User Story 2 — Data Privacy and Encryption (Priority: P1)

Salary data is encrypted on the client before leaving the device. The backend stores only
ciphertext — the server operator cannot read users' salary figures.

**Why this priority**: Salary data is highly sensitive. The zero-knowledge guarantee is a core
trust requirement for this app — especially given it's used by real family members with real
financial data.

**Independent Test**: Inspect network traffic during sync → payload contains no readable
ARS amounts or employer names. Server-side database shows only encrypted blobs.

**Acceptance Scenarios**:
1. **Given** user data synced, **When** server database inspected directly, **Then** no
   plaintext salary figures visible
2. **Given** user changes their password, **When** re-encryption triggered, **Then** all
   stored data is re-encrypted with new key
3. **Given** user account deleted, **When** deletion confirmed, **Then** all encrypted data
   purged from server within 24 hours

---

### User Story 3 — Export and Delete My Data (Priority: P2)

User can download all their data as a JSON file or delete their account entirely. Complies
with the user's right to data portability and erasure.

**Why this priority**: Privacy compliance and user trust. Users must own their data.

**Independent Test**: Click "Exportar mis datos" → JSON file downloaded containing all payslips
and F.572 declarations in plaintext (decrypted locally before export).

---

### User Story 4 — Shared Family Access (Priority: P3)

A primary account holder can invite one additional family member (read-only access) to view
the same data. Useful for a couple reviewing combined tax exposure.

**Why this priority**: In-family app — sharing within a household is the natural use case.
Lower priority because it requires multi-user data isolation to already be solid.

---

## Requirements

### Functional Requirements

- **FR-001**: Authenticated users' data MUST sync automatically without explicit user action
- **FR-002**: App MUST work fully offline — syncs when reconnected (offline-first)
- **FR-003**: Salary data MUST be encrypted client-side before transmission (E2E encryption)
- **FR-004**: Server MUST store only ciphertext — no plaintext salary data at rest
- **FR-005**: Users MUST be able to export all their data as a decrypted JSON file
- **FR-006**: Account deletion MUST purge all server-side data within 24 hours
- **FR-007**: Guest users (unauthenticated) continue to use local storage only — no forced registration
- **FR-008**: Sync conflict resolution: last-write-wins per month/period (no merge conflicts)

### Non-Functional Requirements

- E2E encryption: AES-256-GCM with key derived from user password (PBKDF2, 100k iterations)
- Data never leaves the device unencrypted
- GDPR-aligned data handling (even though Argentina uses PDPA — future-proof)
- Backend candidates: Supabase (with RLS) or self-hosted PocketBase — decision deferred to plan

---

## Success Criteria

- **SC-001**: Data added on Device A appears on Device B within 10 seconds
- **SC-002**: Network inspection shows no plaintext salary values in transit
- **SC-003**: App functions fully with no network connection for at least 72 hours
- **SC-004**: Account deletion removes all server data — verified by attempting to re-login
- **SC-005**: Exported JSON contains all payslips and F.572 data in human-readable format

---

## Assumptions

- Authentication is handled by spec 004 — this spec depends on it
- E2E encryption key is derived from the user's login password — if password is forgotten,
  data cannot be recovered (acceptable trade-off for privacy; spec notes this clearly to users)
- Only one active fiscal year's data is synced in v1 (prior years are local-only)
- Supabase or PocketBase selected as backend — no custom server required in v1
- Family sharing (US4) requires at minimum 2 accounts — no anonymous sharing links
