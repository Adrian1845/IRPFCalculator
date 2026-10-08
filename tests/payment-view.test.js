import test from "node:test";
import assert from "node:assert/strict";
import { euros } from "../src/tax/calculator.js";
import { formatPerPayment } from "../src/payment-view.js";

test("annual net is displayed as an average over 12 or 14 payments", () => {
  const annualNet = euros("24000");
  assert.equal(formatPerPayment(annualNet, 12), "2.000,00 €");
  assert.equal(formatPerPayment(annualNet, 14), "1.714,29 €");
  assert.equal(annualNet, euros("24000"));
});

test("payment display rejects unsupported payment counts", () => {
  assert.throws(() => formatPerPayment(euros("12000"), 13), RangeError);
});
