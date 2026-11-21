// Arma data/ics-2026-06.json.
//
// 1. Descarga de Macrostrat los eones, eras, periodos, épocas y edades internacionales
//    (nombre en inglés, edades, abreviatura y color).
// 2. Compara cada unidad con la transcripción de la carta ICS v2026/06
//    (scripts/carta-ics-2026-06.js) y, donde difieren, usa el valor de la carta.
// 3. Escribe el JSON y muestra un informe de diferencias en Markdown, que sirve para
//    actualizar data/CHANGELOG-datos.md.
//
// Uso (requiere internet):  node scripts/build-data.js

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { CARTA } from './carta-ics-2026-06.js';

const API = 'https://macrostrat.org/api/v2/defs/intervals?timescale=';
const RANGOS = ['eon', 'era', 'periodo', 'epoca', 'edad'];
const ESCALA_MACROSTRAT = {
  eon: 'international eons',
  era: 'international eras',
  periodo: 'international periods',
  epoca: 'international epochs',
  edad: 'international ages',
};
// Prefijo del id según el rango (como en el ejemplo de CLAUDE.md: "piso-aquitaniano")
const PREFIJO = { eon: 'eon', era: 'era', periodo: 'periodo', epoca: 'epoca', edad: 'piso' };
const SALIDA = fileURLToPath(new URL('../data/ics-2026-06.json', import.meta.url));

/**
 * Lee una etiqueta de la carta:
 * '~201.4 ± 0.2' → { ma: 201.4, texto: '201.4', inc: 0.2, incTexto: '0.2', aprox: true }.
 * `texto` e `incTexto` son los números tal como están impresos, con sus ceros finales
 * ('66.00', '3.600', '± 1.0').
 */
export function leerEtiqueta(texto) {
  const m = /^(~?)(\d+(?:\.\d+)?)(?: ± (\d+(?:\.\d+)?))?$/.exec(texto);
  if (!m) throw new Error(`Etiqueta de edad no reconocida: "${texto}"`);
  return {
    ma: Number(m[2]),
    texto: m[2],
    inc: m[3] ? Number(m[3]) : null,
    incTexto: m[3] ?? null,
    aprox: m[1] === '~',
  };
}

/** 'Cretácico Superior' → 'cretacico-superior'. */
export function slug(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Id único: prefijo del rango + nombre en español ('Piso 10' → 'piso-10', no 'piso-piso-10'). */
export function crearId(rango, nombreEs) {
  const prefijo = PREFIJO[rango];
  const s = slug(nombreEs);
  return s.startsWith(`${prefijo}-`) ? s : `${prefijo}-${s}`;
}

/** Macrostrat usa terminología geocronológica (Late/Early); la carta, cronoestratigráfica. */
function nombreComoCarta(nombre) {
  return nombre.replace(/^Late /, 'Upper ').replace(/^Early /, 'Lower ');
}

async function descargar(rango) {
  const url = API + encodeURIComponent(ESCALA_MACROSTRAT[rango]);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Macrostrat respondió ${resp.status} para ${url}`);
  const json = await resp.json();
  const datos = json?.success?.data;
  if (!Array.isArray(datos) || datos.length === 0) throw new Error(`Respuesta vacía para ${url}`);
  return datos;
}

/** Padre: la unidad del rango superior más cercano que la contiene. */
function asignarPadres(unidades) {
  for (const u of unidades) {
    const nivel = RANGOS.indexOf(u.rango);
    u.padre = null;
    for (let n = nivel - 1; n >= 0 && u.padre === null; n--) {
      const padre = unidades.find(
        (p) => p.rango === RANGOS[n] && p.techo_ma <= u.techo_ma && u.base_ma <= p.base_ma,
      );
      if (padre) u.padre = padre.id;
    }
    if (nivel > 0 && u.padre === null) throw new Error(`Sin padre: ${u.id}`);
  }
}

function construir(macrostrat) {
  const informe = { edades: [], colores: [], agregadas: [], quitadas: [], nombres: [], revisar: [] };
  const usados = new Set();
  const unidades = [];

  for (const c of CARTA.unidades) {
    const base = leerEtiqueta(c.base);
    const techo = leerEtiqueta(c.techo);
    const id = crearId(c.rango, c.es);
    const ms = macrostrat[c.rango].find((m) => nombreComoCarta(m.name) === c.en);

    if (ms) {
      usados.add(ms);
      if (ms.name !== c.en) informe.nombres.push([id, ms.name, c.en]);
      if (ms.b_age !== base.ma) informe.edades.push([id, 'base', ms.b_age, base.ma]);
      if (ms.t_age !== techo.ma) informe.edades.push([id, 'techo', ms.t_age, techo.ma]);
      if (ms.color.toUpperCase() !== c.color) informe.colores.push([id, ms.color.toUpperCase(), c.color]);
    } else {
      informe.agregadas.push([id, c.en]);
    }
    if (c.revisar) informe.revisar.push([id, c.revisar]);

    const abrev = ms?.abbrev ? ms.abbrev : null;
    unidades.push({
      id,
      rango: c.rango,
      nombre_en: c.en,
      nombre_es: c.es,
      abrev,
      base_ma: base.ma,
      base_texto: base.texto,
      techo_ma: techo.ma,
      incertidumbre_ma: base.inc,
      incertidumbre_texto: base.incTexto,
      aproximada: base.aprox,
      informal: c.informal === true,
      color: c.color,
      padre: null,
      ...(c.revisar ? { revisar: true } : {}),
    });
  }

  for (const rango of RANGOS) {
    for (const m of macrostrat[rango]) {
      if (!usados.has(m)) informe.quitadas.push([rango, m.name, m.b_age, m.t_age]);
    }
  }

  asignarPadres(unidades);
  unidades.sort(
    (a, b) => RANGOS.indexOf(a.rango) - RANGOS.indexOf(b.rango) || a.techo_ma - b.techo_ma,
  );
  // El padre va al final de cada objeto, como en el esquema
  const ordenadas = unidades.map(({ padre, revisar, ...resto }) => ({
    ...resto,
    padre,
    ...(revisar ? { revisar } : {}),
  }));
  return { unidades: ordenadas, informe };
}

function tabla(encabezados, filas) {
  if (filas.length === 0) return '_Ninguno._\n';
  const linea = (celdas) => `| ${celdas.join(' | ')} |`;
  return [linea(encabezados), linea(encabezados.map(() => '---')), ...filas.map(linea)].join('\n') + '\n';
}

function imprimirInforme(inf, unidades) {
  const porRango = RANGOS.map((r) => `${r}: ${unidades.filter((u) => u.rango === r).length}`);
  console.log(`# Informe de build-data.js (carta ${CARTA.version})\n`);
  console.log(`Unidades: ${unidades.length} (${porRango.join(', ')})\n`);
  console.log('## Edades distintas a Macrostrat\n');
  console.log(tabla(['id', 'límite', 'Macrostrat', 'carta'], inf.edades));
  console.log('## Unidades agregadas (no están en Macrostrat)\n');
  console.log(tabla(['id', 'nombre en la carta'], inf.agregadas));
  console.log('## Unidades de Macrostrat que no se usan\n');
  console.log(tabla(['rango', 'nombre', 'base', 'techo'], inf.quitadas));
  console.log('## Nombres en inglés cambiados\n');
  console.log(tabla(['id', 'Macrostrat', 'carta'], inf.nombres));
  console.log('## Colores distintos a Macrostrat\n');
  console.log(tabla(['id', 'Macrostrat', 'carta'], inf.colores));
  console.log('## Por revisar\n');
  console.log(tabla(['id', 'motivo'], inf.revisar));
}

async function main() {
  const macrostrat = {};
  for (const rango of RANGOS) macrostrat[rango] = await descargar(rango);

  const { unidades, informe } = construir(macrostrat);
  const salida = {
    version: CARTA.version,
    fuente: CARTA.fuente,
    cita: CARTA.cita,
    unidades,
  };
  await writeFile(SALIDA, JSON.stringify(salida, null, 2) + '\n', 'utf8');
  imprimirInforme(informe, unidades);
  console.error(`\nEscrito ${SALIDA}`);
}

// Solo se ejecuta al correrlo directamente (las funciones exportadas se pueden probar)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
