# Current Spanish IRPF Calculator

## Purpose

Build a Spanish-language calculator that estimates annual IRPF and employee Social Security contributions from employment income. It will provide the "current system" side of the comparison described in the repository README.

The result is an educational estimate, not a tax return, payroll withholding calculation, or substitute for AEAT advice. The UI must display that limitation beside the result.

## Fiscal baseline and sources

The first supported policy version is **tax year 2025**, the latest year with a complete published AEAT annual-return manual. Always show `Ejercicio 2025`; never present an unqualified "current" result. Store tax rules as versioned data so another year can be added without changing calculation code.

Use official sources as the authority for every constant and algorithm:

- [AEAT Practical IRPF Manual 2025](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/presentacion.html): employment income, personal/family allowances, state and autonomous scales, and tax calculation.
- [Consolidated IRPF Law 35/2006](https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764): legal definitions and calculation rules.
- [Order PJC/178/2025](https://www.boe.es/eli/es/o/2025/02/25/pjc178): 2025 Social Security bases and rates.
- [Cinco Días calculator](https://cincodias.elpais.com/herramientas/calculadora-irpf/): field and result presentation reference only; it is not the source of tax rules.

Each policy-data file must record the source URL, tax year, publication date, and retrieval date.

## Supported scenario

This **employment-income module** supports a Spanish tax resident for the full year whose general income is employment income or a pension. It assumes no irregular income, salary in kind, exempt income, economic activity, pension-plan contributions, compensatory payments, tax credits, or regional deductions. Savings income is handled separately by [current-savings-income.md](current-savings-income.md), which reuses this module's general base, allowance, and joint-filing results. Family members entered are assumed to meet the income, filing, dependency, and cohabitation requirements for the relevant allowance.

Support the 15 common-regime autonomous communities. Show País Vasco, Navarra, Ceuta, and Melilla in the territory selector as unsupported because the foral systems and autonomous-city residence deductions require separate rules or additional eligibility data. Do not approximate them using common-regime tables.

Unless a future input says otherwise, assume one payer, full-year employment, a full-time contract, and personal/family circumstances as at 31 December 2025.

## Inputs

Include every field represented by the reference calculator. Use semantic controls, help text, and zero as the default for optional counts.

### General and employment

- **Gross annual salary (€):** required decimal, `0` to `10,000,000`, at most two decimals.
- **Family/filing situation:** `individual`, `joint married`, or `joint single-parent`. Joint married assumes the entered salary is the household's only taxable income. Joint single-parent requires at least one eligible child and no cohabiting other parent. Apply the corresponding statutory joint-filing reduction.
- **Age:** required integer, `0` to `120`, measured on 31 December.
- **Active worker:** required yes/no. If no, treat the amount as employment-class income without employee Social Security contributions and disable category, contract type, mobility, and active-worker disability expenses.
- **Professional category:** required for active workers; Social Security contribution groups 1 through 11 with their official category labels.
- **Contract type:** required addition for active workers: permanent or fixed-term, because the employee unemployment contribution can differ.
- **Geographic mobility:** yes/no. Help text must state the legal conditions: previously unemployed and registered, accepted employment requiring a move to another municipality, and within the eligible year or following year.
- **Autonomous community/city:** required. Include all Spanish territories; disable País Vasco, Navarra, Ceuta, and Melilla with an explanation.

### Family

- Children/descendants under 25.
- Of those, children under 3.
- Exclusive entitlement to the descendants' allowance: yes/no. If no, use 50%; if yes, use 100%.
- Ascendants under 65 with disability.
- Ascendants from 65 through 74.
- Ascendants aged 75 or older.
- Number of taxpayers sharing the ascendants' allowances; integer of at least 1 when any ascendant exists.

Assume every entered descendant or ascendant meets the statutory dependency and income limits. Explain those limits in field help.

### Disability

For the taxpayer, use one mutually exclusive selection: none; 33% to under 65% without reduced mobility; 33% to under 65% with reduced mobility/third-party assistance; or 65% or more.

For both descendants and ascendants, collect counts in these mutually exclusive groups:

- 33% to under 65% without reduced mobility.
- 33% to under 65% with reduced mobility/third-party assistance.
- 65% or more.

Disability counts cannot exceed the corresponding total family-member count. Disabled descendants aged 25 or older are legally eligible but cannot be represented by the reference field set; document this as an initial limitation.

## Validation and interaction

Validate on blur and on submit, preserve entered data after errors, and put an inline Spanish message beside each invalid field. Also provide an error summary linked to the controls.

Cross-field rules include:

- Children under 3 cannot exceed descendants under 25.
- All counts are non-negative integers, with a reasonable UI maximum of 20.
- Disability categories are mutually exclusive and their family counts cannot exceed eligible relatives.
- Professional category and contract type are required only for active workers.
- Geographic mobility requires an active worker.
- Ascendant-sharing taxpayers is required only when ascendants are entered.
- Unsupported foral territories cannot be submitted.

## Calculation contract

Use decimal arithmetic; binary floating-point is not acceptable for money.

1. Calculate the employee's 2025 Social Security contribution using monthly contribution bases, the selected group and contract type, applicable minimum/maximum bases, MEI, and additional solidarity contribution above the maximum base. Convert the annual salary consistently to 12 contribution months.
2. Derive net employment income: gross income minus employee Social Security, statutory general employment expenses, eligible mobility/active-disability expenses, and the applicable low-employment-income reduction. Cap deductions where the law requires and never allow the net amount below its legal floor.
3. Apply any selected joint-filing reduction to obtain the general taxable/liquidable base. Retain any unused entitlement for the separate savings calculation; this employment-only module does not itself compute a savings base.
4. Calculate state and regional personal/family allowances separately. Include taxpayer age, descendants and under-three uplift, ascendants and over-75 uplift, disability, assistance/reduced-mobility uplifts, and the configured sharing percentages. Use regional allowance amounts where applicable.
5. Apply the progressive 2025 state scale to both the liquidable base and the applicable state allowance; subtract the latter result. Repeat with the selected territory's regional scale and regional allowance. Clamp each quota at zero.
6. Calculate total IRPF, annual net income, and effective rate from the unrounded internal values.

Round displayed euro amounts to two decimals using half-up rounding. Display the effective rate to two decimals. Keep at least six decimal places internally and round only final outputs.

## Results

Display:

- Gross annual salary.
- State IRPF quota.
- Autonomous IRPF quota.
- Total estimated IRPF.
- Employee Social Security contributions.
- Estimated annual net income (`gross - IRPF - Social Security`).
- Effective IRPF rate (`IRPF / gross × 100`), with 0% when gross is zero.

Also show the tax year, selected territory, filing assumptions, and an expandable calculation breakdown. Results must not be described as payroll withholding.

## Policy architecture

Keep pure calculation functions separate from UI code. Version tables by year and territory, and represent brackets as ordered upper bounds plus marginal rates. Validate policy data at startup: bounds must increase, rates must be non-negative, and every supported territory must have a complete scale and allowance set. No tax constant may be embedded in a UI component.

## Testing and acceptance criteria

Unit tests must cover every state-scale boundary, every regional scale, Social Security minimum/maximum and solidarity boundaries, ages 64/65 and 74/75, child ordering and sharing, all disability categories, joint reductions, zero income, high income, inactive workers, and invalid cross-field combinations.

Add golden tests from worked AEAT Manual examples and independently calculated cases for every territory. For scenarios within the supported scope, state and regional quotas must match the official worked result to within €0.02. Any comparison with Cinco Días is informational; differences must be investigated and documented rather than copying its output.

The feature is complete when all fields are keyboard accessible, validation is available in Spanish, policy sources are traceable, tests pass from a clean checkout, and the UI clearly identifies the result as a 2025 estimate with the documented assumptions and exclusions.

## Deferred scope

- Tax years after 2025.
- País Vasco and Navarra foral taxation, and Ceuta/Melilla residence rules.
- Full Modelo 100 coverage, withholding rates, multiple payers, partial-year employment, part-time contribution bases, other income, deductions/credits, and choosing the most favorable individual-versus-joint filing result.
- Disabled descendants aged 25 or older and family members with partial-year eligibility.
