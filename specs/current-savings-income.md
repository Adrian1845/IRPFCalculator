# Current Spanish IRPF: Savings Income Specification

## Purpose and status

The implemented Spanish-language **current-system savings-income tab** estimates the savings component of IRPF for tax year 2025. It uses the same taxpayer, territory, filing status, and family circumstances as the employment calculator. It shows savings tax and combined *current-system* IRPF separately from the salary-only VOX comparison. VOX separately proposed a 0% first savings band in 2024; see [vox-savings-income.md](vox-savings-income.md). That proposal does not establish how to combine savings with VOX's broader employment-income reform. Do not apply the latter's rates to savings or imply a complete combined VOX estimate exists. This is an educational tax-liability estimate, not a return, withholding calculation, or cash-flow forecast.

## Research and authoritative sources

- [AEAT 2025 savings-income integration and loss offsets](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c12-integracion-compensacion-rentas/reglas-integracion-compensacion-rentas/integracion-compensacion-rentas-base-imponible-ahorro.html): investment income and disposal gains/losses are separate pools; cross-pool offsets are capped at 25%, and unused losses may carry forward four years.
- [AEAT 2025 savings scales](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-ayuda-presentacion/irpf-2025/8-cumplimentacion-irpf/8_4-cuota-integra/8_4_4-gravamen-base-liquidable-ahorro.html): state and autonomous halves have identical 2025 thresholds and rates; the combined marginal rates are 19%, 21%, 23%, 27%, and 30%.
- [AEAT allocation of personal/family allowances](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c15-calculo-impuesto-determinacion-cuotas-integras/introduccion/esquema-grafico-aplicacion-minimo-personal-familiar.html): unused allowance after the general base reduces the savings *quota*, not the savings tax base. State and autonomous allowances must be considered separately.
- [AEAT 2025 base reductions](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c13-determinacion-renta-contribuyente-sujeta-gravamen/introduccion.html): unused joint-filing reduction can reduce the savings base. Other reductions remain outside this calculator's existing scope.
- [AEAT deductible investment costs](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c05-rendimientos-capital-mobiliario/rendimientos-integrar-base-imponible-ahorro/rendimientos-procedentes-cesion-terceros-capitales-propios/gastos-deducibles-administracion-deposito.html) and [AEAT disposal categories](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/7-cumplimentacion-irpf/7_6-ganancias-perdidas-patrimoniales/7_6_6-cumplimentacion/7_6_6_2-apartado-f2.html) define what belongs in each input.

Sources checked 8 October 2026. Record their URLs and retrieval date with the 2025 policy data when implemented; re-check for corrections before release.

## Scope and inputs

Reuse the existing 15 common-regime territories and 2025 assumptions in [current-irpf.md](current-irpf.md). Ask for two **signed, annual, already-net taxable balances** in euros, defaulting to zero:

1. Savings-base investment income (*rendimientos del capital mobiliario*): for example, taxable interest, dividends, and relevant life-insurance returns, after legally deductible administration/custody costs. Do not subtract tax withheld.
2. Gains or losses from disposals (*ganancias/pérdidas patrimoniales por transmisión*): for example, sales of shares, funds, property, or cryptoassets. Enter the taxable gain/loss, **not sale proceeds**; the user must account for acquisition value and eligible transaction costs.

Explain that rental income, salary, non-disposal gains, exempt returns, and investment income assigned to the general base do **not** belong here. Assume users have correctly classified and apportioned jointly owned income. Exclude prior-year loss carryforwards, special exemptions/reinvestment relief, foreign-tax credits, and other omitted general-income categories in the first release. Ask whether any exclusion applies; if so, warn that the estimate may be incomplete rather than silently claiming an exact return.

## Why general-income context is required

The savings base has its own rate scale, but it is part of the same IRPF calculation, not a standalone tax. The [AEAT allowance method](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c15-calculo-impuesto-determinacion-cuotas-integras/introduccion/esquema-grafico-aplicacion-minimo-personal-familiar.html) subtracts savings-scale tax on any state or autonomous personal/family allowance left after the general liquidable base. The [AEAT base-reduction order](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c13-determinacion-renta-contribuyente-sujeta-gravamen/introduccion.html) also allows an unused joint-filing reduction to reduce the savings base. Consequently, salary or pension, filing mode, territory, age, and supported family circumstances can change the savings result. Do not remove those inputs or assume the allowance is already used. If the taxpayer has only savings income, enter `0` for salary/pension and select inactive work; retain the real filing and family details.

For €18,000 of dividends, individual filing, €5,550 state and autonomous allowances, and no other adjustments, a general base that fully uses the allowance produces €3,660 current savings tax. With a zero general base, €5,550 of allowance remains for each half and current savings tax is €2,605.50. The entered dividends are unchanged; only the general-income context differs. Other territories or family circumstances may give different amounts.

## Calculation contract

Use the existing six-decimal fixed-point money representation and round only displayed euros to cents. Let `I` be the signed current-year investment-income balance and `G` the signed disposal-gain/loss balance. Net each pool first. If exactly one pool is negative, offset it against at most 25% of the other pool's positive balance; carry the unused negative balance in the breakdown as *not used this year*. The savings taxable base is the sum of the remaining positive balances, never below zero. For example, `I = −€2,000` and `G = €5,000` yields a €1,250 cross-offset, €3,750 savings taxable base, and €750 unused loss. Do not automatically consume prior-year losses.

Apply any **unused statutory joint-filing reduction** after reducing the general base, limited by the savings taxable base. The existing general calculation caps its recorded joint reduction at general income; implementation must retain the full entitlement and expose the unused portion rather than treating that cap as the total entitlement. The result is the non-negative savings *liquidable* base. No other savings-base reductions are modeled.

Apply separate 2025 state and autonomous marginal scales to that base:

| Savings-base band (€) | State | Autonomous | Combined |
| --- | ---: | ---: | ---: |
| 0–6,000 | 9.5% | 9.5% | 19% |
| 6,000–50,000 | 10.5% | 10.5% | 21% |
| 50,000–200,000 | 11.5% | 11.5% | 23% |
| 200,000–300,000 | 13.5% | 13.5% | 27% |
| Above 300,000 | 15% | 15% | 30% |

For each half, subtract the tax computed on the smaller of the savings liquidable base and the unused personal/family allowance: `max(0, allowance − general liquidable base)`. Use the existing state and territory-specific allowance values independently. Clamp each resulting quota at zero. Add the two savings quotas to the existing general quotas for the combined current-system IRPF. With zero savings input, preserve the current result exactly.

## Presentation and limitations

The savings comparison should foreground only annual estimated savings tax and annual after-tax savings-income balance for each scenario. Put offsets, unused losses, bases, allowances, state/autonomous quotas, and combined current-system IRPF in an optional breakdown; do not show a monthly savings or tax figure. Compute the annual balance as the sum of the two signed entered balances minus savings IRPF. For example, €18,000 of dividends with the personal/family allowance fully used by the general base gives €3,660 estimated savings tax and €14,340 after tax. This is not actual cash flow from asset sales, because entered disposal gains exclude returned capital. Label the existing comparison as **employment-only** when savings inputs are nonzero. Do not fold disposal proceeds or taxable gains into “net salary,” and do not change the 12/14-payment display using savings results. Explain that general-income data are required because unused personal/family allowance and joint-filing reductions can alter savings tax; a taxpayer with only savings income may enter zero employment income. State that withholding is a payment on account and is excluded from tax liability and refund/due calculations; an “impuestos a pagar” label must explicitly say it is before withholding, not the final return balance.

## Implementation and verification

1. Extend versioned 2025 policy data with separately named state/autonomous savings scales and source metadata; validate ascending bounds and non-negative rates.
2. Extract the current calculation's general base, full joint-reduction entitlement, state/regional allowances, and quotas into reusable pure outputs without changing employment-only results.
3. Add a pure savings calculation and validation for the two signed balances, 25% offset, joint-reduction spillover, allowance remainder, and quota calculation.
4. Add the savings tab and clear exclusions/disclaimers; keep the existing VOX employment comparison and monthly-payment switch scoped to employment income. Any separate proposed savings comparison must follow [vox-savings-income.md](vox-savings-income.md).
5. Test every band boundary, positive/negative pool combination, 25% cap, zero income, unused allowances, joint-filing spillover, and each territory's allowance. Use [AEAT's 2025 worked savings-quota example](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c16-deducciones-generales-cuota/deduccion-rentas-obtenidas-ceuta-melilla/ejemplo-deduccion-rentas-obtenidas-ceuta-melilla.html) for a €20,500 base (€2,092.50 per half before any savings allowance) and investigate discrepancies above €0.02.
