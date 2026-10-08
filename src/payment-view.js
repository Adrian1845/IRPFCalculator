import { formatMoney } from "./tax/calculator.js";

export function formatPerPayment(annualAmount, paymentCount) {
  if (paymentCount !== 12 && paymentCount !== 14) {
    throw new RangeError("El número de pagas debe ser 12 o 14.");
  }
  return formatMoney(annualAmount / BigInt(paymentCount));
}
