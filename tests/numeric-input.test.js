import test from "node:test";
import assert from "node:assert/strict";
import { acceptsNumericInsertion, isNumericDraft } from "../src/numeric-input.js";

test("integer fields accept digits only", () => {
  assert.equal(isNumericDraft("120", "integer"), true);
  for (const value of ["12a", "1e3", "-2", "1.5", "1,5", "１２"]) {
    assert.equal(isNumericDraft(value, "integer"), false);
  }
});

test("money fields allow decimal punctuation but reject letters and signs", () => {
  for (const value of ["", "30.000,00", "1000.50", "1,5"]) {
    assert.equal(isNumericDraft(value, "money"), true);
  }
  for (const value of ["1e3", "1a", "-12", "1,2,3", "1,2.3"]) {
    assert.equal(isNumericDraft(value, "money"), false);
  }
});

test("savings fields allow a leading minus for losses", () => {
  assert.equal(isNumericDraft("-1.234,50", "signed-money"), true);
  assert.equal(isNumericDraft("−123,45", "signed-money"), true);
  assert.equal(isNumericDraft("12-3", "signed-money"), false);
});

test("typing or pasting checks the value after replacing the selection", () => {
  assert.equal(acceptsNumericInsertion("120", 1, 2, "5", "integer"), true);
  assert.equal(acceptsNumericInsertion("120", 1, 2, "e5", "integer"), false);
  assert.equal(acceptsNumericInsertion("0", 0, 1, "-1.500,25", "signed-money"), true);
  assert.equal(acceptsNumericInsertion("0", 0, 1, "€1.500", "signed-money"), false);
});
