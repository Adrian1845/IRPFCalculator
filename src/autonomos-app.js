import { euros, formatMoney } from "./tax/calculator.js";
import { policy2025, unsupportedTerritories } from "./tax/policy-2025.js";
import { calculateSelfEmployed } from "./tax/self-employed-calculator.js";
import { validateSelfEmployedInput } from "./tax/self-employed-validation.js";
import { calculateRetaBonusScenario } from "./tax/vox-self-employed-calculator.js";
import { voxSelfEmployedPolicy } from "./tax/vox-self-employed-policy.js";

const form = document.querySelector("#autonomos-form");
const summary = document.querySelector("#error-summary");
const touched = new Set();
let submitted = false;
document.getElementById("vox-smi").textContent = formatMoney(euros(voxSelfEmployedPolicy.smi2025));

for (const [key, region] of Object.entries(policy2025.regions).sort((a, b) => a[1].name.localeCompare(b[1].name, "es"))) {
  form.elements.region.add(new Option(region.name, key));
}
for (const territory of unsupportedTerritories) {
  const option = new Option(`${territory} — no disponible`, "");
  option.disabled = true;
  form.elements.region.add(option);
}

function rawInput() {
  return Object.fromEntries(new FormData(form));
}

function showFieldErrors(errors, all = false) {
  for (const field of form.querySelectorAll("[name]")) {
    if (!all && !touched.has(field.name)) continue;
    const message = document.getElementById(`${field.name}-error`);
    if (message) message.textContent = errors[field.name] ?? "";
    if (errors[field.name]) field.setAttribute("aria-invalid", "true");
    else field.removeAttribute("aria-invalid");
  }
}

function showSummary(errors) {
  summary.replaceChildren();
  const entries = Object.entries(errors);
  if (!entries.length) {
    summary.hidden = true;
    return;
  }
  const heading = document.createElement("strong");
  heading.textContent = "Revisa estos datos antes de calcular:";
  const list = document.createElement("ul");
  for (const [name, message] of entries) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    const field = form.elements[name];
    link.href = `#${name}`;
    link.textContent = `${field?.labels?.[0]?.textContent?.replace("*", "").trim() ?? name}: ${message}`;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      field?.focus();
    });
    item.append(link);
    list.append(item);
  }
  summary.append(heading, list);
  summary.hidden = false;
}

function setMoney(id, amount) {
  document.getElementById(id).textContent = formatMoney(amount);
}

function render(result, raw) {
  document.getElementById("result-empty").hidden = true;
  document.getElementById("result-content").hidden = false;
  document.getElementById("result-context").textContent = `${result.region} · ejercicio ${result.year} · estimación directa simplificada`;
  for (const [id, amount] of [
    ["tax-value", result.tax],
    ["net-yield", result.netYield],
    ["low-income-reduction", result.lowIncomeReduction],
    ["startup-reduction", result.startupReduction],
    ["general-base", result.base],
    ["state-tax", result.stateTax],
    ["regional-tax", result.regionalTax],
    ["income-value", result.income],
    ["expenses-value", result.expenses],
    ["reta-expense", result.retaExpense],
    ["reta-refund", result.retaRefundExcess],
    ["preliminary-yield", result.preliminaryYield],
    ["difficult-expense", result.difficultExpense],
    ["joint-reduction", result.jointReduction],
    ["state-allowance", result.stateAllowance],
    ["regional-allowance", result.regionalAllowance],
  ]) setMoney(id, amount);

  const bonus = calculateRetaBonusScenario(raw, result);
  for (const [id, amount] of [
    ["vox-reta-current", bonus.currentRetaPaid],
    ["vox-reta-proposed", bonus.hypotheticalRetaPaid],
    ["vox-reta-current-tax", bonus.currentTax],
    ["vox-reta-proposed-tax", bonus.hypotheticalTax],
    ["vox-reta-tax-change", bonus.irpfChange],
    ["vox-reta-impact", bonus.netSaving < 0n ? -bonus.netSaving : bonus.netSaving],
  ]) setMoney(id, amount);
  document.getElementById("vox-reta-impact-label").textContent = bonus.netSaving > 0n
    ? "Ahorro combinado estimado" : bonus.netSaving < 0n
      ? "Coste combinado estimado" : "Sin cambio combinado";
  document.getElementById("reta-bonus-details").open = false;
}

form.addEventListener("focusout", (event) => {
  const name = event.target.name;
  if (!name) return;
  touched.add(name);
  showFieldErrors(validateSelfEmployedInput(rawInput()).errors);
});

function invalidateResult() {
  document.getElementById("result-content").hidden = true;
  document.getElementById("result-empty").hidden = false;
}

form.addEventListener("input", () => {
  invalidateResult();
  if (submitted) {
    const { errors } = validateSelfEmployedInput(rawInput());
    showFieldErrors(errors, true);
    showSummary(errors);
  }
});

form.addEventListener("change", () => {
  invalidateResult();
  if (submitted) {
    const { errors } = validateSelfEmployedInput(rawInput());
    showFieldErrors(errors, true);
    showSummary(errors);
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  submitted = true;
  const raw = rawInput();
  const checked = validateSelfEmployedInput(raw);
  showFieldErrors(checked.errors, true);
  showSummary(checked.errors);
  if (!checked.valid) {
    document.getElementById("result-content").hidden = true;
    document.getElementById("result-empty").hidden = false;
    summary.focus();
    return;
  }
  render(calculateSelfEmployed(raw), raw);
  if (window.innerWidth <= 1050) document.querySelector(".result-panel").scrollIntoView({ behavior: "smooth", block: "start" });
});
