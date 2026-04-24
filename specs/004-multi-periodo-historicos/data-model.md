# Data Model: Multi-Período, Históricos y Gráficos

## Entities

### PayslipEntry (Supabase / localStorage)

Stores one month's payslip data for one user in one fiscal year.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK, auto-generated |
| user_id | UUID | FK → auth.users; null for guest (localStorage only) |
| year | INT | Fiscal year (e.g., 2026) |
| month | INT | 1–12 |
| data | JSONB | Serialized `PayslipData` (plaintext in spec 004; E2E-encrypted in spec 007) |
| created_at | TIMESTAMPTZ | auto |
| updated_at | TIMESTAMPTZ | auto |

**Unique constraint**: `(user_id, year, month)` — one entry per user per month.

**RLS**: Users can only SELECT/INSERT/UPDATE/DELETE their own rows (`auth.uid() = user_id`).

### FiscalYearData (React state / localStorage)

In-memory representation used by the React app:

```typescript
type FiscalYearData = Map<number, PayslipData>; // key: month 1-12
```

### StorageAdapter (interface)

```typescript
interface StorageAdapter {
  loadYear(year: number): Promise<FiscalYearData>;
  saveMonth(year: number, month: number, data: PayslipData): Promise<void>;
  deleteMonth(year: number, month: number): Promise<void>;
}
```

Implementations:
- `LocalStorageAdapter`: Guest mode — JSON serialized to `localStorage['rc_year_YYYY']`
- `SupabaseAdapter`: Authenticated mode — Supabase JS SDK CRUD

### AuthState (React context)

```typescript
type AuthState = {
  user: User | null;    // Supabase User type
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};
```

## State Transitions

```
App load
  → check Supabase session
    → authenticated: load FiscalYearData from Supabase
    → guest: load FiscalYearData from localStorage

User adds/edits payslip
  → saveMonth() via StorageAdapter
    → authenticated: upsert to Supabase
    → guest: update localStorage

User signs in
  → migrate localStorage data to Supabase (if any)
  → switch StorageAdapter to SupabaseAdapter

User signs out
  → clear in-memory FiscalYearData
  → switch StorageAdapter to LocalStorageAdapter
```

## localStorage Schema

Guest data stored as:

```json
{
  "rc_year_2026": {
    "3": { /* PayslipData for March */ },
    "4": { /* PayslipData for April */ }
  }
}
```

Key format: `rc_year_{YYYY}`. Only current fiscal year stored in v1.
