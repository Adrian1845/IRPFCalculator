import { policy2025, professionalGroups, unsupportedTerritories } from "./tax/policy-2025.js";
import { calculate, formatMoney, formatRate } from "./tax/calculator.js";
import { calculateVox } from "./tax/vox-calculator.js";
import { validateInput } from "./tax/validation.js";
import { formatPerPayment } from "./payment-view.js";

const form = document.querySelector("#irpf-form");
const regionSelect = document.querySelector("#region");
const groupSelect = document.querySelector("#professionalGroup");
const errorSummary = document.querySelector("#error-summary");
const paymentSelector = document.querySelector(".payment-selector");
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

function renderResult(result) {
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

form.addEventListener("focusout", (event) => {
  const field = event.target;
  if (!field.name) return;
  touched.add(field.name);
  const { errors } = validateInput(rawInput());
  showErrors(errors);
});

form.addEventListener("input", () => {
  syncDependentFields();
  if (submitted) {
    const { errors } = validateInput(rawInput());
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
  const { errors, valid } = validateInput(raw);
  showErrors(errors, true);
  showSummary(errors);
  if (!valid) {
    errorSummary.focus();
    errorSummary.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  renderResult(calculate(raw));
  if (window.matchMedia("(max-width: 720px)").matches) {
    document.querySelector(".result-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

syncDependentFields();
