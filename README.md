# Comparador IRPF 2025 y propuesta de VOX

Web estática en español que compara el IRPF vigente del ejercicio 2025 con una simulación de la propuesta de VOX para los mismos ingresos de trabajo. Muestra IRPF, cotizaciones del empleado, ingreso neto anual y diferencias entre ambos resultados. Todo se calcula en el navegador, sin enviar ni almacenar datos personales.

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

El cálculo vigente usa las reglas del **ejercicio 2025** para las 15 comunidades de régimen común. Supone residencia fiscal durante todo el año, un solo pagador, trabajo a tiempo completo durante doce meses si se declara actividad y únicamente renta del trabajo o pensión. El resultado es orientativo: no equivale a la declaración ni a una retención de nómina. No incluye deducciones, rentas del ahorro, actividades económicas ni los regímenes de País Vasco, Navarra, Ceuta y Melilla. Los supuestos completos se describen en [la especificación vigente](specs/current-irpf.md).

La [simulación de VOX](specs/vox-irpf.md) usa el mismo rendimiento neto del trabajo, aplica un tramo exento y dos tipos marginales reducidos según el número de descendientes. No conserva la reducción por declaración conjunta ni prorratea la rebaja por hijos compartidos: son supuestos explícitos del modelo, no reglas aprobadas. La propuesta no se calcula para «sin actividad» porque el formulario no distingue pensiones contributivas de otros rendimientos.

## Reglas y fuentes

Las reglas vigentes están en `src/tax/policy-2025.js` y su cálculo en `src/tax/calculator.js`; las constantes de la propuesta están en `src/tax/vox-policy.js` y su cálculo en `src/tax/vox-calculator.js`. La validación compartida vive en `src/tax/validation.js`. Las fuentes son el [Manual práctico de Renta 2025 de la AEAT](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/presentacion.html), la [Ley 35/2006](https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764), la [Orden PJC/178/2025](https://www.boe.es/buscar/act.php?id=BOE-A-2025-3780), la [descripción de VOX](https://www.voxespana.es/noticias/figaredo-anima-a-huir-de-la-resignacion-no-conformarnos-con-globalismos-que-nos-quieren-serviles-y-luchar-por-una-espana-fuerte-en-la-que-los-jovenes-tengan-esperanza-20250821) y su [propuesta parlamentaria](https://www.congreso.es/public_oficiales/L15/CONG/BOCG/D/BOCG-15-D-150.PDF).

## Despliegue

`vercel.json` indica a Vercel que genere y sirva `dist/` como sitio estático. El proyecto no necesita backend ni variables de entorno.
