// Textos de la interfaz en español e inglés.
//
// - En index.html, los elementos llevan data-i18n="clave" (texto) o
//   data-i18n-attr="atributo:clave;atributo:clave" (p. ej. aria-label); aplicarTextos() los llena.
// - En el código, t(idioma, clave, datos) da el texto con sus datos: 'Listo: {nombre}'.
// - Los errores llevan un código (state.js, errores.js); mensajeDeError() da su texto.
// - El idioma de la interfaz se recuerda en localStorage. El de las etiquetas de la figura es
//   aparte y va en la URL (state.js).

export const IDIOMAS = ['es', 'en'];
const CLAVE_ALMACEN = 'geoescala.idioma';

export const TEXTOS = {
  es: {
    'titulo-pagina': 'GeoEscala · escala de tiempo geológico para figuras',
    saltar: 'Saltar a la vista previa',
    lema: 'Barras de la escala de tiempo geológico con los colores y edades oficiales de la ICS, listas para tus figuras.',
    'idioma-interfaz': 'Idioma de la interfaz',
    panel: 'Opciones de la escala',
    'aviso-url': 'Algunos datos del enlace no eran válidos y se cambiaron:',

    intervalo: 'Intervalo',
    'elegir-intervalo': 'Elegir el intervalo',
    'por-edad': 'Por edad',
    'por-nombre': 'Por nombre',
    'de-ma': 'De (Ma)',
    'a-ma': 'a (Ma)',
    'ayuda-edad': 'En cualquier orden. Acepta punto o coma decimal.',
    'de-unidad': 'De la unidad',
    'a-unidad': 'a la unidad',
    'unidades-encontradas': 'Unidades encontradas',
    'ayuda-nombre': 'Escribe parte del nombre, en español o en inglés, y elige de la lista. En cualquier orden.',
    'sin-resultados': 'Sin resultados.',

    rangos: 'Rangos',
    orientacion: 'Orientación',
    horizontal: 'Horizontal',
    vertical: 'Vertical',
    invertir: 'Invertir sentido',
    'sentido.horizontal.0': 'Lo más antiguo queda a la izquierda.',
    'sentido.horizontal.1': 'Lo más antiguo queda a la derecha.',
    'sentido.vertical.0': 'Lo más antiguo queda abajo.',
    'sentido.vertical.1': 'Lo más antiguo queda arriba.',

    escala: 'Escala',
    proporcional: 'Proporcional (lineal en Ma)',
    uniforme: 'Uniforme (mismo tamaño por unidad)',

    tamano: 'Tamaño',
    'ancho-figura': 'Ancho de la figura',
    'columna-1': '1 columna (85 mm)',
    'columna-15': '1.5 columnas (120 mm)',
    'columna-2': '2 columnas (175 mm)',
    personalizado: 'Personalizado',
    'ancho-mm': 'Ancho (mm)',
    'alto-mm': 'Alto (mm)',

    etiquetas: 'Etiquetas',
    'idioma-etiquetas': 'Idioma de las etiquetas',
    espanol: 'Español',
    ingles: 'Inglés',
    'tamano-fuente': 'Tamaño de la fuente (pt)',
    terminologia: 'Terminología',
    cronoestratigrafica: 'Cronoestratigráfica (Inferior/Superior, Serie/Piso)',
    geocronologica: 'Geocronológica (Temprano/Tardío, Época/Edad)',
    rotar: 'Girar los nombres en celdas angostas',
    'mostrar-pie': 'Pie de figura con la versión de la carta',
    grises: 'Escala de grises (para impresión en blanco y negro)',
    'ayuda-etiquetas':
      'Si un nombre no cabe se gira, se abrevia o se oculta. El color del texto (negro o blanco) se elige según el contraste con el fondo.',

    eje: 'Eje de edades',
    mostrar: 'Mostrar',
    'eje-auto': 'Marcas automáticas',
    'eje-intervalo': 'Marcas a un intervalo fijo',
    'eje-limites': 'Edades de los límites',
    'eje-ninguno': 'Sin eje',
    'cada-ma': 'Cada (Ma)',
    incertidumbre: 'Mostrar ~ (aproximada) y ± (incertidumbre)',
    'nota-uniforme':
      'En escala uniforme el eje no es lineal, así que muestra las edades de los límites en lugar de marcas.',

    'vista-previa': 'Vista previa',
    exportar: 'Exportar la figura',
    'descargar-svg': 'Descargar SVG',
    'descargar-png': 'Descargar PNG',
    'descargar-pdf': 'Descargar PDF',
    'resolucion-png': 'Resolución del PNG',
    'fondo-transparente': 'Fondo transparente',
    'exportar.preparando': 'Preparando el archivo…',
    'exportar.listo': 'Listo: {nombre}',
    'exportar.sin-figura': 'No hay una figura para exportar.',
    'pie-vista': '{base}–{techo} Ma · {ancho} × {alto} mm',
    'pie-omitido': 'El pie no cabe en este ancho y se omitió.',
    'error-dibujar': 'No se pudo dibujar la escala: {detalle}',

    'como-citar': 'Cómo citar',
    'copiar-cita': 'Copiar cita',
    'cita.copiada': 'Cita copiada.',
    'cita.no-copiada': 'No se pudo copiar automáticamente: el texto quedó seleccionado; cópialo con Ctrl+C (⌘C en Mac).',

    'pie-pagina.datos':
      'Edades y colores: Tabla Cronoestratigráfica Internacional de la ICS v{version} (CC BY 4.0), a partir de los datos de Macrostrat (CC BY 4.0).',
    'pie-pagina.privacidad': 'Todo se calcula en tu navegador: no se envía nada a ningún servidor.',
    'pie-pagina.licencia': 'GeoEscala v{version_app} · código con licencia MIT',
    'pie-pagina.repositorio': 'ver en GitHub',

    'aviso.parametro': 'El parámetro "{parametro}" no es válido ("{valor}"); se usó {usado}.',
    'no-es-numero': 'Escribe un número, por ejemplo 23.04 o 23,04.',
    'dimension.ancho': 'ancho',
    'dimension.alto': 'alto',

    'error.valor-desconocido': 'Valor desconocido: "{valor}".',
    'error.edad-joven-invalida': 'La edad más joven debe ser un número mayor o igual a 0 Ma.',
    'error.edad-antigua-fuera-de-rango': 'La edad más antigua debe ser un número entre 0 y {max} Ma.',
    'error.edades-iguales': 'Las dos edades deben ser distintas.',
    'error.elige-unidad': 'Elige una unidad de la lista.',
    'error.elige-rango': 'Elige al menos un rango.',
    'error.rangos-invalidos': 'La lista de rangos no es válida.',
    'error.si-o-no': '"{campo}" debe ser sí o no.',
    'error.fuente-fuera-de-rango': 'El tamaño de la fuente debe ser un número entre {min} y {max} pt.',
    'error.paso-invalido': 'El intervalo de las marcas debe ser un número mayor que 0 Ma.',
    'error.demasiadas-marcas': 'Con marcas cada {paso} Ma habría más de {max}; usa un intervalo mayor.',
    'error.tamano-fuera-de-rango': 'El {dimension} debe ser un número entre {min} y {max} mm.',
    'error.figura-pequena-para-eje':
      'La figura es demasiado pequeña para el eje de edades; aumenta el tamaño o quita el eje.',
    'error.figura-baja-para-pie': 'La figura es demasiado baja para el pie; aumenta el alto u oculta el pie.',
    'error.png-demasiado-grande':
      'A {dpi} dpi la imagen mediría {ancho} × {alto} px, más de lo que el navegador puede dibujar. Usa una resolución menor, o exporta en SVG o PDF, que no tienen ese límite.',
    'error.png-no-dibujado':
      'El navegador no pudo dibujar la imagen a {dpi} dpi. Prueba con 300 dpi, o exporta en SVG o PDF.',
    'error.png-no-generado': 'El navegador no pudo generar el PNG.',
  },

  en: {
    'titulo-pagina': 'GeoEscala · geologic time scale for figures',
    saltar: 'Skip to preview',
    lema: 'Geologic time scale bars with the official ICS colors and ages, ready for your figures.',
    'idioma-interfaz': 'Interface language',
    panel: 'Scale options',
    'aviso-url': 'Some values in the link were not valid and were changed:',

    intervalo: 'Interval',
    'elegir-intervalo': 'Choose the interval',
    'por-edad': 'By age',
    'por-nombre': 'By name',
    'de-ma': 'From (Ma)',
    'a-ma': 'to (Ma)',
    'ayuda-edad': 'In any order. Decimal point or comma accepted.',
    'de-unidad': 'From unit',
    'a-unidad': 'to unit',
    'unidades-encontradas': 'Matching units',
    'ayuda-nombre': 'Type part of the name, in Spanish or English, and pick it from the list. In any order.',
    'sin-resultados': 'No results.',

    rangos: 'Ranks',
    orientacion: 'Orientation',
    horizontal: 'Horizontal',
    vertical: 'Vertical',
    invertir: 'Reverse direction',
    'sentido.horizontal.0': 'Oldest on the left.',
    'sentido.horizontal.1': 'Oldest on the right.',
    'sentido.vertical.0': 'Oldest at the bottom.',
    'sentido.vertical.1': 'Oldest at the top.',

    escala: 'Scale',
    proporcional: 'Proportional (linear in Ma)',
    uniforme: 'Uniform (same size per unit)',

    tamano: 'Size',
    'ancho-figura': 'Figure width',
    'columna-1': '1 column (85 mm)',
    'columna-15': '1.5 columns (120 mm)',
    'columna-2': '2 columns (175 mm)',
    personalizado: 'Custom',
    'ancho-mm': 'Width (mm)',
    'alto-mm': 'Height (mm)',

    etiquetas: 'Labels',
    'idioma-etiquetas': 'Label language',
    espanol: 'Spanish',
    ingles: 'English',
    'tamano-fuente': 'Font size (pt)',
    terminologia: 'Terminology',
    cronoestratigrafica: 'Chronostratigraphic (Lower/Upper, Series/Stage)',
    geocronologica: 'Geochronologic (Early/Late, Epoch/Age)',
    rotar: 'Rotate names in narrow cells',
    'mostrar-pie': 'Caption with the chart version',
    grises: 'Grayscale (for black-and-white printing)',
    'ayuda-etiquetas':
      'Names that do not fit are rotated, abbreviated or hidden. Text color (black or white) is chosen by contrast with the background.',

    eje: 'Age axis',
    mostrar: 'Show',
    'eje-auto': 'Automatic ticks',
    'eje-intervalo': 'Ticks at a fixed interval',
    'eje-limites': 'Boundary ages',
    'eje-ninguno': 'No axis',
    'cada-ma': 'Every (Ma)',
    incertidumbre: 'Show ~ (approximate) and ± (uncertainty)',
    'nota-uniforme': 'With a uniform scale the axis is not linear, so it shows boundary ages instead of ticks.',

    'vista-previa': 'Preview',
    exportar: 'Export the figure',
    'descargar-svg': 'Download SVG',
    'descargar-png': 'Download PNG',
    'descargar-pdf': 'Download PDF',
    'resolucion-png': 'PNG resolution',
    'fondo-transparente': 'Transparent background',
    'exportar.preparando': 'Preparing the file…',
    'exportar.listo': 'Done: {nombre}',
    'exportar.sin-figura': 'There is no figure to export.',
    'pie-vista': '{base}–{techo} Ma · {ancho} × {alto} mm',
    'pie-omitido': 'The caption does not fit this width and was left out.',
    'error-dibujar': 'The scale could not be drawn: {detalle}',

    'como-citar': 'How to cite',
    'copiar-cita': 'Copy citation',
    'cita.copiada': 'Citation copied.',
    'cita.no-copiada': 'Could not copy automatically: the text is selected; copy it with Ctrl+C (⌘C on a Mac).',

    'pie-pagina.datos':
      'Ages and colors: ICS International Chronostratigraphic Chart v{version} (CC BY 4.0), built from Macrostrat data (CC BY 4.0).',
    'pie-pagina.privacidad': 'Everything runs in your browser: nothing is sent to any server.',
    'pie-pagina.licencia': 'GeoEscala v{version_app} · code under the MIT license',
    'pie-pagina.repositorio': 'view on GitHub',

    'aviso.parametro': 'The parameter "{parametro}" is not valid ("{valor}"); {usado} was used instead.',
    'no-es-numero': 'Type a number, for example 23.04 or 23,04.',
    'dimension.ancho': 'width',
    'dimension.alto': 'height',

    'error.valor-desconocido': 'Unknown value: "{valor}".',
    'error.edad-joven-invalida': 'The youngest age must be a number of 0 Ma or more.',
    'error.edad-antigua-fuera-de-rango': 'The oldest age must be a number between 0 and {max} Ma.',
    'error.edades-iguales': 'The two ages must be different.',
    'error.elige-unidad': 'Choose a unit from the list.',
    'error.elige-rango': 'Choose at least one rank.',
    'error.rangos-invalidos': 'The list of ranks is not valid.',
    'error.si-o-no': '"{campo}" must be yes or no.',
    'error.fuente-fuera-de-rango': 'The font size must be a number between {min} and {max} pt.',
    'error.paso-invalido': 'The tick interval must be a number greater than 0 Ma.',
    'error.demasiadas-marcas': 'Ticks every {paso} Ma would make more than {max}; use a larger interval.',
    'error.tamano-fuera-de-rango': 'The {dimension} must be a number between {min} and {max} mm.',
    'error.figura-pequena-para-eje': 'The figure is too small for the age axis; make it larger or remove the axis.',
    'error.figura-baja-para-pie': 'The figure is too short for the caption; increase the height or hide the caption.',
    'error.png-demasiado-grande':
      'At {dpi} dpi the image would be {ancho} × {alto} px, more than the browser can draw. Use a lower resolution, or export to SVG or PDF, which have no such limit.',
    'error.png-no-dibujado': 'The browser could not draw the image at {dpi} dpi. Try 300 dpi, or export to SVG or PDF.',
    'error.png-no-generado': 'The browser could not create the PNG.',
  },
};

/** Texto de una clave con sus datos: t('es', 'exportar.listo', { nombre: 'a.svg' }) → 'Listo: a.svg'. */
export function t(idioma, clave, datos = {}) {
  const plantilla = TEXTOS[idioma]?.[clave] ?? TEXTOS.es[clave] ?? clave;
  return plantilla.replace(/\{(\w+)\}/g, (todo, nombre) => (nombre in datos ? String(datos[nombre]) : todo));
}

/** Mensaje de un error con código ({ codigo, datos }) o, si no tiene, su texto. */
export function mensajeDeError(idioma, error) {
  const clave = `error.${error?.codigo}`;
  if (error?.codigo && clave in TEXTOS.es) {
    const datos = { ...error.datos };
    if (datos.dimension) datos.dimension = t(idioma, `dimension.${datos.dimension}`);
    return t(idioma, clave, datos);
  }
  return error?.message ?? String(error);
}

/** Llena los textos marcados con data-i18n y data-i18n-attr dentro de `raiz`. */
export function aplicarTextos(raiz, idioma, datos = {}) {
  for (const el of raiz.querySelectorAll('[data-i18n]')) el.textContent = t(idioma, el.dataset.i18n, datos);
  for (const el of raiz.querySelectorAll('[data-i18n-attr]')) {
    for (const par of el.dataset.i18nAttr.split(';')) {
      const [atributo, clave] = par.split(':').map((s) => s.trim());
      el.setAttribute(atributo, t(idioma, clave, datos));
    }
  }
}

/** Idioma guardado en este navegador, o español. */
export function idiomaGuardado() {
  try {
    const v = window.localStorage.getItem(CLAVE_ALMACEN);
    return IDIOMAS.includes(v) ? v : 'es';
  } catch {
    return 'es';
  }
}

/** Recuerda el idioma en este navegador (si el navegador lo permite). */
export function guardarIdioma(idioma) {
  try {
    window.localStorage.setItem(CLAVE_ALMACEN, idioma);
  } catch {
    // Sin almacenamiento (ventana privada, bloqueado): el idioma vale solo para esta visita
  }
}

/** Idioma de la interfaz: { obtener(), cambiar(idioma), suscribir(fn) }. */
export function crearIdioma(inicial = 'es') {
  let actual = IDIOMAS.includes(inicial) ? inicial : 'es';
  const suscriptores = new Set();
  return {
    obtener: () => actual,
    cambiar(idioma) {
      if (!IDIOMAS.includes(idioma) || idioma === actual) return;
      actual = idioma;
      for (const fn of suscriptores) fn(actual);
    },
    suscribir(fn) {
      suscriptores.add(fn);
      return () => suscriptores.delete(fn);
    },
  };
}
