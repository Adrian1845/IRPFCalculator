import { policy2025, professionalGroups, unsupportedTerritories } from "./tax/policy-2025.js";
import { calculate, formatMoney, formatRate } from "./tax/calculator.js";
import { calculateVox } from "./tax/vox-calculator.js";
import { validateInput } from "./tax/validation.js";
import { calculateSavings } from "./tax/savings-calculator.js";
import { calculateVoxSavings } from "./tax/vox-savings-calculator.js";
import { validateSavingsInput } from "./tax/savings-validation.js";
import { formatPerPayment } from "./payment-view.js";

const form = document.querySelector("#irpf-form");
const regionSelect = document.querySelector("#region");
const groupSelect = document.querySelector("#professionalGroup");
const errorSummary = document.querySelector("#error-summary");
const paymentSelector = document.querySelector(".payment-selector");
const resultTabs = [...document.querySelectorAll('.result-tabs [role="tab"]')];
const touched = new Set();
let submitted = false;
let latestCurrent = null;
let latestProposed = null;

for (const [key, region] of Object.entries(policy2025.regions).sort((a, b) => a[1].name.localeCompare(b[1].name, "es"))) {
  regionSelect.add(new Option(region.name, key));
}
for (const territory of unsupportedTerritories) {
  const option = new Option(`${territory} — no disponible`, "");
  option.disabled = true;
  regionSelect.add(option);
}
professionalGroups.forEach((name, index) => groupSelect.add(new Option(`${index + 1}. ${name}`, String(index + 1))));

function rawInput() {
  return Object.fromEntries(new FormData(form));
}

function validateAll(raw) {
  const general = validateInput(raw);
  const savings = validateSavingsInput(raw);
  return { errors: { ...general.errors, ...savings.errors }, valid: general.valid && savings.valid };
}

function syncDependentFields() {
  const active = form.elements.active.value === "yes";
  for (const name of ["professionalGroup", "contract", "mobility"]) {
    form.elements[name].disabled = !active;
    if (!active) clearError(name);
  }
  const ascendants = ["ascendantsDisabledUnder65", "ascendants65to74", "ascendants75plus"]
    .some((name) => Number(form.elements[name].value) > 0);
  form.elements.ascendantSharers.disabled = !ascendants;
  if (!ascendants) clearError("ascendantSharers");
}

function clearError(name) {
  const field = form.elements[name];
  if (!field) return;
  field.removeAttribute("aria-invalid");
  const message = document.getElementById(`${name}-error`);
  if (message) message.textContent = "";
}

function showErrors(errors, all = false) {
  for (const field of form.querySelectorAll("[name]")) {
    const name = field.name;
    if (!all && !touched.has(name)) continue;
    const message = document.getElementById(`${name}-error`);
    if (message) message.textContent = errors[name] ?? "";
    if (errors[name]) field.setAttribute("aria-invalid", "true");
    else field.removeAttribute("aria-invalid");
  }
}

function showSummary(errors) {
  errorSummary.replaceChildren();
  const entries = Object.entries(errors);
  if (!entries.length) {
    errorSummary.hidden = true;
    return;
  }
  const heading = document.createElement("strong");
  heading.textContent = "Revisa estos datos antes de calcular:";
  const list = document.createElement("ul");
  for (const [name, message] of entries) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = `#${name}`;
    link.textContent = `${form.elements[name]?.labels?.[0]?.textContent?.replace("*", "").trim() ?? name}: ${message}`;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      form.elements[name]?.focus();
    });
    item.append(link);
    list.append(item);
  }
  errorSummary.append(heading, list);
  errorSummary.hidden = false;
}

function setMoney(id, amount) {
  document.getElementById(id).textContent = formatMoney(amount);
}

function signedMoney(amount) {
  return amount > 0n ? `+${formatMoney(amount)}` : formatMoney(amount);
}

function updatePaymentValues() {
  if (!latestCurrent) return;
  const paymentCount = Number(paymentSelector.querySelector('input[name="payment-count"]:checked').value);
  document.getElementById("net-payment-value").textContent = formatPerPayment(latestCurrent.netAnnual, paymentCount);
  if (latestProposed?.available) {
    document.getElementById("vox-net-payment-value").textContent = formatPerPayment(latestProposed.netAnnual, paymentCount);
  }
}

function selectResultTab(name) {
  for (const tab of resultTabs) {
    const selected = tab.id === `${name}-tab`;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    document.getElementById(tab.getAttribute("aria-controls")).hidden = !selected;
  }
}

function renderSavingsResult(currentResult, raw) {
  const savings = calculateSavings(currentResult, raw);
  const proposed = calculateVoxSavings(savings);
  setMoney("savings-investment-value", savings.investmentBalance);
  setMoney("savings-disposal-value", savings.disposalBalance);
  setMoney("savings-annual-balance", savings.annualBalance);
  setMoney("current-savings-net-annual", savings.netAnnual);
  setMoney("current-savings-tax", savings.tax);
  setMoney("current-savings-state", savings.stateTax);
  setMoney("current-savings-regional", savings.regionalTax);
  setMoney("current-combined-tax", savings.currentTotalTax);
  setMoney("vox-savings-net-annual", proposed.netAnnual);
  setMoney("vox-savings-tax", proposed.tax);
  setMoney("vox-savings-state", proposed.stateTax);
  setMoney("vox-savings-regional", proposed.regionalTax);
  setMoney("vox-savings-combined-tax", proposed.proposedTotalTax);
  document.getElementById("savings-tax-difference").textContent = signedMoney(proposed.taxDifference);
  setMoney("savings-cross-offset", savings.crossOffset);
  setMoney("savings-unused-investment", savings.unusedInvestmentLoss);
  setMoney("savings-unused-disposal", savings.unusedDisposalLoss);
  setMoney("savings-taxable-base", savings.taxableBase);
  setMoney("savings-joint-reduction", savings.jointReductionApplied);
  setMoney("savings-base", savings.base);
  setMoney("savings-state-minimum", savings.stateMinimum);
  setMoney("savings-regional-minimum", savings.regionalMinimum);
  document.getElementById("savings-exceptions-warning").hidden = !savings.hasExcludedCases;
  const hasSavings = savings.investmentBalance !== 0n || savings.disposalBalance !== 0n;
  document.getElementById("employment-scope-note").hidden = !hasSavings;
  selectResultTab(hasSavings || savings.hasExcludedCases ? "savings" : "employment");
}

function renderResult(result, raw) {
  latestCurrent = result;
  document.getElementById("result-empty").hidden = true;
  document.getElementById("result-content").hidden = false;
  const filing = { individual: "declaración individual", married: "declaración conjunta de matrimonio", singleParent: "declaración conjunta monoparental" }[result.input.filing];
  document.getElementById("result-context").textContent = `${result.region} · ${filing} · ${result.input.active ? "trabajo en activo" : "sin actividad laboral"}`;
  setMoney("net-value", result.netAnnual);
  setMoney("gross-value", result.gross);
  setMoney("state-value", result.stateTax);
  setMoney("regional-value", result.regionalTax);
  setMoney("tax-value", result.tax);
  setMoney("social-value", result.social.total);
  setMoney("monthly-base", result.social.monthlyBase);
  setMoney("before-expense", result.beforeExpenseNet);
  setMoney("general-expense", result.generalExpense);
  setMoney("extra-expense", result.extraExpense);
  setMoney("employment-reduction", result.reduction);
  setMoney("joint-reduction", result.jointReduction);
  setMoney("general-base", result.base);
  setMoney("state-allowance", result.stateAllowance);
  setMoney("regional-allowance", result.regionalAllowance);
  document.getElementById("rate-value").textContent = formatRate(result.effectiveRate);

  const proposed = calculateVox(result);
  latestProposed = proposed;
  document.getElementById("vox-available").hidden = !proposed.available;
  document.getElementById("vox-unavailable").hidden = proposed.available;
  document.getElementById("comparison-delta").hidden = !proposed.available;
  updatePaymentValues();
  renderSavingsResult(result, raw);
  if (!proposed.available) return;

  setMoney("vox-net-value", proposed.netAnnual);
  setMoney("vox-tax-value", proposed.tax);
  setMoney("vox-social-value", proposed.social);
  setMoney("vox-base", proposed.base);
  setMoney("vox-lower-band", proposed.lowerBand);
  setMoney("vox-upper-band", proposed.upperBand);
  setMoney("vox-lower-tax", proposed.lowerTax);
  setMoney("vox-upper-tax", proposed.upperTax);
  document.getElementById("vox-rate-value").textContent = formatRate(proposed.effectiveRate);
  document.getElementById("vox-children").textContent = String(proposed.children);
  document.getElementById("vox-lower-rate").textContent = formatRate(BigInt(proposed.lowerRate));
  document.getElementById("vox-upper-rate").textContent = formatRate(BigInt(proposed.upperRate));
  document.getElementById("tax-difference").textContent = signedMoney(proposed.taxDifference);
  document.getElementById("net-difference").textContent = signedMoney(proposed.netDifference);
}

paymentSelector.addEventListener("change", updatePaymentValues);

for (const [index, tab] of resultTabs.entries()) {
  tab.addEventListener("click", () => selectResultTab(tab.id === "savings-tab" ? "savings" : "employment"));
  tab.addEventListener("keydown", (event) => {
    const next = event.key === "ArrowRight" ? (index + 1) % resultTabs.length
      : event.key === "ArrowLeft" ? (index - 1 + resultTabs.length) % resultTabs.length
        : event.key === "Home" ? 0 : event.key === "End" ? resultTabs.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    const target = resultTabs[next];
    selectResultTab(target.id === "savings-tab" ? "savings" : "employment");
    target.focus();
  });
}

form.addEventListener("focusout", (event) => {
  const field = event.target;
  if (!field.name) return;
  touched.add(field.name);
  const { errors } = validateAll(rawInput());
  showErrors(errors);
});

form.addEventListener("input", () => {
  syncDependentFields();
  if (submitted) {
    const { errors } = validateAll(rawInput());
    showErrors(errors, true);
    showSummary(errors);
  }
  if (!document.getElementById("result-content").hidden) {
    document.getElementById("result-content").hidden = true;
    document.getElementById("result-empty").hidden = false;
  }
});
form.addEventListener("change", syncDependentFields);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  submitted = true;
  syncDependentFields();
  const raw = rawInput();
  const { errors, valid } = validateAll(raw);
  showErrors(errors, true);
  showSummary(errors);
  if (!valid) {
    errorSummary.focus();
    errorSummary.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  renderResult(calculate(raw), raw);
  if (window.matchMedia("(max-width: 720px)").matches) {
    document.querySelector(".result-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

syncDependentFields();
