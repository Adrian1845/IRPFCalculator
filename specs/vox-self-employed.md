# Escenario condicional de cuota RETA bonificada para autónomos

## Origen y estado

La [proposición de ley 122/000106 de VOX, publicada el 31 de mayo de 2024](https://www.congreso.es/public_oficiales/L15/CONG/BOCG/B/BOCG-15-B-118-1.PDF) propuso bonificar el 100 % de las cuotas a la Seguridad Social cuando los «ingresos reales» del autónomo fueran inferiores al SMI. También declaró incompatible la bonificación con el ingreso mínimo vital. La [ficha del Congreso](https://www.congreso.es/es/proposiciones-de-ley?_iniciativas_id=122%2F000106&_iniciativas_legislatura=XV&_iniciativas_mode=mostrarDetalle&p_p_id=iniciativas&p_p_lifecycle=0&p_p_mode=view&p_p_state=normal) indica que la iniciativa decayó. VOX reiteró la medida en una [moción de noviembre de 2025](https://www.congreso.es/public_oficiales/L15/CONG/BOCG/D/BOCG-15-D-435.PDF), rechazada por el Pleno.

La página compara el cálculo vigente de **2025** con un supuesto explícito: que toda la cuota RETA pagada e indicada para ese mismo ejercicio se hubiera bonificado. El [SMI de 2025](https://www.boe.es/buscar/act.php?id=BOE-A-2025-2576) fue de 16.576 € anuales. Este dato da contexto, pero no se usa para declarar elegibilidad: la propuesta no concreta en el articulado cómo computar «ingresos reales» para este umbral, ni la página pregunta si se recibe ingreso mínimo vital. La simulación es condicional y nunca afirma que el usuario tenga derecho a la bonificación.

## Modelo

1. Calcular el IRPF vigente mediante `calculateSelfEmployed` con las entradas existentes.
2. Recalcular con `retaPaid = 0`, manteniendo ingresos, otros gastos, regularización RETA de años anteriores, reducciones y circunstancias personales. Así se elimina únicamente la cuota del ejercicio actual; una devolución o suplemento por cuotas anteriores no desaparece.
3. Recalcular gastos de difícil justificación, reducciones, base y cuotas estatal y autonómica. La [AEAT considera deducibles las cuotas RETA efectivamente satisfechas](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-ayuda-presentacion/irpf-2025/7-cumplimentacion-irpf/7_4-rendimientos-actividades-economicas/7_4_2-regimen-estimacion-directa/7_4_2_3-gastos-fiscalmente-deducibles/cotizaciones-reta.html); una cuota bonificada deja de ser gasto pagado.
4. Mostrar `cambio_IRPF = IRPF_hipotético - IRPF_vigente` y `ahorro_combinado = cuota_RETA_pagada - cambio_IRPF`. El ahorro puede ser cero o negativo; no se promete beneficio automático.

El escenario no modifica la propuesta general de IRPF de VOX. La moción de 2025 menciona un mínimo de 22.000 € para «rentas del trabajo» y no especifica su aplicación detallada a rendimientos de actividades económicas ni a las escalas autonómicas. Tampoco se simulan contratación, aplazamientos o IVA, que requieren otras entradas o afectan al calendario de pagos.

## Presentación y pruebas

Mostrar primero el IRPF vigente. Un `<details>` accesible permite abrir la simulación de la cuota bonificada con un aviso explícito de condicionalidad. Otro `<details>` resume las demás propuestas y enlaza a fuentes oficiales. Mantener ambos cerrados al cargar y tras recalcular.

Probar que la cuota bonificada recalcula el IRPF, que el ahorro combina RETA e IRPF, que la regularización anterior se mantiene, que una cuota pagada de cero no produce ahorro y que el cálculo no emite un veredicto de elegibilidad.
