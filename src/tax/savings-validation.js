const balanceFields = ["investmentIncome", "disposalGains"];

export function validateSavingsInput(raw) {
  const errors = {};
  const value = {};
  for (const field of balanceFields) {
    const text = String(raw[field] ?? "0").trim().replace(/\s/g, "").replace(/−/g, "-");
    const normalized = text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text;
    if (!/^-?\d+(?:\.\d{1,2})?$/.test(normalized) || Math.abs(Number(normalized)) > 100_000_000) {
      errors[field] = "Introduce un saldo entre −100.000.000 y 100.000.000 € con hasta dos decimales.";
    } else {
      value[field] = normalized;
    }
  }
  const exceptions = raw.savingsExceptions ?? "no";
  if (exceptions !== "yes" && exceptions !== "no") {
    errors.savingsExceptions = "Indica si tienes pérdidas anteriores u otros supuestos no cubiertos.";
  }
  value.savingsExceptions = exceptions === "yes";
  return { value, errors, valid: Object.keys(errors).length === 0 };
}
