import { validateInput } from "./validation.js";

const moneyFields = ["businessIncome", "businessExpenses", "retaPaid"];

function normalizedMoney(raw) {
  const text = String(raw ?? "").trim().replace(/\s/g, "").replace(/−/g, "-");
  return text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text;
}

export function validateSelfEmployedInput(raw) {
  const family = validateInput({ ...raw, salary: "0", active: "no" });
  const errors = { ...family.errors };
  const value = family.value;

  for (const field of moneyFields) {
    const amount = normalizedMoney(raw[field]);
    if (!/^\d+(?:\.\d{1,2})?$/.test(amount) || Number(amount) > 10_000_000) {
      errors[field] = "Introduce un importe entre 0 y 10.000.000 € con hasta dos decimales.";
    } else {
      value[field] = amount;
    }
  }
  const adjustment = normalizedMoney(raw.retaAdjustment);
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(adjustment) || Math.abs(Number(adjustment)) > 10_000_000) {
    errors.retaAdjustment = "Introduce un ajuste entre −10.000.000 y 10.000.000 € con hasta dos decimales.";
  } else {
    value.retaAdjustment = adjustment;
  }

  for (const [field, message] of [
    ["edsEligible", "Esta calculadora requiere estimación directa simplificada en 2025."],
    ["singleActivity", "Esta versión admite una sola actividad económica en la unidad familiar."],
    ["otherIncome", "Esta versión solo calcula casos sin otras rentas gravables en la unidad familiar."],
    ["specialCases", "Esta versión no cubre mutualidades alternativas, otras reducciones, deducciones ni transmisiones de bienes afectos."],
  ]) {
    const expected = field === "otherIncome" || field === "specialCases" ? "no" : "yes";
    if (raw[field] !== expected) errors[field] = message;
    value[field] = raw[field];
  }

  if (!["none", "first", "next"].includes(raw.startup)) {
    errors.startup = "Selecciona si procede la reducción por inicio de actividad.";
  }
  value.startup = raw.startup;
  if (raw.startup !== "none" && raw.startupRequirements !== "yes") {
    errors.startupRequirements = "Confirma todos los requisitos antes de aplicar la reducción por inicio.";
  }

  return { value, errors, valid: Object.keys(errors).length === 0 };
}
