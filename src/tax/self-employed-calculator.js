import { euros, familyAllowance, progressiveTax } from "./calculator.js";
import { policy2025 } from "./policy-2025.js";
import { validateSelfEmployedInput } from "./self-employed-validation.js";

const min = (a, b) => a < b ? a : b;
const max = (a, b) => a > b ? a : b;
const signedEuros = (value) => value.startsWith("-") ? -euros(value.slice(1)) : euros(value);
const percent = (amount, basisPoints) => amount * BigInt(basisPoints) / 10_000n;

export function calculateSelfEmployed(raw, policy = policy2025) {
  const checked = validateSelfEmployedInput(raw);
  if (!checked.valid) return { errors: checked.errors };
  const input = checked.value;
  const rules = policy.selfEmployment;
  const income = euros(input.businessIncome);
  const expenses = euros(input.businessExpenses);
  const retaPaid = euros(input.retaPaid);
  const retaAdjustment = signedEuros(input.retaAdjustment);
  const retaNet = retaPaid + retaAdjustment;
  const retaExpense = max(0n, retaNet);
  const retaRefundExcess = max(0n, -retaNet);
  const adjustedIncome = income + retaRefundExcess;
  const preliminaryYield = adjustedIncome - expenses - retaExpense;
  const difficultExpense = min(euros(rules.difficultExpenseLimit),
    percent(max(0n, preliminaryYield), rules.difficultExpenseRate));
  const netYield = preliminaryYield - difficultExpense;

  let lowIncomeReduction = 0n;
  if (netYield > 0n && netYield < euros(rules.lowIncomeEndsAt)) {
    const taper = percent(max(0n, netYield - euros(rules.lowIncomeFullThrough)), rules.lowIncomeTaper);
    lowIncomeReduction = min(netYield, max(0n, euros(rules.lowIncomeAmount) - taper));
  }
  const afterLowIncome = netYield - lowIncomeReduction;
  const startupReduction = input.startup === "none" ? 0n
    : percent(min(max(0n, afterLowIncome), euros(rules.startupBaseLimit)), rules.startupRate);
  const activityYield = afterLowIncome - startupReduction;
  const jointEntitlement = input.filing === "individual" ? 0n : euros(policy.jointReduction[input.filing]);
  const jointReduction = min(max(0n, activityYield), jointEntitlement);
  const base = max(0n, activityYield - jointReduction);
  const region = policy.regions[input.region];
  const stateAllowance = familyAllowance(input, policy.stateAllowance);
  const regionalAllowance = familyAllowance(input, region.allowance);
  const stateTax = max(0n, progressiveTax(base, policy.state)
    - progressiveTax(min(base, stateAllowance), policy.state));
  const regionalTax = max(0n, progressiveTax(base, region.brackets)
    - progressiveTax(min(base, regionalAllowance), region.brackets));

  return {
    input, year: policy.year, region: region.name, income, expenses,
    retaPaid, retaAdjustment, retaExpense, retaRefundExcess, adjustedIncome,
    preliminaryYield, difficultExpense, netYield, lowIncomeReduction,
    startupReduction, activityYield, jointReduction, base,
    stateAllowance, regionalAllowance, stateTax, regionalTax,
    tax: stateTax + regionalTax,
  };
}
