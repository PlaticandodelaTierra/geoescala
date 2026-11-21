// Buscador de unidades: campo de texto con lista de sugerencias (patrón "combobox" de ARIA,
// lista con selección automática del primer resultado).
//
// Teclado: ↓/↑ recorren la lista, Enter elige, Escape la cierra. Busca sin importar acentos,
// en español o en inglés y con las dos terminologías ("Cretácico Superior" o "Tardío").

import { buscarUnidades, unidadPorId } from '../data.js';
import { nombresDeBusqueda } from '../labels.js';

/**
 * input: <input> de texto; lista: <ul> vacía para las sugerencias; mensaje: elemento donde se
 * avisa si no hay resultados; alSeleccionar(unidad): se llama al elegir una unidad;
 * nombreDe(u) y detalleDe(u): textos que se muestran (según la terminología elegida).
 * Regresa { establecer(id), refrescar() }: mostrar una unidad elegida desde fuera y volver a
 * escribir su nombre si cambió la terminología.
 */
export function crearBuscador({
  input,
  lista,
  mensaje,
  unidades,
  alSeleccionar,
  nombreDe,
  detalleDe,
  sinResultados = () => 'Sin resultados.',
}) {
  let elegida = null;
  let resultados = [];
  let activa = -1;

  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', lista.id);
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('spellcheck', 'false');
  lista.setAttribute('role', 'listbox');
  lista.hidden = true;

  const abierta = () => !lista.hidden;

  function cerrar() {
    lista.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    activa = -1;
  }

  function marcar(i) {
    activa = i;
    lista.querySelectorAll('[role="option"]').forEach((op, j) => {
      op.setAttribute('aria-selected', String(j === i));
      if (j === i) {
        input.setAttribute('aria-activedescendant', op.id);
        op.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  function mostrar(encontradas) {
    resultados = encontradas;
    lista.replaceChildren(
      ...encontradas.map((u, i) => {
        const op = document.createElement('li');
        op.id = `${lista.id}-${i}`;
        op.setAttribute('role', 'option');
        op.setAttribute('aria-selected', 'false');
        const nombre = document.createElement('span');
        nombre.className = 'op-nombre';
        nombre.textContent = nombreDe(u);
        const detalle = document.createElement('span');
        detalle.className = 'op-detalle';
        detalle.textContent = detalleDe(u);
        op.append(nombre, ' ', detalle);
        op.addEventListener('click', () => elegir(u));
        return op;
      }),
    );
    if (encontradas.length === 0) {
      cerrar();
      return;
    }
    lista.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    marcar(0);
  }

  const buscar = (texto) => buscarUnidades(unidades, texto, { nombres: nombresDeBusqueda });

  function elegir(u) {
    elegida = u;
    input.value = nombreDe(u);
    mensaje.textContent = '';
    cerrar();
    alSeleccionar(u);
  }

  function restaurar() {
    input.value = elegida ? nombreDe(elegida) : '';
    mensaje.textContent = '';
  }

  input.addEventListener('input', () => {
    const encontradas = buscar(input.value);
    mostrar(encontradas);
    mensaje.textContent = input.value.trim() !== '' && encontradas.length === 0 ? sinResultados() : '';
  });

  input.addEventListener('keydown', (ev) => {
    const n = resultados.length;
    switch (ev.key) {
      case 'ArrowDown':
        ev.preventDefault();
        if (!abierta()) mostrar(buscar(input.value));
        else if (n > 0) marcar((activa + 1) % n);
        break;
      case 'ArrowUp':
        ev.preventDefault();
        if (abierta() && n > 0) marcar((activa - 1 + n) % n);
        break;
      case 'Enter':
        if (abierta() && activa >= 0) {
          ev.preventDefault();
          elegir(resultados[activa]);
        }
        break;
      case 'Escape':
        if (abierta()) {
          ev.preventDefault();
          cerrar();
        } else {
          restaurar();
        }
        break;
      default:
    }
  });

  // Al entrar al campo se selecciona el nombre actual, para que al escribir se reemplace.
  // El mouseup del mismo clic quitaría la selección, por eso se ignora una vez.
  let recienEnfocado = false;
  input.addEventListener('focus', () => {
    input.select();
    recienEnfocado = true;
  });
  input.addEventListener('mouseup', (ev) => {
    if (recienEnfocado) ev.preventDefault();
    recienEnfocado = false;
  });
  input.addEventListener('keydown', () => {
    recienEnfocado = false;
  });

  // Al salir del campo sin elegir, vuelve a mostrar la unidad elegida
  input.addEventListener('blur', () => {
    cerrar();
    restaurar();
  });
  // Evita que el clic en la lista quite el foco del campo antes de elegir
  lista.addEventListener('mousedown', (ev) => ev.preventDefault());

  return {
    establecer(id) {
      const u = unidadPorId(unidades, id);
      if (!u || u === elegida) return;
      elegida = u;
      if (document.activeElement !== input) input.value = nombreDe(u);
    },
    refrescar() {
      if (elegida && document.activeElement !== input) input.value = nombreDe(elegida);
    },
  };
}
