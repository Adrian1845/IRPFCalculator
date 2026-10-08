# Proposed VOX Savings IRPF: Comparison Specification

## Purpose and policy status

The implemented savings tab models a **separate, hypothetical savings-tax proposal** beside the current 2025 savings result in [current-savings-income.md](current-savings-income.md). A VOX parliamentary group *non-legislative proposal* filed in August 2024 asks for the **first €6,000 of the savings liquidable base** (*base liquidable del ahorro*) to face a 0% combined rate instead of 19%. It is not enacted law and gives no effective tax year; this specification simulates that dated proposal against the calculator's **2025** baseline. Label the columns `Sistema vigente · ahorro 2025` and `Propuesta VOX 2024 · simulación sobre 2025`.

## Sources and interpretation

- [VOX's announcement, 6 August 2024](https://www.voxespana.es/grupo_parlamentario/actividad-parlamentaria/vox-propone-que-el-primer-tramo-de-la-base-liquidable-del-ahorro-tribute-al-0-para-proteger-la-economia-de-las-clases-medias-20240806) identifies the first €6,000 and describes a 0% rate in place of 19%.
- [Congress bulletin, 18 September 2024, initiative 161/001123](https://www.congreso.es/public_oficiales/L15/CONG/BOCG/D/BOCG-15-D-197.PDF) publishes the request to change the first savings-base bracket to 0%. It is a request for future legal changes, not a tax-law amendment or a complete rate schedule.
- [AEAT's 2025 savings scales](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-ayuda-presentacion/irpf-2025/8-cumplimentacion-irpf/8_4-cuota-integra/8_4_4-gravamen-base-liquidable-ahorro.html) set each state/autonomous half at 9.5% through €6,000, then 10.5%, 11.5%, 13.5%, and 15%. Their combined first band is 19%.
- [AEAT's allowance-allocation method](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c15-calculo-impuesto-determinacion-cuotas-integras/introduccion/esquema-grafico-aplicacion-minimo-personal-familiar.html) applies any personal/family allowance left after the general base against the savings quota. The parliamentary request does not replace this method.

Sources checked 8 October 2026. Version the proposal separately from enacted 2025 policy, recording source titles, dates, URLs, and retrieval dates. Re-check the initiative and legislation before implementation or release.

## Scope and explicit modeling conventions

Reuse the **same** validated savings liquidable base, current-year loss offsets, unused joint-filing reduction, general liquidable base, and state/autonomous personal/family allowances specified in [current-savings-income.md](current-savings-income.md). The 0% band applies **once to the annual savings base**, not separately to interest, dividends, gains, investments, accounts, or family members. It is a marginal band, not a rule that all savings become taxable after a €6,000 cliff.

The 2024 text gives a **combined** 0% rate but does not allocate it between state and autonomous quotas. For a reproducible 2025 simulation, set *both* 9.5% first-band halves to 0% and leave all higher 2025 bands unchanged. This equal split and unchanged-higher-bands rule are **model assumptions**, not published VOX mechanics. Retain 2025 savings-income classification, loss-offset rules, joint-filing spillover, and allowance allocation because the narrow initiative does not replace them. No VOX child-rate reduction applies to these savings bands.

Do **not** merge this scenario with the €22,000/15%/25% employment proposal in [vox-irpf.md](vox-irpf.md). The 2024 savings initiative does not explain their interaction. The [2023 VOX programme's inflation-indexing proposal](https://www.voxespana.es/wp-content/uploads/2023/07/Programa-VOX-2023-con-menos-peso.pdf), [2025 retirement-savings exemption proposal](https://www.voxespana.es/wp-content/uploads/2025/10/Programa-WEB-021025.pdf), and [older 2019 unified-income-base plan](https://www.voxespana.es/wp-content/uploads/2019/04/voxprogramafiscaldefinitivo.pdf) are distinct policies and **not modeled** here. In particular, the two signed balances in the current-savings spec cannot establish inflation-adjusted gains or eligibility for a retirement-savings exemption.

## Calculation contract

Use the existing fixed-point money and final-display rounding rules. Let `B` be the non-negative 2025 savings liquidable base after current-law offsets and supported reductions. For each half (`state`, `autonomous`), let `M = min(B, max(0, allowance − generalLiquidableBase))`. Use that half's allowance independently. Define `T_proposed(x)` as the corresponding 2025 savings progressive scale with only its **0–€6,000 rate changed from 9.5% to 0%**. Then:

```text
proposedStateSavingsTax      = max(0, T_proposed_state(B) − T_proposed_state(M_state))
proposedAutonomousSavingsTax = max(0, T_proposed_autonomous(B) − T_proposed_autonomous(M_autonomous))
proposedSavingsTax           = proposedStateSavingsTax + proposedAutonomousSavingsTax
savingsTaxDifference         = currentSavingsTax − proposedSavingsTax
```

Subtract the **proposed** scale's tax on the allowance remainder, not the current scale's tax. The difference may be less than €1,140 or zero when unused allowances already shield part of the first band. General-income tax and Social Security stay at their **current-system** values in this savings-only scenario. A zero savings base must produce zero proposed savings tax and zero difference.

The general-income inputs therefore affect **both** the current savings quota and the apparent benefit of this proposal. For €18,000 of dividends, individual filing, €5,550 state/autonomous allowances, and no other adjustments, the current/proposed savings taxes are €3,660/€2,520 when the general base uses all the allowance (saving €1,140). If the general base is zero, they are €2,605.50/€2,520 (saving €85.50). The modeled 0% band cannot increase savings tax; a smaller benefit means existing allowance already shelters part of that band. See [current-savings-income.md](current-savings-income.md) for why the general-income context is required.

## Results and acceptance examples

Show current and modeled annual savings IRPF as the primary figures side by side, with each annual after-tax savings-income balance directly below its tax figure; show no monthly figure. Put state/autonomous savings quotas, `B`, allowance remainders, and any combined IRPF total in an optional breakdown. Compute modeled annual after-tax savings income as the signed annual balances minus modeled savings tax. With €18,000 of dividends and no remaining allowance, this is €2,520 tax and €15,480 after tax annually. If showing a combined IRPF total, label it `IRPF vigente general + ahorro propuesto` rather than a complete VOX-reform tax result. Do not modify net salary or the 12/14-payment figures. Explain beside the result that this is an unenacted, savings-only simulation with assumed state/autonomous allocation and unchanged higher bands; any “impuestos a pagar” amount is before withholding.

The following examples assume no unused personal/family allowance unless stated. They test the savings scale alone, **after** `B` has been derived from the inputs:

| `B` | Unused allowance in each half | Current savings IRPF | Modeled savings IRPF | Difference |
| ---: | ---: | ---: | ---: | ---: |
| €0 | €0 | €0 | €0 | €0 |
| €6,000 | €0 | €1,140 | €0 | €1,140 |
| €6,001 | €0 | €1,140.21 | €0.21 | €1,140 |
| €10,000 | €0 | €1,980 | €840 | €1,140 |
| €10,000 | €3,000 | €1,410 | €840 | €570 |
| €10,000 | €7,000 | €630 | €630 | €0 |

Also test one-cent boundaries at €6,000, €50,000, €200,000, and €300,000; zero/negative savings pools after offsets; differing state and autonomous allowance remainders; joint-filing reduction spillover; and unchanged general tax, Social Security, VOX employment result, and current savings result. Investigate any mismatch above €0.02 against AEAT examples or an independently calculated case.

## Implementation and verification

1. Complete the current-savings calculation contract and tests in [current-savings-income.md](current-savings-income.md), including its general-base and allowance outputs.
2. Store the dated 2024 proposal's two adjusted first-band rates and source metadata separately from 2025 enacted tax data; validate the remaining brackets against the baseline.
3. Add a pure proposed-savings calculation consuming the current savings result without mutating it.
4. Add the labeled savings comparison and assumption note; regression-test the employment-only comparison and all examples above.
