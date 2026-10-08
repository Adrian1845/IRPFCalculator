import { policy2025 } from "./policy-2025.js";
import { validateInput } from "./validation.js";

const UNIT = 1_000_000n;
const RATE_UNIT = 10_000n;

export function euros(text) {
  const [whole, fraction = ""] = String(text).split(".");
  if (!/^\d+$/.test(whole) || !/^\d{0,6}$/.test(fraction)) throw new Error(`Importe no válido: ${text}`);
  return BigInt(whole) * UNIT + BigInt(fraction.padEnd(6, "0"));
}

const rate = (amount, basisPoints) => (amount * BigInt(basisPoints)) / RATE_UNIT;
const min = (a, b) => a < b ? a : b;
const max = (a, b) => a > b ? a : b;

export function roundCents(amount) {
  return amount < 0n ? -((-amount + 5_000n) / 10_000n) : (amount + 5_000n) / 10_000n;
}

export function formatMoney(amount) {
  const cents = roundCents(amount);
  const negative = cents < 0n ? "−" : "";
  const absolute = cents < 0n ? -cents : cents;
  const whole = absolute / 100n;
  const digits = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negative}${digits},${String(absolute % 100n).padStart(2, "0")} €`;
}

export function formatRate(amountBasisPoints) {
  return `${String(amountBasisPoints / 100n)},${String(amountBasisPoints % 100n).padStart(2, "0")} %`;
}

export function progressiveTax(amount, brackets) {
  let previous = 0n;
  let total = 0n;
  for (const [upperText, basisPoints] of brackets) {
    const upper = upperText === null ? amount : euros(upperText);
    const slice = max(0n, min(amount, upper) - previous);
    total += rate(slice, basisPoints);
    previous = upper;
    if (amount <= upper) break;
  }
  return total;
}

function validateBrackets(brackets, label) {
  if (!Array.isArray(brackets) || brackets.length === 0 || brackets.at(-1)[0] !== null) throw new Error(`Escala incompleta: ${label}`);
  let previous = 0n;
  for (const [index, [upperText, basisPoints]] of brackets.entries()) {
    if (!Number.isInteger(basisPoints) || basisPoints < 0) throw new Error(`Tipo inválido: ${label}`);
    if (upperText === null) {
      if (index !== brackets.length - 1) throw new Error(`Límite final mal colocado: ${label}`);
    } else {
      const upper = euros(upperText);
      if (upper <= previous) throw new Error(`Límites no crecientes: ${label}`);
      previous = upper;
    }
  }
}

export function validatePolicy(policy = policy2025) {
  validateBrackets(policy.state, "estatal");
  validateBrackets(policy.savings.state, "ahorro estatal");
  validateBrackets(policy.savings.autonomous, "ahorro autonómico");
  if (Object.keys(policy.regions).length !== 15) throw new Error("Faltan comunidades autónomas");
  for (const [key, region] of Object.entries(policy.regions)) {
    validateBrackets(region.brackets, key);
    for (const field of ["taxpayer", "over65", "over75", "under3", "ascendant", "ascendantOver75", "disability33", "disability65", "assistance"]) {
      if (region.allowance[field] === undefined) throw new Error(`Mínimo incompleto: ${key}.${field}`);
      euros(region.allowance[field]);
    }
    if (region.allowance.descendants?.length !== 4) throw new Error(`Mínimo por descendientes incompleto: ${key}`);
    region.allowance.descendants.forEach(euros);
  }
  return true;
}

validatePolicy();

export function employeeSocialSecurity(gross, group, contract, policy = policy2025) {
  if (gross === 0n) return { total: 0n, common: 0n, unemployment: 0n, training: 0n, mei: 0n, solidarity: 0n, monthlyBase: 0n };
  const rules = policy.socialSecurity;
  const monthlySalary = gross / 12n;
  const maximum = euros(rules.monthlyMaximum);
  const commonBase = min(max(monthlySalary, euros(rules.monthlyMinimumByGroup[group - 1])), maximum);
  const unemploymentBase = min(max(monthlySalary, euros(rules.monthlyUnemploymentMinimum)), maximum);
  const common = rate(commonBase, rules.commonRate) * 12n;
  const unemployment = rate(unemploymentBase, rules.unemploymentRate[contract]) * 12n;
  const training = rate(unemploymentBase, rules.trainingRate) * 12n;
  const mei = rate(commonBase, rules.meiRate) * 12n;
  let solidarity = 0n;
  let lower = maximum;
  for (const [upperText, basisPoints] of rules.solidarity) {
    const upper = upperText === null ? monthlySalary : euros(upperText);
    solidarity += rate(max(0n, min(monthlySalary, upper) - lower), basisPoints) * 12n;
    lower = upper;
    if (monthlySalary <= upper) break;
  }
  return { total: common + unemployment + training + mei + solidarity, common, unemployment, training, mei, solidarity, monthlyBase: commonBase };
}

export function employmentReduction(beforeExpenseNet, policy = policy2025) {
  const { lowIncomeBounds, lowIncomeAmounts, lowIncomeTapers } = policy.employment;
  const [first, second, last] = lowIncomeBounds.map(euros);
  if (beforeExpenseNet <= 0n || beforeExpenseNet >= last) return 0n;
  if (beforeExpenseNet <= first) return euros(lowIncomeAmounts[0]);
  if (beforeExpenseNet <= second) return max(0n, euros(lowIncomeAmounts[0]) - rate(beforeExpenseNet - first, lowIncomeTapers[0]));
  return max(0n, euros(lowIncomeAmounts[1]) - rate(beforeExpenseNet - second, lowIncomeTapers[1]));
}

function disabilityAmount(kind, allowance, relative = "taxpayer") {
  if (kind === "none") return 0n;
  const field33 = relative === "descendant" ? "descendantDisability33" : "disability33";
  const field65 = relative === "descendant" ? "descendantDisability65" : "disability65";
  const amount = euros(kind === "severe" ? (allowance[field65] ?? allowance.disability65) : (allowance[field33] ?? allowance.disability33));
  return amount + (kind === "mobility" || kind === "severe" ? euros(allowance.assistance) : 0n);
}

export function familyAllowance(input, allowance) {
  let total = euros(allowance.taxpayer);
  if (input.age >= 65) total += euros(allowance.over65);
  if (input.age >= 75) total += euros(allowance.over75);
  total += disabilityAmount(input.disability, allowance);

  let descendants = 0n;
  for (let index = 0; index < input.children; index++) {
    descendants += euros(allowance.descendants[Math.min(index, 3)]);
  }
  descendants += BigInt(input.childrenUnder3) * euros(allowance.under3);
  descendants += BigInt(input.disabledChildren33) * disabilityAmount("moderate", allowance, "descendant");
  descendants += BigInt(input.disabledChildrenMobility) * disabilityAmount("mobility", allowance, "descendant");
  descendants += BigInt(input.disabledChildren65) * disabilityAmount("severe", allowance, "descendant");
  total += input.exclusiveChildren ? descendants : descendants / 2n;

  const ascendantCount = input.ascendantsDisabledUnder65 + input.ascendants65to74 + input.ascendants75plus;
  let ascendants = BigInt(ascendantCount) * euros(allowance.ascendant);
  ascendants += BigInt(input.ascendants75plus) * euros(allowance.ascendantOver75);
  ascendants += BigInt(input.disabledAscendants33) * disabilityAmount("moderate", allowance, "ascendant");
  ascendants += BigInt(input.disabledAscendantsMobility) * disabilityAmount("mobility", allowance, "ascendant");
  ascendants += BigInt(input.disabledAscendants65) * disabilityAmount("severe", allowance, "ascendant");
  return total + ascendants / BigInt(input.ascendantSharers);
}

export function calculate(raw, policy = policy2025) {
  const checked = validateInput(raw);
  if (!checked.valid) return { errors: checked.errors };
  const input = checked.value;
  const gross = euros(input.salary);
  // The 2025 unemployment rate for a temporary contract with a recognised
  // disability of at least 33% is the same as for a permanent contract.
  const contributionContract = input.contract === "temporary" && input.disability !== "none" ? "permanent" : input.contract;
  const social = input.active
    ? employeeSocialSecurity(gross, input.professionalGroup, contributionContract, policy)
    : { total: 0n, common: 0n, unemployment: 0n, training: 0n, mei: 0n, solidarity: 0n, monthlyBase: 0n };
  const beforeExpenseNet = max(0n, gross - social.total);
  const generalExpense = min(beforeExpenseNet, euros(policy.employment.generalExpense));
  const activeDisabilityExpense = !input.active || input.disability === "none" ? 0n : euros(input.disability === "severe" || input.disability === "mobility" ? policy.employment.disabledExpense65 : policy.employment.disabledExpense33);
  const extraExpense = min(max(0n, beforeExpenseNet - generalExpense),
    (input.mobility ? euros(policy.employment.mobilityExpense) : 0n) + activeDisabilityExpense);
  const netBeforeReduction = max(0n, beforeExpenseNet - generalExpense - extraExpense);
  const reduction = min(netBeforeReduction, employmentReduction(beforeExpenseNet, policy));
  const netEmployment = max(0n, netBeforeReduction - reduction);
  const jointReductionEntitlement = input.filing === "individual" ? 0n : euros(policy.jointReduction[input.filing]);
  const jointReduction = min(netEmployment, jointReductionEntitlement);
  const jointReductionRemainder = jointReductionEntitlement - jointReduction;
  const base = max(0n, netEmployment - jointReduction);
  const region = policy.regions[input.region];
  const stateAllowance = familyAllowance(input, policy.stateAllowance);
  const regionalAllowance = familyAllowance(input, region.allowance);
  const stateTax = max(0n, progressiveTax(base, policy.state) - progressiveTax(min(base, stateAllowance), policy.state));
  const regionalTax = max(0n, progressiveTax(base, region.brackets) - progressiveTax(min(base, regionalAllowance), region.brackets));
  const tax = stateTax + regionalTax;
  const netAnnual = gross - social.total - tax;
  const effectiveRate = gross === 0n ? 0n : (tax * 10_000n + gross / 2n) / gross;
  return {
    input, year: policy.year, region: region.name, gross, social, beforeExpenseNet,
    generalExpense, extraExpense, reduction, netEmployment, jointReduction,
    jointReductionEntitlement, jointReductionRemainder, base,
    stateAllowance, regionalAllowance, stateTax, regionalTax, tax, netAnnual, effectiveRate,
  };
}
