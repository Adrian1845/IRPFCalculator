import { euros, progressiveTax } from "./calculator.js";
import { policy2025 } from "./policy-2025.js";
import { voxPolicy } from "./vox-policy.js";

const RATE_UNIT = 10_000n;
const min = (a, b) => a < b ? a : b;
const max = (a, b) => a > b ? a : b;

export function validateVoxPolicy(policy = voxPolicy) {
  if (euros(policy.exemptUpper) >= euros(policy.lowerUpper)) throw new Error("Los tramos de VOX no son crecientes.");
  for (const field of ["lowerRate", "upperRate", "reductionPerChild"]) {
    if (!Number.isInteger(policy[field]) || policy[field] < 0) throw new Error(`Tipo de VOX no válido: ${field}`);
  }
  return true;
}

validateVoxPolicy();

export function calculateVox(currentResult, policy = voxPolicy, { includeRegionalTax = true } = {}) {
  if (!currentResult || currentResult.errors) throw new Error("Se necesita un resultado vigente válido.");
  if (!currentResult.input.active) return { available: false, reason: "income-type-unspecified" };

  // Both scenarios use the shared general base; the optional scenario omits the 2025 regional quota.
  const base = currentResult.base;
  const children = currentResult.input.children;
  const childReduction = policy.reductionPerChild * children;
  const lowerRate = Math.max(0, policy.lowerRate - childReduction);
  const upperRate = Math.max(0, policy.upperRate - childReduction);
  const exemptUpper = euros(policy.exemptUpper);
  const lowerUpper = euros(policy.lowerUpper);
  const lowerBand = max(0n, min(base, lowerUpper) - exemptUpper);
  const upperBand = max(0n, base - lowerUpper);
  const lowerTax = lowerBand * BigInt(lowerRate) / RATE_UNIT;
  const upperTax = upperBand * BigInt(upperRate) / RATE_UNIT;
  const stateAllowance = currentResult.stateAllowance + exemptUpper - euros(policy2025.stateAllowance.taxpayer);
  const proposedStateBrackets = [[policy.exemptUpper, 0], [policy.lowerUpper, lowerRate], [null, upperRate]];
  const allowanceRelief = progressiveTax(min(base, stateAllowance), proposedStateBrackets);
  const stateTax = max(0n, lowerTax + upperTax - allowanceRelief);
  const regionalTax = includeRegionalTax ? currentResult.regionalTax : 0n;
  const tax = stateTax + regionalTax;
  const social = currentResult.social.total;
  const netAnnual = currentResult.gross - social - tax;
  const effectiveRate = currentResult.gross === 0n ? 0n : (tax * RATE_UNIT + currentResult.gross / 2n) / currentResult.gross;

  return {
    available: true, year: currentResult.year, base, children, lowerRate, upperRate, includeRegionalTax,
    lowerBand, upperBand, lowerTax, upperTax, stateAllowance, allowanceRelief,
    stateTax, regionalTax, tax, social, netAnnual, effectiveRate,
    taxDifference: currentResult.tax - tax,
    netDifference: netAnnual - currentResult.netAnnual,
  };
}
