import { euros } from "./calculator.js";
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

export function calculateVox(currentResult, policy = voxPolicy) {
  if (!currentResult || currentResult.errors) throw new Error("Se necesita un resultado vigente válido.");
  if (!currentResult.input.active) return { available: false, reason: "income-type-unspecified" };

  // VOX has not specified retention of the current joint-filing reduction.
  const base = currentResult.netEmployment;
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
  const tax = lowerTax + upperTax;
  const social = currentResult.social.total;
  const netAnnual = currentResult.gross - social - tax;
  const effectiveRate = currentResult.gross === 0n ? 0n : (tax * RATE_UNIT + currentResult.gross / 2n) / currentResult.gross;

  return {
    available: true, year: currentResult.year, base, children, lowerRate, upperRate,
    lowerBand, upperBand, lowerTax, upperTax, tax, social, netAnnual, effectiveRate,
    taxDifference: currentResult.tax - tax,
    netDifference: netAnnual - currentResult.netAnnual,
  };
}
