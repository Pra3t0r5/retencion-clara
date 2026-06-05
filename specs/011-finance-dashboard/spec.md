# Spec 011 — Finance Dashboard

## Problem

Financial data is spread across Google Sheets (FRP), Deel PDFs, Argentine payslips, and vault notes.
No single view shows: net income trend, real purchasing power over time, or monthly cash flow.

## Solution

New "Finanzas" tab in retencion-clara. Client-side only. No backend. Data stays in localStorage.

## Data Sources

| Source | Format | Coverage | Priority |
|--------|--------|----------|----------|
| Financial Restructuring Plan (FRP) | CSV / XLSX | Sep 2025 – Apr 2026, transactions | High |
| Salarios Fer (Cuentas Casa XLSX) | XLSX sheet | May 2022 – Feb 2025, monthly income | High |
| Deel payslips | PDF (via pdfjs) | Mar 2025 – present | Medium |
| Manual entry | Form | Any gap | Low |

## Income Modalities (from documents)

| Period | Modality | Currency | Notes |
|--------|----------|----------|-------|
| May 2022 – Feb 2023 | Contractor (INV series) | USD | No social security, no Ganancias |
| Mar 2023 – Feb 2024 | Crehana relación de dependencia | ARS | SIPA + Ganancias, tracked at CCL/MEP |
| Mar 2024 – May 2025 | Crehana USD clause | USD direct | 100% USD via Santander, still in dependency |
| Jun 2025 – present | Crehana via Deel | USD | Same employment, Deel as payment platform |

## Real Purchasing Power Model

```
nominal_usd_income
  ├── / us_cpi_index  → real_usd_2022base  (beats US inflation?)
  ├── * tc_mep / cbt_ars → canastas_compradas  (ARG household purchasing power)
  └── / tc_mep * 1000 → hours_of_argentina_min_wage  (relative local context)
```

Reference datasets (hardcoded static tables, updated manually):
- `src/finance/tablas/ipc-indec.ts` — INDEC monthly IPC desde Ene 2022
- `src/finance/tablas/cpi-us.ts`    — BLS monthly CPI desde Ene 2022
- `src/finance/tablas/cbt-indec.ts` — INDEC CBT mensual (canasta básica total, 4 personas)

## Views

### 1. Ingresos (IncomeCurveView)
- Line chart: nominal USD/month from May 2022 → present
- Overlay: real USD (CPI-adjusted, 2022 base)
- Bar: canastas básicas cubiertos/month
- Table: month, nominal USD, real USD, canastas, modalidad de pago

### 2. Flujo (CashFlowView)
- Bar chart: total income vs total expenses by month (from FRP data)
- Stacked bars by category
- Savings rate % per month
- Import button: drag-drop FRP CSV file

### 3. Patrimonio (NetWorthView)
- Single snapshot card (April 2026 data) to start
- Asset breakdown donut: cash, investments, crypto
- Liabilities summary

## Engine Functions

```typescript
// income.ts
getIncomeHistory(): IncomeEntry[]       // sorted May 2022 → now
getRealUSD(entry: IncomeEntry): number  // CPI-adjusted
getCanastas(entry: IncomeEntry): number // entry.netUSD * tc / cbt

// cashflow.ts
aggregateByMonth(txs: Transaction[]): MonthlyFlow[]
getCategoryBreakdown(txs: Transaction[], month: string): CategoryBreakdown

// power-curve.ts
buildPowerCurve(history: IncomeEntry[]): PowerPoint[]
```

## Storage Schema

localStorage key: `finance_v1`

```typescript
interface FinanceDB {
  transactions: Transaction[];     // FRP imports
  incomeOverrides: Partial<IncomeEntry>[];  // manual corrections to seeded data
  netWorthSnapshots: NetWorthSnapshot[];
  lastImport: string | null;       // ISO date
}
```

## Seeded Data

`src/finance/engine/income-seed.ts` — hardcoded income from Salarios Fer:
May 2022 – Feb 2025, one entry per month, netUSD, modalidad, tc where known.
User can override any entry via manual form.

## Non-Goals (this spec)

- Santander PDF parsing (future spec)
- Finzo portfolio tracking (future spec)
- Multi-year tax integration with existing retencion-clara engine
