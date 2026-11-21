// Punto de arranque de GeoEscala.
//
// - Idioma de la interfaz: el guardado en este navegador (o español); se cambia con ES | EN.
// - Configuración de la figura: de la URL; las etiquetas empiezan en el idioma de la interfaz si
//   el enlace no dice otro. Cada cambio se guarda en la URL, para compartir la escala.

import datos from '../data/ics-2026-06.json';
import { VERSION } from './acerca.js';
import { aplicarTextos, crearIdioma, guardarIdioma, idiomaGuardado, t } from './i18n.js';
import { crearEstado, estadoAParametros, estadoDesdeParametros, validarEstado } from './state.js';
import { crearCita } from './ui/cita.js';
import { crearExportacion } from './ui/exportar.js';
import { crearPanel } from './ui/panel.js';
import { crearVistaPrevia } from './ui/vista-previa.js';

const unidades = datos.unidades;
const version = datos.version;
const idioma = crearIdioma(idiomaGuardado());

// --- Idioma de la interfaz ---

function mostrarIdioma(ui) {
  document.documentElement.lang = ui;
  document.title = t(ui, 'titulo-pagina');
  aplicarTextos(document, ui, { version, version_app: VERSION });
  for (const boton of document.querySelectorAll('[data-idioma]')) {
    boton.setAttribute('aria-pressed', String(boton.dataset.idioma === ui));
  }
}
for (const boton of document.querySelectorAll('[data-idioma]')) {
  boton.addEventListener('click', () => idioma.cambiar(boton.dataset.idioma));
}
mostrarIdioma(idioma.obtener());
idioma.suscribir((ui) => {
  guardarIdioma(ui);
  mostrarIdioma(ui);
});

// --- Estado de la figura ---

const { estado: inicial, avisos } = estadoDesdeParametros(window.location.search, unidades, {
  idioma: idioma.obtener(),
});
const estado = crearEstado(inicial, (e) => validarEstado(e, unidades));

const { dibujar, ultima } = crearVistaPrevia({
  figura: document.querySelector('#figura'),
  pie: document.querySelector('#pie'),
  unidades,
  version,
  idioma,
});
crearPanel({ formulario: document.querySelector('#controles'), estado, unidades, idioma });
crearExportacion({ raiz: document.querySelector('.exportar'), ultima, idioma });
crearCita({
  texto: document.querySelector('#cita-texto'),
  boton: document.querySelector('#copiar-cita'),
  mensaje: document.querySelector('#mensaje-cita'),
  version,
  idioma,
});

// Aviso si el enlace traía parámetros inválidos (se usaron los valores por defecto)
const aviso = document.querySelector('#aviso-url');
function mostrarAvisos() {
  aviso.querySelector('ul')?.remove();
  if (avisos.length === 0) return;
  const lista = document.createElement('ul');
  for (const a of avisos) {
    const li = document.createElement('li');
    li.textContent = t(idioma.obtener(), 'aviso.parametro', a);
    lista.append(li);
  }
  aviso.append(lista);
  aviso.hidden = false;
}
mostrarAvisos();
idioma.suscribir(mostrarAvisos);

/** Guarda el estado en la URL sin agregar entradas al historial del navegador. */
function guardarEnURL(e) {
  const url = `${window.location.pathname}?${estadoAParametros(e)}${window.location.hash}`;
  window.history.replaceState(null, '', url);
}

dibujar(estado.obtener());
guardarEnURL(estado.obtener());
estado.suscribir((e) => {
  dibujar(e);
  guardarEnURL(e);
  // El enlace ya no tiene los parámetros inválidos
  avisos.length = 0;
  aviso.hidden = true;
});
// Los avisos de la vista previa están en el idioma de la interfaz
idioma.suscribir(() => dibujar(estado.obtener()));
