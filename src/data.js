// Consultas sobre las unidades de la carta (funciones puras, sin DOM).
//
// Los datos se empaquetan con la app (data/ics-*.json); aquí solo se consultan.

import { RANGOS } from './layout.js';

const porTecho = (a, b) => a.techo_ma - b.techo_ma;

/** Unidad con ese id, o null si no existe. */
export function unidadPorId(unidades, id) {
  return unidades.find((u) => u.id === id) ?? null;
}

/** Unidades de un rango, de la más joven a la más antigua. */
export function unidadesDelRango(unidades, rango) {
  return unidades.filter((u) => u.rango === rango).sort(porTecho);
}

/** Subdivisiones directas de una unidad, de la más joven a la más antigua. */
export function hijosDe(unidades, id) {
  return unidades.filter((u) => u.padre === id).sort(porTecho);
}

/** Texto para comparar: sin acentos, en minúsculas y con espacios simples ('Cretácico  Sup.' → 'cretacico sup.'). */
export function normalizarTexto(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Busca unidades por nombre, en español o en inglés, sin importar acentos ni mayúsculas.
 * Orden: primero las que empiezan con el texto, luego las que tienen una palabra que empieza
 * con él y al final las que lo contienen; dentro de cada grupo, del rango mayor al menor y de
 * la más joven a la más antigua. `nombres(u)` da los nombres con que se busca cada unidad
 * (por defecto, el español y el inglés).
 */
export function buscarUnidades(
  unidades,
  texto,
  { limite = 20, nombres: nombresDe = (u) => [u.nombre_es, u.nombre_en] } = {},
) {
  const q = normalizarTexto(texto);
  if (q === '') return [];

  const encontradas = [];
  for (const u of unidades) {
    const nombres = nombresDe(u).map(normalizarTexto);
    let grupo = null;
    if (nombres.some((n) => n.startsWith(q))) grupo = 0;
    else if (nombres.some((n) => n.split(/[\s-]+/).some((palabra) => palabra.startsWith(q)))) grupo = 1;
    else if (nombres.some((n) => n.includes(q))) grupo = 2;
    if (grupo !== null) encontradas.push({ u, grupo });
  }

  encontradas.sort(
    (a, b) =>
      a.grupo - b.grupo ||
      RANGOS.indexOf(a.u.rango) - RANGOS.indexOf(b.u.rango) ||
      a.u.techo_ma - b.u.techo_ma,
  );
  return encontradas.slice(0, limite).map((e) => e.u);
}

/**
 * Intervalo que cubre dos unidades, en cualquier orden: del techo de la más joven a la base
 * de la más antigua. Regresa null si alguna no existe.
 */
export function intervaloDeUnidades(unidades, idA, idB) {
  const a = unidadPorId(unidades, idA);
  const b = unidadPorId(unidades, idB);
  if (!a || !b) return null;
  return {
    techo_ma: Math.min(a.techo_ma, b.techo_ma),
    base_ma: Math.max(a.base_ma, b.base_ma),
  };
}
