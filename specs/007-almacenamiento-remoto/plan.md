# Implementation Plan: Almacenamiento Remoto con Cuenta

**Branch**: `007-almacenamiento-remoto` | **Date**: 2026-04-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/007-almacenamiento-remoto/spec.md`

## Summary

Layer E2E encryption and cross-device sync on top of the Supabase storage introduced in spec 004.
Salary data is encrypted with AES-256-GCM (key derived from user password via PBKDF2) before
leaving the device. The server stores only ciphertext.

**Dependency**: Spec 004 (Supabase setup + auth) MUST be implemented first.

## Technical Context

**Language/Version**: TypeScript 5.x + React 19; Web Crypto API (browser-native)  
**Primary Dependencies**: None new — Web Crypto API is available in all modern browsers  
**Storage**: Supabase Postgres (encrypted JSONB blobs); localStorage (offline queue)  
**Testing**: Vitest + `@peculiar/webcrypto` polyfill for Node.js crypto testing  
**Target Platform**: Browser SPA (HTTPS required for Web Crypto — already PWA/HTTPS)  
**Performance Goals**: Encrypt/decrypt <100ms per payslip; sync within 5s when online  
**Constraints**: Key derived from password — lost password = lost data (by design, disclosed to user)  
**Scale/Scope**: In-family app; single active fiscal year in v1

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| I. Zero Backend (data privacy) | ✅ PASS | Server stores only ciphertext. NFR: "no plaintext salary data at rest" satisfied |
| II. Tax Math Authoritative | ✅ PASS | Engine unchanged |
| III. Test-First | ✅ PASS | Crypto functions get unit tests first |
| IV. Offline-First | ✅ PASS | FR-002: offline sync queue; app works 72h+ without network |
| V. Password-Loss Disclosure | ✅ REQUIRED | User MUST be clearly warned at account creation that lost password = lost data |

## Project Structure

### Source Code Changes

```text
src/
  crypto/
    keys.ts            # NEW — PBKDF2 key derivation from password
    cipher.ts          # NEW — AES-256-GCM encrypt/decrypt
    types.ts           # NEW — EncryptedBlob type
  storage/
    remote.ts          # MODIFY (from spec 004) — encrypt before upload, decrypt on load
    sync-queue.ts      # NEW — offline-first queue (IndexedDB)
  components/
    AccountSetup.tsx   # NEW — registration form with password-loss warning
    ExportData.tsx     # NEW — JSON export button (US3)
    DeleteAccount.tsx  # NEW — account deletion confirmation (US3)
```

## Phase 0: Research

### Decision: Encryption Algorithm

**Decision**: AES-256-GCM with PBKDF2 key derivation (100k iterations, SHA-256)

**Rationale**: Standard Web Crypto API primitives. AES-GCM provides authenticated encryption
(integrity + confidentiality). PBKDF2 with 100k iterations matches spec NFR and current OWASP
recommendations for password-based key derivation.

**Implementation**:
```typescript
// Key derivation (done once at login)
const salt = crypto.getRandomValues(new Uint8Array(16)); // stored with user account
const keyMaterial = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(password),
  "PBKDF2",
  false,
  ["deriveKey"]
);
const encryptionKey = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
  keyMaterial,
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt", "decrypt"]
);

// Encryption (per payslip)
const iv = crypto.getRandomValues(new Uint8Array(12));
const ciphertext = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv },
  encryptionKey,
  new TextEncoder().encode(JSON.stringify(payslipData))
);
```

**Stored format** (JSONB in Supabase):
```json
{
  "v": 1,
  "iv": "<base64>",
  "salt": "<base64>",
  "data": "<base64-ciphertext>"
}
```

Salt stored per-row (not per-account) for rotation safety.

### Decision: Offline Sync Queue

**Decision**: IndexedDB via `idb` library (~2kB) for offline-first queue

**Rationale**: localStorage is synchronous and limited. IndexedDB is async and supports
larger payloads. `idb` is a tiny typed wrapper — worth the dependency for the ergonomics.
Queue holds pending upserts. On connection restore: flush queue to Supabase.

**Alternative**: Service Worker background sync. Too complex for v1 in-family use case.

### Decision: Key Storage in Memory Only

**Decision**: Derived encryption key lives in memory (CryptoKey object) for the session.
Never serialized to localStorage or any storage.

**Rationale**: Exporting the key to storage defeats the password-based protection. The user
must re-enter their password on each session start (handled by Supabase auth — they re-log in,
key is re-derived from password).

**Trade-off**: Key is re-derived on every login. At 100k PBKDF2 iterations, this takes ~200ms
in modern browsers — acceptable one-time cost at login.

### Decision: Salt Per Row vs Per Account

**Decision**: Salt stored per encrypted row (alongside IV and ciphertext)

**Rationale**: Allows password rotation to re-encrypt each row independently. Simplifies
implementation — no separate salt storage table needed.

## Phase 1: Design

### Data Model (extension of spec 004)

The `payslips.data` JSONB column changes from plaintext `PayslipData` to `EncryptedBlob`:

```typescript
type EncryptedBlob = {
  v: 1;                // schema version
  iv: string;          // base64, 12 bytes
  salt: string;        // base64, 16 bytes (for PBKDF2)
  data: string;        // base64 AES-256-GCM ciphertext
};
```

No schema migration needed — the `data JSONB` column accepts both formats.
The application checks `v` field to determine if decryption is needed.

### Offline Queue Schema (IndexedDB)

```typescript
type SyncQueueEntry = {
  id: string;          // UUID
  operation: "upsert" | "delete";
  year: number;
  month: number;
  encryptedData: EncryptedBlob | null; // null for delete
  queuedAt: number;    // timestamp
};
```

### Contracts

Internal — `StorageAdapter.saveMonth()` interface from spec 004 is preserved.
The `SupabaseAdapter` from spec 004 is modified to encrypt/decrypt transparently.
App.tsx and storage callers don't need to know about encryption.
