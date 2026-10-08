# Comparador IRPF 2025 y propuesta de VOX

Web estática en español con comparaciones separadas del IRPF vigente del ejercicio 2025 y propuestas de VOX para rentas del trabajo y del ahorro. Incluye además una [calculadora de autónomos](autonomos.html) para el IRPF vigente de una actividad en estimación directa simplificada, con un escenario condicional separado de bonificación del RETA. Los importes del formulario se calculan en el navegador y no se envían al servidor; Vercel Web Analytics registra visitas a la página, sin eventos personalizados que incluyan datos fiscales.

## Ejecutar y comprobar

Se necesita Node.js 24 o posterior. No hay dependencias externas ni paso de instalación.

```sh
npm run dev    # servidor local en http://localhost:4173
npm test       # pruebas de reglas, límites y validación
npm run lint   # comprobación de sintaxis de JavaScript
npm run build  # copia los archivos estáticos a dist/
```

En PowerShell con la ejecución de scripts deshabilitada, utiliza `npm.cmd` en lugar de `npm`.

## Alcance

El cálculo vigente usa las reglas del **ejercicio 2025** para las 15 comunidades de régimen común. La página principal supone residencia fiscal durante todo el año, un solo pagador y trabajo a tiempo completo durante doce meses si se declara actividad. La pestaña «Trabajo» calcula solo renta del trabajo o pensión. La pestaña «Ahorro» añade dos saldos netos anuales: capital mobiliario y ganancias o pérdidas por transmisiones. No incluye actividades económicas. Consulta las especificaciones de [trabajo](specs/current-irpf.md) y [ahorro](specs/current-savings-income.md).

La página [«Autónomos»](autonomos.html) estima la cuota anual vigente de una sola actividad en **estimación directa simplificada**, sin otras rentas gravables en la unidad familiar. Solicita ingresos y gastos fiscales, cuotas del RETA, regularización, territorio y circunstancias familiares. Aplica el 5 % de difícil justificación con su límite, la reducción de rentas bajas y, si procede, la de inicio de actividad. Quedan fuera estimación directa normal, módulos, mutualidades alternativas, varias actividades, otras rentas, pagos a cuenta y deducciones no modeladas. Es una estimación antes de retenciones y pagos fraccionados; no representa el dinero disponible ni el resultado final de la declaración. Consulta la [especificación de autónomos](specs/current-self-employed-irpf.md).

La página de autónomos muestra, en un desplegable separado, un [escenario condicional de bonificación del RETA](specs/vox-self-employed.md) basado en la proposición de ley de VOX de 2024. Si la cuota introducida se bonificara por completo, recalcula el IRPF de 2025 al perderse ese gasto deducible y muestra el ahorro combinado. **No determina si el usuario cumple el umbral de ingresos reales inferior al SMI**, ni suma la reforma general del IRPF de VOX. Otro desplegable resume contratación, plazos e IVA con fuentes. Ninguna de estas propuestas es ley vigente.

La [simulación de VOX](specs/vox-irpf.md) toma como referencia la proposición de ley 122/000084 de abril de 2024, actualmente decaída. Conserva la base liquidable general y la cuota autonómica de 2025; recalcula la cuota estatal con los tipos y el mínimo personal propuestos. Mantener fija la cuota autonómica refleja la intención declarada de la proposición, aunque la nueva redacción del mínimo personal podría afectarla indirectamente. La rebaja de tipos por hijos compartidos no se prorratea: es un supuesto del modelo. La propuesta no se calcula para «sin actividad» porque el formulario no distingue pensiones contributivas de otros rendimientos.

La [simulación separada del ahorro](specs/vox-savings-income.md) aplica el 0 % al primer tramo de 6.000 € propuesto por VOX en 2024. Mantener los tramos superiores de 2025 y repartir la rebaja por mitades entre Estado y comunidad son supuestos del modelo; no se combina con la propuesta sobre rentas del trabajo. La pestaña de ahorro destaca el **impuesto estimado** y muestra debajo el saldo neto anual (`capital mobiliario + ganancias/pérdidas − impuesto del ahorro`); el desglose fiscal es opcional y no hay media mensual. El saldo no representa el efectivo cobrado por la venta de activos ni el importe final a ingresar tras retenciones. El selector de 12/14 pagas solo distribuye el neto laboral anual.

## Por qué el ahorro necesita datos generales

La base del ahorro forma parte del **IRPF**, aunque tiene su [propia escala de gravamen](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-ayuda-presentacion/irpf-2025/8-cumplimentacion-irpf/8_4-cuota-integra/8_4_4-gravamen-base-liquidable-ahorro.html): **no es un impuesto independiente**. Según la [AEAT, el mínimo personal y familiar no utilizado por la base general](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c15-calculo-impuesto-determinacion-cuotas-integras/introduccion/esquema-grafico-aplicacion-minimo-personal-familiar.html) puede reducir la cuota del ahorro, con importes estatal y autonómico distintos. Además, el [remanente de la reducción por declaración conjunta](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c13-determinacion-renta-contribuyente-sujeta-gravamen/introduccion.html) puede reducir su base. Por eso el formulario conserva salario o pensión, territorio, modalidad de declaración y circunstancias familiares. Si solo percibes dividendos, escribe `0` en salario o pensión y selecciona «No, sin actividad o con pensión»; no inventes un salario para obtener la cifra de la captura.

Ejemplo orientativo: 18.000 € de dividendos, declaración individual, mínimo estatal y autonómico de 5.550 €, sin otros ajustes. «General suficiente» significa que la base general ya consume todo el mínimo.

| Base general | Impuesto vigente del ahorro | Simulación VOX del ahorro | Ahorro fiscal |
| --- | ---: | ---: | ---: |
| General suficiente | 3.660,00 € | 2.520,00 € | 1.140,00 € |
| 0 € | 2.605,50 € | 2.520,00 € | 85,50 € |

«Impuestos a pagar» en pantalla es la cuota estimada **antes** de retenciones o pagos a cuenta; no predice cuánto saldrá a ingresar en la declaración. La propuesta de VOX sigue siendo una simulación no legislada.

## Reglas y fuentes

Las reglas vigentes están en `src/tax/policy-2025.js`; los cálculos de trabajo, ahorro y autónomos están en `src/tax/calculator.js`, `src/tax/savings-calculator.js` y `src/tax/self-employed-calculator.js`. Las propuestas simuladas tienen módulos separados: `src/tax/vox-calculator.js`, `src/tax/vox-savings-calculator.js` y `src/tax/vox-self-employed-calculator.js`. Las fuentes son el [Manual práctico de Renta 2025 de la AEAT](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/presentacion.html), su [capítulo de estimación directa](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c07-rendimientos-actividades-economicas-estimacion-directa.html), la [escala del ahorro](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-ayuda-presentacion/irpf-2025/8-cumplimentacion-irpf/8_4-cuota-integra/8_4_4-gravamen-base-liquidable-ahorro.html), la [Ley 35/2006](https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764), la [Orden PJC/178/2025](https://www.boe.es/buscar/act.php?id=BOE-A-2025-3780), la [proposición de ley laboral de VOX](https://www.congreso.es/public_oficiales/L15/CONG/BOCG/B/BOCG-15-B-98-1.PDF), la [proposición de ley de autónomos de VOX](https://www.congreso.es/public_oficiales/L15/CONG/BOCG/B/BOCG-15-B-118-1.PDF) y la [propuesta no legislativa sobre el ahorro](https://www.congreso.es/public_oficiales/L15/CONG/BOCG/D/BOCG-15-D-197.PDF).

## Despliegue

`vercel.json` indica a Vercel que genere y sirva `dist/` como sitio estático. El proyecto no necesita backend ni variables de entorno.

Para activar las métricas de visitas, habilita **Web Analytics** en el panel del proyecto de Vercel y vuelve a desplegar. `index.html` y `autonomos.html` cargan `/_vercel/insights/script.js`, la integración HTML para este sitio sin empaquetador; no hace falta instalar `@vercel/analytics`. La ruta del script solo existe en un despliegue de Vercel con Analytics habilitado, por lo que una ejecución local puede mostrar un 404 inocuo para esa ruta. Comprueba la visita en el panel Analytics después del despliegue. No añadas los importes del formulario a eventos, URLs ni parámetros de consulta. Véase la [guía oficial de Vercel](https://vercel.com/docs/analytics/quickstart).
