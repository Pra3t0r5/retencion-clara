# Tasks: Almacenamiento Remoto con Cuenta (E2E Encryption + Sync)

**Input**: Design documents from `/specs/007-almacenamiento-remoto/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅
**Hard dependency**: spec 004 (Supabase setup + auth + StorageAdapter) must be implemented

---

## Phase 1: Setup

- [ ] T001 Install `idb` dependency: `bun add idb` (IndexedDB wrapper for offline queue)
- [ ] T002 Add Supabase SQL: create `delete_own_account()` RPC function that deletes the
      calling user's auth record (cascades to payslips via FK). Run in Supabase SQL editor.
- [ ] T003 Create `src/crypto/types.ts`: define `EncryptedBlob = { v: 1; iv: string; salt: string; data: string }`

---

## Phase 2: Foundational — Crypto Layer

**⚠️ CRITICAL**: Encryption functions must be correct before any data is stored.

- [ ] T004 Install test polyfill: `bun add -d @peculiar/webcrypto` for Node.js Web Crypto
      compatibility in Vitest
- [ ] T005 Write tests FIRST in `src/crypto/cipher.test.ts`:
      - `encrypt(data, password)` returns `EncryptedBlob`
      - `decrypt(blob, password)` returns original data
      - wrong password → `decrypt` throws
      - same plaintext + same password → different ciphertext (IV randomness)
      - round-trip: encrypt then decrypt returns identical object
- [ ] T006 Create `src/crypto/keys.ts`: `deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey>`
      — PBKDF2, 100k iterations, SHA-256, AES-256-GCM
- [ ] T007 Create `src/crypto/cipher.ts`:
      - `encrypt(plaintext: object, password: string): Promise<EncryptedBlob>`
        (generates random IV + salt, derives key, encrypts, returns base64 encoded blob)
      - `decrypt(blob: EncryptedBlob, password: string): Promise<object>`
        (derives key from blob.salt + password, decrypts, parses JSON)

**Checkpoint**: Crypto layer tested — encrypt/decrypt round-trip verified.

---

## Phase 3: User Story 1 — Auto-Sync (Priority: P1) 🎯 Core

**Goal**: Authenticated user adds payslip → encrypted blob synced to Supabase within 5s.

**Independent Test**: Add March payslip on Device A → Supabase dashboard shows encrypted
blob (no readable numbers) → open app on Device B → March payslip visible after login.

### Implementation

- [ ] T008 [US1] Modify `src/auth/AuthProvider.tsx`: after login, derive and store `CryptoKey`
      in auth context — `signIn()` receives password, derives key, stores in state
- [ ] T009 [US1] Create `src/storage/sync-queue.ts` using `idb`:
      - IndexedDB store `syncQueue` with schema: `SyncQueueEntry`
      - `enqueue(entry)`, `dequeue()`, `flushQueue(adapter)` — flush on online + app load
- [ ] T010 [US1] Modify `src/storage/remote.ts` (spec 004 `SupabaseAdapter`):
      - `saveMonth()` now calls `encrypt(data, key)` before upsert
      - `loadYear()` now calls `decrypt(blob, key)` after fetch
      - if offline: enqueue to `SyncQueueEntry` instead of direct upsert
- [ ] T011 [US1] Wire `window.addEventListener('online', flushSyncQueue)` in `src/main.tsx`
- [ ] T012 [US1] Manual test: inspect Supabase dashboard → `data` column shows `{ v:1, iv:..., salt:..., data:... }` — no readable ARS amounts

**Checkpoint**: E2E encryption live. Server stores only ciphertext.

---

## Phase 4: User Story 2 — Privacy Guarantee (Priority: P1)

**Goal**: Network inspection shows no plaintext salaries. Password change re-encrypts all rows.

### Implementation

- [ ] T013 [US2] Add password change flow to `SettingsPanel.tsx` (from spec 005) or new
      `AccountSettings.tsx`:
      - current password + new password inputs
      - on submit: fetch all payslips → decrypt with old password → re-encrypt with new →
        batch upsert → update Supabase Auth password
      - show progress bar (can be many rows)
- [ ] T014 [US2] Add password-loss warning to `AccountSetup.tsx` (shown at registration):
      "Si olvidás tu contraseña, tus datos no podrán recuperarse. RetenciónClara no tiene
      acceso a tus datos." — with explicit checkbox acknowledgment
- [ ] T015 [US2] Manual test: capture network traffic (DevTools Network) during save →
      verify no ARS amounts visible in request payloads

**Checkpoint**: US2 — privacy guarantee verified.

---

## Phase 5: User Story 3 — Export + Delete (Priority: P2)

**Goal**: User downloads all data as JSON; or deletes account and all data.

### Implementation

- [ ] T016 [US3] Create `src/components/ExportData.tsx`:
      - "Exportar mis datos" button
      - on click: load all payslips → decrypt → format as `{ exportedAt, payslips: [...] }`
      - trigger download via `URL.createObjectURL(new Blob([json], { type: 'application/json' }))`
- [ ] T017 [US3] Create `src/components/DeleteAccount.tsx`:
      - confirmation dialog with password re-entry
      - on confirm: verify password (decrypt one row as check) → call `supabase.rpc('delete_own_account')`
        → clear localStorage → sign out
- [ ] T018 [US3] Add Export + Delete Account to Settings panel

**Checkpoint**: US3 — data portability and erasure implemented.

---

## Phase 6: Polish

- [ ] T019 [P] Run `bun test` — all existing + new crypto tests pass
- [ ] T020 [P] Offline queue test: disable network → add payslip → re-enable → verify Supabase
      receives the queued upsert
- [ ] T021 Handle re-login after tab reload: if Supabase session exists but CryptoKey missing →
      show password prompt to re-derive key (not full login form)

---

## Dependencies

- Spec 004 (auth + Supabase + StorageAdapter) MUST be complete
- T005 tests before T006/T007 implementation (TDD for crypto)
- T006 (key derivation) → T007 (cipher) → T008 (auth integration) → T010 (storage encryption)
- T009 (sync queue) independent of crypto — can run in parallel with T007
- T013-T015 (US2) after T010 (encryption in storage)
- T016-T018 (US3) after T013 (crypto context available)
