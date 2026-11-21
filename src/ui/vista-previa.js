// Vista previa: dibuja la figura que corresponde al estado y guarda la última que se dibujó,
// que es la que se exporta.

import { mensajeDeError, t } from '../i18n.js';
import { calcularFigura } from '../layout.js';
import { renderSVG } from '../render-svg.js';
import { opcionesDeFigura } from '../state.js';

/**
 * Regresa { dibujar(estado), ultima() }. Si algo falla, avisa debajo de la figura y conserva la
 * última; ultima() da { figura, svg } de la última que se dibujó bien (o null). `idioma` es el
 * de la interfaz (para los avisos); el de las etiquetas viene en el estado.
 */
export function crearVistaPrevia({ figura, pie, unidades, version, idioma }) {
  let ultima = null;

  function dibujar(e) {
    const ui = idioma.obtener();
    const opciones = opcionesDeFigura(e, unidades, { version });
    try {
      const resultado = calcularFigura(unidades, opciones);
      const svg = renderSVG(resultado);
      // El SVG se arma con datos propios y textos escapados (render-svg.js)
      figura.innerHTML = svg;
      ultima = { figura: resultado, svg };
      const datos = { base: opciones.base_ma, techo: opciones.techo_ma, ancho: e.ancho_mm, alto: e.alto_mm };
      pie.textContent = t(ui, 'pie-vista', datos) + (resultado.pie_omitido ? ` · ${t(ui, 'pie-omitido')}` : '');
    } catch (err) {
      pie.textContent = t(ui, 'error-dibujar', { detalle: mensajeDeError(ui, err) });
    }
  }

  return { dibujar, ultima: () => ultima };
}
