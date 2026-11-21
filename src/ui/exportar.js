// Barra de exportación: botones de SVG, PNG (300/600 dpi, fondo transparente opcional) y PDF.
// Exporta la última figura de la vista previa.

import { crearPDF, crearPNG, crearSVG, descargar, nombreDeArchivo } from '../export.js';
import { mensajeDeError, t } from '../i18n.js';

export function crearExportacion({ raiz, ultima, idioma }) {
  const $ = (sel) => raiz.querySelector(sel);
  const botones = { svg: $('#exportar-svg'), png: $('#exportar-png'), pdf: $('#exportar-pdf') };
  const dpi = $('#png-dpi');
  const transparente = $('#png-transparente');
  const mensaje = $('#mensaje-exportar');

  function avisar(texto, esError = false) {
    mensaje.textContent = texto;
    mensaje.classList.toggle('error', esError);
  }
  // Un mensaje viejo no se traduce: se borra al cambiar de idioma
  idioma.suscribir(() => avisar(''));

  /** Ejecuta una exportación con el botón desactivado mientras dura. */
  async function exportar(boton, crear) {
    const ui = idioma.obtener();
    const actual = ultima();
    if (!actual) {
      avisar(t(ui, 'exportar.sin-figura'), true);
      return;
    }
    boton.disabled = true;
    avisar(t(ui, 'exportar.preparando'));
    try {
      const { blob, nombre } = await crear(actual);
      descargar(blob, nombre);
      avisar(t(ui, 'exportar.listo', { nombre }));
    } catch (err) {
      avisar(mensajeDeError(ui, err), true);
    } finally {
      boton.disabled = false;
    }
  }

  botones.svg.addEventListener('click', () =>
    exportar(botones.svg, async ({ figura, svg }) => ({
      blob: crearSVG(svg),
      nombre: nombreDeArchivo(figura, 'svg'),
    })),
  );

  botones.png.addEventListener('click', () =>
    exportar(botones.png, async ({ figura, svg }) => {
      const resolucion = Number(dpi.value);
      return {
        blob: await crearPNG(svg, figura, { dpi: resolucion, transparente: transparente.checked }),
        nombre: nombreDeArchivo(figura, 'png', { dpi: resolucion }),
      };
    }),
  );

  botones.pdf.addEventListener('click', () =>
    exportar(botones.pdf, async ({ figura, svg }) => ({
      blob: await crearPDF(svg, figura),
      nombre: nombreDeArchivo(figura, 'pdf'),
    })),
  );
}
