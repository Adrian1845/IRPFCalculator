import test from "node:test";
import assert from "node:assert/strict";
import { policy2025 } from "../../src/tax/policy-2025.js";
import { calculate, euros, formatMoney, progressiveTax, validatePolicy } from "../../src/tax/calculator.js";
import { calculateSavings } from "../../src/tax/savings-calculator.js";
import { validateSavingsInput } from "../../src/tax/savings-validation.js";
import { calculateVoxSavings, validateVoxSavingsPolicy } from "../../src/tax/vox-savings-calculator.js";
import { voxSavingsPolicy2024 } from "../../src/tax/vox-savings-policy.js";

const general = (changes = {}) => ({
  year: 2025, region: "Aragón", base: euros("30000"), tax: euros("4000"),
  stateAllowance: euros("5550"), regionalAllowance: euros("5550"),
  jointReductionRemainder: 0n, ...changes,
});
const savings = (income, gains, current = general()) => calculateSavings(current, {
  investmentIncome: income, disposalGains: gains, savingsExceptions: "no",
});

test("2025 savings scales are complete and marginal at every boundary", () => {
  assert.equal(validatePolicy(), true);
  for (const [name, brackets] of Object.entries({ state: policy2025.savings.state, autonomous: policy2025.savings.autonomous })) {
    for (let index = 0; index < brackets.length - 1; index++) {
      const upper = euros(brackets[index][0]);
      assert.equal(progressiveTax(upper + euros("0.01"), brackets) - progressiveTax(upper, brackets), BigInt(brackets[index + 1][1]), `${name} at ${brackets[index][0]}`);
    }
  }
  assert.equal(formatMoney(progressiveTax(euros("20500"), policy2025.savings.state)), "2.092,50 €");
});

test("signed savings balances validate locale formatting and reject invalid inputs", () => {
  const accepted = validateSavingsInput({ investmentIncome: "−2.000,00", disposalGains: "5.000,00", savingsExceptions: "yes" });
  assert.equal(accepted.valid, true);
  assert.equal(accepted.value.investmentIncome, "-2000.00");
  assert.equal(accepted.value.savingsExceptions, true);
  for (const invalid of ["1.234", "1,234", "abc", "100000000.01", "1,000.00"]) {
    assert.equal(validateSavingsInput({ investmentIncome: invalid }).valid, false, invalid);
  }
});

test("same-year negative investment income offsets at most 25% of gains", () => {
  const result = savings("-2000", "5000");
  assert.equal(result.crossOffset, euros("1250"));
  assert.equal(result.taxableBase, euros("3750"));
  assert.equal(result.unusedInvestmentLoss, euros("750"));
  assert.equal(result.unusedDisposalLoss, 0n);
  assert.equal(formatMoney(result.tax), "712,50 €");
});

test("negative disposal balance offsets investment income and remaining losses are shown", () => {
  const result = savings("10000", "-3000");
  assert.equal(result.crossOffset, euros("2500"));
  assert.equal(result.taxableBase, euros("7500"));
  assert.equal(result.unusedDisposalLoss, euros("500"));
  const bothNegative = savings("-100", "-200");
  assert.equal(bothNegative.base, 0n);
  assert.equal(bothNegative.tax, 0n);
  assert.equal(bothNegative.unusedInvestmentLoss, euros("100"));
  assert.equal(bothNegative.unusedDisposalLoss, euros("200"));
});

test("unused joint filing reduction reaches savings base without changing general result", () => {
  const current = general({ base: 0n, tax: 0n, jointReductionRemainder: euros("3400") });
  const result = savings("0", "10000", current);
  assert.equal(result.jointReductionApplied, euros("3400"));
  assert.equal(result.base, euros("6600"));
  assert.equal(result.stateMinimum, euros("5550"));
  assert.equal(result.regionalMinimum, euros("5550"));
  assert.equal(current.tax, 0n);
});

test("unused state and territory allowances are applied separately to savings quotas", () => {
  const result = savings("0", "10000", general({
    base: 0n, stateAllowance: euros("5550"), regionalAllowance: euros("6105"),
  }));
  assert.equal(result.stateMinimum, euros("5550"));
  assert.equal(result.regionalMinimum, euros("6105"));
  assert.ok(result.stateTax > result.regionalTax);
  for (const [key] of Object.entries(policy2025.regions)) {
    const current = calculate({
      salary: "0", age: "35", region: key, filing: "individual", active: "no",
      disability: "none", exclusiveChildren: "yes",
    });
    const regional = savings("0", "10000", current);
    assert.equal(regional.regionalMinimum, current.regionalAllowance, key);
  }
});

test("VOX savings proposal matches 0% first-band examples without mutating current tax", () => {
  assert.equal(validateVoxSavingsPolicy(), true);
  const examples = [
    ["0", "0,00 €", "0,00 €"],
    ["6000", "1.140,00 €", "0,00 €"],
    ["6001", "1.140,21 €", "0,21 €"],
    ["10000", "1.980,00 €", "840,00 €"],
    ["50000", "10.380,00 €", "9.240,00 €"],
  ];
  for (const [base, currentExpected, proposedExpected] of examples) {
    const current = savings("0", base);
    const proposed = calculateVoxSavings(current);
    assert.equal(formatMoney(current.tax), currentExpected, `current at ${base}`);
    assert.equal(formatMoney(proposed.tax), proposedExpected, `proposed at ${base}`);
    assert.equal(proposed.taxDifference, current.tax - proposed.tax);
    assert.equal(proposed.proposedTotalTax, current.generalTax + proposed.tax);
  }
  assert.equal(voxSavingsPolicy2024.firstBandUpper, "6000");
});

test("proposed savings scale stays marginal at every 2025 band boundary", () => {
  for (const upper of ["6000", "50000", "200000", "300000"]) {
    const atBoundary = calculateVoxSavings(savings("0", upper));
    const aboveBoundary = calculateVoxSavings(savings("0", String(Number(upper) + 0.01)));
    const nextRate = upper === "6000" ? 2100 : upper === "50000" ? 2300 : upper === "200000" ? 2700 : 3000;
    assert.equal(aboveBoundary.tax - atBoundary.tax, BigInt(nextRate), `proposed savings tax above €${upper}`);
  }
  assert.throws(() => validateVoxSavingsPolicy({ ...voxSavingsPolicy2024, stateFirstRate: 100 }), /0 %/);
  assert.throws(() => savings("0", "100", general({ year: 2024 })), /mismo ejercicio/);
});

test("annual dividends show tax and after-tax result in both scenarios", () => {
  const current = savings("18000", "0");
  const proposed = calculateVoxSavings(current);
  assert.equal(formatMoney(current.annualBalance), "18.000,00 €");
  assert.equal(formatMoney(current.tax), "3.660,00 €");
  assert.equal(formatMoney(proposed.tax), "2.520,00 €");
  assert.equal(formatMoney(current.netAnnual), "14.340,00 €");
  assert.equal(formatMoney(proposed.netAnnual), "15.480,00 €");
  assert.equal(proposed.netAnnual - current.netAnnual, proposed.taxDifference);
});

test("unused personal allowance from general income changes savings tax", () => {
  const allowanceUsed = savings("18000", "0");
  const allowanceUnused = savings("18000", "0", general({ base: 0n, tax: 0n }));
  assert.equal(formatMoney(allowanceUsed.tax), "3.660,00 €");
  assert.equal(formatMoney(allowanceUnused.tax), "2.605,50 €");
  assert.equal(formatMoney(calculateVoxSavings(allowanceUnused).tax), "2.520,00 €");
});

test("after-tax savings result uses signed declared balances, not the taxable base", () => {
  const current = savings("-2000", "5000");
  assert.equal(current.annualBalance, euros("3000"));
  assert.equal(current.taxableBase, euros("3750"));
  assert.equal(current.netAnnual, current.annualBalance - current.tax);
});

test("remaining allowance can reduce or eliminate savings from the 0% band", () => {
  const partial = savings("0", "10000", general({ base: 0n, stateAllowance: euros("3000"), regionalAllowance: euros("3000") }));
  const partialProposal = calculateVoxSavings(partial);
  assert.equal(formatMoney(partial.tax), "1.410,00 €");
  assert.equal(formatMoney(partialProposal.tax), "840,00 €");
  const full = savings("0", "10000", general({ base: 0n, stateAllowance: euros("7000"), regionalAllowance: euros("7000") }));
  const fullProposal = calculateVoxSavings(full);
  assert.equal(formatMoney(full.tax), "630,00 €");
  assert.equal(fullProposal.tax, full.tax);
});

test("zero savings preserves existing general IRPF and excludes no income from it", () => {
  const current = general();
  const result = savings("0", "0", current);
  const proposed = calculateVoxSavings(result);
  assert.equal(result.currentTotalTax, current.tax);
  assert.equal(proposed.proposedTotalTax, current.tax);
  assert.equal(result.tax, 0n);
  assert.equal(proposed.tax, 0n);
});
