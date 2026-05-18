import { z } from 'zod';

export const PaymentModality = z.enum([
  'contractor',    // USD invoices, no social security
  'crehana-ars',   // ARS dependency, tracked at CCL
  'crehana-usd',   // USD clause, Santander direct
  'deel',          // USD via Deel platform
  'manual',
]);
export type PaymentModality = z.infer<typeof PaymentModality>;

export const IncomeEntry = z.object({
  year:       z.number().int(),
  month:      z.number().int().min(1).max(12),
  netUSD:     z.number(),          // take-home in USD (normalized)
  grossARS:   z.number().nullable(),
  netARS:     z.number().nullable(),
  taxARS:     z.number().nullable(),
  tcMEP:      z.number().nullable(),
  tcCCL:      z.number().nullable(),
  modality:   PaymentModality,
  notes:      z.string().optional(),
});
export type IncomeEntry = z.infer<typeof IncomeEntry>;

export const TransactionType = z.enum(['Egreso', 'Ingreso', 'Transferencia', 'Inversión']);
export type TransactionType = z.infer<typeof TransactionType>;

export const Transaction = z.object({
  date:          z.string(),   // ISO YYYY-MM-DD
  description:   z.string(),
  category:      z.string(),
  currency:      z.enum(['ARS', 'USD']),
  type:          TransactionType,
  amountNative:  z.number(),   // in original currency
  amountARS:     z.number(),
  amountUSD:     z.number(),
  tcMEP:         z.number().nullable(),
  paymentMethod: z.string(),
  importBatch:   z.string().optional(),  // timestamp of import session
});
export type Transaction = z.infer<typeof Transaction>;

export const AssetSnapshot = z.object({
  cashPhysicalUSD:  z.number(),
  cashSantanderUSD: z.number(),
  cashSantanderARS: z.number(),
  balanzUSD:        z.number(),
  finzoUSD:         z.number(),
  cryptoUSD:        z.number(),
  otherUSD:         z.number(),
});
export type AssetSnapshot = z.infer<typeof AssetSnapshot>;

export const LiabilitySnapshot = z.object({
  creditCardsARS: z.number(),
  creditCardsUSD: z.number(),
  otherARS:       z.number(),
  tcForARS:       z.number(),  // rate used to convert ARS liabilities to USD
});
export type LiabilitySnapshot = z.infer<typeof LiabilitySnapshot>;

export const NetWorthSnapshot = z.object({
  date:        z.string(),   // ISO YYYY-MM-DD
  assets:      AssetSnapshot,
  liabilities: LiabilitySnapshot,
  netWorthUSD: z.number(),
  notes:       z.string().optional(),
});
export type NetWorthSnapshot = z.infer<typeof NetWorthSnapshot>;

export const MonthlyFlow = z.object({
  yearMonth:   z.string(),   // "YYYY-MM"
  incomeUSD:   z.number(),
  expensesUSD: z.number(),
  savingsUSD:  z.number(),
  savingsRate: z.number(),   // 0-1
  byCategory:  z.record(z.string(), z.number()),  // category → USD
});
export type MonthlyFlow = z.infer<typeof MonthlyFlow>;

export const PowerPoint = z.object({
  yearMonth:     z.string(),
  nominalUSD:    z.number(),
  realUSD:       z.number(),   // CPI-adjusted, 2022 base
  canastas:      z.number(),   // how many CBT (4p) covered
  modality:      PaymentModality,
});
export type PowerPoint = z.infer<typeof PowerPoint>;

export const FinanceDB = z.object({
  transactions:     z.array(Transaction),
  incomeOverrides:  z.array(IncomeEntry),
  netWorthSnapshots: z.array(NetWorthSnapshot),
  lastImport:       z.string().nullable(),
});
export type FinanceDB = z.infer<typeof FinanceDB>;
