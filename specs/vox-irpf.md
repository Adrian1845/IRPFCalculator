# Simulación del IRPF general propuesto por VOX

## Fuente y alcance

La referencia de esta simulación es la [proposición de ley 122/000084, publicada el 12 de abril de 2024](https://www.congreso.es/public_oficiales/L15/CONG/BOCG/B/BOCG-15-B-98-1.PDF). [Su ficha parlamentaria la declara decaída](https://www.congreso.es/es/busqueda-de-iniciativas?_iniciativas_id=122%2F000084&_iniciativas_legislatura=XV&_iniciativas_mode=mostrarDetalle&p_p_id=iniciativas&p_p_lifecycle=0&p_p_mode=view&p_p_state=normal); es una propuesta histórica, no una norma vigente ni una iniciativa actualmente en tramitación. Su exposición de motivos dice expresamente que pretende modificar **únicamente el tramo estatal**, e invita a las comunidades autónomas a reducir sus respectivos tramos. El articulado modifica la escala general estatal del artículo 63 e introduce el artículo 63 bis para reducir sus tipos por hijos. No modifica la escala autonómica del artículo 74.

La comparación usa el IRPF vigente del ejercicio 2025 como referencia. Solo se ofrece para trabajadores activos con rendimientos del trabajo. «Sin actividad» puede representar una pensión u otra renta; el formulario no permite aplicar con fiabilidad las propuestas específicas para pensiones. El ahorro y las actividades económicas se calculan en apartados separados y esta propuesta laboral no se les aplica.

## Datos compartidos y cálculo

Se reutilizan salario, cotización del empleado, gastos deducibles del trabajo, reducciones, base liquidable general, circunstancias familiares y comunidad autónoma del cálculo vigente de 2025. La reducción por tributación conjunta se conserva porque la proposición no modifica su regulación. Se usan las mismas reglas de validación y exclusiones territoriales.

La cuota autonómica de 2025 se conserva en el resultado propuesto. Se recalcula únicamente la cuota estatal con estos elementos del proyecto:

- Mínimo personal general de 22.000 € en lugar de 5.550 €, más los importes existentes por edad y circunstancias familiares. El texto de la proposición anuncia una modificación de los artículos 57 y 58, pero únicamente proporciona nueva redacción del artículo 57; se conservan los importes por descendientes del ejercicio 2025.
- Escala estatal marginal: 0 % hasta 22.000 €, 15 % entre 22.000 € y 70.000 €, y 25 % por encima de 70.000 €. Los tipos del 15 % y del 25 % bajan cuatro puntos porcentuales por cada hijo, con suelo del 0 %.
- El mínimo personal y familiar se aplica con la operación del artículo 63: cuota de la escala sobre la base menos cuota de la misma escala sobre la parte de la base correspondiente al mínimo. El tramo de 0 % y el mínimo personal de 22.000 € no se suman como dos exenciones independientes.

El número de hijos del formulario reduce íntegramente los tipos, incluso si el mínimo por descendientes se comparte. Esta es una convención provisional: el artículo 63 bis propuesto no precisa prorrateo para hijos compartidos. El mínimo por descendientes sí conserva el reparto ya usado en el cálculo vigente.

```text
base = base liquidable general vigente de 2025
tipo_medio = max(0 %, 15 % - 4 % × hijos)
tipo_alto = max(0 %, 25 % - 4 % × hijos)
escala = [0–22.000 €: 0 %, 22.000–70.000 €: tipo_medio, >70.000 €: tipo_alto]
mínimo_estatal_propuesto = mínimo_estatal_vigente - 5.550 € + 22.000 €
cuota_estatal_propuesta = escala(base) - escala(min(base, mínimo_estatal_propuesto))
cuota_autonómica_propuesta = cuota_autonómica_vigente_2025
IRPF_total_propuesto = cuota_estatal_propuesta + cuota_autonómica_propuesta
neto_propuesto = bruto - cotización_del_empleado - IRPF_total_propuesto
```

Todos los importes se calculan con la precisión decimal y el redondeo de presentación existentes. El ahorro fiscal es `IRPF vigente - IRPF propuesto` y equivale al cambio del neto anual porque cotización y bruto son iguales.

El interruptor «Excluir el tramo autonómico» permite un escenario hipotético adicional: `cuota_autonómica_propuesta = 0` e `IRPF_total_propuesto = cuota_estatal_propuesta`. No modifica la base liquidable, el mínimo estatal ni los tipos de la propuesta, y el cálculo vigente sigue intacto. Aplica la escala propuesta a toda la base general sin duplicar tipos. La proposición de ley no plantea eliminar la cuota autonómica, por lo que la opción aparece desactivada por defecto y se identifica como supuesto del simulador. No afecta a la comparación separada del ahorro.

## Salida y advertencias

Mostrar el IRPF total y su desglose en cuota estatal propuesta y cuota autonómica de 2025. En el escenario predeterminado, la comunidad autónoma sigue siendo relevante: dos residentes con la misma base y familia pueden tener distinto IRPF propuesto. Indicar que los tipos del 15 % y del 25 % son **solo estatales** en la proposición, y que el tipo marginal conjunto suma el tipo autonómico correspondiente. Con el interruptor activado, mostrar cuota autonómica cero y recalcular total, neto, tipo efectivo y diferencia anual. No presentar 22.000 € como umbral de exención total del IRPF vigente o del escenario predeterminado: puede existir cuota autonómica con base inferior a ese importe.

El resultado es orientativo, anterior a retenciones, deducciones no modeladas y otros ajustes de la declaración. No se debe prometer ahorro en todos los casos.

## Ambigüedad jurídica relevante

La intención estatal de la proposición y su técnica de redacción no encajan por completo. El [artículo 56.3 de la Ley 35/2006](https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764) forma el mínimo autonómico a partir de los importes de los artículos 57 a 60, con los cambios aprobados por cada comunidad. Elevar el mínimo general del artículo 57 podría, por tanto, **alterar indirectamente la cuota autonómica**, aunque la exposición de motivos diga que esta no cambia. La simulación mantiene fija la cuota autonómica como interpretación de la intención política, no como liquidación literal segura de la redacción propuesta. Una futura versión deberá estudiar el efecto de cada normativa autonómica o una aclaración legislativa antes de presentarse como cálculo legal exhaustivo.

## Verificación

Probar los límites de 22.000 € y 70.000 €, un céntimo alrededor de cada límite, cero ingresos, cuatro o más hijos, hijos compartidos, reducción conjunta, mínimos familiares, variación entre comunidades y conservación exacta de la cuota autonómica vigente. Probar además que el interruptor elimina solo la cuota autonómica del escenario propuesto y actualiza total, neto y diferencia, incluso por debajo de 22.000 €. Comprobar que la comparación de IRPF y neto coincide y que la opción «sin actividad» no produce simulación.
