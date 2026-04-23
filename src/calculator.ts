// Root-level calculator delegates to src/engine/calculator.ts
// Kept for App.tsx compatibility during transition to dynamic form (spec 002)
import { RECIBO_MAR, F572 } from "./data";
import {
  calcularGap,
  proyectarAbril as engineProyectarAbril,
  proyectarAnual as engineProyectarAnual,
} from "./engine/calculator";

export type { GapAnalysis } from "./engine/calculator";
export type { ProyeccionAbril, ProyeccionAnual } from "./engine/calculator";

export function calcularGaps() {
  return calcularGap(RECIBO_MAR, F572, RECIBO_MAR.meses);
}

export function proyectarAbril() {
  return engineProyectarAbril(RECIBO_MAR, F572);
}

export function proyectarAnual() {
  return engineProyectarAnual(RECIBO_MAR, F572);
}
