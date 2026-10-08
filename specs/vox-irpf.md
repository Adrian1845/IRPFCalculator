# Proposed VOX IRPF: comparison specification

## Purpose and status

Add a **hypothetical VOX proposal** alongside the existing Spanish IRPF 2025 estimate. The VOX rates are political proposals, not enacted tax law. Label both columns clearly: `Sistema vigente · ejercicio 2025` and `Propuesta de VOX · simulación sobre 2025`. Do not call the proposal the current IRPF or present its output as a tax return or payroll withholding rate.

This specification describes the core reform only: a €22,000 exempt band, a 15% band through €70,000, a 25% band above €70,000, and a four-percentage-point rate reduction per eligible child. Other measures mentioned in VOX publications are outside this comparison unless separately specified.

## Sources and interpretation

- [VOX's 2025 description of its economic program](https://www.voxespana.es/noticias/figaredo-anima-a-huir-de-la-resignacion-no-conformarnos-con-globalismos-que-nos-quieren-serviles-y-luchar-por-una-espana-fuerte-en-la-que-los-jovenes-tengan-esperanza-20250821) states the exempt minimum, both rates, and a reduction for each descendant.
- [VOX's 2023 general-election program summary](https://www.voxespana.es/actualidad/bajada-radical-de-impuestos-drastica-reduccion-del-gasto-politico-ineficaz-simplificacion-de-tramites-asi-es-el-programa-economico-de-vox-para-el-23j-20230707%3Famp) adds the four-child examples: 0% below €70,000 and 9% above.
- [VOX's proposal published in the Congress bulletin in May 2024](https://www.congreso.es/public_oficiales/L15/CONG/BOCG/D/BOCG-15-D-150.PDF) describes the €22,000–€70,000 and above-€70,000 bands as applying to *base liquidable*, with a 0% floor for child-adjusted rates.

These publications are not a complete bill specifying all tax mechanics. The **modeling conventions** below make the comparison reproducible; they must be shown as assumptions in the product and revisited if an enacted text or a more detailed proposal becomes available. Version the source title, publication date, URL, and retrieval date with the proposal data.

## Comparison scope and shared inputs

Use the same entered annual gross salary, 2025 tax year, family data, and supported common-regime territories as the current-system calculator in [current-irpf.md](current-irpf.md). The VOX estimate is initially available only for **active employees with employment income**. The current interface's inactive-worker option may represent a pension or another kind of employment income; it does not identify contributory pensions, which VOX has separately proposed exempting. Show the current result but mark the VOX result unavailable for that input until income type is collected and specified. Do not silently tax or exempt every inactive worker as a pension.

Keep the 2025 employee Social Security calculation identical in both columns; the cited proposal does not define replacement contribution rules. Reuse the existing salary validation and territory exclusions. No additional personal data is required for the core rate comparison. The current child count supplies the proposal's eligible-descendant count, subject to the existing dependency assumptions and count validation.

## Calculation model

For this simulation, compute `B`, the non-negative annual general income base produced from gross employment income **after** the same 2025 employee Social Security and employment-income expense/reduction rules used by the current calculator. Do not use gross salary to select a band. This shared-base convention is an inference for comparability; VOX's publications do not settle which existing income deductions would survive a full reform.

Apply the proposal's €22,000 exempt amount as a **0% band of B**, not as an eligibility cliff. Replace the current state and autonomous general-rate scales and their personal/family minimum calculations with the following single nationwide modeled scale. Do not also subtract the existing personal or descendant allowance, as that would count family relief twice. Do not apply the current joint-filing reduction to the VOX calculation: its retention is unspecified in the proposal. The current-system calculation remains unchanged.

Let `n` be the number of qualifying descendants entered in the existing under-25 count. For this provisional model, each eligible descendant reduces **each positive band rate** by four percentage points, regardless of the current calculator's exclusive/shared entitlement toggle. Clamp each adjusted rate to 0%; a negative rate never creates a refund. The proposal does not define shared-custody proration, so this full-per-child treatment is a modeling assumption, not a verified rule.

```text
lowRate  = max(0, 0.15 - 0.04 × n)
highRate = max(0, 0.25 - 0.04 × n)
VOX_IRPF = max(0, min(B, 70,000) - 22,000) × lowRate
         + max(0, B - 70,000) × highRate
```

Rates apply **marginally**: crossing €70,000 changes the rate only on the excess. `B = €22,000` produces zero tax; `B = €70,000` has no 25% portion. At five or more children, the first taxable band's rate remains 0%; at seven or more, both rates are 0%. The model does not create a tax credit or negative tax.

Use the current calculator's exact decimal-money arithmetic and final-display rounding convention. Calculate the effective rate as `VOX_IRPF / gross salary × 100`, or 0% when gross salary is zero. Calculate modeled annual net income as `gross salary - employee Social Security - VOX_IRPF`.

## Results and presentation

Show current and proposed total IRPF, employee Social Security, annual net income, and effective IRPF rate side by side for the **same inputs**. Because gross income and Social Security are identical in both modeled scenarios, `current IRPF − proposed IRPF` always equals `proposed annual net − current annual net`. Display this impact **once**, not as two identical rows. For a positive difference label it `Ahorro anual en IRPF (aumento del neto)`; for a negative difference label it `IRPF adicional anual (reducción del neto)` and display its magnitude. Keep the existing state/autonomous breakdown only for the current system; the modeled VOX scale has a single quota and no specified state/autonomous split. Include the assumed base `B`, eligible-child count, adjusted band rates, and marginal-band amounts in an expandable proposal breakdown.

Place a concise note next to the proposal result: `Simulación de una propuesta política, no legislación vigente. Base y tratamiento de hijos compartidos según supuestos del modelo.` Link to the source and a readable explanation of assumptions. Avoid claiming that the proposal guarantees a saving for every user.

## Worked acceptance examples

These examples use **B**, not gross salary, and exclude Social Security because it was already subtracted when deriving B. They test the proposed scale alone; end-to-end tests must derive B from actual form inputs.

| B | Children | Low / high rate | Proposed IRPF |
| ---: | ---: | ---: | ---: |
| €22,000 | 0 | 15% / 25% | €0.00 |
| €22,001 | 0 | 15% / 25% | €0.15 |
| €70,000 | 0 | 15% / 25% | €7,200.00 |
| €70,001 | 0 | 15% / 25% | €7,200.25 |
| €70,000 | 1 | 11% / 21% | €5,280.00 |
| €70,000 | 4 | 0% / 9% | €0.00 |
| €70,001 | 4 | 0% / 9% | €0.09 |

Also test zero and negative adjusted rates, exactly both band boundaries, a one-cent boundary crossing, shared-child input, inactive-worker unavailability, and equality of Social Security amounts across both columns. The proposal calculation must be deterministic and must not alter the existing current-system result.

## Unsettled policy details and deferred scope

The cited proposals do not fully specify how the €22,000 exemption interacts with every income category, whether the 2025 employment reductions and joint-filing rules survive, how qualifying descendants are shared, or how a national scale would be divided between state and autonomous quotas. This spec chooses a transparent simulation convention for the first three where needed and presents only a combined proposed quota. The 2024 VOX press statement also referred specifically to modifying the *state* portion of IRPF, while later program language describes a broader reform; this comparison models the latter, full-reform scenario.

Do not fold in separate proposals for pension exemption, birth/adoption credits, housing or school-expense deductions, savings income, or Social Security changes. Those require additional inputs, precedence rules, and dedicated specifications. If the intended product is the narrower state-only 2024 initiative instead, choose that policy version explicitly before implementing it.
