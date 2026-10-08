// VOX bill 122/000084, modeled against 2025 employment income. Rates are basis points.
export const voxPolicy = {
  name: "Propuesta de VOX",
  comparisonYear: 2025,
  published: "2024-04-12",
  retrieved: "2026-10-08",
  source: "https://www.congreso.es/public_oficiales/L15/CONG/BOCG/B/BOCG-15-B-98-1.PDF",
  parliamentarySource: "https://www.congreso.es/public_oficiales/L15/CONG/BOCG/B/BOCG-15-B-98-1.PDF",
  exemptUpper: "22000",
  lowerUpper: "70000",
  lowerRate: 1500,
  upperRate: 2500,
  reductionPerChild: 400,
};
