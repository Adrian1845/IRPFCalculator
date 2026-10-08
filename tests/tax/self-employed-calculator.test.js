import test from "node:test";
import assert from "node:assert/strict";
import { euros } from "../../src/tax/calculator.js";
import { calculateSelfEmployed } from "../../src/tax/self-employed-calculator.js";

const baseInput = {
  businessIncome: "40000", businessExpenses: "10000", retaPaid: "3000", retaAdjustment: "0",
  edsEligible: "yes", singleActivity: "yes", otherIncome: "no", specialCases: "no",
  startup: "none", startupRequirements: "no",
  region: "madrid", age: "35", filing: "individual", disability: "none", exclusiveChildren: "yes",
};

const calculate = (changes = {}) => calculateSelfEmployed({ ...baseInput, ...changes });

test("calcula el rendimiento EDS y el 5 % sin confundir RETA con otros gastos", () => {
  const result = calculate();
  assert.equal(result.preliminaryYield, euros("27000"));
  assert.equal(result.difficultExpense, euros("1350"));
  assert.equal(result.netYield, euros("25650"));
  assert.equal(result.activityYield, euros("25650"));
  assert.equal(result.tax, result.stateTax + result.regionalTax);
});

test("reproduce el rendimiento de la tabla trabajada por la AEAT en 2025", () => {
  const result = calculate({ businessIncome: "138400", businessExpenses: "75000", retaPaid: "3300" });
  assert.equal(result.preliminaryYield, euros("60100"));
  assert.equal(result.difficultExpense, euros("2000"));
  assert.equal(result.netYield, euros("58100"));
});

test("limita el gasto de difícil justificación a 2.000 € y respeta el umbral", () => {
  assert.equal(calculate({ businessIncome: "43000", businessExpenses: "0", retaPaid: "3000" }).difficultExpense, euros("2000"));
  assert.equal(calculate({ businessIncome: "43000.01", businessExpenses: "0", retaPaid: "3000" }).difficultExpense, euros("2000"));
  assert.equal(calculate({ businessIncome: "42999.99", businessExpenses: "0", retaPaid: "3000" }).difficultExpense, euros("1999.9995"));
});

test("aplica la reducción para rentas no exentas bajas antes de la de inicio", () => {
  const low = calculate({ businessIncome: "8000", businessExpenses: "0", retaPaid: "0" });
  assert.equal(low.netYield, euros("7600"));
  assert.equal(low.lowIncomeReduction, euros("1620"));
  const taper = calculate({ businessIncome: "10000", businessExpenses: "0", retaPaid: "0" });
  assert.equal(taper.netYield, euros("9500"));
  assert.equal(taper.lowIncomeReduction, euros("1012.50"));
  const end = calculate({ businessIncome: "12631.57", businessExpenses: "0", retaPaid: "0" });
  assert.equal(end.netYield, euros("11999.9915"));
  assert.ok(end.lowIncomeReduction > 0n);
  assert.equal(calculate({ businessIncome: "12631.58", businessExpenses: "0", retaPaid: "0" }).lowIncomeReduction, 0n);
});

test("aplica la reducción por inicio con tope y sin generar base negativa", () => {
  const started = calculate({ startup: "first", startupRequirements: "yes" });
  assert.equal(started.startupReduction, euros("5130"));
  assert.equal(started.activityYield, euros("20520"));
  const high = calculate({ businessIncome: "200000", businessExpenses: "0", retaPaid: "0", startup: "next", startupRequirements: "yes" });
  assert.equal(high.startupReduction, euros("20000"));
});

test("las pérdidas y el cero no generan deducción porcentual ni cuota", () => {
  const loss = calculate({ businessIncome: "5000", businessExpenses: "10000", retaPaid: "3000" });
  assert.equal(loss.preliminaryYield, -euros("8000"));
  assert.equal(loss.difficultExpense, 0n);
  assert.equal(loss.lowIncomeReduction, 0n);
  assert.equal(loss.tax, 0n);
  assert.equal(calculate({ businessIncome: "0", businessExpenses: "0", retaPaid: "0" }).tax, 0n);
});

test("registra el exceso de devolución del RETA como ingreso", () => {
  const result = calculate({ businessIncome: "10000", businessExpenses: "0", retaPaid: "1000", retaAdjustment: "-1500" });
  assert.equal(result.retaExpense, 0n);
  assert.equal(result.retaRefundExcess, euros("500"));
  assert.equal(result.preliminaryYield, euros("10500"));
});

test("la declaración conjunta aplica una sola reducción a la base", () => {
  const result = calculate({ filing: "married" });
  assert.equal(result.jointReduction, euros("3400"));
  assert.equal(result.base, euros("22250"));
});

test("territorio y circunstancias familiares alteran la cuota y no el rendimiento", () => {
  const madrid = calculate();
  const andalucia = calculate({ region: "andalucia", children: "1", childrenUnder3: "1" });
  assert.equal(madrid.netYield, andalucia.netYield);
  assert.notEqual(madrid.tax, andalucia.tax);
  assert.ok(andalucia.stateAllowance > madrid.stateAllowance);
});

test("rechaza métodos, otras rentas y supuestos fuera de alcance", () => {
  for (const changes of [
    { edsEligible: "no" }, { singleActivity: "no" }, { otherIncome: "yes" },
    { specialCases: "yes" }, { startup: "first" }, { businessIncome: "-1" },
    { businessExpenses: "1.001" }, { children: "0", childrenUnder3: "1" },
  ]) {
    assert.ok(calculate(changes).errors);
  }
});
