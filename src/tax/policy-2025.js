// Rates are basis points: 950 = 9.50%. Amounts are decimal-euro strings.
const AEAT = "https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/";
const REGION_SOURCE = `${AEAT}c15-calculo-impuesto-determinacion-cuotas-integras/gravamen-base-liquidable-general/gravamen-autonomico/`;
const ALLOWANCE_SOURCE = `${AEAT}c14-adecuacion-impuesto-circunstancias-personales/minimo-autonomico-personal-familiar/cuadro-minimos-personales-familiares-estatal-autonomicos.html`;
const SOCIAL_SOURCE = "https://www.boe.es/buscar/act.php?id=BOE-A-2025-3780";

const standardAllowance = {
  taxpayer: "5550", over65: "1150", over75: "1400",
  descendants: ["2400", "2700", "4000", "4500"], under3: "2800",
  ascendant: "1150", ascendantOver75: "1400",
  disability33: "3000", disability65: "9000", assistance: "3000",
};

const raisedAllowance = {
  taxpayer: "6105", over65: "1265", over75: "1540",
  descendants: ["2640", "2970", "4400", "4950"], under3: "3080",
  ascendant: "1265", ascendantOver75: "1540",
  disability33: "3300", disability65: "9900", assistance: "3300",
};

function region(name, slug, brackets, allowance = standardAllowance) {
  return { name, source: `${REGION_SOURCE}${slug}.html`, brackets, allowance };
}

export const policy2025 = {
  year: 2025,
  published: "2026-03-27",
  retrieved: "2026-10-08",
  sources: {
    manual: `${AEAT}presentacion.html`,
    allowances: ALLOWANCE_SOURCE,
    socialSecurity: SOCIAL_SOURCE,
    law: "https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764",
  },
  savings: {
    published: "2026-03-27",
    retrieved: "2026-10-08",
    source: "https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-ayuda-presentacion/irpf-2025/8-cumplimentacion-irpf/8_4-cuota-integra/8_4_4-gravamen-base-liquidable-ahorro.html",
    state: [["6000", 950], ["50000", 1050], ["200000", 1150], ["300000", 1350], [null, 1500]],
    autonomous: [["6000", 950], ["50000", 1050], ["200000", 1150], ["300000", 1350], [null, 1500]],
  },
  state: [["12450", 950], ["20200", 1200], ["35200", 1500], ["60000", 1850], ["300000", 2250], [null, 2450]],
  stateAllowance: standardAllowance,
  jointReduction: { married: "3400", singleParent: "2150" },
  selfEmployment: {
    source: "https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c07-rendimientos-actividades-economicas-estimacion-directa.html",
    difficultExpenseSource: "https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-ayuda-presentacion/irpf-2025/7-cumplimentacion-irpf/7_4-rendimientos-actividades-economicas/7_4_2-regimen-estimacion-directa/7_4_2_3-gastos-fiscalmente-deducibles/provisiones-fiscalmente-deducibles.html",
    lowIncomeSource: "https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c07-rendimientos-actividades-economicas-estimacion-directa/fase-3-determinacion-rendimiento-neto-total/reducciones-generales-ejercicio/reduccion-contribuyentes-rentas-no-exentas.html",
    startupSource: "https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c07-rendimientos-actividades-economicas-estimacion-directa/fase-3-determinacion-rendimiento-neto-total/reduccion-rendimiento-neto-inicio-actividad-economica.html",
    retaSource: "https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-ayuda-presentacion/irpf-2025/7-cumplimentacion-irpf/7_4-rendimientos-actividades-economicas/7_4_2-regimen-estimacion-directa/7_4_2_3-gastos-fiscalmente-deducibles/cotizaciones-reta.html",
    published: "2026-03-27",
    retrieved: "2026-10-08",
    difficultExpenseRate: 500,
    difficultExpenseLimit: "2000",
    lowIncomeFullThrough: "8000",
    lowIncomeEndsAt: "12000",
    lowIncomeAmount: "1620",
    lowIncomeTaper: 4050,
    startupRate: 2000,
    startupBaseLimit: "100000",
  },
  employment: {
    generalExpense: "2000", mobilityExpense: "2000",
    disabledExpense33: "3500", disabledExpense65: "7750",
    lowIncomeBounds: ["14852", "17673.52", "19747.50"],
    lowIncomeAmounts: ["7302", "2364.34"],
    lowIncomeTapers: [17500, 11400],
  },
  socialSecurity: {
    published: "2025-02-26", source: SOCIAL_SOURCE,
    monthlyMaximum: "4909.50", monthlyUnemploymentMinimum: "1381.20",
    monthlyMinimumByGroup: ["1929", "1599.60", "1391.70", "1381.20", "1381.20", "1381.20", "1381.20", "1381.20", "1381.20", "1381.20", "1381.20"],
    commonRate: 470, trainingRate: 10, meiRate: 13,
    unemploymentRate: { permanent: 155, temporary: 160 },
    solidarity: [["5400.45", 15], ["7364.25", 17], [null, 19]],
  },
  regions: {
    andalucia: region("Andalucía", "comunidad-autonoma-andalucia", [["13000", 950], ["21100", 1200], ["35200", 1500], ["60000", 1850], [null, 2250]], {
      taxpayer: "5790", over65: "1200", over75: "1460", descendants: ["2510", "2820", "4170", "4700"], under3: "2920", ascendant: "1200", ascendantOver75: "1460", disability33: "3130", disability65: "9390", assistance: "3130",
    }),
    aragon: region("Aragón", "comunidad-autonoma-aragon", [["13072.50", 950], ["21210", 1200], ["36960", 1500], ["52500", 1850], ["60000", 2050], ["80000", 2300], ["90000", 2400], ["130000", 2500], [null, 2550]]),
    asturias: region("Asturias", "comunidad-autonoma-principado-asturias", [["12450", 900], ["17707.20", 1200], ["33007.20", 1400], ["53407.20", 1920], ["70000", 2150], ["90000", 2250], ["175000", 2500], [null, 2600]], raisedAllowance),
    baleares: region("Illes Balears", "comunidad-autonoma-illes-balears", [["10000", 900], ["18000", 1125], ["30000", 1425], ["48000", 1750], ["70000", 1900], ["90000", 2175], ["120000", 2275], ["175000", 2375], [null, 2475]], {
      taxpayer: "5550", over65: "1265", over75: "1540", descendants: ["2400", "2970", "4400", "4950"], under3: "2800", ascendant: "1265", ascendantOver75: "1540", disability33: "3300", disability65: "9900", assistance: "3300",
    }),
    canarias: region("Canarias", "comunidad-autonoma-canarias", [["13748", 900], ["19422", 1150], ["35924", 1400], ["57566", 1850], ["93268", 2350], ["123745", 2500], [null, 2600]], {
      taxpayer: "5606", over65: "1162", over75: "1414", descendants: ["2424", "2727", "4040", "4545"], under3: "2828", ascendant: "1162", ascendantOver75: "1414", disability33: "3030", disability65: "9090", assistance: "3030",
    }),
    cantabria: region("Cantabria", "comunidad-autonoma-cantabria", [["13000", 850], ["21000", 1100], ["35200", 1450], ["60000", 1800], ["90000", 2250], [null, 2450]]),
    castilla_la_mancha: region("Castilla-La Mancha", "comunidad-autonoma-castilla-mancha", [["12450", 950], ["20200", 1200], ["35200", 1500], ["60000", 1850], [null, 2250]]),
    castilla_y_leon: region("Castilla y León", "comunidad-castilla-leon", [["12450", 900], ["20200", 1200], ["35200", 1400], ["53407.20", 1850], [null, 2150]]),
    cataluna: region("Cataluña", "comunidad-autonoma-cataluna", [["12500", 950], ["22000", 1250], ["33000", 1600], ["53000", 1900], ["90000", 2150], ["120000", 2350], ["175000", 2450], [null, 2550]]),
    extremadura: region("Extremadura", "comunidad-autonoma-extremadura", [["12450", 800], ["20200", 1000], ["24200", 1600], ["35200", 1750], ["60000", 2100], ["80200", 2350], ["99200", 2400], ["120200", 2450], [null, 2500]]),
    galicia: region("Galicia", "comunidad-autonoma-galicia", [["12985.35", 900], ["21068.60", 1165], ["35200", 1490], ["60000", 1840], [null, 2250]], {
      taxpayer: "5789", over65: "1199", over75: "1460", descendants: ["2503", "2816", "4172", "4694"], under3: "2920", ascendant: "1199", ascendantOver75: "1460", disability33: "3129", disability65: "9387", assistance: "3129",
    }),
    madrid: region("Comunidad de Madrid", "comunidad-madrid", [["13362.22", 850], ["19004.63", 1070], ["35425.68", 1280], ["57320.40", 1740], [null, 2050]], {
      taxpayer: "5956.65", over65: "1234.26", over75: "1502.58", descendants: ["2575.85", "2897.83", "4400", "4950"], under3: "3005.16", ascendant: "1234.26", ascendantOver75: "1502.58", disability33: "3219.81", disability65: "9659.44", assistance: "3219.81",
    }),
    murcia: region("Región de Murcia", "comunidad-autonoma-region-murcia", [["12450", 950], ["20200", 1120], ["34000", 1330], ["60000", 1790], [null, 2250]]),
    rioja: region("La Rioja", "comunidad-autonoma-rioja", [["12450", 800], ["20200", 1060], ["35200", 1360], ["40000", 1780], ["50000", 1830], ["60000", 1900], ["120000", 2450], [null, 2700]], {
      ...standardAllowance, descendantDisability33: "3300", descendantDisability65: "9900",
    }),
    valencia: region("Comunitat Valenciana", "comunitat-valenciana", [["12000", 900], ["22000", 1200], ["32000", 1500], ["42000", 1750], ["52000", 2000], ["62000", 2250], ["72000", 2500], ["100000", 2650], ["150000", 2750], ["200000", 2850], [null, 2950]], raisedAllowance),
  },
};

export const unsupportedTerritories = ["País Vasco", "Navarra", "Ceuta", "Melilla"];

export const professionalGroups = [
  "Ingenieros, licenciados y alta dirección",
  "Ingenieros técnicos, peritos y ayudantes titulados",
  "Jefes administrativos y de taller",
  "Ayudantes no titulados",
  "Oficiales administrativos",
  "Subalternos",
  "Auxiliares administrativos",
  "Oficiales de primera y segunda",
  "Oficiales de tercera y especialistas",
  "Peones",
  "Personas trabajadoras menores de 18 años",
];
