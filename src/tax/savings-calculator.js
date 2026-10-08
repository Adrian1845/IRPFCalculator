import { policy2025 } from "./policy-2025.js";
import { euros, progressiveTax } from "./calculator.js";
import { validateSavingsInput } from "./savings-validation.js";

const min = (a, b) => a < b ? a : b;
const max = (a, b) => a > b ? a : b;
const signedEuros = (text) => text.startsWith("-") ? -euros(text.slice(1)) : euros(text);

export function calculateSavings(currentResult, raw, policy = policy2025) {
  if (!currentResult || currentResult.errors) throw new Error("Se necesita un resultado general vigente válido.");
  if (currentResult.year !== policy.year) throw new Error("El resultado general y la escala del ahorro deben ser del mismo ejercicio.");
  const checked = validateSavingsInput(raw);
  if (!checked.valid) return { errors: checked.errors };

  const investmentBalance = signedEuros(checked.value.investmentIncome);
  const disposalBalance = signedEuros(checked.value.disposalGains);
  const offsetFromInvestment = investmentBalance < 0n && disposalBalance > 0n
    ? min(-investmentBalance, disposalBalance / 4n) : 0n;
  const offsetFromDisposals = disposalBalance < 0n && investmentBalance > 0n
    ? min(-disposalBalance, investmentBalance / 4n) : 0n;
  const crossOffset = offsetFromInvestment + offsetFromDisposals;
  const unusedInvestmentLoss = max(0n, -investmentBalance - offsetFromInvestment);
  const unusedDisposalLoss = max(0n, -disposalBalance - offsetFromDisposals);
  const taxableBase = max(0n, investmentBalance) + max(0n, disposalBalance) - crossOffset;
  const jointReductionApplied = min(taxableBase, currentResult.jointReductionRemainder);
  const base = taxableBase - jointReductionApplied;
  const stateMinimum = min(base, max(0n, currentResult.stateAllowance - currentResult.base));
  const regionalMinimum = min(base, max(0n, currentResult.regionalAllowance - currentResult.base));
  const stateTax = max(0n, progressiveTax(base, policy.savings.state) - progressiveTax(stateMinimum, policy.savings.state));
  const regionalTax = max(0n, progressiveTax(base, policy.savings.autonomous) - progressiveTax(regionalMinimum, policy.savings.autonomous));
  const tax = stateTax + regionalTax;
  const annualBalance = investmentBalance + disposalBalance;

  return {
    year: currentResult.year, region: currentResult.region,
    investmentBalance, disposalBalance, annualBalance, crossOffset, unusedInvestmentLoss, unusedDisposalLoss,
    taxableBase, jointReductionApplied, base, stateMinimum, regionalMinimum,
    stateTax, regionalTax, tax, netAnnual: annualBalance - tax, generalTax: currentResult.tax,
    currentTotalTax: currentResult.tax + tax,
    hasExcludedCases: checked.value.savingsExceptions,
  };
}
