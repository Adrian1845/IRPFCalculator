import { policy2025 } from "./policy-2025.js";

const countFields = [
  "children", "childrenUnder3", "ascendantsDisabledUnder65", "ascendants65to74", "ascendants75plus",
  "disabledChildren33", "disabledChildrenMobility", "disabledChildren65",
  "disabledAscendants33", "disabledAscendantsMobility", "disabledAscendants65",
];

const disabilities = ["none", "moderate", "mobility", "severe"];
const filings = ["individual", "married", "singleParent"];

export function validateInput(raw) {
  const errors = {};
  const value = { ...raw };
  const salaryText = String(raw.salary ?? "").trim().replace(/\s/g, "");
  const normalizedSalary = salaryText.includes(",")
    ? salaryText.replace(/\./g, "").replace(",", ".")
    : salaryText;
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalizedSalary) || Number(normalizedSalary) > 10_000_000) {
    errors.salary = "Introduce un salario entre 0 y 10.000.000 € con hasta dos decimales.";
  } else {
    value.salary = normalizedSalary;
  }

  const age = Number(raw.age);
  if (!/^\d+$/.test(String(raw.age ?? "")) || age > 120) {
    errors.age = "Introduce una edad entera entre 0 y 120 años.";
  } else {
    value.age = age;
  }

  if (!filings.includes(raw.filing)) errors.filing = "Selecciona una modalidad de declaración.";
  if (raw.active !== "yes" && raw.active !== "no") errors.active = "Indica si trabajaste durante 2025.";
  value.active = raw.active === "yes";
  if (!disabilities.includes(raw.disability)) errors.disability = "Selecciona un grado de discapacidad.";
  if (!Object.hasOwn(policy2025.regions, raw.region)) errors.region = "Selecciona una comunidad autónoma admitida.";

  for (const field of countFields) {
    const text = String(raw[field] ?? "0");
    const count = Number(text);
    if (!/^\d+$/.test(text) || count > 20) {
      errors[field] = "Introduce un número entero entre 0 y 20.";
    } else {
      value[field] = count;
    }
  }

  if (value.active) {
    const group = Number(raw.professionalGroup);
    if (!/^\d+$/.test(String(raw.professionalGroup ?? "")) || group < 1 || group > 11) {
      errors.professionalGroup = "Selecciona un grupo de cotización.";
    } else {
      value.professionalGroup = group;
    }
    if (raw.contract !== "permanent" && raw.contract !== "temporary") {
      errors.contract = "Selecciona el tipo de contrato.";
    }
    if (raw.mobility !== "yes" && raw.mobility !== "no") {
      errors.mobility = "Indica si cumples los requisitos de movilidad.";
    }
    value.mobility = raw.mobility === "yes";
  } else {
    value.professionalGroup = null;
    value.contract = null;
    value.mobility = false;
  }

  const ascendants = (value.ascendantsDisabledUnder65 ?? 0) + (value.ascendants65to74 ?? 0) + (value.ascendants75plus ?? 0);
  const sharesText = String(raw.ascendantSharers ?? "1");
  if (ascendants > 0 && (!/^\d+$/.test(sharesText) || Number(sharesText) < 1 || Number(sharesText) > 20)) {
    errors.ascendantSharers = "Indica entre 1 y 20 contribuyentes con derecho al mínimo.";
  } else {
    value.ascendantSharers = ascendants > 0 ? Number(sharesText) : 1;
  }
  if (raw.exclusiveChildren !== "yes" && raw.exclusiveChildren !== "no") {
    errors.exclusiveChildren = "Indica si te corresponde el mínimo por descendientes íntegro.";
  }
  value.exclusiveChildren = raw.exclusiveChildren === "yes";

  if (!errors.children && !errors.childrenUnder3 && value.childrenUnder3 > value.children) {
    errors.childrenUnder3 = "No puede superar el número total de descendientes.";
  }
  const disabledChildren = (value.disabledChildren33 ?? 0) + (value.disabledChildrenMobility ?? 0) + (value.disabledChildren65 ?? 0);
  if (!errors.children && disabledChildren > value.children && !countFields.some((key) => errors[key])) {
    errors.disabledChildren33 = "La suma de descendientes con discapacidad no puede superar el total.";
  }
  const disabledAscendants = (value.disabledAscendants33 ?? 0) + (value.disabledAscendantsMobility ?? 0) + (value.disabledAscendants65 ?? 0);
  if (disabledAscendants > ascendants && !countFields.some((key) => errors[key])) {
    errors.disabledAscendants33 = "La suma de ascendientes con discapacidad no puede superar el total.";
  } else if (disabledAscendants < (value.ascendantsDisabledUnder65 ?? 0) && !countFields.some((key) => errors[key])) {
    errors.disabledAscendants33 = "Indica al menos tantos ascendientes con discapacidad como menores de 65 años has incluido.";
  }
  if (raw.filing === "singleParent" && value.children === 0 && !errors.children) {
    errors.children = "La declaración conjunta monoparental requiere al menos un descendiente elegible.";
  }
  if (raw.filing === "singleParent" && raw.exclusiveChildren !== "yes") {
    errors.exclusiveChildren = "En este supuesto debes tener derecho íntegro al mínimo por descendientes.";
  }

  return { value, errors, valid: Object.keys(errors).length === 0 };
}
