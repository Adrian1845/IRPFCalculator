import test from "node:test";
import assert from "node:assert/strict";
import { policy2025 } from "../../src/tax/policy-2025.js";
import { calculate, employeeSocialSecurity, employmentReduction, euros, familyAllowance, formatMoney, progressiveTax, roundCents, validatePolicy } from "../../src/tax/calculator.js";
import { validateInput } from "../../src/tax/validation.js";

const standardInput = {
  salary: "30000", age: "35", region: "madrid", filing: "individual",
  active: "yes", professionalGroup: "7", contract: "permanent", mobility: "no",
  children: "0", childrenUnder3: "0", exclusiveChildren: "yes",
  ascendantsDisabledUnder65: "0", ascendants65to74: "0", ascendants75plus: "0", ascendantSharers: "1",
  disability: "none", disabledChildren33: "0", disabledChildrenMobility: "0", disabledChildren65: "0",
  disabledAscendants33: "0", disabledAscendantsMobility: "0", disabledAscendants65: "0",
};

const withChanges = (changes) => ({ ...standardInput, ...changes });

test("2025 policy has complete, ascending state and regional scales", () => {
  assert.equal(validatePolicy(), true);
  for (const [name, region] of Object.entries(policy2025.regions)) {
    assert.ok(region.source.includes(name === "madrid" ? "comunidad-madrid" : "gravamen-autonomico"));
    assert.ok(region.allowance.taxpayer);
    for (const [index, [upper, next]] of region.brackets.entries()) {
      if (upper === null || index === region.brackets.length - 1) continue;
      const at = euros(upper);
      const increment = progressiveTax(at + euros("0.01"), region.brackets) - progressiveTax(at, region.brackets);
      assert.equal(increment, BigInt(region.brackets[index + 1][1]), `${name} at ${upper}`);
      assert.ok(next >= 0);
    }
  }
  for (const [index, [upper]] of policy2025.state.entries()) {
    if (upper === null) continue;
    const at = euros(upper);
    assert.equal(progressiveTax(at + euros("0.01"), policy2025.state) - progressiveTax(at, policy2025.state), BigInt(policy2025.state[index + 1][1]));
  }
});

test("AEAT 2025 worked Aragón general-base example matches both quotas", () => {
  // AEAT Manual 2025, chapter 15: base 23,900; minimum 5,550; no savings here.
  const base = euros("23900");
  const minimum = euros("5550");
  const state = progressiveTax(base, policy2025.state) - progressiveTax(minimum, policy2025.state);
  const region = progressiveTax(base, policy2025.regions.aragon.brackets) - progressiveTax(minimum, policy2025.regions.aragon.brackets);
  assert.equal(formatMoney(state), "2.140,50 €");
  assert.equal(formatMoney(region), "2.094,64 €");
});

test("Social Security applies group minimum, maximum and solidarity boundaries", () => {
  const low = employeeSocialSecurity(euros("1000"), 1, "permanent");
  assert.equal(low.monthlyBase, euros("1929"));
  assert.equal(formatMoney(low.common), "1.087,96 €");
  const atMaximum = employeeSocialSecurity(euros("58914"), 7, "permanent");
  assert.equal(atMaximum.monthlyBase, euros("4909.50"));
  assert.equal(atMaximum.solidarity, 0n);
  const aboveMaximum = employeeSocialSecurity(euros("58926"), 7, "permanent");
  assert.equal(aboveMaximum.monthlyBase, euros("4909.50"));
  assert.ok(aboveMaximum.solidarity > 0n);
  const firstTier = employeeSocialSecurity(euros("64805.40"), 7, "permanent");
  const nextTier = employeeSocialSecurity(euros("64817.40"), 7, "permanent");
  assert.equal(roundCents(nextTier.solidarity - firstTier.solidarity), 2n);
  const high = employeeSocialSecurity(euros("100000"), 7, "permanent");
  assert.ok(high.solidarity > nextTier.solidarity);
});

test("temporary contract rate changes only the unemployment contribution", () => {
  const permanent = employeeSocialSecurity(euros("30000"), 7, "permanent");
  const temporary = employeeSocialSecurity(euros("30000"), 7, "temporary");
  assert.equal(formatMoney(temporary.unemployment - permanent.unemployment), "15,00 €");
  assert.equal(temporary.common, permanent.common);
  const disabilityTemporary = calculate(withChanges({ disability: "moderate", contract: "temporary" }));
  const disabilityPermanent = calculate(withChanges({ disability: "moderate", contract: "permanent" }));
  assert.equal(disabilityTemporary.social.unemployment, disabilityPermanent.social.unemployment);
});

test("low employment reduction tapers and never exceeds the remaining net", () => {
  assert.equal(employmentReduction(euros("14852")), euros("7302"));
  assert.ok(employmentReduction(euros("17673.52")) > employmentReduction(euros("17673.53")));
  assert.equal(employmentReduction(euros("19747.50")), 0n);
  const low = calculate(withChanges({ salary: "2000", active: "no" }));
  assert.equal(low.base, 0n);
});

test("age thresholds and family shares change the allowance", () => {
  const allowance = policy2025.stateAllowance;
  const base = validateInput(standardInput).value;
  assert.equal(familyAllowance({ ...base, age: 64 }, allowance), euros("5550"));
  assert.equal(familyAllowance({ ...base, age: 65 }, allowance), euros("6700"));
  assert.equal(familyAllowance({ ...base, age: 74 }, allowance), euros("6700"));
  assert.equal(familyAllowance({ ...base, age: 75 }, allowance), euros("8100"));
  const twoChildren = { ...base, children: 2, childrenUnder3: 1, exclusiveChildren: true };
  assert.equal(familyAllowance(twoChildren, allowance), euros("13450"));
  assert.equal(familyAllowance({ ...twoChildren, exclusiveChildren: false }, allowance), euros("9500"));
  const oneAscendant = { ...base, ascendants65to74: 1, ascendantSharers: 2 };
  assert.equal(familyAllowance(oneAscendant, allowance), euros("6125"));
});

test("disability categories include assistance and regional differences", () => {
  const base = validateInput(standardInput).value;
  const state = policy2025.stateAllowance;
  assert.equal(familyAllowance({ ...base, disability: "moderate" }, state), euros("8550"));
  assert.equal(familyAllowance({ ...base, disability: "mobility" }, state), euros("11550"));
  assert.equal(familyAllowance({ ...base, disability: "severe" }, state), euros("17550"));
  assert.equal(familyAllowance({ ...base, children: 1, disabledChildren65: 1 }, state), euros("19950"));
  assert.equal(familyAllowance({ ...base, disability: "moderate" }, policy2025.regions.madrid.allowance), euros("9176.46"));
});

test("joint filing reductions, zero income and pension scenario", () => {
  const individual = calculate(standardInput);
  const married = calculate(withChanges({ filing: "married" }));
  const parent = calculate(withChanges({ filing: "singleParent", children: "1" }));
  assert.equal(individual.social.total, euros("1944"));
  assert.equal(married.jointReduction, euros("3400"));
  assert.equal(parent.jointReduction, euros("2150"));
  assert.equal(married.base, individual.base - euros("3400"));
  const zero = calculate(withChanges({ salary: "0" }));
  assert.equal(zero.tax, 0n);
  assert.equal(zero.social.total, 0n);
  assert.equal(zero.effectiveRate, 0n);
  const pension = calculate(withChanges({ active: "no", salary: "30000" }));
  assert.equal(pension.social.total, 0n);
  assert.ok(pension.tax > 0n);
});

test("validation rejects invalid salary, territories and cross-field combinations", () => {
  assert.ok(validateInput(withChanges({ salary: "30000.123" })).errors.salary);
  assert.ok(validateInput(withChanges({ salary: "10000000.01" })).errors.salary);
  assert.ok(validateInput(withChanges({ region: "navarra" })).errors.region);
  assert.ok(validateInput(withChanges({ children: "1", childrenUnder3: "2" })).errors.childrenUnder3);
  assert.ok(validateInput(withChanges({ children: "1", disabledChildren33: "1", disabledChildren65: "1" })).errors.disabledChildren33);
  assert.ok(validateInput(withChanges({ ascendantsDisabledUnder65: "1" })).errors.disabledAscendants33);
  assert.ok(validateInput(withChanges({ filing: "singleParent" })).errors.children);
  assert.ok(validateInput(withChanges({ age: "121" })).errors.age);
  assert.ok(validateInput(withChanges({ professionalGroup: "" })).errors.professionalGroup);
  assert.equal(validateInput(withChanges({ salary: "30.000,50" })).value.salary, "30000.50");
});
