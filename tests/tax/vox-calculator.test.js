import test from "node:test";
import assert from "node:assert/strict";
import { calculate, euros, formatMoney } from "../../src/tax/calculator.js";
import { calculateVox, validateVoxPolicy } from "../../src/tax/vox-calculator.js";
import { voxPolicy } from "../../src/tax/vox-policy.js";

const input = {
  salary: "80000", age: "35", region: "madrid", filing: "individual",
  active: "yes", professionalGroup: "7", contract: "permanent", mobility: "no",
  children: "0", childrenUnder3: "0", exclusiveChildren: "yes",
  ascendantsDisabledUnder65: "0", ascendants65to74: "0", ascendants75plus: "0", ascendantSharers: "1",
  disability: "none", disabledChildren33: "0", disabledChildrenMobility: "0", disabledChildren65: "0",
  disabledAscendants33: "0", disabledAscendantsMobility: "0", disabledAscendants65: "0",
};

const currentWith = (changes = {}) => calculate({ ...input, ...changes });
const atBase = (base, children = 0) => calculateVox({
  input: { active: true, children }, base: euros(base), stateAllowance: euros("5550"), regionalTax: 0n,
  gross: euros("100000"), social: { total: 0n }, tax: 0n, netAnnual: euros("100000"), year: 2025,
});

test("VOX proposal constants are valid and marginal at both thresholds", () => {
  assert.equal(validateVoxPolicy(), true);
  assert.equal(formatMoney(atBase("22000").tax), "0,00 €");
  assert.equal(formatMoney(atBase("22001").tax), "0,15 €");
  assert.equal(formatMoney(atBase("70000").tax), "7.200,00 €");
  assert.equal(formatMoney(atBase("70001").tax), "7.200,25 €");
  assert.equal(atBase("70000.01").upperBand, euros("0.01"));
  assert.equal(atBase("70000.01").lowerBand, euros("48000"));
});

test("four points per child reduce both rates without negative tax", () => {
  assert.equal(formatMoney(atBase("70000", 1).tax), "5.280,00 €");
  assert.equal(formatMoney(atBase("70000", 4).tax), "0,00 €");
  assert.equal(formatMoney(atBase("70001", 4).tax), "0,09 €");
  assert.equal(atBase("70001", 4).lowerRate, 0);
  assert.equal(atBase("70001", 4).upperRate, 900);
  assert.equal(atBase("100000", 7).tax, 0n);
});

test("comparison retains joint relief and the 2025 autonomous quota", () => {
  const individual = currentWith();
  const married = currentWith({ filing: "married" });
  const proposed = calculateVox(married);
  assert.equal(proposed.available, true);
  assert.equal(proposed.base, married.base);
  assert.equal(proposed.base, individual.base - married.jointReduction);
  assert.equal(proposed.social, married.social.total);
  assert.equal(proposed.regionalTax, married.regionalTax);
  assert.equal(proposed.tax, proposed.stateTax + married.regionalTax);
  assert.equal(proposed.taxDifference, married.tax - proposed.tax);
  assert.equal(proposed.netDifference, proposed.netAnnual - married.netAnnual);
  assert.equal(proposed.netDifference, proposed.taxDifference);
});

test("shared entitlement changes the state minimum but does not prorate the rate discount", () => {
  const full = calculateVox(currentWith({ children: "1", exclusiveChildren: "yes" }));
  const shared = calculateVox(currentWith({ children: "1", exclusiveChildren: "no" }));
  assert.ok(full.stateTax <= shared.stateTax);
  assert.equal(full.lowerRate, voxPolicy.lowerRate - voxPolicy.reductionPerChild);
  assert.equal(full.lowerRate, shared.lowerRate);
});

test("regional scales remain region-dependent under the proposal", () => {
  const madrid = calculateVox(currentWith({ region: "madrid" }));
  const valencia = calculateVox(currentWith({ region: "valencia" }));
  assert.equal(madrid.stateTax, valencia.stateTax);
  assert.notEqual(madrid.regionalTax, valencia.regionalTax);
  assert.notEqual(madrid.tax, valencia.tax);
});

test("optional scenario applies only the proposed scale to the whole general base", () => {
  const madrid = currentWith({ region: "madrid" });
  const valencia = currentWith({ region: "valencia" });
  const defaultResult = calculateVox(madrid);
  const stateOnly = calculateVox(madrid, voxPolicy, { includeRegionalTax: false });
  const valenciaStateOnly = calculateVox(valencia, voxPolicy, { includeRegionalTax: false });

  assert.equal(defaultResult.includeRegionalTax, true);
  assert.equal(stateOnly.includeRegionalTax, false);
  assert.equal(stateOnly.stateTax, defaultResult.stateTax);
  assert.equal(stateOnly.regionalTax, 0n);
  assert.equal(stateOnly.tax, stateOnly.stateTax);
  assert.equal(defaultResult.tax - stateOnly.tax, madrid.regionalTax);
  assert.equal(stateOnly.tax, valenciaStateOnly.tax);
  assert.equal(stateOnly.netAnnual - defaultResult.netAnnual, madrid.regionalTax);
  assert.equal(stateOnly.taxDifference, madrid.tax - stateOnly.tax);
  assert.equal(stateOnly.netDifference, stateOnly.taxDifference);
});

test("a base below 22000 can still owe autonomous IRPF", () => {
  const current = currentWith({ salary: "24000", region: "madrid" });
  const proposed = calculateVox(current);
  assert.ok(current.base < euros(voxPolicy.exemptUpper));
  assert.equal(proposed.stateTax, 0n);
  assert.equal(proposed.regionalTax, current.regionalTax);
  assert.ok(proposed.tax > 0n);
  const stateOnly = calculateVox(current, voxPolicy, { includeRegionalTax: false });
  assert.equal(stateOnly.tax, 0n);
});

test("inactive income has no proposed result until its type is known", () => {
  const current = currentWith({ active: "no" });
  assert.equal(calculateVox(current).available, false);
  assert.ok(current.tax > 0n);
});
