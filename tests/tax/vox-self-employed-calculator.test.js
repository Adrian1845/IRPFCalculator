import test from "node:test";
import assert from "node:assert/strict";
import { euros } from "../../src/tax/calculator.js";
import { calculateSelfEmployed } from "../../src/tax/self-employed-calculator.js";
import { calculateRetaBonusScenario } from "../../src/tax/vox-self-employed-calculator.js";

const input = {
  businessIncome: "40000", businessExpenses: "10000", retaPaid: "3000", retaAdjustment: "0",
  edsEligible: "yes", singleActivity: "yes", otherIncome: "no", specialCases: "no",
  startup: "none", startupRequirements: "no", region: "madrid", age: "35",
  filing: "individual", disability: "none", exclusiveChildren: "yes",
};

test("bonificar RETA recalcula el IRPF y resta su aumento del ahorro", () => {
  const current = calculateSelfEmployed(input);
  const scenario = calculateRetaBonusScenario(input, current);
  assert.equal(scenario.eligibilityDetermined, false);
  assert.equal(scenario.currentRetaPaid, euros("3000"));
  assert.equal(scenario.hypotheticalRetaPaid, 0n);
  assert.ok(scenario.hypotheticalTax > current.tax);
  assert.equal(scenario.irpfChange, scenario.hypotheticalTax - current.tax);
  assert.equal(scenario.netSaving, euros("3000") - scenario.irpfChange);
  assert.ok(scenario.netSaving < euros("3000"));
});

test("la bonificación no borra la regularización de años anteriores", () => {
  const raw = { ...input, retaPaid: "1000", retaAdjustment: "-1500" };
  const current = calculateSelfEmployed(raw);
  const scenario = calculateRetaBonusScenario(raw, current);
  const withoutCurrentQuota = calculateSelfEmployed({ ...raw, retaPaid: "0" });
  assert.equal(withoutCurrentQuota.retaRefundExcess, euros("1500"));
  assert.equal(scenario.hypotheticalTax, withoutCurrentQuota.tax);
  assert.equal(scenario.netSaving, euros("1000") + current.tax - withoutCurrentQuota.tax);
});

test("cero cuota pagada no crea un ahorro ficticio", () => {
  const raw = { ...input, retaPaid: "0" };
  const current = calculateSelfEmployed(raw);
  const scenario = calculateRetaBonusScenario(raw, current);
  assert.equal(scenario.irpfChange, 0n);
  assert.equal(scenario.netSaving, 0n);
});
