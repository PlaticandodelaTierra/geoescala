// Texto para citar una figura hecha con GeoEscala (funciones puras, sin DOM).
//
// La carta se cita como piden sus dos versiones (pie de cada PDF de la v2026/06):
//   - inglés:  "Cite: Cohen K, Harper D, Gibbard P, Car N. The ICS international
//               chronostratigraphic chart this decade. Episodes 2025;48:105-115. <DOI>."
//   - español: "Citar como: Cohen, K., Harper, D., Gibbard, P. & Car, N. 2025 (actualizada a
//               junio de 2026). The ICS international chronostratigraphic chart this decade.
//               Episodes, 48(1): 105-115. <DOI>"
// GeoEscala se cita con su versión, su autor y año, su dirección y la fecha de consulta (datos en
// acerca.js, los mismos que CITATION.cff). El DOI de Zenodo se agregará cuando exista.

import { ANIO, AUTOR_CITA, URL_APP, VERSION } from './acerca.js';

export const DOI_CARTA = 'https://doi.org/10.18814/epiiugs/2025/025001';

const MESES = {
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

/** Cita de la carta ICS como la pide la versión de la carta en ese idioma (sin punto final). */
export function citaDeLaCarta(version, idioma = 'es') {
  if (idioma === 'en') {
    return (
      'Cohen K, Harper D, Gibbard P, Car N. The ICS international chronostratigraphic chart ' +
      `this decade. Episodes 2025;48:105-115. ${DOI_CARTA}`
    );
  }
  const [anio, mes] = version.split('/');
  return (
    `Cohen, K., Harper, D., Gibbard, P. & Car, N. 2025 (actualizada a ${MESES.es[Number(mes) - 1]} ` +
    `de ${anio}). The ICS international chronostratigraphic chart this decade. Episodes, 48(1): ` +
    `105-115. ${DOI_CARTA}`
  );
}

/** Fecha de consulta: '18 de noviembre de 2026' o '18 November 2026'. */
export function fechaDeConsulta(fecha, idioma = 'es') {
  const dia = fecha.getDate();
  const mes = (MESES[idioma] ?? MESES.es)[fecha.getMonth()];
  const anio = fecha.getFullYear();
  return idioma === 'en' ? `${dia} ${mes} ${anio}` : `${dia} de ${mes} de ${anio}`;
}

/**
 * Texto completo para citar la figura.
 * { version: versión de la carta ('2026/06'), idioma: 'es' | 'en', fecha: Date,
 *   url: dirección de GeoEscala (por defecto, la publicada) }
 */
export function textoDeCita({ version, idioma = 'es', url = URL_APP, fecha }) {
  const geoescala = `GeoEscala v${VERSION} (${AUTOR_CITA}, ${ANIO}), ${url}`;
  const carta = citaDeLaCarta(version, idioma);
  const consulta = fechaDeConsulta(fecha, idioma);
  if (idioma === 'en') {
    return (
      `Ages and colors: ICS International Chronostratigraphic Chart v${version} (${carta}). ` +
      `Figure made with ${geoescala} (accessed ${consulta}).`
    );
  }
  return (
    `Edades y colores: Tabla Cronoestratigráfica Internacional de la ICS v${version} (${carta}). ` +
    `Figura generada con ${geoescala} (consultado el ${consulta}).`
  );
}
