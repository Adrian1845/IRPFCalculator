import { calculateSelfEmployed } from "./self-employed-calculator.js";
import { voxSelfEmployedPolicy } from "./vox-self-employed-policy.js";

export function calculateRetaBonusScenario(raw, current, policy = voxSelfEmployedPolicy) {
  if (!current || current.errors) throw new Error("Se necesita un resultado vigente válido.");
  if (current.year !== policy.comparisonYear) throw new Error("El escenario usa un ejercicio distinto.");

  // Prior-year RETA adjustments remain due; only the current-year paid quota is bonified.
  const hypothetical = calculateSelfEmployed({ ...raw, retaPaid: "0" });
  if (hypothetical.errors) throw new Error("No se pudo calcular el escenario bonificado.");
  const irpfChange = hypothetical.tax - current.tax;
  const netSaving = current.retaPaid - irpfChange;

  return {
    eligibilityDetermined: false,
    year: current.year,
    currentRetaPaid: current.retaPaid,
    hypotheticalRetaPaid: 0n,
    currentTax: current.tax,
    hypotheticalTax: hypothetical.tax,
    irpfChange,
    netSaving,
  };
}
