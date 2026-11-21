// Panel de controles: conecta cada control del formulario (#controles) con el estado.
//
// Cada grupo de campos se lee completo y se manda al estado de una vez. Si el valor no es
// válido, el estado lo rechaza, el mensaje aparece junto al grupo y la vista previa conserva
// la última escala válida. Cuando el estado cambia, los controles se ponen al día sin tocar
// lo que el usuario está escribiendo si ya equivale al estado (p. ej. '23,04').
//
// Los textos vienen de i18n.js en el idioma de la interfaz; al cambiarlo, los mensajes que se
// estén mostrando se vuelven a escribir en el idioma nuevo.

import { mensajeDeError, t } from '../i18n.js';
import { nombreDeRango, nombreDeUnidad, textoDeLimite } from '../labels.js';
import { intervaloDelEstado, leerNumero } from '../state.js';
import { crearBuscador } from './buscador.js';

const NO_ES_NUMERO = { codigo: 'no-es-numero' };

export function crearPanel({ formulario, estado, unidades, idioma }) {
  const $ = (sel) => formulario.querySelector(sel);
  const $$ = (sel) => [...formulario.querySelectorAll(sel)];
  const ui = () => idioma.obtener();

  const c = {
    modos: $$('input[name="modo"]'),
    grupoEdad: $('#intervalo-edad'),
    grupoNombre: $('#intervalo-nombre'),
    techo: $('#techo'),
    base: $('#base'),
    desde: $('#desde'),
    hasta: $('#hasta'),
    rangos: $$('input[name="rango"]'),
    orientaciones: $$('input[name="orientacion"]'),
    invertir: $('#invertir'),
    ayudaSentido: $('#ayuda-sentido'),
    escalas: $$('input[name="escala"]'),
    atajo: $('#atajo-ancho'),
    ancho: $('#ancho'),
    alto: $('#alto'),
    idiomasEtiquetas: $$('input[name="idioma-etiquetas"]'),
    fuente: $('#fuente'),
    terminologias: $$('input[name="terminologia"]'),
    rotar: $('#rotar'),
    mostrarPie: $('#mostrar-pie'),
    grises: $('#grises'),
    nombresDeRango: $$('[data-rango]'),
    eje: $('#eje'),
    campoPaso: $('#campo-paso'),
    paso: $('#paso'),
    campoIncertidumbre: $('#campo-incertidumbre'),
    incertidumbre: $('#incertidumbre'),
    notaEje: $('#nota-eje'),
  };

  // Grupos de controles: dónde se muestra su error y qué campo corresponde a cada dato
  const grupos = {
    edad: { error: $('#error-edad'), campos: { techo_ma: [c.techo, c.base], base_ma: [c.techo, c.base] } },
    nombre: { error: $('#error-nombre'), campos: { desde: [c.desde], hasta: [c.hasta] } },
    rangos: { error: $('#error-rangos'), campos: { rangos: [] } },
    tamano: { error: $('#error-tamano'), campos: { ancho_mm: [c.ancho], alto_mm: [c.alto] } },
    etiquetas: { error: $('#error-etiquetas'), campos: { tamano_fuente_pt: [c.fuente] } },
    eje: { error: $('#error-eje'), campos: { eje_paso_ma: [c.paso] } },
  };
  // Errores que se muestran en cada grupo (con código), para reescribirlos si cambia el idioma
  const mostrados = {};

  const textoDeErrores = (errores) =>
    errores.map((e) => (e.codigo === 'no-es-numero' ? t(ui(), 'no-es-numero') : mensajeDeError(ui(), e))).join(' ');

  /** Muestra los errores de un grupo ([] los quita) y marca los campos inválidos. */
  function mostrarError(grupo, errores = [], invalidos = []) {
    const g = grupos[grupo];
    mostrados[grupo] = errores;
    g.error.textContent = textoDeErrores(errores);
    for (const campo of Object.values(g.campos).flat()) campo.removeAttribute('aria-invalid');
    for (const campo of invalidos) campo.setAttribute('aria-invalid', 'true');
  }

  /** Manda cambios al estado y muestra u oculta el error del grupo. */
  function aplicar(grupo, cambios) {
    const errores = estado.actualizar(cambios);
    const propios = errores.filter((e) => e.campo in grupos[grupo].campos);
    mostrarError(
      grupo,
      propios.length > 0 ? propios : errores,
      propios.flatMap((e) => grupos[grupo].campos[e.campo]),
    );
  }

  /** Lee dos campos numéricos; si alguno no es número, muestra el error y regresa null. */
  function leerDos(grupo, a, b) {
    const valores = [leerNumero(a.value), leerNumero(b.value)];
    const malos = [a, b].filter((_, i) => Number.isNaN(valores[i]));
    if (malos.length > 0) {
      mostrarError(grupo, [NO_ES_NUMERO], malos);
      return null;
    }
    return valores;
  }

  // --- Intervalo ---

  for (const radio of c.modos) {
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      if (radio.value === 'edad') {
        // Los campos de edad toman el intervalo que se estaba viendo
        const { techo_ma, base_ma } = intervaloDelEstado(estado.obtener(), unidades);
        aplicar('edad', { modo: 'edad', techo_ma, base_ma });
      } else {
        aplicar('nombre', { modo: 'nombre' });
      }
    });
  }

  function leerEdades() {
    const valores = leerDos('edad', c.techo, c.base);
    // El orden no importa: el intervalo va de la edad menor a la mayor
    if (valores) aplicar('edad', { techo_ma: Math.min(...valores), base_ma: Math.max(...valores) });
  }
  c.techo.addEventListener('input', leerEdades);
  c.base.addEventListener('input', leerEdades);

  // El buscador muestra los nombres en el idioma de la interfaz y con la terminología elegida
  const opcionesNombre = () => ({ idioma: ui(), terminologia: estado.obtener().terminologia });
  const nombreDe = (u) => nombreDeUnidad(u, opcionesNombre());
  const detalleDe = (u) => {
    const rango = nombreDeRango(u.rango, opcionesNombre()).toLocaleLowerCase(ui());
    return `${rango} · ${textoDeLimite(u.base_ma, unidades)}–${textoDeLimite(u.techo_ma, unidades)} Ma`;
  };
  const buscadores = {};
  for (const campo of ['desde', 'hasta']) {
    buscadores[campo] = crearBuscador({
      input: c[campo],
      lista: $(`#${campo}-lista`),
      mensaje: $(`#${campo}-mensaje`),
      unidades,
      nombreDe,
      detalleDe,
      sinResultados: () => t(ui(), 'sin-resultados'),
      alSeleccionar: (u) => aplicar('nombre', { [campo]: u.id }),
    });
  }

  // --- Rangos ---

  for (const casilla of c.rangos) {
    casilla.addEventListener('change', () => {
      aplicar('rangos', { rangos: c.rangos.filter((x) => x.checked).map((x) => x.value) });
    });
  }

  // --- Orientación y escala ---

  for (const radio of c.orientaciones) {
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      const e = estado.obtener();
      // Al girar la escala se intercambian ancho y alto (175 × 30 → 30 × 175)
      aplicar('tamano', { orientacion: radio.value, ancho_mm: e.alto_mm, alto_mm: e.ancho_mm });
    });
  }
  c.invertir.addEventListener('change', () => estado.actualizar({ invertir: c.invertir.checked }));
  for (const radio of c.escalas) {
    radio.addEventListener('change', () => {
      if (radio.checked) estado.actualizar({ escala: radio.value });
    });
  }

  // --- Tamaño ---

  c.atajo.addEventListener('change', () => {
    if (c.atajo.value === 'personalizado') {
      c.ancho.focus();
      c.ancho.select();
    } else {
      aplicar('tamano', { ancho_mm: Number(c.atajo.value), alto_mm: estado.obtener().alto_mm });
    }
  });

  function leerTamano() {
    const valores = leerDos('tamano', c.ancho, c.alto);
    if (valores) aplicar('tamano', { ancho_mm: valores[0], alto_mm: valores[1] });
  }
  c.ancho.addEventListener('input', leerTamano);
  c.alto.addEventListener('input', leerTamano);

  // --- Etiquetas ---

  for (const radio of c.idiomasEtiquetas) {
    radio.addEventListener('change', () => {
      if (radio.checked) estado.actualizar({ idioma: radio.value });
    });
  }
  c.fuente.addEventListener('input', () => {
    const pt = leerNumero(c.fuente.value);
    if (Number.isNaN(pt)) mostrarError('etiquetas', [NO_ES_NUMERO], [c.fuente]);
    else aplicar('etiquetas', { tamano_fuente_pt: pt });
  });
  for (const radio of c.terminologias) {
    radio.addEventListener('change', () => {
      if (radio.checked) estado.actualizar({ terminologia: radio.value });
    });
  }
  c.rotar.addEventListener('change', () => estado.actualizar({ rotar: c.rotar.checked }));
  c.mostrarPie.addEventListener('change', () => aplicar('etiquetas', { pie: c.mostrarPie.checked }));
  c.grises.addEventListener('change', () => estado.actualizar({ grises: c.grises.checked }));

  // --- Eje ---

  c.eje.addEventListener('change', () => aplicar('eje', { eje: c.eje.value }));
  c.paso.addEventListener('input', () => {
    const paso = leerNumero(c.paso.value);
    if (Number.isNaN(paso)) mostrarError('eje', [NO_ES_NUMERO], [c.paso]);
    else aplicar('eje', { eje_paso_ma: paso });
  });
  c.incertidumbre.addEventListener('change', () => estado.actualizar({ incertidumbre: c.incertidumbre.checked }));

  // Enter en un campo de texto no debe recargar la página
  formulario.addEventListener('submit', (ev) => ev.preventDefault());

  // --- Estado → controles ---

  function sincronizar(e) {
    for (const radio of c.modos) radio.checked = radio.value === e.modo;
    c.grupoEdad.hidden = e.modo !== 'edad';
    c.grupoNombre.hidden = e.modo !== 'nombre';

    // Edades: se respetan si ya equivalen al estado, en cualquier orden
    const escritas = [leerNumero(c.techo.value), leerNumero(c.base.value)].sort((a, b) => a - b);
    if (escritas[0] !== e.techo_ma || escritas[1] !== e.base_ma) {
      c.techo.value = String(e.techo_ma);
      c.base.value = String(e.base_ma);
      mostrarError('edad');
    }

    for (const campo of ['desde', 'hasta']) buscadores[campo].establecer(e[campo]);

    if (c.rangos.some((x) => x.checked !== e.rangos.includes(x.value))) {
      for (const x of c.rangos) x.checked = e.rangos.includes(x.value);
      mostrarError('rangos');
    }

    for (const radio of c.orientaciones) radio.checked = radio.value === e.orientacion;
    c.invertir.checked = e.invertir;
    for (const radio of c.escalas) radio.checked = radio.value === e.escala;

    if (leerNumero(c.ancho.value) !== e.ancho_mm || leerNumero(c.alto.value) !== e.alto_mm) {
      c.ancho.value = String(e.ancho_mm);
      c.alto.value = String(e.alto_mm);
      mostrarError('tamano');
    }
    const atajo = [...c.atajo.options].find((op) => Number(op.value) === e.ancho_mm);
    c.atajo.value = atajo ? atajo.value : 'personalizado';

    for (const radio of c.idiomasEtiquetas) radio.checked = radio.value === e.idioma;
    if (leerNumero(c.fuente.value) !== e.tamano_fuente_pt) {
      c.fuente.value = String(e.tamano_fuente_pt);
      mostrarError('etiquetas');
    }
    for (const radio of c.terminologias) radio.checked = radio.value === e.terminologia;
    c.rotar.checked = e.rotar;
    c.mostrarPie.checked = e.pie;
    c.grises.checked = e.grises;

    c.eje.value = e.eje;
    c.campoPaso.hidden = e.eje !== 'intervalo';
    if (leerNumero(c.paso.value) !== e.eje_paso_ma) {
      c.paso.value = String(e.eje_paso_ma);
      mostrarError('eje');
    }
    // En escala uniforme, 'auto' e 'intervalo' muestran las edades de los límites
    const numerico = e.eje === 'auto' || e.eje === 'intervalo';
    const muestraLimites = e.eje === 'limites' || (numerico && e.escala === 'uniforme');
    c.campoIncertidumbre.hidden = !muestraLimites;
    c.incertidumbre.checked = e.incertidumbre;

    escribirTextos(e);
  }

  /** Textos del panel que dependen del idioma de la interfaz y del estado. */
  function escribirTextos(e) {
    for (const campo of ['desde', 'hasta']) buscadores[campo].refrescar();
    for (const span of c.nombresDeRango) {
      span.textContent = nombreDeRango(span.dataset.rango, { idioma: ui(), terminologia: e.terminologia });
    }
    c.ayudaSentido.textContent = t(ui(), `sentido.${e.orientacion}.${e.invertir ? 1 : 0}`);
    const numerico = e.eje === 'auto' || e.eje === 'intervalo';
    c.notaEje.textContent = numerico && e.escala === 'uniforme' ? t(ui(), 'nota-uniforme') : '';
  }

  sincronizar(estado.obtener());
  estado.suscribir(sincronizar);

  // Al cambiar el idioma de la interfaz solo cambian los textos: lo que el usuario está
  // escribiendo se respeta y los mensajes visibles se reescriben en el idioma nuevo
  idioma.suscribir(() => {
    escribirTextos(estado.obtener());
    for (const grupo of Object.keys(grupos)) {
      if (mostrados[grupo]?.length) grupos[grupo].error.textContent = textoDeErrores(mostrados[grupo]);
    }
  });
}
