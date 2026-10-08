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
  input: { active: true, children }, netEmployment: euros(base),
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

test("comparison shares Social Security and employment base, but not joint relief", () => {
  const individual = currentWith();
  const married = currentWith({ filing: "married" });
  const proposed = calculateVox(married);
  assert.equal(proposed.available, true);
  assert.equal(proposed.base, individual.netEmployment);
  assert.equal(proposed.base, married.base + married.jointReduction);
  assert.equal(proposed.social, married.social.total);
  assert.equal(proposed.taxDifference, married.tax - proposed.tax);
  assert.equal(proposed.netDifference, proposed.netAnnual - married.netAnnual);
  assert.equal(proposed.netDifference, proposed.taxDifference);
});

test("shared entitlement does not prorate the provisional VOX child discount", () => {
  const full = calculateVox(currentWith({ children: "1", exclusiveChildren: "yes" }));
  const shared = calculateVox(currentWith({ children: "1", exclusiveChildren: "no" }));
  assert.equal(full.tax, shared.tax);
  assert.equal(full.lowerRate, voxPolicy.lowerRate - voxPolicy.reductionPerChild);
  assert.notEqual(full.taxDifference, shared.taxDifference);
});

test("inactive income has no proposed result until its type is known", () => {
  const current = currentWith({ active: "no" });
  assert.equal(calculateVox(current).available, false);
  assert.ok(current.tax > 0n);
});
