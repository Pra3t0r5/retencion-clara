# Research: Almacenamiento Remoto con Cuenta (spec 007)

## Encryption Algorithm

**Decision**: AES-256-GCM + PBKDF2 (100k iterations, SHA-256) via Web Crypto API  
**Rationale**: Browser-native, no npm crypto dependency. GCM provides authenticated
encryption (tamper detection). 100k PBKDF2 iterations per OWASP current recommendation.  
**Performance**: Key derivation ~200ms in Chrome on modern hardware — acceptable at login.

## Salt Strategy

**Decision**: Per-row salt (stored in EncryptedBlob alongside IV + ciphertext)  
**Rationale**: Enables password rotation without a separate salt storage table.
Increases row size by ~22 bytes (16-byte salt base64-encoded) — negligible.

## Key Storage

**Decision**: In-memory only (CryptoKey object in React state/context)  
**Rationale**: Serializing the derived key to localStorage/sessionStorage defeats the
password-protection guarantee. Key re-derived at each login (~200ms acceptable).  
**Risk**: If user closes tab mid-session, they must re-login. For an in-family app
with Supabase sessions (7-day cookies), this is acceptable — Supabase restores the
Supabase session, but the CryptoKey must be re-derived from password.  
**Mitigation**: Prompt for password re-entry when session is restored but CryptoKey
is missing (i.e., tab reload without re-login).

## Offline Sync

**Decision**: IndexedDB via `idb` (~2kB gzip)  
**Rationale**: Async, supports larger payloads than localStorage. `idb` is minimal.
Queue is per-user (keyed by user_id) so guest and authenticated queues don't mix.  
**Sync trigger**: `window.addEventListener('online', flushQueue)` + retry on app load.

## Re-encryption on Password Change

**Decision**: Implement in v1 (per FR-002 + spec US2 scenario 2)  
**Process**:
1. Decrypt all rows with old key
2. Re-encrypt with new key
3. Batch upsert to Supabase
4. Update password in Supabase Auth

This is a blocking operation shown with a progress indicator.

## Export Format

**Decision**: JSON file downloaded via `<a download>` with `Blob` URL  
**Format**: `{ exportedAt, user, payslips: [{ year, month, data: PayslipData }] }`
Decryption happens client-side before export — no plaintext ever hits the server.

## Account Deletion

**Decision**: Delete Supabase Auth user (cascades via FK to `payslips` table via RLS)  
Supabase `supabase.auth.admin.deleteUser()` not available client-side; use
`supabase.rpc('delete_own_account')` — a stored procedure that the user can call
under RLS to delete their own auth user and all cascading data.
