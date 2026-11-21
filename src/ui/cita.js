// Recuadro "Cómo citar": muestra la cita en el idioma de la interfaz y la copia al portapapeles.
// Si el navegador no deja copiar, deja el texto seleccionado para copiarlo a mano.

import { textoDeCita } from '../cita.js';
import { t } from '../i18n.js';

export function crearCita({ texto, boton, mensaje, version, idioma }) {
  // La cita usa la dirección publicada de GeoEscala (acerca.js), no la de esta página: así es la
  // misma aunque la app se abra en el servidor local o en una copia
  function escribir() {
    texto.textContent = textoDeCita({ version, idioma: idioma.obtener(), fecha: new Date() });
    mensaje.textContent = '';
  }

  function seleccionar() {
    const rango = document.createRange();
    rango.selectNodeContents(texto);
    const seleccion = window.getSelection();
    seleccion.removeAllRanges();
    seleccion.addRange(rango);
  }

  boton.addEventListener('click', async () => {
    const ui = idioma.obtener();
    try {
      await navigator.clipboard.writeText(texto.textContent);
      mensaje.textContent = t(ui, 'cita.copiada');
    } catch {
      seleccionar();
      mensaje.textContent = t(ui, 'cita.no-copiada');
    }
  });

  escribir();
  idioma.suscribir(escribir);
}
