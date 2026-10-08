import { policy2025 } from "./policy-2025.js";
import { euros, progressiveTax } from "./calculator.js";
import { voxSavingsPolicy2024 } from "./vox-savings-policy.js";

const max = (a, b) => a > b ? a : b;

export function validateVoxSavingsPolicy(proposal = voxSavingsPolicy2024, baseline = policy2025) {
  const state = baseline.savings.state;
  const autonomous = baseline.savings.autonomous;
  if (state[0][0] !== proposal.firstBandUpper || autonomous[0][0] !== proposal.firstBandUpper) {
    throw new Error("El primer tramo propuesto no coincide con el de 2025.");
  }
  if (proposal.stateFirstRate !== 0 || proposal.autonomousFirstRate !== 0) {
    throw new Error("La propuesta modelada exige un 0 % en ambas mitades del primer tramo.");
  }
  euros(proposal.firstBandUpper);
  return true;
}

validateVoxSavingsPolicy();

export function calculateVoxSavings(currentSavings, baseline = policy2025, proposal = voxSavingsPolicy2024) {
  if (!currentSavings || currentSavings.errors) throw new Error("Se necesita un resultado vigente del ahorro válido.");
  if (currentSavings.year !== baseline.year) throw new Error("El resultado del ahorro y la escala base deben ser del mismo ejercicio.");
  validateVoxSavingsPolicy(proposal, baseline);
  const stateBrackets = baseline.savings.state.map(([upper, rate], index) => [upper, index === 0 ? proposal.stateFirstRate : rate]);
  const autonomousBrackets = baseline.savings.autonomous.map(([upper, rate], index) => [upper, index === 0 ? proposal.autonomousFirstRate : rate]);
  const stateTax = max(0n, progressiveTax(currentSavings.base, stateBrackets) - progressiveTax(currentSavings.stateMinimum, stateBrackets));
  const regionalTax = max(0n, progressiveTax(currentSavings.base, autonomousBrackets) - progressiveTax(currentSavings.regionalMinimum, autonomousBrackets));
  const tax = stateTax + regionalTax;
  return {
    year: currentSavings.year, base: currentSavings.base, stateTax, regionalTax, tax,
    netAnnual: currentSavings.annualBalance - tax,
    taxDifference: currentSavings.tax - tax,
    proposedTotalTax: currentSavings.generalTax + tax,
  };
}
